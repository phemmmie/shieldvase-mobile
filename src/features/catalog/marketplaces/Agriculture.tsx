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

const GREEN = '#006838';
const GREEN2 = '#4CAF50';
const BG = '#F8F9FA';

// Hardcoded filter options — web AgricultureAndAnimalFeed.tsx defines these.
const CATEGORIES = [
  { value: 'fertilizers', label: 'Fertilizers' },
  { value: 'pesticides', label: 'Pesticides & Herbicides' },
  { value: 'poultry-feed', label: 'Poultry Feed' },
  { value: 'fish-feed', label: 'Fish Feed' },
  { value: 'livestock-feed', label: 'Livestock Feed' },
  { value: 'irrigation', label: 'Irrigation Systems' },
];
const LOCATIONS = ['Lagos', 'Abuja', 'Ibadan', 'Kano', 'Kaduna', 'Port Harcourt', 'Ogun'];
const BRANDS = ['Amo Byng', 'Vital Feeds', 'Top Feeds', 'Durante', 'Syngenta', 'Notore'];

const KEY_CATEGORIES = [
  {
    slug: 'fertilizers',
    icon: 'leaf-outline' as const,
    color: '#4CAF50',
    title: 'Fertilizers',
    desc: 'Premium fertilizers for improved crop yield.',
  },
  {
    slug: 'pesticides',
    icon: 'bug-outline' as const,
    color: '#FF5722',
    title: 'Pesticides & Herbicides',
    desc: 'Effective pest control solutions.',
  },
  {
    slug: 'poultry-feed',
    icon: 'egg-outline' as const,
    color: '#E91E63',
    title: 'Poultry Feed',
    desc: 'Balanced feed for poultry farming.',
  },
  {
    slug: 'fish-feed',
    icon: 'fish-outline' as const,
    color: '#00BCD4',
    title: 'Fish Feed',
    desc: 'High-protein feed for fish farming.',
  },
];

/** Mobile port of web views/AgricultureAndAnimalFeed.tsx. */
export function AgricultureMarketplace() {
  const page = useMarketplacePage('agriculture');
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
    : 'All Agriculture Products';

  return (
    <ScrollView ref={scrollRef} style={styles.screen} showsVerticalScrollIndicator={false}>
      <ScreenColumn>
        {/* Hero — green gradient card (web parity) */}
        <View style={styles.heroCard}>
          <LinearGradient colors={[GREEN, GREEN2]} style={styles.heroText}>
            <Text style={styles.heroTitle}>Agriculture & Animal Feed</Text>
            <Text style={styles.heroSub}>
              Discover premium agricultural products and animal feed solutions. From fertilizers
              and pesticides to high-quality animal feeds.
            </Text>
            <View style={styles.heroBtns}>
              <Pressable
                onPress={() => {
                  pickSlug(null);
                  scrollRef.current?.scrollTo({ y: productsY, animated: true });
                }}
                style={({ pressed }) => [styles.btnWhite, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.btnWhiteText}>Browse All Products</Text>
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
            source={{ uri: MARKETPLACE_IMAGES.agricultureHero }}
            style={styles.heroImg}
            contentFit="cover"
          />
        </View>

        {/* Key Agricultural Categories */}
        <View onLayout={(e) => setCategoriesY(e.nativeEvent.layout.y)}>
          <Text style={styles.keyTitle}>Key Agricultural Categories</Text>
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
            title="Explore Agriculture Products"
            subtitle="Browse through our wide range of agricultural products and animal feeds."
            accent={GREEN}
          />
          <MarketplaceSearch
            placeholder="Search agriculture products..."
            value={page.search}
            onChange={page.setSearch}
            accent={GREEN2}
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
            accent={GREEN2}
          />
          <FilterBar
            accent={GREEN2}
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
            <InfoPill text="Prices vary by location and quantity" iconColor={GREEN2} />
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
  btnWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  btnWhiteText: { ...typography.bodyStrong, color: GREEN },
  btnGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  btnGhostText: { ...typography.bodyStrong, color: '#FFFFFF' },
  heroImg: { width: '100%', height: 150 },
  keyTitle: { ...typography.h2, color: GREEN, marginTop: spacing.xl, marginBottom: spacing.md },
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
  keyCardTitle: { ...typography.caption, color: GREEN, fontWeight: '700' },
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
  productsHeadTitle: { ...typography.h3, color: GREEN },
});
