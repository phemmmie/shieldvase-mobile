import { supabase } from '@/api/supabase';

// Vendor storefront — mirrors web StorefrontPage.tsx queries:
// vendor_storefronts (public, status=active) + vendor_directory + vendor_products.

export type Storefront = {
  id: string;
  vendor_id: string; // auth user id
  slug: string;
  tagline: string | null;
  banner_url: string | null;
  logo_url: string | null;
  about: string | null;
  // enriched from vendor_directory
  vendor_display_id: string | null;
  verification_status: string | null;
  city: string | null;
  state: string | null;
};

export type VendorListing = {
  id: string;
  price: number | null;
  price_unit: string | null;
  stock_quantity: number | null;
  unified_product_id: string | null;
  product_name: string | null;
  product_slug: string | null;
  product_images: string[] | null;
  category_slug: string | null;
};

export async function fetchStorefrontBySlug(slug: string): Promise<Storefront | null> {
  const { data: sf, error } = await supabase
    .from('vendor_storefronts')
    .select('id, vendor_id, slug, tagline, banner_url, logo_url, about')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  if (!sf) return null;

  const { data: dir } = await supabase
    .from('vendor_directory')
    .select('vendor_id, verification_status, state, city')
    .eq('user_id', sf.vendor_id)
    .maybeSingle();

  return {
    ...(sf as any),
    vendor_display_id: dir?.vendor_id ?? null,
    verification_status: dir?.verification_status ?? null,
    city: dir?.city ?? null,
    state: dir?.state ?? null,
  };
}

export async function fetchStorefrontByVendorId(
  vendorUserId: string,
): Promise<Storefront | null> {
  const { data: sf } = await supabase
    .from('vendor_storefronts')
    .select('slug')
    .eq('vendor_id', vendorUserId)
    .eq('status', 'active')
    .maybeSingle();
  if (!sf?.slug) return null;
  return fetchStorefrontBySlug(sf.slug);
}

export async function fetchVendorListings(vendorUserId: string): Promise<VendorListing[]> {
  const { data, error } = await supabase
    .from('vendor_products')
    .select(
      'id, price, price_unit, stock_quantity, unified_product_id, unified_products!unified_product_id(id, name, slug, images, categories:category_id(slug))',
    )
    .eq('vendor_id', vendorUserId)
    .eq('status', 'active');
  if (error) throw error;

  return (data ?? []).map((vp: any) => ({
    id: vp.id,
    price: vp.price,
    price_unit: vp.price_unit,
    stock_quantity: vp.stock_quantity,
    unified_product_id: vp.unified_product_id,
    product_name: vp.unified_products?.name ?? null,
    product_slug: vp.unified_products?.slug ?? null,
    product_images: vp.unified_products?.images ?? null,
    category_slug: vp.unified_products?.categories?.slug ?? null,
  }));
}
