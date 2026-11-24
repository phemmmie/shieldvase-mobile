import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import {
  CategoryChips,
  FilterBar,
  InfoPill,
  MarketplaceGrid,
  MarketplaceSearch,
  MarketplaceSectionHeader,
} from '../MarketplaceControls';
import { useMarketplacePage } from '../marketplaceApi';
import { MARKETPLACE_IMAGES } from './shared';

const NAVY = '#1A2F4B';
const NAVY2 = '#0D4C7B';
const GOLD = '#F7B32B';
const BG = '#F8F9FA';

// Hardcoded filter options — web Energy.tsx defines these inline.
const CATEGORIES = [
  { value: 'petroleum-products', label: 'Petroleum Products' },
  { value: 'industrial-gases', label: 'Industrial Gases' },
  { value: 'renewable-energy', label: 'Renewable Energy' },
  { value: 'energy-storage', label: 'Energy Storage' },
];
const LOCATIONS = ['Lagos', 'Abuja', 'Ibadan', 'Kano', 'Kaduna', 'Port Harcourt', 'Ogun'];
const BRANDS = ['Total', 'Shell', 'Mobil', 'Oando', 'Conoil'];

const KEY_CATEGORIES = [
  {
    slug: 'petroleum-products',
    icon: 'flame-outline' as const,
    color: GOLD,
    title: 'Petroleum Products',
    desc: 'Diesel, petrol, and other refined petroleum products for various applications.',
  },
  {
    slug: 'industrial-gases',
    icon: 'water-outline' as const,
    color: '#3498DB',
    title: 'Industrial Gases',
    desc: 'LPG, CNG, and other industrial gases for commercial and industrial use.',
  },
  {
    slug: 'renewable-energy',
    icon: 'flash-outline' as const,
    color: '#27AE60',
    title: 'Renewable Energy',
    desc: 'Solar panels and other renewable energy solutions for sustainable power.',
  },
  {
    slug: 'energy-storage',
    icon: 'trending-up-outline' as const,
    color: '#9B59B6',
    title: 'Energy Storage',
    desc: 'Batteries and energy storage solutions for reliable power supply.',
  },
];

/** Mobile port of web views/Energy.tsx. */
export function EnergyMarketplace({ initialSearch = '' }: { initialSearch?: string }) {
  const page = useMarketplacePage('energy', initialSearch);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [productsY, setProductsY] = useState(0);
  const [categoriesY, setCategoriesY] = useState(0);

  const pickSlug = (slug: string | null) => {
    page.setCategorySlug(slug);
    page.setCategoryId(null);
  };

  const selectedLabel = page.categorySlug
    ? page.categorySlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : 'All Energy Products';

  return (
    <ScrollView ref={scrollRef} style={styles.screen} showsVerticalScrollIndicator={false}>
      <ScreenColumn>
        {/* Hero — navy gradient card, text + image (web parity) */}
        <View style={styles.heroCard}>
          <LinearGradient colors={[NAVY, NAVY2]} style={styles.heroText}>
            <Text style={styles.heroTitle}>Energy & Petroleum Products</Text>
            <Text style={styles.heroSub}>
              Explore our comprehensive range of energy solutions, from traditional petroleum
              products to renewable energy alternatives. Quality products for industrial and
              commercial applications.
            </Text>
            <View style={styles.heroBtns}>
              <Pressable
                onPress={() => {
                  pickSlug(null);
                  scrollRef.current?.scrollTo({ y: productsY, animated: true });
                }}
                style={({ pressed }) => [styles.btnGold, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.btnGoldText}>Browse All Products</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  scrollRef.current?.scrollTo({ y: categoriesY, animated: true })
                }
                style={({ pressed }) => [styles.btnGhost, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.btnGhostText}>View Categories</Text>
              </Pressable>
            </View>
          </LinearGradient>
          <Image
            source={{ uri: MARKETPLACE_IMAGES.energyHero }}
            style={styles.heroImg}
            contentFit="cover"
          />
        </View>

        {/* Key Energy Categories — clickable cards */}
        <View onLayout={(e) => setCategoriesY(e.nativeEvent.layout.y)}>
          <Text style={styles.keyTitle}>Key Energy Categories</Text>
        </View>
        <View style={styles.keyGrid}>
          {KEY_CATEGORIES.map((c) => (
            <Pressable
              key={c.slug}
              onPress={() => {
                pickSlug(c.slug);
                scrollRef.current?.scrollTo({ y: productsY, animated: true });
              }}
              style={[styles.keyCard, { borderLeftColor: c.color }]}
            >
              <View style={[styles.keyIcon, { backgroundColor: `${c.color}1A` }]}>
                <Ionicons name={c.icon} size={20} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.keyCardTitle}>{c.title}</Text>
                <Text style={styles.keyCardDesc} numberOfLines={2}>
                  {c.desc}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Products — web's white card section */}
        <View style={styles.productsCard} onLayout={(e) => setProductsY(e.nativeEvent.layout.y)}>
          <MarketplaceSectionHeader
            title="Explore Energy Products"
            subtitle="Browse through our wide range of energy and petroleum products."
            accent={NAVY}
          />
          <MarketplaceSearch
            placeholder="Search energy products..."
            value={page.search}
            onChange={page.setSearch}
            accent={GOLD}
          />
          <View style={{ height: spacing.md }} />
          <CategoryChips
            options={CATEGORIES.map((c) => ({
              id: c.value,
              name: c.label,
              slug: c.value,
              count: null,
            }))}
            selectedId={null}
            selectedSlug={page.categorySlug}
            onPick={(chip) => pickSlug(chip?.slug ?? null)}
            accent={GOLD}
          />
          <FilterBar
            accent={GOLD}
            locations={LOCATIONS}
            brands={BRANDS}
            selectedLocations={page.cities}
            selectedBrands={page.brands}
            onToggleLocation={(v) =>
              page.setCities((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]))
            }
            onToggleBrand={(v) =>
              page.setBrands((b) => (b.includes(v) ? b.filter((x) => x !== v) : [...b, v]))
            }
            activeCount={page.activeFilterCount}
            onClear={page.clearFilters}
          />
          <View style={styles.productsHead}>
            <Text style={styles.productsHeadTitle}>{selectedLabel}</Text>
            <InfoPill text="Prices vary by location and quantity" iconColor="#3498DB" />
          </View>
          <MarketplaceGrid
            products={page.filtered}
            accent={colors.primary}
            loading={page.query.isLoading}
            error={page.query.isError}
            onRetry={() => page.query.refetch()}
            emptyTitle="No products found"
            emptyHint="Try adjusting your filters or search query"
          />
        </View>
      </ScreenColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  heroCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadows.raised,
  },
  heroText: { padding: spacing.xl },
  heroTitle: { ...typography.h2, color: '#FFFFFF' },
  heroSub: { ...typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: spacing.sm },
  heroBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  btnGold: {
    backgroundColor: GOLD,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  btnGoldText: { ...typography.bodyStrong, color: NAVY },
  btnGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  btnGhostText: { ...typography.bodyStrong, color: '#FFFFFF' },
  heroImg: { width: '100%', height: 150 },
  keyTitle: { ...typography.h2, color: NAVY, marginTop: spacing.xl, marginBottom: spacing.md },
  keyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  keyCard: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    ...shadows.card,
  },
  keyIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyCardTitle: { ...typography.caption, color: NAVY, fontWeight: '700' },
  keyCardDesc: { ...typography.micro, color: '#6B7280', marginTop: 3 },
  productsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
    ...shadows.card,
  },
  productsHead: { marginTop: spacing.md, marginBottom: spacing.sm, gap: spacing.sm },
  productsHeadTitle: { ...typography.h3, color: NAVY },
});
