import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Port of web useWishlist — `wishlists` table, product_id (unified) and/or
// vendor_product_id, duplicate-safe inserts.

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string | null;
  vendor_product_id: string | null;
  product_type: 'individual' | 'bulk';
  created_at: string;
  notes: string | null;
  // enriched
  name?: string;
  slug?: string;
  image?: string | null;
  price?: number | null;
}

async function enrich(items: any[]): Promise<WishlistItem[]> {
  const unifiedIds = items.map((i) => i.product_id).filter(Boolean) as string[];
  const vpIds = items.map((i) => i.vendor_product_id).filter(Boolean) as string[];

  const unifiedMap = new Map<string, any>();
  const vpMap = new Map<string, any>();

  if (unifiedIds.length) {
    const { data } = await supabase
      .from('unified_products')
      .select('id, name, slug, images, admin_price')
      .in('id', unifiedIds);
    (data ?? []).forEach((p: any) => unifiedMap.set(p.id, p));
  }

  if (vpIds.length) {
    const { data } = await supabase
      .from('vendor_products')
      .select('id, price, unified_product_id, unified_products:unified_product_id(name, slug, images)')
      .in('id', vpIds);
    (data ?? []).forEach((vp: any) => vpMap.set(vp.id, vp));
  }

  return items.map((i) => {
    const up = i.product_id ? unifiedMap.get(i.product_id) : null;
    const vp = i.vendor_product_id ? vpMap.get(i.vendor_product_id) : null;
    const viaVp = vp?.unified_products;
    return {
      ...i,
      name: up?.name ?? viaVp?.name ?? 'Saved product',
      slug: up?.slug ?? viaVp?.slug ?? undefined,
      image: up?.images?.[0] ?? viaVp?.images?.[0] ?? null,
      price: up?.admin_price ?? vp?.price ?? null,
    };
  });
}

export function useWishlist(userId: string | undefined) {
  return useQuery({
    queryKey: ['wishlist-items', userId],
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<WishlistItem[]> => {
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return enrich(data || []);
    },
  });
}

export function useWishlistToggle(userId: string | undefined) {
  const queryClient = useQueryClient();
  const wishlist = useWishlist(userId);
  const items = wishlist.data ?? [];

  const find = (productId?: string | null, vendorProductId?: string | null) =>
    items.find(
      (i) =>
        (productId && i.product_id === productId) ||
        (vendorProductId && i.vendor_product_id === vendorProductId),
    );

  const toggle = useMutation({
    mutationFn: async (params: {
      productId?: string | null;
      vendorProductId?: string | null;
      productType?: 'individual' | 'bulk';
    }) => {
      if (!userId) throw new Error('Sign in to save products');
      const existing = find(params.productId, params.vendorProductId);
      if (existing) {
        const { error } = await supabase.from('wishlists').delete().eq('id', existing.id);
        if (error) throw error;
        return 'removed';
      }
      const { error } = await supabase.from('wishlists').insert({
        user_id: userId,
        product_id: params.productId ?? null,
        vendor_product_id: params.vendorProductId ?? null,
        product_type: params.productType ?? 'individual',
      } as any);
      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate')) return 'duplicate';
        throw error;
      }
      return 'added';
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist-items'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wishlists').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist-items'] }),
  });

  return {
    items,
    isSaved: (productId?: string | null, vendorProductId?: string | null) =>
      !!find(productId, vendorProductId),
    toggle,
    remove,
    isLoading: wishlist.isLoading,
  };
}
