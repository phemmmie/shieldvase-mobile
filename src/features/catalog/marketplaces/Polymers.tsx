import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import {
  CategoryChips,
  FilterBar,
  MarketplaceGrid,
  MarketplaceSearch,
  MarketplaceSectionHeader,
} from '../MarketplaceControls';
import { useMarketplacePage } from '../marketplaceApi';
import { MARKETPLACE_IMAGES } from './shared';

const ACCENT = '#1EAEDB';
const ACCENT_DARK = '#1a9bc4';
const TEXT_DARK = '#403E43';

const APPLICATIONS = [
  {
    icon: 'cube-outline' as const,
    bg: '#d3e4fd',
    tint: ACCENT,
    title: 'Industrial Packaging',
    body: 'Heavy-duty packaging solutions for industrial products, ensuring maximum protection during transit and storage.',
  },
  {
    icon: 'leaf-outline' as const,
    bg: '#e6f3e6',
    tint: '#16A34A',
    title: 'Sustainable Materials',
    body: 'Eco-friendly polymer alternatives that reduce environmental impact without compromising on quality and performance.',
  },
  {
    icon: 'bag-outline' as const,
    bg: '#ffe6e6',
    tint: '#EF4444',
    title: 'Consumer Products',
    body: 'Food-grade packaging and consumer goods materials that meet strict safety and quality standards.',
  },
];

/** Mobile port of web views/Polymers.tsx. */
export function PolymersMarketplace({ initialSearch = '' }: { initialSearch?: string }) {
  const page = useMarketplacePage('polymers', initialSearch);
  const router = useRouter();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [productsY, setProductsY] = useState(0);

  return (
    <ScrollView ref={scrollRef} style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Hero — light gradient, text + stacked image (web parity) */}
      <LinearGradient colors={['#EFF6FF', '#F0FDF4']} style={styles.hero}>
        <ScreenColumn>
          <Text style={styles.heroTitle}>Polymer & Packaging Solutions</Text>
          <Text style={styles.heroSub}>
            Premium quality polymers and sustainable packaging materials for industrial and
            commercial applications.
          </Text>
          <View style={styles.heroBtns}>
            <Pressable
              onPress={() => scrollRef.current?.scrollTo({ y: productsY, animated: true })}
              style={({ pressed }) => [styles.btnSolid, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="cube-outline" size={16} color="#FFFFFF" />
              <Text style={styles.btnSolidText}>Browse Products</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/rfq/new' as any)}
              style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.8 }]}
            >
              <Ionicons name="search" size={16} color={ACCENT} />
              <Text style={styles.btnOutlineText}>Request Quote</Text>
            </Pressable>
          </View>
          <Image
            source={{ uri: MARKETPLACE_IMAGES.polymersHero }}
            style={styles.heroImg}
            contentFit="cover"
          />
        </ScreenColumn>
      </LinearGradient>

      {/* Products — web's white section */}
      <View style={styles.productsSection}>
        <ScreenColumn>
          <View onLayout={(e) => setProductsY(e.nativeEvent.layout.y)}>
            <MarketplaceSectionHeader
              title="Explore Our Polymer Products"
              subtitle="Browse through our wide range of polymer and packaging materials, designed to meet your specific requirements for quality, performance, and sustainability."
              accent={TEXT_DARK}
            />
          </View>
          <MarketplaceSearch
            placeholder="Search polymer products..."
            value={page.search}
            onChange={page.setSearch}
            accent={ACCENT}
          />
          <View style={{ height: spacing.md }} />
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
          <View style={{ height: spacing.md }} />
          <MarketplaceGrid
            products={page.filtered}
            accent={colors.primary}
            loading={page.query.isLoading}
            error={page.query.isError}
            onRetry={() => page.query.refetch()}
            emptyTitle="No products found"
            emptyHint="Try adjusting your filters or search query"
          />
        </ScreenColumn>
      </View>

      {/* Polymer Applications — web's 3-card section */}
      <View style={styles.applicationsSection}>
        <ScreenColumn>
          <MarketplaceSectionHeader
            title="Polymer Applications"
            subtitle="Discover how our polymer solutions are transforming industries"
            accent={TEXT_DARK}
          />
          {APPLICATIONS.map((a) => (
            <View key={a.title} style={styles.appCard}>
              <View style={[styles.appIcon, { backgroundColor: a.bg }]}>
                <Ionicons name={a.icon} size={20} color={a.tint} />
              </View>
              <Text style={styles.appTitle}>{a.title}</Text>
              <Text style={styles.appBody}>{a.body}</Text>
            </View>
          ))}
        </ScreenColumn>
      </View>

      {/* CTA — cyan gradient, mirrors web RequestQuoteCTA */}
      <LinearGradient colors={[ACCENT, ACCENT_DARK]} style={styles.cta}>
        <Text style={styles.ctaTitle}>Need Custom Polymer Solutions?</Text>
        <Text style={styles.ctaSub}>
          Our experts are ready to help you find the perfect polymer and packaging materials for
          your specific requirements.
        </Text>
        <Pressable
          onPress={() => router.push('/rfq/new' as any)}
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.ctaBtnText}>Request a Quote</Text>
        </Pressable>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: { paddingVertical: spacing['2xl'] },
  heroTitle: { ...typography.h1, color: TEXT_DARK },
  heroSub: { ...typography.body, color: '#4B5563', marginTop: spacing.sm },
  heroBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, flexWrap: 'wrap' },
  btnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  btnSolidText: { ...typography.bodyStrong, color: '#FFFFFF' },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  btnOutlineText: { ...typography.bodyStrong, color: ACCENT },
  heroImg: { width: '100%', height: 180, borderRadius: radius.lg, marginTop: spacing.xl },
  productsSection: { backgroundColor: '#FFFFFF', paddingVertical: spacing.xl },
  applicationsSection: { backgroundColor: '#FFFFFF', paddingVertical: spacing.xl },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  appTitle: { ...typography.bodyStrong, color: TEXT_DARK },
  appBody: { ...typography.caption, color: '#6B7280', marginTop: 4 },
  cta: { paddingVertical: spacing['2xl'], alignItems: 'center', paddingHorizontal: spacing.lg },
  ctaTitle: { ...typography.h2, color: '#FFFFFF', textAlign: 'center' },
  ctaSub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: 420,
  },
  ctaBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 11,
  },
  ctaBtnText: { ...typography.bodyStrong, color: colors.text },
});
