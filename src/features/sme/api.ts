import { supabase } from '@/api/supabase';

// SME-facing dashboard data — mirrors web useSMEOrders/useSMEProfile.
// orders.sme_id = buyer auth user id; vendor text ids resolved via vendor_directory
// (the view maps profiles.user_id -> { vendor_id: 'VEND-XXX', business_name }),
// NOT vendor_profiles (silent RLS failures on verification_status).

export type OrderItemWithVendor = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number | null;
  selected_specs: Record<string, { label: string; value: string }> | null;
  vendor_id: string | null;
  vendor_text_id: string | null;
  vendor_name: string | null;
};

export type SMEOrder = {
  id: string;
  order_number: string;
  purchase_order_id: string | null;
  product_name: string;
  product_category: string | null;
  product_details: unknown[];
  status: string;
  payment_status: string;
  shipping_status: string | null;
  order_date: string;
  created_at: string;
  estimated_delivery_date: string | null;
  delivery_eta: string | null;
  completed_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  notes: string | null;
  shipping_address: Record<string, unknown> | null;
  invoice_number: string | null;
  invoice_date: string | null;
  payment_due_date: string | null;
  vendor_name: string | null;
  total_quantity: number;
  total_amount: number;
  subtotal: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
  freight_cost: number | null;
  shipping_cost: number | null;
  discount_amount: number | null;
  credit_used: number;
  items: OrderItemWithVendor[];
};

export type SMEStatistics = {
  total_orders: number;
  all_orders: number;
  total_spend: number;
  total_pending_value: number;
  pending_payment_orders: number;
  pending_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  price_lock_spend: number;
  group_buy_spend: number;
  total_confirmed_spend: number;
  credit_utilization: number;
  credit_available: number;
  pending_shipments: number;
  active_orders: number;
};

export type OrderShipping = {
  shipping: {
    id: string;
    status: string;
    carrier: string | null;
    tracking_number: string | null;
    estimated_delivery: string | null;
    actual_delivery: string | null;
  } | null;
  status_history: { status: string; notes: string | null; changed_at: string }[];
  order: {
    status: string;
    payment_status: string;
    created_at: string;
    completed_at: string | null;
    delivered_at: string | null;
    estimated_delivery_date: string | null;
    delivery_eta: string | null;
    tracking_number: string | null;
    carrier: string | null;
  } | null;
};

export type SMEProfile = {
  id?: string;
  user_id: string;
  business_name: string;
  industry: string;
  country: string;
  state?: string;
  city?: string;
  postal_code?: string;
  digital_postcode?: string;
  sme_id?: string;
  procurement_needs: string[];
  company_size?: string;
  registration_number?: string;
  tax_number?: string;
  website_url?: string;
  description?: string;
  logo_url?: string;
  company_email?: string;
  company_phone?: string;
  established_year?: number;
  employee_count?: number;
  annual_revenue?: number;
  annual_turnover?: number;
  business_type?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: unknown;
  social_links?: unknown;
  business_hours?: unknown;
  credit_score?: number;
  credit_limit?: number;
  credit_used?: number;
  bank_details?: unknown;
  preferred_payment_terms?: string;
  verification_documents?: string[];
  latitude?: number;
  longitude?: number;
};

export type ProfileWithUser = SMEProfile & {
  email?: string;
  phone?: string;
  full_name?: string;
};

type RawOrder = Record<string, unknown> & {
  id: string;
  order_items?: RawOrderItem[];
};

type RawOrderItem = Record<string, unknown> & {
  id: string;
  product_id: string | null;
  quantity: number | null;
};

export async function fetchSMEOrders(userId: string): Promise<SMEOrder[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      `id, order_number, purchase_order_id, vendor_id, vendor_name, supplier_name,
       status, payment_status, shipping_status, created_at, estimated_delivery_date,
       delivery_eta, completed_at, tracking_number, carrier, notes, shipping_address,
       invoice_number, invoice_date, payment_due_date, credit_used,
       total_amount, subtotal, tax_amount, tax_rate, freight_cost, shipping_cost,
       discount_amount,
       order_items (id, product_id, product_name, quantity, unit_price, total_price, selected_specs)`,
    )
    .eq('sme_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (orders ?? []) as unknown as RawOrder[];
  if (rows.length === 0) return [];

  // Product-name fallback: order_items.product_name can be null — resolve
  // through vendor_products -> unified_products.
  const productIds = [
    ...new Set(
      rows.flatMap((o) =>
        (o.order_items ?? []).map((i) => i.product_id).filter((id): id is string => !!id),
      ),
    ),
  ];
  const productMap = new Map<string, { vendor_id: string | null; name: string }>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('vendor_products')
      .select('id, vendor_id, unified_product_id, unified_products!unified_product_id(name)')
      .in('id', productIds);
    for (const p of (products ?? []) as unknown as {
      id: string;
      vendor_id: string | null;
      unified_products: { name: string } | { name: string }[] | null;
    }[]) {
      const up = Array.isArray(p.unified_products) ? p.unified_products[0] : p.unified_products;
      productMap.set(p.id, { vendor_id: p.vendor_id, name: up?.name ?? 'Product' });
    }
  }

  // Vendor lookup through vendor_directory (user_id -> VEND-xxx / business_name).
  const vendorIds = [
    ...new Set(
      [
        ...rows.map((o) => o.vendor_id as string | null),
        ...[...productMap.values()].map((p) => p.vendor_id),
      ].filter((id): id is string => !!id),
    ),
  ];
  const vendorMap = new Map<string, { vendor_id: string; business_name: string | null }>();
  if (vendorIds.length > 0) {
    const { data: vendors } = await supabase
      .from('vendor_directory')
      .select('user_id, vendor_id, business_name')
      .in('user_id', vendorIds);
    for (const v of (vendors ?? []) as {
      user_id: string;
      vendor_id: string;
      business_name: string | null;
    }[]) {
      vendorMap.set(v.user_id, { vendor_id: v.vendor_id, business_name: v.business_name });
    }
  }

  return rows.map((order) => {
    const items: OrderItemWithVendor[] = (order.order_items ?? []).map((item) => {
      const productInfo = item.product_id ? productMap.get(item.product_id) : undefined;
      const itemVendorId = productInfo?.vendor_id ?? (order.vendor_id as string | null) ?? null;
      const vendor = itemVendorId ? vendorMap.get(itemVendorId) : undefined;
      return {
        id: item.id,
        product_id: item.product_id,
        product_name:
          (item.product_name as string | null) ?? productInfo?.name ?? 'Product',
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
        total_price: item.total_price == null ? null : Number(item.total_price),
        selected_specs:
          (item.selected_specs as OrderItemWithVendor['selected_specs']) ?? null,
        vendor_id: itemVendorId,
        vendor_text_id: vendor?.vendor_id ?? null,
        vendor_name: vendor?.business_name ?? null,
      };
    });

    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const summaryName =
      items.length === 1
        ? items[0].product_name
        : items.length > 1
          ? `${items[0].product_name} +${items.length - 1} more`
          : 'N/A';
    const vendorName =
      (order.vendor_name as string | null) ??
      ((order.vendor_id as string | null)
        ? vendorMap.get(order.vendor_id as string)?.business_name
        : null) ??
      items[0]?.vendor_name ??
      (order.supplier_name as string | null);

    return {
      id: order.id,
      order_number:
        (order.order_number as string | null) ?? `ORD-${order.id.slice(0, 8)}`,
      purchase_order_id: (order.purchase_order_id as string | null) ?? null,
      product_name: summaryName,
      product_category: (order.product_category as string | null) ?? null,
      product_details: [],
      status: (order.status as string) ?? 'pending',
      payment_status: (order.payment_status as string) ?? 'pending',
      shipping_status: (order.shipping_status as string | null) ?? null,
      order_date: (order.created_at as string) ?? '',
      created_at: (order.created_at as string) ?? '',
      estimated_delivery_date:
        (order.estimated_delivery_date as string | null) ?? null,
      delivery_eta: (order.delivery_eta as string | null) ?? null,
      completed_at: (order.completed_at as string | null) ?? null,
      tracking_number: (order.tracking_number as string | null) ?? null,
      carrier: (order.carrier as string | null) ?? null,
      notes: (order.notes as string | null) ?? null,
      shipping_address:
        (order.shipping_address as Record<string, unknown> | null) ?? null,
      invoice_number: (order.invoice_number as string | null) ?? null,
      invoice_date: (order.invoice_date as string | null) ?? null,
      payment_due_date: (order.payment_due_date as string | null) ?? null,
      vendor_name: vendorName ?? null,
      total_quantity: totalQuantity,
      total_amount: Number(order.total_amount ?? 0),
      subtotal: order.subtotal == null ? null : Number(order.subtotal),
      tax_amount: order.tax_amount == null ? null : Number(order.tax_amount),
      tax_rate: order.tax_rate == null ? null : Number(order.tax_rate),
      freight_cost: order.freight_cost == null ? null : Number(order.freight_cost),
      shipping_cost:
        order.shipping_cost == null ? null : Number(order.shipping_cost),
      discount_amount:
        order.discount_amount == null ? null : Number(order.discount_amount),
      credit_used: Number(order.credit_used ?? 0),
      items,
    };
  });
}

export async function fetchSMEStatistics(userId: string): Promise<SMEStatistics> {
  const { data, error } = await supabase.rpc('get_sme_statistics', {
    sme_user_id: userId,
  });
  if (error) throw error;
  const parsed = (data ?? {}) as Record<string, unknown>;
  return {
    total_orders: Number(parsed.total_orders || 0),
    all_orders: Number(parsed.all_orders || 0),
    total_spend: Number(parsed.total_spend || 0),
    total_pending_value: Number(parsed.total_pending_value || 0),
    pending_payment_orders: Number(parsed.pending_payment_orders || 0),
    pending_orders: Number(parsed.pending_orders || 0),
    shipped_orders: Number(parsed.shipped_orders || 0),
    delivered_orders: Number(parsed.delivered_orders || 0),
    price_lock_spend: Number(parsed.price_lock_spend || 0),
    group_buy_spend: Number(parsed.group_buy_spend || 0),
    total_confirmed_spend: Number(parsed.total_confirmed_spend || 0),
    credit_utilization: Number(parsed.credit_utilization || 0),
    credit_available: Number(parsed.credit_available || 0),
    pending_shipments: Number(parsed.pending_shipments || 0),
    active_orders: Number(parsed.active_orders || 0),
  };
}

export async function fetchOrderShipping(orderId: string): Promise<OrderShipping> {
  const [shippingRes, historyRes, orderRes] = await Promise.all([
    supabase.from('shipping').select('*').eq('order_id', orderId).maybeSingle(),
    supabase
      .from('order_status_history')
      .select('status, notes, changed_at')
      .eq('order_id', orderId)
      .order('changed_at', { ascending: true }),
    supabase
      .from('orders')
      .select(
        'status, payment_status, created_at, completed_at, delivered_at, estimated_delivery_date, delivery_eta, tracking_number, carrier',
      )
      .eq('id', orderId)
      .single(),
  ]);
  if (orderRes.error) throw orderRes.error;
  return {
    shipping: (shippingRes.data as OrderShipping['shipping']) ?? null,
    status_history:
      (historyRes.data as OrderShipping['status_history']) ?? [],
    order: (orderRes.data as OrderShipping['order']) ?? null,
  };
}

export async function cancelSMEOrder(orderId: string, reason: string) {
  const { data, error } = await supabase.rpc('order_cancel', {
    p_order_id: orderId,
    p_reason: reason,
  });
  if (error) throw error;
  return data;
}

export async function fetchSMEProfile(userId: string): Promise<ProfileWithUser | null> {
  const { data: smeData, error: smeError } = await supabase
    .from('sme_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (smeError) throw smeError;
  if (!smeData) return null;

  const { data: profileData } = await supabase
    .from('profiles')
    .select('email, phone, full_name')
    .eq('id', userId)
    .single();

  return {
    ...(smeData as SMEProfile),
    email: profileData?.email ?? undefined,
    phone: profileData?.phone ?? undefined,
    full_name: profileData?.full_name ?? undefined,
  };
}

export async function updateSMEProfile(
  userId: string,
  updates: Partial<ProfileWithUser>,
) {
  // Split fields: email/phone/full_name live on profiles, the rest on sme_profiles.
  const { email, phone, full_name, ...smeFields } = updates;
  const smeUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(smeFields)) {
    if (value !== undefined) smeUpdates[key] = value;
  }
  smeUpdates.updated_at = new Date().toISOString();

  if (Object.keys(smeUpdates).length > 1) {
    const { error } = await supabase
      .from('sme_profiles')
      .update(smeUpdates)
      .eq('user_id', userId);
    if (error) throw error;
  }

  const profileUpdates: Record<string, unknown> = {};
  if (email !== undefined) profileUpdates.email = email;
  if (phone !== undefined) profileUpdates.phone = phone;
  if (full_name !== undefined) profileUpdates.full_name = full_name;
  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);
    if (error) throw error;
  }
}

// ---- Invoices (ported from web views/sme/Invoices.tsx) ----
// Merges three sources: orders, price_lock_participants, group_buy_participants.

export type InvoiceItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoiceRecord = {
  id: string;
  type: 'order' | 'price_lock' | 'group_buy';
  invoiceNumber: string;
  orderId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  productName: string;
  items: InvoiceItem[];
  breakdown: {
    subtotal: number;
    delivery: number;
    vat: number;
    vatRate: number;
    adminFee?: number;
    adminFeeRate?: number;
    discount?: number;
  };
  priceLock?: {
    depositAmount: number;
    depositPercentage: number | null;
    depositPaidAt: string | null;
    balanceDue: number;
    balancePaidAt: string | null;
    extrasPaidAt: string | null;
  };
};

export async function fetchSMEInvoices(userId: string): Promise<InvoiceRecord[]> {
  const results: InvoiceRecord[] = [];

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id, order_number, order_group_id, created_at, total_amount, payment_method, payment_status,
      product_name, invoice_number,
      subtotal, shipping_cost, tax_amount, tax_rate, discount_amount,
      order_items(id, product_name, quantity, unit_price, total_price)
    `)
    .eq('sme_id', userId)
    .order('created_at', { ascending: false });
  if (ordersError) throw ordersError;

  (orders || []).forEach((o: any) => {
    const items: InvoiceItem[] = (o.order_items || []).map((item: any) => ({
      name: item.product_name || 'Product',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.total_price,
    }));

    const itemsSubtotal = items.reduce((s, i) => s + (i.total || 0), 0);
    results.push({
      id: o.id,
      type: 'order',
      invoiceNumber: o.invoice_number || `INV-${o.order_number}`,
      orderId: o.order_group_id || o.id,
      date: o.created_at,
      amount: o.total_amount,
      paymentMethod: o.payment_method || 'N/A',
      paymentStatus: o.payment_status || 'pending',
      productName: o.product_name || 'Order Items',
      items,
      breakdown: {
        subtotal: Number(o.subtotal ?? itemsSubtotal ?? 0),
        delivery: Number(o.shipping_cost ?? 0),
        vat: Number(o.tax_amount ?? 0),
        vatRate: Number(o.tax_rate ?? 0),
        discount: Number(o.discount_amount ?? 0),
      },
    });
  });

  const { data: priceLocks, error: plError } = await supabase
    .from('price_lock_participants')
    .select(`
      id, locked_at, total_amount, deposit_amount, deposit_paid_at, deposit_percentage,
      balance_due, balance_paid_at, extra_charges_paid_at, payment_status, locked_quantity, extra_charges,
      price_locks(title, locked_price)
    `)
    .eq('sme_id', userId)
    .order('locked_at', { ascending: false });
  if (plError) throw plError;

  (priceLocks || []).forEach((pl: any) => {
    const lock = pl.price_locks as any;
    const ec = (pl.extra_charges || {}) as any;
    const subtotal = pl.locked_quantity * (lock?.locked_price || 0);
    const total = (pl.total_amount || subtotal) + (Number(ec.total) || 0);
    results.push({
      id: pl.id,
      type: 'price_lock',
      invoiceNumber: `PL-${pl.id.substring(0, 8).toUpperCase()}`,
      orderId: pl.id,
      date: pl.locked_at,
      amount: total,
      paymentMethod: 'Price Lock',
      paymentStatus: pl.payment_status || 'pending',
      productName: lock?.title || 'Price Lock Deal',
      items: [{
        name: lock?.title || 'Price Lock',
        quantity: pl.locked_quantity,
        unitPrice: lock?.locked_price || 0,
        total: subtotal,
      }],
      breakdown: {
        subtotal,
        delivery: Number(ec.delivery) || 0,
        vat: Number(ec.vat) || 0,
        vatRate: Number(ec.vatPercent) || 0,
        adminFee: Number(ec.adminFee) || 0,
        adminFeeRate: Number(ec.adminFeePercent) || 0,
      },
      priceLock: {
        depositAmount: Number(pl.deposit_amount) || 0,
        depositPercentage: pl.deposit_percentage != null ? Number(pl.deposit_percentage) : null,
        depositPaidAt: pl.deposit_paid_at || null,
        balanceDue: Number(pl.balance_due) || 0,
        balancePaidAt: pl.balance_paid_at || null,
        extrasPaidAt: pl.extra_charges_paid_at || null,
      },
    });
  });

  const { data: groupBuys, error: gbError } = await supabase
    .from('group_buy_participants')
    .select(`
      id, joined_at, quantity, status, extra_charges,
      group_buys(title, group_buy_price)
    `)
    .eq('sme_id', userId)
    .order('joined_at', { ascending: false });
  if (gbError) throw gbError;

  (groupBuys || []).forEach((gb: any) => {
    const deal = gb.group_buys as any;
    const ec = (gb.extra_charges || {}) as any;
    const subtotal = gb.quantity * (deal?.group_buy_price || 0);
    const total = subtotal + (Number(ec.total) || 0);
    results.push({
      id: gb.id,
      type: 'group_buy',
      invoiceNumber: `GB-${gb.id.substring(0, 8).toUpperCase()}`,
      orderId: gb.id,
      date: gb.joined_at,
      amount: total,
      paymentMethod: 'Group Buy',
      paymentStatus: gb.status === 'active' ? 'paid' : gb.status,
      productName: deal?.title || 'Group Buy Deal',
      items: [{
        name: deal?.title || 'Group Buy',
        quantity: gb.quantity,
        unitPrice: deal?.group_buy_price || 0,
        total: subtotal,
      }],
      breakdown: {
        subtotal,
        delivery: Number(ec.delivery) || 0,
        vat: Number(ec.vat) || 0,
        vatRate: Number(ec.vatPercent) || 0,
        adminFee: Number(ec.adminFee) || 0,
        adminFeeRate: Number(ec.adminFeePercent) || 0,
      },
    });
  });

  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return results;
}
