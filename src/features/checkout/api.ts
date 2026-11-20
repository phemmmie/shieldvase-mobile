import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/api/supabase';
import { env } from '@/config/env';

// Port of the web useCheckout flow (verified against src/hooks/useCheckout.ts):
// checkout_sessions insert (idempotent reuse) → vendor_product enrichment →
// convert_cart_to_order RPC → process-bank-transfer → PalmPay cashier URL.
// All totals are computed server-side; the client never asserts amounts.

export type DeliveryDetails = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  country?: string;
  deliveryInstructions?: string;
};

export type CheckoutPayload = {
  deliveryDetails: DeliveryDetails;
  paymentMethod: 'transfer' | 'wallet';
  items: any[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const canonicalizeJson = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalizeJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonicalizeJson(v)]),
    );
  }
  return value;
};

const sameJson = (a: unknown, b: unknown) =>
  JSON.stringify(canonicalizeJson(a)) === JSON.stringify(canonicalizeJson(b));

export const getCartSessionId = async (): Promise<string> => {
  let sid = await AsyncStorage.getItem('cart_session_id');
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('cart_session_id', sid);
  }
  return sid;
};

/** Deduped, id-sorted cart selection — mirrors web getCheckoutCartSelection. */
export const getCheckoutCartSelection = (
  items: { id?: unknown; quantity?: unknown }[] | null | undefined,
) => {
  const unique = new Map<string, { id: string; quantity?: unknown }>();
  (items ?? []).forEach((item) => {
    if (typeof item?.id === 'string' && UUID_PATTERN.test(item.id) && !unique.has(item.id)) {
      unique.set(item.id, item as { id: string; quantity?: unknown });
    }
  });
  const rows = Array.from(unique.values()).sort((a, b) => a.id.localeCompare(b.id));
  return {
    cartItemIds: rows.map((r) => r.id),
    quantities: rows.map((r) => Number(r.quantity ?? 0)),
  };
};

export const getDeliveryDetailsValidationError = (
  d: Partial<DeliveryDetails>,
): string | null => {
  const missing = [d.fullName, d.email, d.phone, d.address, d.city, d.state].some(
    (v) => !v?.trim(),
  );
  if (missing) return 'Please fill in all required delivery details.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email!.trim()))
    return 'Please enter a valid email address.';
  if ((d.phone || '').replace(/\D/g, '').length < 7)
    return 'Please enter a valid phone number.';
  return null;
};

export async function createCheckoutSession(payload: CheckoutPayload) {
  const sessionId = await getCartSessionId();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { cartItemIds, quantities } = getCheckoutCartSelection(payload.items);

  if (!cartItemIds.length)
    throw new Error('No persisted cart items were found for checkout.');
  if (cartItemIds.length !== payload.items.length)
    throw new Error('Some cart items are still syncing. Please retry in a moment.');

  const safeItems = payload.items.map((i: any) => ({
    id: i?.id ?? null,
    name: i?.name,
    quantity: i?.quantity ?? 1,
    unit_price: i?.price ?? 0,
    discount: 0,
    line_total: (i?.price ?? 0) * (i?.quantity ?? 1),
  }));

  const checkoutPayload = {
    session_id: sessionId,
    user_id: user?.id || null,
    status: 'pending',
    total_amount: payload.total,
    subtotal: payload.subtotal,
    tax_amount: payload.tax,
    shipping_cost: payload.shipping,
    delivery_details: payload.deliveryDetails,
    billing_address: payload.deliveryDetails,
    shipping_address: payload.deliveryDetails,
    payment_method: payload.paymentMethod,
    payment_status: 'pending',
    items: safeItems,
  };

  const storageKey = `checkout_session_${sessionId}`;
  const existingId = await AsyncStorage.getItem(storageKey);
  let previousCheckoutSessionId: string | null = null;

  if (existingId) {
    const { data: existing, error } = await supabase
      .from('checkout_sessions')
      .select(
        'id, status, payment_status, items, delivery_details, payment_method, subtotal, tax_amount, shipping_cost, total_amount',
      )
      .eq('id', existingId)
      .maybeSingle();
    if (error) throw error;

    const isFinal =
      existing?.status === 'completed' || existing?.payment_status === 'paid';
    const matches =
      Boolean(existing) &&
      existing!.payment_method === payload.paymentMethod &&
      Number(existing!.subtotal) === payload.subtotal &&
      Number(existing!.tax_amount) === payload.tax &&
      Number(existing!.shipping_cost) === payload.shipping &&
      Number(existing!.total_amount) === payload.total &&
      sameJson(existing!.items, safeItems) &&
      sameJson(existing!.delivery_details, payload.deliveryDetails);

    if (isFinal && matches) {
      return { id: existing!.id, previousCheckoutSessionId: null, cartItemIds, quantities };
    }
    if (existing?.status === 'pending' && existing.payment_status === 'pending' && matches) {
      const { error: updateError } = await supabase
        .from('checkout_sessions')
        .update(checkoutPayload as any)
        .eq('id', existing.id);
      if (updateError) throw updateError;
      return { id: existing.id, previousCheckoutSessionId: null, cartItemIds, quantities };
    }
    previousCheckoutSessionId = isFinal ? null : existing?.id || null;
    await AsyncStorage.removeItem(storageKey);
  }

  const checkoutId = `chk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const { error } = await supabase
    .from('checkout_sessions')
    .insert({ id: checkoutId, ...(checkoutPayload as any) });
  if (error) throw error;

  await AsyncStorage.setItem(storageKey, checkoutId);
  return { id: checkoutId, previousCheckoutSessionId, cartItemIds, quantities };
}

/**
 * Enrich cart items with vendor_product_id — safe resolutions only
 * (product_id that is already a vendor_products.id, or exact
 * vendor_id + unified_product_id pair). Ported verbatim from web.
 */
async function enrichCartItems(
  userId: string | null,
  sessionId: string,
  cartItemIds?: string[] | null,
) {
  try {
    let query = supabase
      .from('cart_items')
      .select('id,vendor_product_id,product_id,unified_product_id,vendor_id,name')
      .limit(200);
    query = userId ? query.eq('user_id', userId) : query.eq('session_id', sessionId);
    if (cartItemIds?.length) query = query.in('id', cartItemIds);
    const { data: cartRows } = await query;
    if (!cartRows?.length) return;

    for (const r of cartRows.filter((r: any) => !r.vendor_product_id)) {
      let vendorProductId: string | null = null;

      if (r.product_id) {
        const { data: vpById } = await supabase
          .from('vendor_products')
          .select('id, vendor_id')
          .eq('id', r.product_id)
          .maybeSingle();
        if (vpById?.id && (!r.vendor_id || (vpById as any).vendor_id === r.vendor_id)) {
          vendorProductId = vpById.id;
        }
      }

      if (!vendorProductId && r.unified_product_id && r.vendor_id) {
        const { data: vpPair } = await supabase
          .from('vendor_products')
          .select('id')
          .eq('unified_product_id', r.unified_product_id)
          .eq('vendor_id', r.vendor_id)
          .limit(1)
          .maybeSingle();
        vendorProductId = vpPair?.id || null;
      }

      if (vendorProductId) {
        await supabase
          .from('cart_items')
          .update({ vendor_product_id: vendorProductId })
          .eq('id', r.id);
      } else {
        console.warn('[checkout] ambiguous cart row, no safe vendor resolution', r.id);
      }
    }
  } catch (e) {
    console.warn('Cart enrichment error:', e);
  }
}

export type OrderGroupDetails = {
  orderGroupId: string;
  firstOrderId: string;
  firstPurchaseOrderId: string;
  totalGroupAmount: number;
  orderCount: number;
  orders: {
    id: string;
    purchase_order_id: string | null;
    total_amount: number | null;
    order_number: string | null;
    payment_status: string | null;
  }[];
};

export async function getOrderGroupDetails(
  orderGroupId: string,
): Promise<OrderGroupDetails> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, purchase_order_id, total_amount, order_number, payment_status')
    .eq('order_group_id', orderGroupId)
    .order('created_at', { ascending: true });

  if (error || !orders?.length)
    throw new Error('Failed to retrieve orders after creation');

  return {
    orderGroupId,
    firstOrderId: orders[0].id,
    firstPurchaseOrderId: orders[0].purchase_order_id || orders[0].id,
    totalGroupAmount: orders.reduce((s, o) => s + (o.total_amount || 0), 0),
    orderCount: orders.length,
    orders: orders as OrderGroupDetails['orders'],
  };
}

export type PaymentInit =
  | { kind: 'redirect'; cashierUrl: string; orderGroupId: string }
  | { kind: 'paid'; orderGroupId: string };

/**
 * Runs convert_cart_to_order then initiates PalmPay via process-bank-transfer.
 * Returns a cashier URL to open, or 'paid' when the group settled without
 * gateway (e.g. wallet/credit fully covering).
 */
export async function processPayment(
  checkoutSessionId: string,
  method: 'transfer' | 'wallet',
  deliveryDetails: DeliveryDetails,
  previousCheckoutSessionId?: string | null,
  cartItemIds?: string[] | null,
  cartQuantities?: number[] | null,
): Promise<PaymentInit> {
  const { data: session } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('id', checkoutSessionId)
    .single();
  if (!session) throw new Error('Checkout session not found');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionId = await getCartSessionId();

  await enrichCartItems(user?.id || null, sessionId, cartItemIds);

  const { data: orderGroupId, error: orderError } = await supabase.rpc(
    'convert_cart_to_order',
    {
      p_session_id: sessionId,
      p_user_id: user?.id || null,
      p_delivery_details: deliveryDetails || null,
      p_payment_method: method === 'wallet' ? 'wallet' : 'bank_transfer',
      p_checkout_session_id: checkoutSessionId,
      p_previous_checkout_session_id: previousCheckoutSessionId || null,
      p_cart_item_ids: cartItemIds?.length ? cartItemIds : null,
      p_cart_quantities: cartQuantities?.length ? cartQuantities : null,
    },
  );

  if (orderError) {
    if (orderError.code === '42883')
      throw new Error('Checkout service is temporarily unavailable.');
    throw new Error('Failed to create order: ' + (orderError.message || 'Unknown error'));
  }

  const group = await getOrderGroupDetails(orderGroupId);
  const paidCount = group.orders.filter((o) => o.payment_status === 'paid').length;

  if (paidCount === group.orderCount) {
    await supabase
      .from('checkout_sessions')
      .update({
        status: 'completed',
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
      })
      .eq('id', checkoutSessionId);
    await AsyncStorage.removeItem(`checkout_session_${sessionId}`);
    return { kind: 'paid', orderGroupId };
  }
  if (paidCount > 0)
    throw new Error('This order group is partially paid and requires support review.');

  // D14: hosted bridge preferred once it ships; scheme fallback for now.
  const callBackUrl = `${env.paymentCallbackBase}/${orderGroupId}?type=order&method=${method === 'wallet' ? 'wallet' : 'bank'}`;
  const notifyUrl = `${env.supabaseUrl}/functions/v1/payment-webhook`;

  const { data: transferData, error: transferError } =
    await supabase.functions.invoke('process-bank-transfer', {
      body: {
        orderId: group.firstPurchaseOrderId,
        orderUuid: group.firstOrderId,
        orderGroupId,
        amount: group.totalGroupAmount,
        userId: user?.id || 'guest',
        userMobileNo: deliveryDetails?.phone || '',
        title: 'Product Purchase',
        description: `Order Group ${orderGroupId}`,
        goodsDetails: JSON.stringify(session.items || []),
        notifyUrl,
        callBackUrl,
      },
    });

  if (transferError) {
    let parsed: string | undefined;
    try {
      const ctx = (transferError as any).context;
      if (ctx) parsed = (await ctx.json())?.error;
    } catch {
      // context may not be JSON
    }
    throw new Error(parsed || transferError.message || 'Payment failed');
  }
  if (transferData && !transferData.success) {
    throw new Error(transferData.error || 'Payment processing failed');
  }

  const cashierUrl =
    transferData?.cashierUrl ||
    transferData?.checkoutUrl ||
    transferData?.data?.cashierUrl ||
    transferData?.data?.checkoutUrl;

  if (!cashierUrl)
    throw new Error('Payment gateway did not return a checkout URL.');

  return { kind: 'redirect', cashierUrl, orderGroupId };
}
