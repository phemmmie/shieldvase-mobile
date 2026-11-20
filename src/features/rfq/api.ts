import { supabase } from '@/api/supabase';

// Buyer RFQ flows — verified against web useRFQs.ts, CreateRFQTab.tsx and
// BidComparisonMatrix.tsx. Award goes through the SECURITY DEFINER RPC
// sme_award_rfq_items which marks winners and inserts locked cart rows.

export type RfqItemInput = {
  product_name: string;
  quantity: number;
  unit?: string | null;
  category?: string | null;
  location?: string | null;
  delivery_date?: string | null;
  target_price?: number | null;
  instructions?: string | null;
  specification?: string | null;
};

export async function createRfq(userId: string, items: RfqItemInput[]) {
  const title =
    items.length === 1
      ? items[0].product_name
      : `${items[0].product_name} +${items.length - 1} more`;

  const { data: rfq, error: rfqError } = await supabase
    .from('rfqs')
    .insert({ sme_id: userId, status: 'submitted', source: 'manual', title })
    .select()
    .single();
  if (rfqError) throw rfqError;

  const { error: itemsError } = await supabase.from('rfq_items').insert(
    items.map((i) => ({
      rfq_id: rfq.id,
      product_name: i.product_name,
      category: i.category || null,
      quantity: i.quantity,
      unit: i.unit || null,
      delivery_date: i.delivery_date || null,
      location: i.location || null,
      target_price: i.target_price ?? null,
      instructions: i.instructions || null,
      specifications: i.specification ? { text: i.specification } : null,
    })),
  );
  if (itemsError) throw itemsError;
  return rfq;
}

export type RfqSummary = {
  id: string;
  rfq_number: string;
  status: string;
  title: string | null;
  created_at: string;
  response_count: number;
  total_items: number;
  lowest_bid: number | null;
};

const ACTIVE_QUOTE_STATUSES = ['withdrawn', 'rejected'];

export async function fetchMyRfqs(userId: string): Promise<RfqSummary[]> {
  const { data, error } = await supabase
    .from('rfqs')
    .select('*, rfq_items(*), quotations(id, total_amount, status, is_winning_bid, bid_rank)')
    .eq('sme_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((r: any) => {
    const active = (r.quotations ?? []).filter(
      (q: any) => !ACTIVE_QUOTE_STATUSES.includes(q.status),
    );
    return {
      id: r.id,
      rfq_number: r.rfq_number,
      status: r.status,
      title: r.title,
      created_at: r.created_at,
      total_items: (r.rfq_items ?? []).length,
      response_count: active.length,
      lowest_bid: active.length
        ? Math.min(...active.map((q: any) => Number(q.total_amount)))
        : null,
    };
  });
}

export type BidItem = {
  quotation_item_id: string;
  unit_price: number;
  subtotal: number;
  is_winning: boolean;
};

export type Bid = {
  quotation_id: string;
  vendor_label: string; // "Supplier A" — anonymised for SME viewer (web parity)
  vendor_sublabel: string;
  total: number;
  items: Record<string, BidItem>; // keyed by rfq_item_id
};

export type RfqDetail = {
  id: string;
  rfq_number: string;
  status: string;
  title: string | null;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit: string | null;
    markup_type: string;
    markup_value: number;
  }[];
  bids: Bid[];
};

export async function fetchRfqDetail(rfqId: string): Promise<RfqDetail | null> {
  const { data: rfq, error } = await supabase
    .from('rfqs')
    .select(
      `id, rfq_number, status, title, created_at,
       rfq_items(id, product_name, quantity, unit, markup_type, markup_value),
       quotations(id, vendor_id, status, total_amount,
         quotation_items(id, rfq_item_id, unit_price, subtotal, is_winning))`,
    )
    .eq('id', rfqId)
    .maybeSingle();
  if (error) throw error;
  if (!rfq) return null;

  const quotes = (rfq.quotations ?? []).filter(
    (q: any) => !ACTIVE_QUOTE_STATUSES.includes(q.status),
  );

  // vendor_directory is a public view — resolves under SME RLS (web comment).
  const vendorIds = [...new Set(quotes.map((q: any) => q.vendor_id))];
  const vendorInfo = new Map<string, any>();
  if (vendorIds.length) {
    const { data: vps } = await supabase
      .from('vendor_directory')
      .select('user_id, vendor_id, city, state')
      .in('user_id', vendorIds);
    (vps ?? []).forEach((v: any) => vendorInfo.set(v.user_id, v));
  }

  const sorted = [...quotes].sort(
    (a: any, b: any) => Number(a.total_amount || 0) - Number(b.total_amount || 0),
  );

  const bids: Bid[] = sorted.map((q: any, idx: number) => {
    const items: Record<string, BidItem> = {};
    (q.quotation_items ?? []).forEach((qi: any) => {
      items[qi.rfq_item_id] = {
        quotation_item_id: qi.id,
        unit_price: Number(qi.unit_price),
        subtotal: Number(qi.subtotal),
        is_winning: !!qi.is_winning,
      };
    });
    const vp = vendorInfo.get(q.vendor_id);
    const displayId = vp?.vendor_id || `VEND-${String(q.vendor_id).slice(0, 6).toUpperCase()}`;
    const location = [vp?.city, vp?.state].filter(Boolean).join(', ');
    return {
      quotation_id: q.id,
      vendor_label: `Supplier ${String.fromCharCode(65 + idx)}`,
      vendor_sublabel: `ID: ${displayId}${location ? ` · ${location}` : ''}`,
      total: Number(q.total_amount || 0),
      items,
    };
  });

  return {
    id: rfq.id,
    rfq_number: rfq.rfq_number,
    status: rfq.status,
    title: rfq.title,
    created_at: rfq.created_at,
    items: (rfq.rfq_items ?? []).map((it: any) => ({
      id: it.id,
      product_name: it.product_name,
      quantity: Number(it.quantity || 0),
      unit: it.unit,
      markup_type: it.markup_type || 'percent',
      markup_value: Number(it.markup_value || 0),
    })),
    bids,
  };
}

/** Markup the SME sees on top of raw vendor unit prices (web displayUnit). */
export const displayUnitPrice = (
  rawUnit: number,
  item: { markup_type?: string; markup_value?: number },
) => {
  const mt = item.markup_type || 'percent';
  const mv = Number(item.markup_value || 0);
  return mt === 'multiplier' ? rawUnit * (mv || 1) : rawUnit * (1 + mv / 100);
};

/**
 * Award selected quotation_items → server marks winners and inserts locked
 * cart rows. Returns the RPC payload (cart_inserts count, etc.).
 */
export async function awardRfqItems(
  rfqId: string,
  awards: { rfq_item_id: string; quotation_item_id: string }[],
) {
  const { data, error } = await supabase.rpc('sme_award_rfq_items', {
    _rfq_id: rfqId,
    _awards: awards as any,
  });
  if (error) throw error;
  return data as any;
}
