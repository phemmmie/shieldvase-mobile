import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import { EmptyState, LoadingState } from '@/components/States';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';
import { PRICE_INDEX_MATERIALS, citySlug } from '@/features/prices/priceIndexMaterials';

// Mirrors web /prices (views/Prices.tsx + pricing/* components):
// "Product Pricing" + Cart button, dashboard stats, category/trend bars,
// "Live Price Guides by City" links, "Latest Podcasts", and the filterable
// "Product Prices" table (price range / type / city / brand + view + cart).

type PriceProduct = {
  vendor_product_id: string;
  unified_product_id: string;
  name: string;
  brand: string;
  grade: string;
  location: string;
  price: number;
  price_unit: string;
  category_name: string;
  stock_quantity: number | null;
  last_updated: string;
  created_at: string;
  image_url: string | null;
};

const PRICE_RANGES = [
  'All Prices',
  '₦0 - ₦10,000',
  '₦10,001 - ₦25,000',
  '₦25,001 - ₦50,000',
  '₦50,001 - ₦100,000',
  '₦100,001+',
];

const usePricesProducts = () =>
  useQuery({
    queryKey: ['prices-products'],
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<PriceProduct[]> => {
      const { data: vps, error } = await supabase
        .from('vendor_products')
        .select(
          `id, unified_product_id, vendor_id, price, price_unit, stock_quantity, last_updated, created_at, available_locations, brand_id,
           unified_products!inner(id, name, description, category_id, images)`,
        )
        .eq('status', 'active')
        .order('last_updated', { ascending: false, nullsFirst: false });
      if (error) throw error;
      if (!vps?.length) return [];

      const catIds = [...new Set(vps.map((v: any) => v.unified_products?.category_id).filter(Boolean))] as string[];
      const brandIds = [...new Set(vps.map((v: any) => v.brand_id).filter(Boolean))] as string[];
      const [{ data: cats }, { data: brands }] = await Promise.all([
        supabase.from('categories').select('id, name, slug').in('id', catIds),
        brandIds.length
          ? supabase.from('brands').select('id, name').in('id', brandIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const catMap = new Map((cats ?? []).map((c: any) => [c.id, c]));
      const brandMap = new Map((brands ?? []).map((b: any) => [b.id, b.name]));

      return vps.map((vp: any) => {
        const up = vp.unified_products;
        const cat = catMap.get(up?.category_id);
        const loc = Array.isArray(vp.available_locations) ? vp.available_locations[0] : null;
        return {
          vendor_product_id: vp.id,
          unified_product_id: vp.unified_product_id || '',
          name: up?.name || 'Unknown Product',
          brand: brandMap.get(vp.brand_id || '') || 'Unknown',
          grade: 'Standard',
          location: loc || 'Nigeria',
          price: vp.price || 0,
          price_unit: vp.price_unit || 'unit',
          category_name: cat?.name || 'Uncategorized',
          stock_quantity: vp.stock_quantity,
          last_updated: vp.last_updated || vp.created_at,
          created_at: vp.created_at,
          image_url: up?.images?.[0] || null,
        };
      });
    },
  });

const useLatestPodcasts = () =>
  useQuery({
    queryKey: ['prices-podcasts'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('id, title, slug, host, duration')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as { id: string; title: string; slug: string | null; host: string; duration: string }[];
    },
  });

function SingleSelectSheet({
  visible,
  title,
  options,
  selected,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onPick: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 380 }}>
          {options.map((o) => (
            <Pressable
              key={o}
              onPress={() => {
                onPick(o);
                onClose();
              }}
              style={styles.sheetOption}
            >
              <Ionicons
                name={o === selected ? 'radio-button-on' : 'radio-button-off'}
                size={16}
                color={o === selected ? colors.primary : colors.textMuted}
              />
              <Text style={styles.sheetOptionText}>{o}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const PAGE_SIZE = 50;
// Evaluated once at bundle load — "New" badge window (web: created within 7 days)
const NEW_CUTOFF = Date.now() - 7 * 86400000;

export default function PricesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { addToCart } = useCart();
  const products = usePricesProducts();
  const podcasts = useLatestPodcasts();
  const [priceRange, setPriceRange] = useState('All Prices');
  const [prodType, setProdType] = useState('All Types');
  const [city, setCity] = useState('All Cities');
  const [brand, setBrand] = useState('All Brands');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sheet, setSheet] = useState<'range' | 'type' | 'city' | 'brand' | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const list = useMemo(() => products.data ?? [], [products.data]);

  const optionLists = useMemo(
    () => ({
      types: ['All Types', ...Array.from(new Set(list.map((p) => p.grade))).sort()],
      cities: ['All Cities', ...Array.from(new Set(list.map((p) => p.location))).sort()],
      brands: ['All Brands', ...Array.from(new Set(list.map((p) => p.brand))).sort()],
    }),
    [list],
  );

  const filtered = useMemo(() => {
    let f = list;
    if (priceRange !== 'All Prices') {
      const [min, max] = priceRange
        .replace(/₦/g, '')
        .split(' - ')
        .map((s) => parseInt(s.replace(/[^\d]/g, ''), 10));
      f = f.filter((p) => (max ? p.price >= min && p.price <= max : p.price >= min));
    }
    if (prodType !== 'All Types') f = f.filter((p) => p.grade === prodType);
    if (city !== 'All Cities') f = f.filter((p) => p.location === city);
    if (brand !== 'All Brands') f = f.filter((p) => p.brand === brand);
    return f;
  }, [list, priceRange, prodType, city, brand]);

  const stats = useMemo(() => {
    const prices = list.map((p) => p.price).filter((p) => p > 0);
    return {
      total: list.length,
      avg: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };
  }, [list]);

  const categoryBars = useMemo(() => {
    const counts = new Map<string, { count: number; total: number }>();
    for (const p of list) {
      const e = counts.get(p.category_name) ?? { count: 0, total: 0 };
      e.count += 1;
      e.total += p.price;
      counts.set(p.category_name, e);
    }
    return [...counts.entries()]
      .map(([name, e]) => ({ name, count: e.count, avg: e.total / e.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [list]);
  const maxCatCount = categoryBars[0]?.count ?? 1;

  const trendBars = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const out: { month: string; avg: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = list.filter((p) => {
        const u = new Date(p.last_updated);
        return u.getMonth() === d.getMonth() && u.getFullYear() === d.getFullYear();
      });
      const prices = m.map((p) => p.price).filter((v) => v > 0);
      if (prices.length) {
        out.push({ month: months[d.getMonth()], avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) });
      }
    }
    return out;
  }, [list]);
  const maxTrend = Math.max(1, ...trendBars.map((t) => t.avg));

  const clearFilters = () => {
    setPriceRange('All Prices');
    setProdType('All Types');
    setCity('All Cities');
    setBrand('All Brands');
  };
  const activeFilters = [priceRange !== 'All Prices', prodType !== 'All Types', city !== 'All Cities', brand !== 'All Brands'].filter(Boolean).length;

  const addItem = async (p: PriceProduct) => {
    if (!session) {
      router.push('/(auth)/sign-in');
      return;
    }
    if (busyId) return;
    setBusyId(p.vendor_product_id);
    await addToCart({
      vendor_product_id: p.vendor_product_id,
      unified_product_id: p.unified_product_id,
      name: p.name,
      price: p.price,
      image: p.image_url,
      quantity: 1,
    });
    setBusyId(null);
  };

  const filterBtn = (label: string, value: string, onPress: () => void) => (
    <Pressable key={label} onPress={onPress} style={styles.filterBtn}>
      <Text style={styles.filterBtnText} numberOfLines={1}>{value}</Text>
      <Ionicons name="chevron-down" size={13} color={colors.primary} />
    </Pressable>
  );

  const podSlug = (t: string) =>
    t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Product Pricing' }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          <View style={styles.headRow}>
            <Text style={styles.h1}>Product Pricing</Text>
            <Pressable style={styles.cartBtn} onPress={() => router.push('/cart' as any)}>
              <Ionicons name="cart-outline" size={14} color={colors.textOnPrimary} />
              <Text style={styles.cartBtnText}>Cart</Text>
            </Pressable>
          </View>

          {/* Dashboard stats — web PriceDashboard */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Products</Text>
              <Text style={styles.statValue}>{stats.total.toLocaleString()}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average Price</Text>
              <Text style={styles.statValue}>{formatNaira(stats.avg)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Price Range</Text>
              <Text style={[styles.statValue, { fontSize: 14 }]}>
                {formatNaira(stats.min)} - {formatNaira(stats.max)}
              </Text>
            </View>
          </View>

          {/* Price Trends — web trend chart, adapted to bars */}
          {trendBars.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Price Trends (Last 6 Months)</Text>
                <Ionicons name="trending-up" size={16} color={colors.info} />
              </View>
              {trendBars.map((t) => (
                <View key={t.month} style={styles.barRow}>
                  <Text style={styles.barLabel}>{t.month}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(t.avg / maxTrend) * 100}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{formatNaira(t.avg)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Products by Category — web bar/pie charts, adapted to bars */}
          {categoryBars.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Products by Category</Text>
                <Ionicons name="bar-chart-outline" size={16} color={colors.secondary} />
              </View>
              {categoryBars.map((c) => (
                <View key={c.name} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>{c.name}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { width: `${(c.count / maxCatCount) * 100}%`, backgroundColor: colors.secondary }]}
                    />
                  </View>
                  <Text style={styles.barValue}>{c.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Live Price Guides by City */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Live Price Guides by City</Text>
            <View style={styles.guideLinks}>
              {PRICE_INDEX_MATERIALS.flatMap((m) =>
                m.cities.map((c) => (
                  <Pressable
                    key={`${m.slug}-${c}`}
                    onPress={() =>
                      router.push(`/prices/${m.slug}/${citySlug(c)}` as any)
                    }
                  >
                    <Text style={styles.guideLink}>{m.label} price in {c}</Text>
                  </Pressable>
                )),
              )}
            </View>
            <Pressable onPress={() => router.push('/calculators' as any)}>
              <Text style={[styles.guideLink, styles.calcLink]}>
                Try our free cement, block &amp; materials cost calculators →
              </Text>
            </Pressable>
          </View>

          {/* Latest Podcasts */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Latest Podcasts</Text>
            {(podcasts.data ?? []).map((ep) => (
              <Pressable
                key={ep.id}
                style={styles.podRow}
                onPress={() => router.push(`/podcast/${ep.slug ?? podSlug(ep.title)}` as any)}
              >
                <View style={styles.podPlay}>
                  <Ionicons name="play" size={14} color={colors.textOnPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.podTitle} numberOfLines={2}>{ep.title}</Text>
                  <Text style={styles.podMeta}>{ep.duration} • {ep.host}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Product Prices table */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Prices</Text>
            <View style={styles.filterRow}>
              {filterBtn('range', priceRange, () => setSheet('range'))}
              {filterBtn('type', prodType, () => setSheet('type'))}
              {filterBtn('city', city, () => setSheet('city'))}
              {filterBtn('brand', brand, () => setSheet('brand'))}
              {activeFilters > 0 && (
                <Pressable onPress={clearFilters} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Clear</Text>
                </Pressable>
              )}
            </View>

            {products.isLoading ? (
              <LoadingState label="Loading prices…" />
            ) : filtered.length === 0 ? (
              <EmptyState title="No products match the selected filters." />
            ) : (
              <>
                <View style={styles.tableHead}>
                  <Text style={[styles.thText, { flex: 1 }]}>Product Name</Text>
                  <Text style={[styles.thText, styles.thPrice]}>Price</Text>
                  <Text style={[styles.thText, { width: 72 }]}>Actions</Text>
                </View>
                {filtered.slice(0, visibleCount).map((p) => {
                  const isNew = new Date(p.created_at).getTime() > NEW_CUTOFF;
                  return (
                    <View key={p.vendor_product_id} style={styles.row}>
                      {p.image_url ? (
                        <Image source={{ uri: p.image_url }} style={styles.rowImg} contentFit="cover" transition={120} />
                      ) : (
                        <View style={[styles.rowImg, styles.rowImgFallback]}>
                          <Ionicons name="cube-outline" size={16} color={colors.textFaint} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.rowName}>
                          <Text style={styles.rowNameText} numberOfLines={2}>{p.name}</Text>
                          {isNew && (
                            <View style={styles.newBadge}>
                              <Text style={styles.newBadgeText}>New</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {p.brand} · {p.grade} · {p.location}
                        </Text>
                      </View>
                      <Text style={styles.rowPrice} numberOfLines={1}>
                        {formatNaira(p.price)}
                        <Text style={styles.rowUnit}>/{p.price_unit}</Text>
                      </Text>
                      <View style={styles.rowActions}>
                        <Pressable
                          style={styles.iconBtn}
                          hitSlop={4}
                          onPress={() =>
                            p.unified_product_id &&
                            router.push(
                              `/product/${buildProductParam({ id: p.unified_product_id, name: p.name } as any)}` as any,
                            )
                          }
                        >
                          <Ionicons name="eye-outline" size={16} color={colors.text} />
                        </Pressable>
                        <Pressable
                          style={[styles.iconBtn, { borderColor: colors.primary }]}
                          hitSlop={4}
                          onPress={() => addItem(p)}
                          disabled={busyId === p.vendor_product_id}
                        >
                          <Ionicons name="cart-outline" size={16} color={colors.primary} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
                <Text style={styles.showing}>Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} products</Text>
                {visibleCount < filtered.length && (
                  <Pressable style={styles.loadMore} onPress={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                    <Text style={styles.loadMoreText}>Load More</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </ScreenColumn>
      </ScrollView>

      <SingleSelectSheet
        visible={sheet === 'range'}
        title="Price Range"
        options={PRICE_RANGES}
        selected={priceRange}
        onPick={setPriceRange}
        onClose={() => setSheet(null)}
      />
      <SingleSelectSheet
        visible={sheet === 'type'}
        title="Product Type"
        options={optionLists.types}
        selected={prodType}
        onPick={setProdType}
        onClose={() => setSheet(null)}
      />
      <SingleSelectSheet
        visible={sheet === 'city'}
        title="City"
        options={optionLists.cities}
        selected={city}
        onPick={setCity}
        onClose={() => setSheet(null)}
      />
      <SingleSelectSheet
        visible={sheet === 'brand'}
        title="Brand"
        options={optionLists.brands}
        selected={brand}
        onPick={setBrand}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { paddingVertical: spacing.lg, paddingBottom: 60 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  h1: { ...typography.h2, color: colors.text },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cartBtnText: { ...typography.captionStrong, color: colors.textOnPrimary },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  statLabel: { ...typography.caption, color: colors.textMuted },
  statValue: { ...typography.h2, color: colors.text, fontSize: 18, marginTop: 2 },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  barLabel: { width: 86, ...typography.caption, color: colors.textMuted },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.info, borderRadius: 5 },
  barValue: { width: 78, ...typography.captionStrong, color: colors.text, textAlign: 'right', fontSize: 11 },
  guideLinks: { gap: spacing.xs },
  guideLink: { ...typography.body, color: colors.primary, fontSize: 13 },
  calcLink: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.md, fontSize: 13 },
  podRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  podPlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podTitle: { ...typography.bodyStrong, color: colors.text, fontSize: 13 },
  podMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 170,
  },
  filterBtnText: { ...typography.captionStrong, color: colors.primary, fontSize: 12 },
  clearBtn: { justifyContent: 'center', paddingHorizontal: spacing.sm },
  clearBtnText: { ...typography.captionStrong, color: colors.destructive },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  thText: { ...typography.micro, color: colors.textMuted },
  thPrice: { width: 76, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowImg: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surface },
  rowImgFallback: { alignItems: 'center', justifyContent: 'center' },
  rowName: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rowNameText: { ...typography.bodyStrong, color: colors.text, fontSize: 13, flexShrink: 1 },
  newBadge: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  newBadgeText: { ...typography.micro, color: colors.secondary, fontSize: 10 },
  rowMeta: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  rowPrice: { width: 76, ...typography.bodyStrong, color: colors.primary, fontSize: 12, textAlign: 'right' },
  rowUnit: { ...typography.micro, color: colors.textMuted, fontSize: 10 },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showing: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
  loadMore: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  loadMoreText: { ...typography.bodyStrong, color: colors.primary },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sheetTitle: { ...typography.h3, color: colors.text },
  sheetOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  sheetOptionText: { ...typography.body, color: colors.text },
});
