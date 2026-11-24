import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';

// Data contracts ported from the web marketplace pages:
// useConstructionProducts / usePolymerProducts / useEnergyProducts /
// useAgricultureProducts / useChemicalProducts — all resolve
// main_category → category ids → unified_products (+ vendor_products).

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

export type MarketplaceProduct = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  images: string[];
  category_id: string | null;
  subcategory_id: string | null;
  category_name: string | null;
  subcategory_name: string | null;
  subcategory_slug: string | null;
  display_price: number | null;
  price_unit: string | null;
  vendor_count: number;
  in_stock: boolean;
  cities: string[];
  brands: string[];
  cheapest_vendor_product_id: string | null;
  cheapest_vendor_id: string | null;
};

export type MarketplaceData = {
  categories: MarketplaceCategory[];
  products: MarketplaceProduct[];
};

export async function fetchMarketplace(mainCategory: string): Promise<MarketplaceData> {
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .eq('main_category', mainCategory)
    .eq('is_active', true);
  if (catError) throw catError;

  const cats = (categories ?? []) as MarketplaceCategory[];
  const ids = cats.map((c) => c.id);
  if (!ids.length) return { categories: [], products: [] };

  // Products tagged at any depth of the tree — category_id OR
  // subcategory_id in the id set (web parity: DB tagging depth varies).
  const { data, error } = await supabase
    .from('unified_products')
    .select(
      `id, name, slug, description, images, base_price, admin_price,
       available_cities, available_brands, category_id, subcategory_id,
       vendor_products ( id, vendor_id, price, price_unit, stock_quantity, available_locations, status )`,
    )
    .eq('status', 'active')
    .neq('marketplace_visible', false)
    .or(`category_id.in.(${ids.join(',')}),subcategory_id.in.(${ids.join(',')})`);
  if (error) throw error;

  const nameById = new Map(cats.map((c) => [c.id, c.name]));
  const slugById = new Map(cats.map((c) => [c.id, c.slug]));

  const products = (data ?? []).map((p: any): MarketplaceProduct => {
    const listings = ((p.vendor_products as any[]) ?? []).filter((v) => v.status === 'active');
    const prices = listings
      .map((v) => v.price)
      .filter((x) => typeof x === 'number' && x > 0) as number[];
    const minPrice = prices.length ? Math.min(...prices) : null;
    const cheapest =
      [...listings]
        .filter((v) => (v.stock_quantity ?? 0) > 0 && v.price > 0)
        .sort((a, b) => a.price - b.price)[0] ??
      listings[0] ??
      null;

    const cities = new Set<string>();
    for (const c of p.available_cities ?? []) if (c) cities.add(String(c));
    for (const v of listings)
      for (const c of v.available_locations ?? []) if (c) cities.add(String(c));

    return {
      id: p.id,
      name: p.name,
      slug: p.slug ?? null,
      description: p.description ?? null,
      images: Array.isArray(p.images) ? p.images : [],
      category_id: p.category_id ?? null,
      subcategory_id: p.subcategory_id ?? null,
      category_name: p.category_id ? nameById.get(p.category_id) ?? null : null,
      subcategory_name: p.subcategory_id ? nameById.get(p.subcategory_id) ?? null : null,
      subcategory_slug: p.subcategory_id ? slugById.get(p.subcategory_id) ?? null : null,
      display_price: p.admin_price ?? minPrice ?? p.base_price ?? null,
      price_unit: cheapest?.price_unit ?? listings[0]?.price_unit ?? null,
      vendor_count: new Set(listings.map((v) => v.vendor_id).filter(Boolean)).size,
      in_stock: listings.some((v) => (v.stock_quantity ?? 0) > 0),
      cities: Array.from(cities).sort(),
      brands: (p.available_brands ?? []).filter(Boolean),
      cheapest_vendor_product_id: cheapest?.id ?? null,
      cheapest_vendor_id: cheapest?.vendor_id ?? null,
    };
  });

  return { categories: cats, products };
}

export const useMarketplace = (mainCategory: string | undefined) =>
  useQuery({
    queryKey: ['marketplace', mainCategory],
    queryFn: () => fetchMarketplace(mainCategory!),
    enabled: !!mainCategory,
  });

/** Selected node plus all its descendants (web tree-filter behaviour). */
export function descendantIds(categories: MarketplaceCategory[], rootId: string): Set<string> {
  const out = new Set<string>([rootId]);
  const stack = [rootId];
  while (stack.length) {
    const pid = stack.pop()!;
    for (const c of categories) {
      if (c.parent_id === pid && !out.has(c.id)) {
        out.add(c.id);
        stack.push(c.id);
      }
    }
  }
  return out;
}

/** Category nodes in tree order (roots first, children after each parent). */
export function flattenTree(categories: MarketplaceCategory[]): MarketplaceCategory[] {
  const roots = categories.filter((c) => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name));
  const children = (pid: string) =>
    categories.filter((c) => c.parent_id === pid).sort((a, b) => a.name.localeCompare(b.name));
  const out: MarketplaceCategory[] = [];
  const walk = (n: MarketplaceCategory) => {
    out.push(n);
    children(n.id).forEach(walk);
  };
  roots.forEach(walk);
  return out;
}

export type MarketplaceFilters = {
  categoryId?: string | null;
  categorySlug?: string | null;
  cities?: string[];
  brands?: string[];
  search?: string;
};

export function applyMarketplaceFilters(
  products: MarketplaceProduct[],
  categories: MarketplaceCategory[],
  opts: MarketplaceFilters,
): MarketplaceProduct[] {
  let out = products;
  if (opts.categoryId) {
    const set = descendantIds(categories, opts.categoryId);
    out = out.filter(
      (p) =>
        (p.category_id && set.has(p.category_id)) ||
        (p.subcategory_id && set.has(p.subcategory_id)),
    );
  }
  if (opts.categorySlug) {
    out = out.filter((p) => p.subcategory_slug === opts.categorySlug);
  }
  if (opts.cities?.length) {
    out = out.filter((p) => p.cities.some((c) => opts.cities!.includes(c)));
  }
  if (opts.brands?.length) {
    out = out.filter((p) => p.brands.some((b) => opts.brands!.includes(b)));
  }
  const term = opts.search?.trim().toLowerCase();
  if (term) {
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description ?? '').toLowerCase().includes(term),
    );
  }
  return out;
}

export type SortKey = 'default' | 'price-low' | 'price-high' | 'popular' | 'newest';

export const SORT_OPTIONS: { key: SortKey; label: string; short: string }[] = [
  { key: 'default', label: 'Sort by', short: 'Sort by' },
  { key: 'price-low', label: 'Price: Low to High', short: 'Price: Low' },
  { key: 'price-high', label: 'Price: High to Low', short: 'Price: High' },
  { key: 'popular', label: 'Most Popular', short: 'Popular' },
  { key: 'newest', label: 'Newest First', short: 'Newest' },
];

export function sortMarketplaceProducts(
  products: MarketplaceProduct[],
  sortBy: SortKey,
): MarketplaceProduct[] {
  const sorted = [...products];
  switch (sortBy) {
    case 'price-low':
      sorted.sort((a, b) => (a.display_price ?? 0) - (b.display_price ?? 0));
      break;
    case 'price-high':
      sorted.sort((a, b) => (b.display_price ?? 0) - (a.display_price ?? 0));
      break;
    case 'popular':
      sorted.sort((a, b) => b.vendor_count - a.vendor_count);
      break;
    case 'newest':
      sorted.sort((a, b) => (b.id > a.id ? 1 : -1));
      break;
  }
  return sorted;
}

export type CategoryChip = { id: string; name: string; slug: string; count: number | null };

/**
 * Shared marketplace-page state: search, category/city/brand filters, sort,
 * plus derived option lists. Mirrors the filter logic each web marketplace
 * view runs against its catalogue.
 */
export function useMarketplacePage(mainCategory: string, initialSearch = '') {
  const query = useMarketplace(mainCategory);
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('default');

  const categories = useMemo(() => query.data?.categories ?? [], [query.data]);
  const products = useMemo(() => query.data?.products ?? [], [query.data]);

  const cityOptions = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.cities))).sort(),
    [products],
  );
  const brandOptions = useMemo(
    () => Array.from(new Set(products.flatMap((p) => p.brands))).sort(),
    [products],
  );

  // Chip options in tree order; a chip's count includes its descendants'
  // products, matching the web sidebar's group counts.
  const categoryChips = useMemo<CategoryChip[]>(
    () =>
      flattenTree(categories).map((c) => {
        const set = descendantIds(categories, c.id);
        const count = products.filter(
          (p) =>
            (p.category_id && set.has(p.category_id)) ||
            (p.subcategory_id && set.has(p.subcategory_id)),
        ).length;
        return { id: c.id, name: c.name, slug: c.slug, count };
      }),
    [categories, products],
  );

  const filtered = useMemo(
    () =>
      sortMarketplaceProducts(
        applyMarketplaceFilters(products, categories, {
          categoryId,
          categorySlug,
          cities,
          brands,
          search,
        }),
        sortBy,
      ),
    [products, categories, categoryId, categorySlug, cities, brands, search, sortBy],
  );

  const activeFilterCount =
    (categoryId || categorySlug ? 1 : 0) + cities.length + brands.length;

  const clearFilters = () => {
    setCategoryId(null);
    setCategorySlug(null);
    setCities([]);
    setBrands([]);
    setSearch('');
  };

  return {
    query,
    categories,
    categoryChips,
    products,
    filtered,
    cityOptions,
    brandOptions,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    categorySlug,
    setCategorySlug,
    cities,
    setCities,
    brands,
    setBrands,
    sortBy,
    setSortBy,
    activeFilterCount,
    clearFilters,
  };
}

/**
 * Mirrors the web hero's handleSearchSubmit: a free-text search resolves to
 * the marketplace category page that lists matching products —
 * /{categorySlug}?search={term}. Direct category-name match first, else the
 * main_category of the best-matching product, else 'construction-materials'.
 */
export async function resolveSearchCategorySlug(term: string): Promise<string> {
  const trimmed = term.trim();
  const { data: topCategories } = await supabase
    .from('categories')
    .select('name, slug, main_category')
    .is('parent_id', null)
    .eq('is_active', true);

  const direct = (topCategories ?? []).find(
    (c: any) =>
      c.name?.toLowerCase() === trimmed.toLowerCase() ||
      c.name?.toLowerCase().includes(trimmed.toLowerCase()),
  );
  if (direct) return direct.slug;

  const { data: products } = await supabase
    .from('unified_products')
    .select('name, categories:categories!unified_products_category_id_fkey(main_category)')
    .ilike('name', `%${trimmed}%`)
    .eq('status', 'active')
    .limit(5);

  const best =
    (products ?? []).find((p: any) => p.name?.toLowerCase().startsWith(trimmed.toLowerCase())) ??
    (products ?? [])[0];
  const mainCategory = (best as any)?.categories?.main_category;
  const matched = mainCategory
    ? (topCategories ?? []).find((c: any) => c.main_category === mainCategory)
    : undefined;

  return matched?.slug || 'construction-materials';
}
