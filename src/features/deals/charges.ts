import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Faithful port of web useOrderCharges.ts — same parsing, precedence and
// math so the extra_charges snapshots written by mobile join flows match
// what web (and settlement) compute.

export interface DeliveryByLocation {
  default: number;
  /** "Lagos" → whole state; "Lagos|Ikeja" → that city only */
  states: Record<string, number>;
}

export interface CustomCharge {
  id: string;
  label: string;
  type: 'percent' | 'fixed';
  value: number;
  visible: boolean;
}

export interface SectionCharges {
  adminFeePercent: number;
  vatPercent: number;
  deliveryByLocation: DeliveryByLocation;
  freeDeliveryThreshold?: number;
  customCharges: CustomCharge[];
}

export interface OrderCharges {
  standard: SectionCharges;
  groupBuy: SectionCharges;
  priceLock: SectionCharges;
  rfq: SectionCharges;
  adminFeePercent: number;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  vatPercent: number;
  groupBuyDeliveryCharge: number;
  groupBuyAdminFeePercent: number;
  priceLockAdminFeePercent: number;
  rfqAdminFeePercent: number;
}

const DEFAULT_SECTION_STANDARD: SectionCharges = {
  adminFeePercent: 0,
  vatPercent: 7.5,
  deliveryByLocation: { default: 2500, states: {} },
  freeDeliveryThreshold: 50000,
  customCharges: [],
};

const DEFAULT_SECTION_GROUP_BUY: SectionCharges = {
  adminFeePercent: 0,
  vatPercent: 7.5,
  deliveryByLocation: { default: 1500, states: {} },
  customCharges: [],
};

const DEFAULT_SECTION_PRICE_LOCK: SectionCharges = {
  adminFeePercent: 0,
  vatPercent: 7.5,
  deliveryByLocation: { default: 2500, states: {} },
  freeDeliveryThreshold: 50000,
  customCharges: [],
};

const DEFAULT_SECTION_RFQ: SectionCharges = {
  adminFeePercent: 0,
  vatPercent: 7.5,
  deliveryByLocation: { default: 2500, states: {} },
  freeDeliveryThreshold: 0,
  customCharges: [],
};

export const DEFAULT_CHARGES: OrderCharges = {
  standard: DEFAULT_SECTION_STANDARD,
  groupBuy: DEFAULT_SECTION_GROUP_BUY,
  priceLock: DEFAULT_SECTION_PRICE_LOCK,
  rfq: DEFAULT_SECTION_RFQ,
  adminFeePercent: 0,
  deliveryCharge: 2500,
  freeDeliveryThreshold: 50000,
  vatPercent: 7.5,
  groupBuyDeliveryCharge: 1500,
  groupBuyAdminFeePercent: 0,
  priceLockAdminFeePercent: 0,
  rfqAdminFeePercent: 0,
};

const num = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const parseDeliveryByLocation = (raw: unknown, fallback: DeliveryByLocation): DeliveryByLocation => {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;
  const states =
    r.states && typeof r.states === 'object'
      ? Object.fromEntries(
          Object.entries(r.states as Record<string, unknown>).map(([k, v]) => [k, num(v, 0)]),
        )
      : {};
  return { default: num(r.default, fallback.default), states };
};

const parseCustomCharges = (raw: unknown): CustomCharge[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, idx): CustomCharge | null => {
      if (!item || typeof item !== 'object') return null;
      const r = item as Record<string, unknown>;
      const label = typeof r.label === 'string' ? r.label.trim() : '';
      if (!label) return null;
      const type: CustomCharge['type'] = r.type === 'percent' ? 'percent' : 'fixed';
      return {
        id: typeof r.id === 'string' && r.id ? r.id : `charge-${idx}-${Date.now()}`,
        label,
        type,
        value: num(r.value, 0),
        visible: r.visible !== false,
      };
    })
    .filter((c): c is CustomCharge => c !== null);
};

const parseSection = (
  raw: unknown,
  fallback: SectionCharges,
  legacyDeliveryFlat?: number,
  legacyAdminFlat?: number,
  legacyVatFlat?: number,
  legacyThresholdFlat?: number,
): SectionCharges => {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    adminFeePercent: num(r.adminFeePercent, legacyAdminFlat ?? fallback.adminFeePercent),
    vatPercent: num(r.vatPercent, legacyVatFlat ?? fallback.vatPercent),
    deliveryByLocation: parseDeliveryByLocation(
      r.deliveryByLocation,
      legacyDeliveryFlat !== undefined
        ? { default: legacyDeliveryFlat, states: {} }
        : fallback.deliveryByLocation,
    ),
    freeDeliveryThreshold:
      r.freeDeliveryThreshold !== undefined
        ? num(r.freeDeliveryThreshold, fallback.freeDeliveryThreshold ?? 0)
        : (legacyThresholdFlat ?? fallback.freeDeliveryThreshold),
    customCharges:
      r.customCharges !== undefined ? parseCustomCharges(r.customCharges) : fallback.customCharges,
  };
};

const parseCharges = (value: unknown): OrderCharges => {
  if (!value || typeof value !== 'object') return DEFAULT_CHARGES;
  const v = value as Record<string, unknown>;

  const legacyAdmin = num(v.adminFeePercent, DEFAULT_CHARGES.adminFeePercent);
  const legacyVat = num(v.vatPercent, DEFAULT_CHARGES.vatPercent);
  const legacyDelivery = num(v.deliveryCharge, DEFAULT_CHARGES.deliveryCharge);
  const legacyThreshold = num(v.freeDeliveryThreshold, DEFAULT_CHARGES.freeDeliveryThreshold);
  const legacyGbDelivery = num(v.groupBuyDeliveryCharge, DEFAULT_CHARGES.groupBuyDeliveryCharge);
  const legacyGbAdmin = num(v.groupBuyAdminFeePercent, DEFAULT_CHARGES.groupBuyAdminFeePercent);
  const legacyPlAdmin = num(v.priceLockAdminFeePercent, DEFAULT_CHARGES.priceLockAdminFeePercent);
  const legacyRfqAdmin = num(v.rfqAdminFeePercent, DEFAULT_CHARGES.rfqAdminFeePercent);

  const standard = parseSection(v.standard, DEFAULT_SECTION_STANDARD, legacyDelivery, legacyAdmin, legacyVat, legacyThreshold);
  const groupBuy = parseSection(v.groupBuy, DEFAULT_SECTION_GROUP_BUY, legacyGbDelivery, legacyGbAdmin, legacyVat);
  const priceLock = parseSection(v.priceLock, DEFAULT_SECTION_PRICE_LOCK, legacyDelivery, legacyPlAdmin, legacyVat, legacyThreshold);
  const rfq = parseSection(v.rfq, DEFAULT_SECTION_RFQ, legacyDelivery, legacyRfqAdmin, legacyVat, 0);

  return {
    standard,
    groupBuy,
    priceLock,
    rfq,
    adminFeePercent: standard.adminFeePercent,
    vatPercent: standard.vatPercent,
    deliveryCharge: standard.deliveryByLocation.default,
    freeDeliveryThreshold: standard.freeDeliveryThreshold ?? 0,
    groupBuyDeliveryCharge: groupBuy.deliveryByLocation.default,
    groupBuyAdminFeePercent: groupBuy.adminFeePercent,
    priceLockAdminFeePercent: priceLock.adminFeePercent,
    rfqAdminFeePercent: rfq.adminFeePercent,
  };
};

export const useOrderCharges = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`order-charges-sync-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings', filter: 'key=eq.order_charges' },
        () => qc.invalidateQueries({ queryKey: ['order-charges'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: ['order-charges'],
    queryFn: async (): Promise<OrderCharges> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['order_charges']);
      if (error) {
        console.error('Error fetching order charges:', error);
        return DEFAULT_CHARGES;
      }
      const setting = data?.find((s) => s.key === 'order_charges');
      return parseCharges(setting?.value);
    },
    staleTime: 60 * 1000,
  });
};

export const resolveDeliveryFee = (
  config: DeliveryByLocation,
  location?: { state?: string; city?: string },
): number => {
  if (!location?.state) return config.default;
  const cityKey = location.city ? `${location.state}|${location.city}` : null;
  if (cityKey && config.states[cityKey] !== undefined) return config.states[cityKey];
  if (config.states[location.state] !== undefined) return config.states[location.state];
  return config.default;
};

export interface ComputedCharge {
  id: string;
  label: string;
  amount: number;
  visible: boolean;
}

export interface AppliedRuleEvent {
  rule_id: string | null;
  charge_kind: 'admin_fee' | 'custom';
  label?: string | null;
  source?: string;
  amount: number;
  visible?: boolean;
}

export interface ChargeBreakdown {
  subtotal: number;
  adminFee: number;
  vat: number;
  delivery: number;
  customCharges: ComputedCharge[];
  customChargesTotal: number;
  total: number;
  appliedRules?: AppliedRuleEvent[];
}

const computeCustomCharges = (subtotal: number, items: CustomCharge[]): ComputedCharge[] =>
  items.map((c) => ({
    id: c.id,
    label: c.label,
    amount: c.type === 'percent' ? subtotal * (c.value / 100) : c.value,
    visible: c.visible,
  }));

export interface ActiveChargeRule {
  id: string;
  transaction_type: 'all' | 'standard' | 'group_buy' | 'price_lock' | 'rfq';
  scope_type: 'global' | 'category' | 'product' | 'location' | 'vendor';
  category_id: string | null;
  product_id: string | null;
  location_key: string | null;
  vendor_id: string | null;
  charge_kind: 'admin_fee' | 'custom';
  label: string | null;
  charge_type: 'percent' | 'fixed';
  value: number;
  visible: boolean;
  priority: number;
}

export const useActiveChargeRules = () => {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`charge-rules-sync-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_charge_rules' }, () =>
        qc.invalidateQueries({ queryKey: ['active-order-charge-rules'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: ['active-order-charge-rules'],
    queryFn: async (): Promise<ActiveChargeRule[]> => {
      const { data, error } = await supabase
        .from('order_charge_rules' as any)
        .select('*')
        .eq('is_active', true);
      if (error) {
        console.error('Error fetching charge rules:', error);
        return [];
      }
      return (data || []) as unknown as ActiveChargeRule[];
    },
    staleTime: 60 * 1000,
  });
};

export interface RuleResolutionContext {
  categoryId?: string;
  productId?: string;
  vendorId?: string;
  vendorCommissionOverride?: number | null;
  state?: string;
  city?: string;
}

interface RuleAwareArgs {
  transactionType: 'group_buy' | 'price_lock';
  rules: ActiveChargeRule[];
  ruleContext: RuleResolutionContext;
}

const matchesTxn = (rule: ActiveChargeRule, txn: string) =>
  rule.transaction_type === txn || rule.transaction_type === 'all';

const pickMostSpecific = (rules: ActiveChargeRule[]): ActiveChargeRule | undefined =>
  [...rules].sort((a, b) => {
    if (a.transaction_type !== b.transaction_type) {
      if (a.transaction_type === 'all') return 1;
      if (b.transaction_type === 'all') return -1;
    }
    return b.priority - a.priority;
  })[0];

const resolveAdminFeeRateClient = (
  rules: ActiveChargeRule[],
  txn: string,
  ctx: RuleResolutionContext,
  fallbackPercent: number,
): { rate: number; event: AppliedRuleEvent } => {
  const feeRules = rules.filter((r) => r.charge_kind === 'admin_fee' && matchesTxn(r, txn));

  if (ctx.productId) {
    const best = pickMostSpecific(
      feeRules.filter((r) => r.scope_type === 'product' && r.product_id === ctx.productId),
    );
    if (best)
      return { rate: best.value, event: { rule_id: best.id, charge_kind: 'admin_fee', source: 'product_rule', amount: 0 } };
  }
  if (ctx.categoryId) {
    const best = pickMostSpecific(
      feeRules.filter((r) => r.scope_type === 'category' && r.category_id === ctx.categoryId),
    );
    if (best)
      return { rate: best.value, event: { rule_id: best.id, charge_kind: 'admin_fee', source: 'category_rule', amount: 0 } };
  }
  if (ctx.state) {
    const cityKey = ctx.city ? `${ctx.state}|${ctx.city}` : null;
    const locationRules = feeRules.filter(
      (r) => r.scope_type === 'location' && (r.location_key === cityKey || r.location_key === ctx.state),
    );
    const exact = locationRules.filter((r) => r.location_key === cityKey);
    const best = pickMostSpecific(exact.length ? exact : locationRules);
    if (best)
      return { rate: best.value, event: { rule_id: best.id, charge_kind: 'admin_fee', source: 'location_rule', amount: 0 } };
  }
  if (ctx.vendorCommissionOverride !== undefined && ctx.vendorCommissionOverride !== null) {
    return { rate: ctx.vendorCommissionOverride, event: { rule_id: null, charge_kind: 'admin_fee', source: 'vendor_override', amount: 0 } };
  }
  const globalBest = pickMostSpecific(feeRules.filter((r) => r.scope_type === 'global'));
  if (globalBest)
    return { rate: globalBest.value, event: { rule_id: globalBest.id, charge_kind: 'admin_fee', source: 'global_rule', amount: 0 } };

  return { rate: fallbackPercent, event: { rule_id: null, charge_kind: 'admin_fee', source: 'section_default', amount: 0 } };
};

const resolveCustomChargesClient = (
  rules: ActiveChargeRule[],
  txn: string,
  ctx: RuleResolutionContext,
  subtotal: number,
): ComputedCharge[] => {
  const cityKey = ctx.state && ctx.city ? `${ctx.state}|${ctx.city}` : null;
  const matching = rules.filter((r) => {
    if (r.charge_kind !== 'custom' || !matchesTxn(r, txn)) return false;
    if (r.scope_type === 'global') return true;
    if (r.scope_type === 'vendor') return r.vendor_id === ctx.vendorId;
    if (r.scope_type === 'location')
      return !!ctx.state && (r.location_key === cityKey || r.location_key === ctx.state);
    if (r.scope_type === 'category') return r.category_id === ctx.categoryId;
    if (r.scope_type === 'product') return r.product_id === ctx.productId;
    return false;
  });
  return matching.map((r) => ({
    id: r.id,
    label: r.label || 'Charge',
    amount: r.charge_type === 'percent' ? subtotal * (r.value / 100) : r.value,
    visible: r.visible,
  }));
};

const calculateSection = (
  subtotal: number,
  section: SectionCharges,
  location?: { state?: string; city?: string },
  applyFreeDeliveryThreshold = true,
  ruleAware?: RuleAwareArgs,
): ChargeBreakdown => {
  let adminFee = subtotal * (section.adminFeePercent / 100);
  let customCharges = computeCustomCharges(subtotal, section.customCharges || []);
  let appliedRules: AppliedRuleEvent[] | undefined;

  if (ruleAware) {
    const ctx: RuleResolutionContext = { ...ruleAware.ruleContext, state: location?.state, city: location?.city };
    const { rate, event } = resolveAdminFeeRateClient(ruleAware.rules, ruleAware.transactionType, ctx, section.adminFeePercent);
    adminFee = subtotal * (rate / 100);
    // Custom charges come exclusively from order_charge_rules once a rule
    // context exists — section.customCharges is legacy jsonb (migrated out),
    // reading both would double-charge.
    customCharges = resolveCustomChargesClient(ruleAware.rules, ruleAware.transactionType, ctx, subtotal);
    appliedRules = [
      { ...event, amount: adminFee },
      ...customCharges.map(
        (c): AppliedRuleEvent => ({ rule_id: c.id, charge_kind: 'custom', label: c.label, amount: c.amount, visible: c.visible }),
      ),
    ];
  }

  const vat = subtotal * (section.vatPercent / 100);
  let delivery = resolveDeliveryFee(section.deliveryByLocation, location);
  if (
    applyFreeDeliveryThreshold &&
    section.freeDeliveryThreshold !== undefined &&
    section.freeDeliveryThreshold > 0 &&
    subtotal >= section.freeDeliveryThreshold
  ) {
    delivery = 0;
  }
  const customChargesTotal = customCharges.reduce((sum, c) => sum + c.amount, 0);
  const total = subtotal + adminFee + vat + delivery + customChargesTotal;
  return { subtotal, adminFee, vat, delivery, customCharges, customChargesTotal, total, appliedRules };
};

export const calculateOrderCharges = (
  subtotal: number,
  charges: OrderCharges,
  location?: { state?: string; city?: string },
): ChargeBreakdown => calculateSection(subtotal, charges.standard, location, true);

/** Group Buy: shared delivery; no free-delivery threshold (already subsidised). */
export const calculateGroupBuyCharges = (
  subtotal: number,
  charges: OrderCharges,
  location?: { state?: string; city?: string },
  rules?: ActiveChargeRule[],
  ruleContext?: RuleResolutionContext,
): ChargeBreakdown =>
  calculateSection(
    subtotal,
    charges.groupBuy,
    location,
    false,
    rules && ruleContext ? { transactionType: 'group_buy', rules, ruleContext } : undefined,
  );

/** Price Lock: standard shape, priceLock section; free-delivery threshold applies. */
export const calculatePriceLockCharges = (
  subtotal: number,
  charges: OrderCharges,
  location?: { state?: string; city?: string },
  rules?: ActiveChargeRule[],
  ruleContext?: RuleResolutionContext,
): ChargeBreakdown =>
  calculateSection(
    subtotal,
    charges.priceLock,
    location,
    true,
    rules && ruleContext ? { transactionType: 'price_lock', rules, ruleContext } : undefined,
  );

// ---------------------------------------------------------------------------
// Server-authoritative order-charge preview (port of web useServerOrderCharges)
// ---------------------------------------------------------------------------

interface VendorProductContextRow {
  id: string;
  vendor_id: string;
  unified_product_id: string | null;
}

interface ResolvedChargeItem {
  vendorId: string;
  categoryId: string | null;
  productId: string | null;
  subtotal: number;
}

interface ChargesRpcResult {
  subtotal?: number;
  admin_fee?: number;
  vat?: number;
  delivery?: number;
  custom_charges_total?: number;
  applied_rules?: {
    charge_kind?: string;
    rule_id?: string | null;
    label?: string | null;
    amount?: number;
    visible?: boolean;
  }[];
}

export interface ServerOrderChargesItem {
  id: string;
  vendor_product_id?: string;
  unified_product_id?: string;
  vendor_id?: string | null;
  price: number;
  quantity: number;
}

/**
 * Server-authoritative order-charge preview for the cart/checkout summary.
 * Calls calculate_order_charges_v2 per vendor group (delivery applied once per
 * order group) — the same RPC convert_cart_to_order uses, so the displayed
 * total matches the charged total by construction. Returns null data (callers
 * fall back to client-side calc) when items can't be resolved or the RPC fails.
 */
export const useServerOrderCharges = (
  items: ServerOrderChargesItem[],
  location?: { state?: string; city?: string },
) => {
  const itemsKey = (items || [])
    .map((i) => `${i.vendor_product_id || `${i.unified_product_id}|${i.vendor_id}`}:${i.quantity}:${i.price}`)
    .sort()
    .join(';');
  const state = location?.state || null;
  const city = location?.city || null;

  return useQuery<{ breakdown: ChargeBreakdown } | null>({
    queryKey: ['server-order-charges', itemsKey, state, city],
    enabled: items.length > 0,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const byVpId = (items || []).filter((i) => i.vendor_product_id);
      const byPair = (items || []).filter(
        (i) => !i.vendor_product_id && i.unified_product_id && i.vendor_id,
      );

      const contextByItemId = new Map<string, VendorProductContextRow>();
      const vpIds = Array.from(new Set(byVpId.map((i) => i.vendor_product_id!)));
      if (vpIds.length > 0) {
        const { data, error } = await supabase
          .from('vendor_products')
          .select('id, vendor_id, unified_product_id')
          .in('id', vpIds);
        if (error) throw error;
        (data || []).forEach((row: any) => contextByItemId.set(row.id, row));
      }

      for (const item of byPair) {
        const { data, error } = await supabase
          .from('vendor_products')
          .select('id, vendor_id, unified_product_id')
          .eq('unified_product_id', item.unified_product_id!)
          .eq('vendor_id', item.vendor_id!)
          .limit(1);
        if (error) throw error;
        if (data?.[0]) contextByItemId.set(item.id, data[0]);
      }

      const unifiedIds = Array.from(
        new Set(
          Array.from(contextByItemId.values())
            .map((r) => r.unified_product_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const categoryByUnified = new Map<string, string | null>();
      if (unifiedIds.length > 0) {
        const { data, error } = await supabase
          .from('unified_products')
          .select('id, category_id')
          .in('id', unifiedIds);
        if (error) throw error;
        (data || []).forEach((row: any) => categoryByUnified.set(row.id, row.category_id));
      }

      const resolved: ResolvedChargeItem[] = [];
      for (const item of items) {
        const ctx = contextByItemId.get(item.vendor_product_id || item.id);
        if (!ctx) return null;
        resolved.push({
          vendorId: ctx.vendor_id,
          categoryId: ctx.unified_product_id
            ? categoryByUnified.get(ctx.unified_product_id) ?? null
            : null,
          productId: ctx.unified_product_id,
          subtotal: item.price * item.quantity,
        });
      }
      if (resolved.length === 0) return null;

      const groups = new Map<string, ResolvedChargeItem[]>();
      resolved.forEach((ri) => {
        const list = groups.get(ri.vendorId) || [];
        list.push(ri);
        groups.set(ri.vendorId, list);
      });

      const results = await Promise.all(
        Array.from(groups.entries()).map(([vendorId, groupItems]) =>
          supabase.rpc('calculate_order_charges_v2', {
            p_items: groupItems.map((g) => ({
              category_id: g.categoryId,
              product_id: g.productId,
              subtotal: g.subtotal,
            })),
            p_vendor_id: vendorId,
            p_transaction_type: 'order',
            p_state: state,
            p_city: city,
          }),
        ),
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;

      let subtotal = 0;
      let adminFee = 0;
      let vat = 0;
      let delivery = 0;
      let customChargesTotal = 0;
      let total = 0;
      const customCharges: ComputedCharge[] = [];

      results.forEach((res, idx) => {
        const data = res.data as ChargesRpcResult | null;
        if (!data) return;
        subtotal += Number(data.subtotal || 0);
        adminFee += Number(data.admin_fee || 0);
        vat += Number(data.vat || 0);
        if (idx === 0) delivery = Number(data.delivery || 0);
        customChargesTotal += Number(data.custom_charges_total || 0);
        total +=
          Number(data.subtotal || 0) +
          Number(data.admin_fee || 0) +
          Number(data.vat || 0) +
          Number(data.custom_charges_total || 0) +
          (idx === 0 ? Number(data.delivery || 0) : 0);
        (data.applied_rules || [])
          .filter((r) => r.charge_kind === 'custom')
          .forEach((r) =>
            customCharges.push({
              id: r.rule_id || r.label || 'custom',
              label: r.label || 'Charge',
              amount: Number(r.amount || 0),
              visible: r.visible !== false,
            }),
          );
      });

      return {
        breakdown: {
          subtotal,
          adminFee,
          vat,
          delivery,
          customCharges,
          customChargesTotal,
          total,
        },
      };
    },
  });
};
