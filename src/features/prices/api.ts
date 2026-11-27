import type { SupabaseClient } from '@supabase/supabase-js';

export interface MaterialCityPrice {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  vendorCount: number;
  priceUnit: string | null;
  lastUpdated: string | null;
}

/**
 * Current price for a curated material (a set of unified_product_ids, see
 * priceIndexMaterials.ts) in one city, from active listings by *verified*
 * vendors only — same purchasability rule enforced elsewhere in the app
 * (see convert_cart_to_order / vendor_directory.verification_status), kept
 * consistent here since these pages represent real, actionable pricing.
 *
 * No price-history table exists yet (see the SEO plan's Phase 3 note) — this
 * is always the live current price, not a historical trend.
 */
export const fetchMaterialCityPrice = async (
  client: SupabaseClient,
  unifiedProductIds: string[],
  city: string,
): Promise<MaterialCityPrice | null> => {
  const { data: vendorProducts, error } = await client
    .from('vendor_products')
    .select('price, price_unit, vendor_id, last_updated, available_locations')
    .in('unified_product_id', unifiedProductIds)
    .eq('status', 'active')
    .contains('available_locations', [city]);

  if (error || !vendorProducts || vendorProducts.length === 0) return null;

  const vendorIds = [...new Set(vendorProducts.map((vp) => vp.vendor_id).filter(Boolean))];
  if (vendorIds.length === 0) return null;

  const { data: vendors } = await client
    .from('vendor_directory')
    .select('user_id, verification_status')
    .in('user_id', vendorIds as string[]);

  const verifiedIds = new Set(
    (vendors || []).filter((v) => v.verification_status === 'verified').map((v) => v.user_id),
  );

  const verifiedListings = vendorProducts.filter((vp) => verifiedIds.has(vp.vendor_id));
  if (verifiedListings.length === 0) return null;

  const prices = verifiedListings.map((v) => v.price).filter((p): p is number => !!p && p > 0);
  if (prices.length === 0) return null;

  const lastUpdated = verifiedListings.reduce<string | null>((latest, v) => {
    if (!v.last_updated) return latest;
    return !latest || v.last_updated > latest ? v.last_updated : latest;
  }, null);

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    vendorCount: verifiedListings.length,
    priceUnit: verifiedListings[0]?.price_unit || null,
    lastUpdated,
  };
};
