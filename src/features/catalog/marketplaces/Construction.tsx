import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';
import {
  CategoryChips,
  FilterBar,
  MarketplaceGrid,
  MarketplaceSearch,
  SortPicker,
} from '../MarketplaceControls';
import { useMarketplacePage } from '../marketplaceApi';
import { MARKETPLACE_IMAGES } from './shared';

const ACCENT = '#FFB400';
const CARD_ACCENT = colors.primary;

/** Mobile port of web views/Construction.tsx — hero, filters, product grid. */
export function ConstructionMarketplace({ initialSearch = '' }: { initialSearch?: string }) {
  const page = useMarketplacePage('construction', initialSearch);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [productsY, setProductsY] = useState(0);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero — full-bleed image + black/50 overlay, gold CTA (web parity) */}
      <View style={styles.hero}>
        <Image
          source={{ uri: MARKETPLACE_IMAGES.constructionHero }}
          style={styles.heroImg}
          contentFit="cover"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Construction Materials</Text>
          <Text style={styles.heroSub}>
            Source construction materials in Nigeria from verified local suppliers, with
            procurement support for international buyers.
          </Text>
          <Pressable
            onPress={() => scrollRef.current?.scrollTo({ y: productsY, animated: true })}
            style={({ pressed }) => [styles.heroBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.heroBtnText}>Browse Products</Text>
          </Pressable>
        </View>
      </View>

      <ScreenColumn>
        {/* Filters — web renders a left sheet on mobile / sidebar on desktop.
            Mobile adaptation: chips + multi-select sheets inline. */}
        <View onLayout={(e) => setProductsY(e.nativeEvent.layout.y)} style={styles.controls}>
          <CategoryChips
            options={page.categoryChips}
            selectedId={page.categoryId}
            selectedSlug={page.categorySlug}
            onPick={(chip) => {
              page.setCategoryId(chip?.id ?? null);
              page.setCategorySlug(null);
            }}
            accent={ACCENT}
          />
          <FilterBar
            accent={ACCENT}
            locations={page.cityOptions}
            brands={page.brandOptions}
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
        </View>

        {/* Search + sort + count — web's same-row controls, stacked on mobile */}
        <MarketplaceSearch
          placeholder="Search products..."
          value={page.search}
          onChange={page.setSearch}
          accent={ACCENT}
        />
        <View style={styles.sortRow}>
          <SortPicker value={page.sortBy} onChange={page.setSortBy} accent={ACCENT} />
          <Text style={styles.count}>Showing {page.filtered.length} products</Text>
        </View>

        <MarketplaceGrid
          products={page.filtered}
          accent={CARD_ACCENT}
          loading={page.query.isLoading}
          error={page.query.isError}
          onRetry={() => page.query.refetch()}
          emptyTitle="No products found matching your criteria."
          emptyHint="Try adjusting your filters or search query"
        />
      </ScreenColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { height: 240, justifyContent: 'center', alignItems: 'center' },
  heroImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroContent: { alignItems: 'center', paddingHorizontal: spacing.xl },
  heroTitle: { ...typography.h1, color: '#FFFFFF', textAlign: 'center' },
  heroSub: {
    ...typography.body,
    color: '#E5E7EB',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: 420,
  },
  heroBtn: {
    backgroundColor: ACCENT,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  heroBtnText: { ...typography.bodyStrong, color: '#000000' },
  controls: { paddingTop: spacing.lg, gap: spacing.sm },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  count: { ...typography.micro, color: colors.textMuted },
});
