import { supabase } from '@/api/supabase';
import { parseProductSlug, shortIdFromUuid } from '@/utils/productUrl';

// Field names verified against the web app's own queries
// (useCategoriesWithProducts.ts, ProductDetailPage.tsx).

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parent_id: string | null;
  main_category: string | null;
  description: string | null;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  images: string[] | null;
  category_id: string | null;
  min_price: number | null;
  vendor_count: number;
};

export type VendorOffer = {
  id: string;
  vendor_id: string; // auth user id
  vendor_display_id: string | null; // VEND-XXX-####
  price: number | null;
  price_unit: string | null;
  stock_quantity: number | null;
  min_order_quantity: number | null;
  lead_time_days: number | null;
  available_locations: unknown;
  manufacturer: string | null;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, image, parent_id, main_category, description')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Category[];
}

async function attachMinPrices<T extends { id: string }>(
  rows: T[],
): Promise<(T & { min_price: number | null; vendor_count: number })[]> {
  if (!rows.length) return rows.map((r) => ({ ...r, min_price: null, vendor_count: 0 }));
  const { data: vps } = await supabase
    .from('vendor_products')
    .select('unified_product_id, price')
    .in('unified_product_id', rows.map((r) => r.id))
    .eq('status', 'active')
    .order('price', { ascending: true });
  const map = new Map<string, { min: number | null; count: number }>();
  for (const vp of vps ?? []) {
    const pid = (vp as any).unified_product_id as string;
    const cur = map.get(pid) ?? { min: null, count: 0 };
    if (cur.min == null) cur.min = (vp as any).price ?? null;
    cur.count += 1;
    map.set(pid, cur);
  }
  return rows.map((r) => ({
    ...r,
    min_price: map.get(r.id)?.min ?? null,
    vendor_count: map.get(r.id)?.count ?? 0,
  }));
}

export async function fetchFeaturedProducts(limit = 24): Promise<ProductSummary[]> {
  const { data, error } = await supabase
    .from('unified_products')
    .select('id, name, slug, description, images, category_id')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return attachMinPrices((data ?? []) as any[]);
}

export async function fetchProductsByCategory(categoryId: string): Promise<ProductSummary[]> {
  const { data, error } = await supabase
    .from('unified_products')
    .select('id, name, slug, description, images, category_id')
    .eq('category_id', categoryId)
    .eq('status', 'active');
  if (error) throw error;
  return attachMinPrices((data ?? []) as any[]);
}

export async function searchProducts(term: string): Promise<ProductSummary[]> {
  const { data, error } = await supabase
    .from('unified_products')
    .select('id, name, slug, description, images, category_id')
    .eq('status', 'active')
    .ilike('name', `%${term}%`)
    .limit(40);
  if (error) throw error;
  return attachMinPrices((data ?? []) as any[]);
}

export async function fetchProductBySlug(slugParam: string) {
  // Web canonical URLs are /{categorySlug}/{productSlug}-p-{shortId}; the
  // mobile route param carries the full "{slug}-p-{shortId}" tail. Disambiguate
  // shared slugs by the 6-char shortId, preferring active rows (web parity).
  const parsed = parseProductSlug(slugParam);
  const lookupSlug = parsed?.slug ?? slugParam;

  const { data: rows, error } = await supabase
    .from('unified_products')
    .select('*')
    .eq('slug', lookupSlug)
    .order('status');
  if (error) throw error;

  const list = rows ?? [];
  if (parsed?.shortId) {
    return (
      list.find((r: any) => shortIdFromUuid(r.id) === parsed.shortId && r.status === 'active') ||
      list.find((r: any) => shortIdFromUuid(r.id) === parsed.shortId) ||
      null
    );
  }
  return list.find((r: any) => r.status === 'active') || list[0] || null;
}

export async function fetchVendorOffers(unifiedProductId: string): Promise<VendorOffer[]> {
  const { data: vps, error } = await supabase
    .from('vendor_products')
    .select(
      'id, vendor_id, price, price_unit, stock_quantity, min_order_quantity, lead_time_days, available_locations, manufacturer',
    )
    .eq('unified_product_id', unifiedProductId)
    .eq('status', 'active')
    .order('price', { ascending: true });
  if (error) throw error;

  const userIds = Array.from(new Set((vps ?? []).map((v: any) => v.vendor_id).filter(Boolean)));
  let dir: Record<string, { vendor_id: string | null; verification_status: string | null }> = {};
  if (userIds.length) {
    const { data: rows } = await supabase
      .from('vendor_directory')
      .select('user_id, vendor_id, verification_status')
      .in('user_id', userIds);
    for (const r of rows ?? []) dir[(r as any).user_id] = r as any;
  }

  // Only verified vendors' listings are purchasable (web parity — enforced
  // server-side by convert_cart_to_order).
  return (vps ?? [])
    .map((v: any) => ({
      ...v,
      vendor_display_id: dir[v.vendor_id]?.vendor_id ?? null,
      verification_status: dir[v.vendor_id]?.verification_status ?? null,
    }))
    .filter((v: any) => v.verification_status === 'verified' || v.verification_status === 'approved')
    .map(({ verification_status: _drop, ...v }: any) => v) as VendorOffer[];
}
