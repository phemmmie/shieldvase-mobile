import { supabase } from '@/api/supabase';
import { env } from '@/config/env';
import {
  calculateGroupBuyCharges,
  calculatePriceLockCharges,
  type ActiveChargeRule,
  type ChargeBreakdown,
  type OrderCharges,
  type RuleResolutionContext,
} from './charges';

// Deal flows ported from web GroupBuyBrowse/Joined, PriceLockBrowse/Joined,
// JoinGroupBuyModal, JoinPriceLockModal, usePalmPayPayment, DealLandingPage.

export type DealWindowState = 'upcoming' | 'joinable' | 'expired';

export function getDealWindowState(
  deal: { start_date?: string | null; end_date?: string | null },
  now: Date = new Date(),
): DealWindowState {
  const start = deal.start_date ? new Date(deal.start_date) : null;
  const endRaw = deal.end_date ? new Date(deal.end_date) : null;
  const end = endRaw ? new Date(endRaw.setHours(23, 59, 59, 999)) : null;
  if (start && now < start) return 'upcoming';
  if (end && now > end) return 'expired';
  return 'joinable';
}

export type DealProduct = { name: string | null; slug: string | null; images: string[] | null };

export type GroupBuy = {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  discount_percentage: number | null;
  original_price: number | null;
  group_buy_price: number | null;
  current_quantity: number | null;
  target_quantity: number | null;
  min_participants: number | null;
  max_participants: number | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  unit_of_measurement: string | null;
  eligible_variants: Record<string, string[]> | null;
  vendor_id: string | null;
  product_id: string | null; // vendor_products.id
  status: string;
  product: DealProduct | null;
  unified_product_id: string | null;
  participants: { sme_id: string; quantity: number; status: string }[];
};

export type PriceLock = {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  original_price: number | null;
  locked_price: number | null;
  total_available_quantity: number | null;
  current_locked_quantity: number | null;
  max_quantity_per_sme: number | null;
  lock_duration_days: number | null;
  payment_plan: string | null;
  start_date: string | null;
  end_date: string | null;
  vendor_id: string | null;
  product_id: string | null;
  status: string;
  product: DealProduct | null;
  unified_product_id: string | null;
  participants: { sme_id: string; locked_quantity: number }[];
};

const GB_SELECT = `
  *,
  vendor_products(unified_product_id, unified_products!unified_product_id(name, slug, images)),
  group_buy_participants!left(sme_id, quantity, status)
`;

const PL_SELECT = `
  *,
  vendor_products!inner(unified_product_id, unified_products!unified_product_id(name, slug, images)),
  price_lock_participants!left(sme_id, locked_quantity)
`;

const mapGroupBuy = (g: any): GroupBuy => ({
  ...g,
  unified_product_id: g.vendor_products?.unified_product_id ?? null,
  product: g.vendor_products?.unified_products ?? null,
  participants: g.group_buy_participants ?? [],
});

const mapPriceLock = (p: any): PriceLock => ({
  ...p,
  unified_product_id: p.vendor_products?.unified_product_id ?? null,
  product: p.vendor_products?.unified_products ?? null,
  participants: p.price_lock_participants ?? [],
});

export async function fetchActiveGroupBuys(): Promise<GroupBuy[]> {
  const { data, error } = await supabase
    .from('group_buys')
    .select(GB_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapGroupBuy);
}

export async function fetchActivePriceLocks(): Promise<PriceLock[]> {
  const { data, error } = await supabase
    .from('price_locks')
    .select(PL_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPriceLock);
}

export async function fetchGroupBuyBySlug(slug: string): Promise<GroupBuy | null> {
  const { data, error } = await supabase
    .from('group_buys')
    .select(GB_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGroupBuy(data) : null;
}

export async function fetchPriceLockBySlug(slug: string): Promise<PriceLock | null> {
  const { data, error } = await supabase
    .from('price_locks')
    .select(PL_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPriceLock(data) : null;
}

export async function fetchGroupBuyById(id: string): Promise<GroupBuy | null> {
  const { data, error } = await supabase
    .from('group_buys')
    .select(GB_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGroupBuy(data) : null;
}

export async function fetchPriceLockById(id: string): Promise<PriceLock | null> {
  const { data, error } = await supabase
    .from('price_locks')
    .select(PL_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPriceLock(data) : null;
}

/** Deals attached to a unified product (PDP shortcut — useProductDeals parity). */
export async function fetchProductDeals(unifiedProductId: string) {
  const { data: vps } = await supabase
    .from('vendor_products')
    .select('id')
    .eq('unified_product_id', unifiedProductId)
    .eq('status', 'active');
  const vpIds = (vps ?? []).map((v: any) => v.id);
  if (!vpIds.length) return { groupBuys: [] as GroupBuy[], priceLocks: [] as PriceLock[] };

  const now = new Date().toISOString();
  const [gb, pl] = await Promise.all([
    supabase.from('group_buys').select(GB_SELECT).in('product_id', vpIds).eq('status', 'active').gte('end_date', now),
    supabase.from('price_locks').select(PL_SELECT).in('product_id', vpIds).eq('status', 'active').gte('end_date', now),
  ]);
  if (gb.error) throw gb.error;
  if (pl.error) throw pl.error;
  return {
    groupBuys: (gb.data ?? []).map(mapGroupBuy),
    priceLocks: (pl.data ?? []).map(mapPriceLock),
  };
}

// ---------------------------------------------------------------------------
// Participation rows
// ---------------------------------------------------------------------------

export type GroupBuyParticipant = {
  id: string;
  group_buy_id: string;
  quantity: number;
  status: string;
  delivery_address: any;
  selected_variants: Record<string, string> | null;
  joined_at: string;
  group_buy: GroupBuy | null;
};

export type PriceLockParticipant = {
  id: string;
  price_lock_id: string;
  locked_quantity: number;
  status: string;
  payment_status: string;
  deposit_percentage: number | null;
  deposit_amount: number | null;
  balance_due: number | null;
  total_amount: number | null;
  expires_at: string | null;
  locked_at: string;
  price_lock: PriceLock | null;
};

export async function fetchMyGroupBuys(userId: string): Promise<GroupBuyParticipant[]> {
  const { data, error } = await supabase
    .from('group_buy_participants')
    .select(`*, group_buys!inner(*, vendor_products(unified_product_id, unified_products!unified_product_id(name, slug, images)))`)
    .eq('sme_id', userId)
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({ ...p, group_buy: p.group_buys ?? null }));
}

export async function fetchMyPriceLocks(userId: string): Promise<PriceLockParticipant[]> {
  const { data, error } = await supabase
    .from('price_lock_participants')
    .select(`*, price_locks!inner(*, vendor_products(unified_product_id, unified_products!unified_product_id(name, slug, images)))`)
    .eq('sme_id', userId)
    .order('locked_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({ ...p, price_lock: p.price_locks ?? null }));
}

export async function fetchMyGroupBuyParticipation(groupBuyId: string, userId: string) {
  const { data } = await supabase
    .from('group_buy_participants')
    .select('id, status, quantity')
    .eq('group_buy_id', groupBuyId)
    .eq('sme_id', userId)
    .maybeSingle();
  return data;
}

export async function fetchMyPriceLockParticipation(priceLockId: string, userId: string) {
  const { data } = await supabase
    .from('price_lock_participants')
    .select('*')
    .eq('price_lock_id', priceLockId)
    .eq('sme_id', userId)
    .maybeSingle();
  return data;
}

// ---------------------------------------------------------------------------
// Join mutations — mirror web JoinGroupBuyModal / JoinPriceLockModal exactly.
// ---------------------------------------------------------------------------

export type DeliveryAddress = {
  fullName: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
};

const extraChargesSnapshot = (b: ChargeBreakdown) => ({
  adminFee: b.adminFee,
  vat: b.vat,
  delivery: b.delivery,
  customCharges: b.customCharges,
  total: b.adminFee + b.vat + b.delivery + b.customChargesTotal,
  applied_rules: b.appliedRules || [],
});

export async function joinGroupBuy(params: {
  groupBuy: GroupBuy;
  userId: string;
  quantity: number;
  deliveryAddress: DeliveryAddress;
  selectedVariants?: Record<string, string>;
  charges: OrderCharges;
  rules?: ActiveChargeRule[];
  ruleContext?: RuleResolutionContext;
}): Promise<string> {
  const { groupBuy, userId, quantity, deliveryAddress, selectedVariants, charges, rules, ruleContext } = params;

  const { data: existing } = await supabase
    .from('group_buy_participants')
    .select('id, status')
    .eq('group_buy_id', groupBuy.id)
    .eq('sme_id', userId)
    .maybeSingle();

  // Recomputed fresh every join attempt — nothing paid yet, so a pending
  // row's stored snapshot must not go stale against current charge config.
  const live = calculateGroupBuyCharges(
    Number(groupBuy.group_buy_price) * quantity,
    charges,
    { state: deliveryAddress.state, city: deliveryAddress.city },
    rules,
    ruleContext,
  );

  if (existing) {
    if (existing.status === 'active' || existing.status === 'completed') {
      throw new Error('You have already joined and paid for this group buy deal');
    }
    const { data: updated, error } = await supabase
      .from('group_buy_participants')
      .update({
        quantity,
        delivery_address: deliveryAddress as any,
        extra_charges: extraChargesSnapshot(live) as any,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return updated.id;
  }

  const { data: participant, error } = await supabase
    .from('group_buy_participants')
    .insert({
      group_buy_id: groupBuy.id,
      sme_id: userId,
      quantity,
      status: 'pending',
      delivery_address: deliveryAddress as any,
      selected_variants:
        selectedVariants && Object.keys(selectedVariants).length ? selectedVariants : null,
      extra_charges: extraChargesSnapshot(live) as any,
    } as any)
    .select()
    .single();
  if (error) throw error;

  // Seed purchase_order_id for webhook fallback reconciliation.
  try {
    await supabase
      .from('group_buy_participants')
      .update({ purchase_order_id: participant.id } as any)
      .eq('id', participant.id);
  } catch {
    // non-fatal
  }
  return participant.id;
}

export const getDepositInfo = (paymentPlan: string | null | undefined) => {
  switch (paymentPlan) {
    case 'deposit_30':
      return { percentage: 0.3, label: '30%', balanceLabel: '70%' };
    case 'deposit_50':
      return { percentage: 0.5, label: '50%', balanceLabel: '50%' };
    case 'deposit_25':
      return { percentage: 0.25, label: '25%', balanceLabel: '75%' };
    default:
      return { percentage: 1.0, label: '100%', balanceLabel: '0%' };
  }
};

export async function joinPriceLock(params: {
  priceLock: PriceLock;
  userId: string;
  quantity: number;
  deliveryAddress: DeliveryAddress;
  charges: OrderCharges;
  rules?: ActiveChargeRule[];
  ruleContext?: RuleResolutionContext;
}): Promise<string> {
  const { priceLock, userId, quantity, deliveryAddress, charges, rules, ruleContext } = params;

  // Fresh capacity check — never trust the list row.
  const { data: latest, error: fetchError } = await supabase
    .from('price_locks')
    .select('current_locked_quantity, total_available_quantity')
    .eq('id', priceLock.id)
    .single();
  if (fetchError) throw fetchError;

  const remaining =
    (latest?.total_available_quantity || 0) - (latest?.current_locked_quantity || 0);
  if (quantity > remaining) {
    throw new Error(`Only ${remaining} units available for this deal`);
  }

  const { data: existing } = await supabase
    .from('price_lock_participants')
    .select('id, status, payment_status, locked_quantity')
    .eq('price_lock_id', priceLock.id)
    .eq('sme_id', userId)
    .maybeSingle();

  if (existing?.status === 'active' && existing?.payment_status === 'fully_paid') {
    throw new Error('You have already completed this price lock deal');
  }
  if (existing && existing.status !== 'active') {
    await supabase.from('price_lock_participants').delete().eq('id', existing.id);
  }

  const depositInfo = getDepositInfo(priceLock.payment_plan);
  const totalAmt = Number(priceLock.locked_price) * quantity;
  const depAmt = totalAmt * depositInfo.percentage;
  const balAmt = totalAmt - depAmt;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (priceLock.lock_duration_days || 30));

  const snap = calculatePriceLockCharges(
    totalAmt,
    charges,
    { state: deliveryAddress.state, city: deliveryAddress.city },
    rules,
    ruleContext,
  );

  const { data: participant, error } = await supabase
    .from('price_lock_participants')
    .insert({
      price_lock_id: priceLock.id,
      sme_id: userId,
      locked_quantity: quantity,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
      payment_status: 'unpaid',
      deposit_percentage: Math.round(depositInfo.percentage * 100),
      deposit_amount: depAmt,
      balance_due: balAmt,
      total_amount: totalAmt,
      delivery_address: deliveryAddress as any,
      extra_charges: {
        ...extraChargesSnapshot(snap),
        adminFeePercent: totalAmt > 0 ? (snap.adminFee / totalAmt) * 100 : charges.priceLock.adminFeePercent,
        vatPercent: charges.priceLock.vatPercent,
        deliveryLocation: { state: deliveryAddress.state, city: deliveryAddress.city },
        snapshotAt: new Date().toISOString(),
      } as any,
    } as any)
    .select()
    .single();
  if (error) throw error;

  try {
    await supabase
      .from('price_lock_participants')
      .update({ purchase_order_id: participant.id } as any)
      .eq('id', participant.id);
  } catch {
    // non-fatal
  }
  return participant.id;
}

// ---------------------------------------------------------------------------
// Deal payment — mirrors usePalmPayPayment (deal branch).
// ---------------------------------------------------------------------------

export type DealPaymentStep = 'deposit' | 'balance';

export async function initiateDealPayment(params: {
  participantId: string;
  amount: number;
  userId: string;
  userMobileNo?: string;
  title: string;
  description: string;
  dealType: 'group_buy' | 'price_lock';
  step?: DealPaymentStep;
}): Promise<string> {
  const { participantId, amount, userId, title, description, dealType } = params;
  const step = params.step ?? 'deposit';

  let mobileNo = params.userMobileNo;
  if (!mobileNo) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('user_id', userId)
      .maybeSingle();
    mobileNo = profile?.phone || '';
  }

  // -balance suffix → PalmPay treats it as a distinct transaction (its dedup
  // cache would otherwise return the deposit's cached account details).
  const gatewayOrderId = step === 'balance' ? `${participantId}-balance` : participantId;
  const stepParam = step === 'balance' ? '&step=balance' : '';
  const callBackUrl = `${env.paymentCallbackBase}/${participantId}?type=${dealType}${stepParam}`;
  const notifyUrl = `${env.supabaseUrl}/functions/v1/payment-webhook`;

  const { data, error } = await supabase.functions.invoke('process-bank-transfer', {
    body: {
      orderUuid: undefined,
      orderId: gatewayOrderId,
      amount,
      dealOrderId: gatewayOrderId,
      dealAmount: amount,
      userId,
      userMobileNo: mobileNo,
      title,
      description,
      goodsDetails: description,
      callBackUrl,
      notifyUrl,
      flow: dealType,
    },
  });

  if (error) {
    let parsed: string | undefined;
    try {
      const ctx = (error as any).context;
      if (ctx) parsed = (await ctx.json())?.error;
    } catch {
      // context may not be JSON
    }
    throw new Error(parsed || error.message || 'Payment failed');
  }
  if (data && !data.success) throw new Error(data.error || 'Payment processing failed');

  const url = data?.cashierUrl || data?.checkoutUrl || data?.data?.cashierUrl || data?.data?.checkoutUrl;
  if (!url) throw new Error('Payment gateway did not return a checkout URL.');
  return url;
}

/**
 * Poll participant payment state — mirrors web PaymentCallback resolution:
 * group_buy → status 'active' means paid; price_lock → payment_status
 * deposit_paid / fully_paid (step=balance resolves only on fully_paid).
 */
export async function fetchDealPaymentState(
  dealType: 'group_buy' | 'price_lock',
  participantId: string,
) {
  if (dealType === 'group_buy') {
    const { data, error } = await supabase
      .from('group_buy_participants')
      .select('id, status')
      .eq('id', participantId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { found: false, paid: false, failed: false, status: null as string | null };
    return {
      found: true,
      paid: data.status === 'active',
      failed: data.status === 'cancelled' || data.status === 'failed',
      status: data.status as string,
    };
  }

  const { data, error } = await supabase
    .from('price_lock_participants')
    .select('id, status, payment_status')
    .eq('id', participantId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { found: false, paid: false, failed: false, status: null as string | null };
  return {
    found: true,
    paid: data.payment_status === 'deposit_paid' || data.payment_status === 'fully_paid',
    fullyPaid: data.payment_status === 'fully_paid',
    failed: data.status === 'cancelled' || data.payment_status === 'failed',
    status: `${data.status}/${data.payment_status}`,
  };
}

// ---------------------------------------------------------------------------
// Share links + click tracking (ShareDealButton / useTrackShareClick parity)
// ---------------------------------------------------------------------------

const prefixCache: Record<string, string> = {};

export async function getShareLinkPrefix(
  dealType: 'group_buy' | 'price_lock',
  fallback: string,
): Promise<string> {
  if (prefixCache[dealType]) return prefixCache[dealType];
  const { data } = await (supabase.from as any)('share_link_settings')
    .select('path_prefix')
    .eq('deal_type', dealType)
    .maybeSingle();
  const prefix = data?.path_prefix || fallback;
  prefixCache[dealType] = prefix;
  return prefix;
}

export async function buildDealShareUrl(
  dealType: 'group_buy' | 'price_lock',
  slug: string,
): Promise<string> {
  const fallback = dealType === 'group_buy' ? '/deals/group-buy' : '/deals/price-lock';
  const prefix = await getShareLinkPrefix(dealType, fallback);
  return `${env.siteUrl}${prefix}/${slug}`;
}

const clickedThisSession = new Set<string>();

/** One click row per app session per slug — feeds admin click analytics. */
export async function trackShareClick(
  dealType: 'group_buy' | 'price_lock',
  slug: string,
  userId?: string | null,
  role?: string | null,
) {
  const key = `${dealType}_${slug}`;
  if (clickedThisSession.has(key)) return;
  clickedThisSession.add(key);
  try {
    const ip = await fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((d) => d.ip)
      .catch(() => null);
    await (supabase.from as any)('share_link_clicks').insert({
      deal_type: dealType,
      slug,
      ip_address: ip,
      user_id: userId ?? null,
      role: role ?? null,
    });
  } catch {
    // analytics only — never block
  }
}
