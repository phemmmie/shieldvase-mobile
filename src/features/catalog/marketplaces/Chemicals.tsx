import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const NAVY = '#052947';
const CYAN = '#33C3F0';
const ACCENT = '#1EAEDB';
const TEXT_DARK = '#403E43';

const APPLICATIONS = [
  'Manufacturing',
  'Agriculture',
  'Construction',
  'Healthcare',
  'Water Treatment',
  'Food Processing',
  'Electronics',
  'Automotive',
  'Research & Development',
  'Energy Industry',
];

const FEATURED = [
  {
    icon: 'flask-outline' as const,
    title: 'Industrial Chemicals',
    body: 'Essential chemicals for manufacturing processes and industrial applications',
  },
  {
    icon: 'water-outline' as const,
    title: 'Specialty Chemicals',
    body: 'Specialty formulations for specific industrial and commercial applications',
  },
  {
    icon: 'flask-outline' as const,
    title: 'Laboratory Chemicals',
    body: 'High-purity chemicals for research, testing, and analytical applications',
  },
];

/** Mobile port of web views/Chemicals.tsx + its sub-components. */
export function ChemicalsMarketplace({ initialSearch = '' }: { initialSearch?: string }) {
  const page = useMarketplacePage('chemicals', initialSearch);
  const router = useRouter();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [productsY, setProductsY] = useState(0);

  return (
    <ScrollView ref={scrollRef} style={styles.screen} showsVerticalScrollIndicator={false}>
      {/* Hero — navy→cyan gradient, flask icon, two CTAs (web parity) */}
      <LinearGradient colors={[NAVY, ACCENT]} style={styles.hero}>
        <Ionicons name="flask-outline" size={48} color={CYAN} style={{ marginBottom: spacing.md }} />
        <Text style={styles.heroTitle}>Chemical Solutions for Industries</Text>
        <Text style={styles.heroSub}>
          Access high-quality industrial chemicals, specialty products, and solutions for various
          applications
        </Text>
        <View style={styles.heroBtns}>
          <Pressable
            onPress={() => scrollRef.current?.scrollTo({ y: productsY, animated: true })}
            style={({ pressed }) => [styles.btnSolid, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.btnSolidText}>Explore Products</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/rfq/new' as any)}
            style={({ pressed }) => [styles.btnOutline, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.btnOutlineText}>Request Quote</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {/* Products — white section (ChemicalsMainContent parity) */}
      <View style={styles.white}>
        <ScreenColumn>
          <View onLayout={(e) => setProductsY(e.nativeEvent.layout.y)}>
            <MarketplaceSectionHeader
              icon="flask-outline"
              title="Chemical Products"
              subtitle="Browse through our wide range of industrial and specialty chemicals for all your business needs."
              accent={TEXT_DARK}
            />
          </View>
          <MarketplaceSearch
            placeholder="Search chemical products..."
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

          {/* Applications — web ApplicationsCard (gradient + bullets) */}
          <LinearGradient colors={[NAVY, ACCENT]} style={styles.appsCard}>
            <View style={styles.appsHead}>
              <Ionicons name="planet-outline" size={20} color={CYAN} />
              <Text style={styles.appsTitle}>Chemical Applications</Text>
            </View>
            <View style={styles.appsGrid}>
              {APPLICATIONS.map((a) => (
                <View key={a} style={styles.appItem}>
                  <View style={styles.appDot} />
                  <Text style={styles.appText}>{a}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Featured categories — 3 static cards (web parity) */}
          {FEATURED.map((f) => (
            <View key={f.title} style={styles.featuredCard}>
              <View style={styles.featuredIcon}>
                <Ionicons name={f.icon} size={26} color={ACCENT} />
              </View>
              <Text style={styles.featuredTitle}>{f.title}</Text>
              <Text style={styles.featuredBody}>{f.body}</Text>
            </View>
          ))}
        </ScreenColumn>
      </View>

      {/* CTA — navy section (RequestQuoteCTA parity) */}
      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>Need Specialized Chemical Products?</Text>
        <Text style={styles.ctaSub}>
          We connect you with trusted suppliers for all your industrial and specialty chemical needs
        </Text>
        <Pressable
          onPress={() => router.push('/rfq/new' as any)}
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.ctaBtnText}>Request a Quote</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F0F8FF' },
  hero: { alignItems: 'center', paddingVertical: spacing['3xl'], paddingHorizontal: spacing.lg },
  heroTitle: { ...typography.h1, color: '#FFFFFF', textAlign: 'center' },
  heroSub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 460,
  },
  heroBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  btnSolid: {
    backgroundColor: CYAN,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 11,
  },
  btnSolidText: { ...typography.bodyStrong, color: '#FFFFFF' },
  btnOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 11,
  },
  btnOutlineText: { ...typography.bodyStrong, color: '#FFFFFF' },
  white: { backgroundColor: '#FFFFFF', paddingVertical: spacing.xl },
  appsCard: { borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.xl },
  appsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  appsTitle: { ...typography.h3, color: '#FFFFFF' },
  appsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  appItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '50%', paddingVertical: 5 },
  appDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: CYAN },
  appText: { ...typography.caption, color: 'rgba(255,255,255,0.9)' },
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  featuredIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E7F5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featuredTitle: { ...typography.h3, color: colors.text },
  featuredBody: { ...typography.caption, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  cta: { backgroundColor: NAVY, alignItems: 'center', paddingVertical: spacing['2xl'], paddingHorizontal: spacing.lg },
  ctaTitle: { ...typography.h2, color: '#FFFFFF', textAlign: 'center' },
  ctaSub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: 420,
  },
  ctaBtn: {
    backgroundColor: CYAN,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 11,
  },
  ctaBtnText: { ...typography.bodyStrong, color: '#FFFFFF' },
});
