import { supabase } from '@/api/supabase';

// Buyer-side orders — mirrors web useTrackOrders/useOrders field usage.
// orders.sme_id = buyer auth user id; order_items.product_id = vendor_products.id.

export type OrderSummary = {
  id: string;
  order_number: string;
  purchase_order_id: string | null;
  order_group_id: string | null;
  status: string;
  payment_status: string;
  total_amount: number | null;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number | null;
  total_price: number | null;
  selected_specs: Record<string, { label: string; value: string }> | null;
  vendor_name: string | null;
};

export type StatusEvent = {
  status: string;
  notes: string | null;
  changed_at: string;
};

export async function fetchOrders(userId: string): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, purchase_order_id, order_group_id, status, payment_status, total_amount, created_at',
    )
    .eq('sme_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((o: any) => ({
    ...o,
    order_number: o.order_number || o.purchase_order_id || o.id,
    payment_status: o.payment_status || 'pending',
  }));
}

export async function fetchOrder(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, product_name, quantity, unit_price, total_price, selected_specs')
    .eq('order_id', orderId);
  if (error) throw error;
  if (!items?.length) return [];

  // Vendor name via order_items.product_id → vendor_products.vendor_id → vendor_profiles
  const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];
  const vendorByProduct = new Map<string, string>();
  if (productIds.length) {
    const { data: vps } = await supabase
      .from('vendor_products')
      .select('id, vendor_id')
      .in('id', productIds);
    const vendorIds = [...new Set((vps ?? []).map((v: any) => v.vendor_id).filter(Boolean))];
    if (vendorIds.length) {
      const { data: profiles } = await supabase
        .from('vendor_profiles')
        .select('user_id, business_name')
        .in('user_id', vendorIds);
      const nameByUser = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, p.business_name as string]),
      );
      for (const vp of vps ?? []) {
        const name = nameByUser.get((vp as any).vendor_id);
        if (name) vendorByProduct.set((vp as any).id, name);
      }
    }
  }

  return items.map((i: any) => ({
    ...i,
    vendor_name: i.product_id ? (vendorByProduct.get(i.product_id) ?? null) : null,
  }));
}

export async function fetchOrderStatusHistory(orderId: string): Promise<StatusEvent[]> {
  const { data, error } = await supabase
    .from('order_status_history')
    .select('status, notes, changed_at')
    .eq('order_id', orderId)
    .order('changed_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as StatusEvent[];
}

/** Poll the whole group — payment truth lives on orders.payment_status (webhook). */
export async function fetchOrderGroupPaymentState(orderGroupId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, payment_status, total_amount')
    .eq('order_group_id', orderGroupId);
  if (error) throw error;
  const orders = data ?? [];
  return {
    orders,
    allPaid: orders.length > 0 && orders.every((o) => o.payment_status === 'paid'),
    anyFailed: orders.some(
      (o) => o.payment_status === 'failed' || o.payment_status === 'cancelled',
    ),
  };
}
