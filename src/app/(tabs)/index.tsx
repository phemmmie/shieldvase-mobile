import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories, useFeaturedProducts } from '@/features/catalog/queries';
import { useActiveGroupBuys, useActivePriceLocks } from '@/features/deals/queries';
import { GroupBuyCard, PriceLockCard } from '@/features/deals/components';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState } from '@/components/States';
import { ProductGridSkeleton, RowSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

const TOOLS: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  tint: string;
  tag?: string;
  href?: string;
}[] = [
  {
    icon: 'lock-closed-outline',
    title: 'Price Lock',
    body: 'Freeze market prices for up to 90 days on site',
    tint: colors.accentSoft,
    tag: '30% Dep',
    href: '/deals',
  },
  {
    icon: 'people-outline',
    title: 'Group Buying',
    body: 'Split bulk loads with adjacent site projects',
    tint: colors.secondarySoft,
    tag: 'Save 18%',
    href: '/deals',
  },
  {
    icon: 'document-text-outline',
    title: 'RFQ Portal',
    body: 'Upload engineer BoQ sheet for itemized quotation',
    tint: colors.infoSoft,
    tag: 'Instant',
    href: '/rfq/new',
  },
  {
    icon: 'flash-outline',
    title: 'Live Bids',
    body: 'Real-time quotes & queries tender for your supply',
    tint: colors.primarySoft,
    tag: 'Live',
    href: '/(tabs)/rfqs',
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const categories = useCategories();
  const featured = useFeaturedProducts();
  const groupBuys = useActiveGroupBuys();
  const priceLocks = useActivePriceLocks();
  const dealCards = [
    ...(priceLocks.data ?? []).slice(0, 2).map((d) => <PriceLockCard key={d.id} deal={d} />),
    ...(groupBuys.data ?? []).slice(0, 2).map((d) => <GroupBuyCard key={d.id} deal={d} />),
  ];

  const firstName =
    (user?.user_metadata?.first_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenColumn pad={false}>
        {/* Navy hero banner — stitch 02 */}
        <LinearGradient
          colors={[colors.navy, colors.navySoft]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <ScreenColumn>
            {firstName ? <Text style={styles.greeting}>Welcome back, {firstName}</Text> : null}
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={12} color={colors.secondaryLight} />
              <Text style={styles.verifiedText}>ShieldVase Verified Market</Text>
            </View>
            <Text style={styles.heroTitle}>
              Nigeria’s Marketplace for Construction & Industrial Materials
            </Text>
            <Text style={styles.heroSub}>
              Build From Anywhere. Find Materials. Compare Vendors. Order with Confidence.
            </Text>
            <View style={styles.heroCtas}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/deals' as any);
                }}
                style={({ pressed }) => [styles.ctaDeals, pressed && { opacity: 0.9 }]}
              >
                <Ionicons name="pricetags" size={16} color={colors.textOnAccent} />
                <Text style={styles.ctaDealsText}>Explore Deals</Text>
              </Pressable>
              <View style={styles.escrowPill}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.secondaryLight} />
                <Text style={styles.escrowText}>Guaranteed Escrow Protection</Text>
              </View>
            </View>
            {!user && (
              <Link href="/(auth)/sign-in" style={styles.signIn}>
                Sign in for escrow checkout →
              </Link>
            )}
          </ScreenColumn>
        </LinearGradient>
      </ScreenColumn>

      <ScreenColumn>
        {/* Procurement tools grid */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Procurement Tools & Perks</Text>
          <Text style={styles.directTag}>DIRECT DISPATCH</Text>
        </View>
        <View style={styles.toolsGrid}>
          {TOOLS.map((t, i) => (
            <Animated.View
              key={t.title}
              entering={FadeInDown.delay(80 + i * 60).duration(380)}
              style={styles.toolWrap}
            >
              <Pressable
                onPress={() => t.href && router.push(t.href as any)}
                style={({ pressed }) => [styles.toolCard, pressed && { opacity: 0.85 }]}
              >
                <View style={styles.toolHead}>
                  <View style={[styles.toolIcon, { backgroundColor: t.tint }]}>
                    <Ionicons name={t.icon} size={20} color={colors.text} />
                  </View>
                  {!!t.tag && (
                    <View style={styles.toolTag}>
                      <Text style={styles.toolTagText}>{t.tag}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.toolTitle}>{t.title}</Text>
                <Text style={styles.toolBody} numberOfLines={2}>
                  {t.body}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Categories */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable onPress={() => router.push('/search')} hitSlop={8}>
            <Text style={styles.seeAll}>SEE ALL</Text>
          </Pressable>
        </View>
        {categories.isLoading ? (
          <RowSkeleton />
        ) : categories.isError ? (
          <ErrorState onRetry={() => categories.refetch()} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRail}
          >
            {(categories.data ?? []).map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} asChild>
                <Pressable style={styles.catChip}>
                  {!!c.image ? (
                    <Image source={{ uri: c.image }} style={styles.catImg} contentFit="cover" />
                  ) : (
                    <View style={[styles.catImg, styles.catImgFallback]}>
                      <Ionicons name="cube-outline" size={13} color={colors.textMuted} />
                    </View>
                  )}
                  <Text numberOfLines={1} style={styles.catName}>
                    {c.name}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        )}

        {/* Deals strip */}
        {dealCards.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Deals</Text>
              <Pressable onPress={() => router.push('/deals' as any)} hitSlop={8}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <Animated.View entering={FadeInDown.springify()}>{dealCards}</Animated.View>
          </>
        )}

        {/* Featured products */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Popular Near You</Text>
        </View>
        {featured.isLoading ? (
          <ProductGridSkeleton />
        ) : featured.isError ? (
          <ErrorState onRetry={() => featured.refetch()} />
        ) : !featured.data?.length ? (
          <EmptyState title="No products yet" hint="Check back soon." />
        ) : (
          <View style={styles.grid}>
            {featured.data.map((p, i) => (
              <Animated.View
                key={p.id}
                entering={FadeInDown.delay(Math.min(i, 8) * 40).springify()}
                style={styles.gridItem}
              >
                <ProductCard product={p} />
              </Animated.View>
            ))}
          </View>
        )}

        {/* Escrow trust strip */}
        <View style={styles.escrowStrip}>
          <Ionicons name="shield-checkmark" size={18} color={colors.secondary} />
          <Text style={styles.escrowStripText}>
            Your payment is held secure until truck arrives, weighed, verified & your site agent
            signs the waybill.
          </Text>
        </View>
      </ScreenColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['4xl'] },
  hero: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
  },
  greeting: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xs },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47,191,113,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  verifiedText: { ...typography.micro, color: colors.secondaryLight },
  heroTitle: { ...typography.h1, color: colors.background, fontSize: 24, lineHeight: 32 },
  heroSub: { ...typography.caption, color: 'rgba(255,255,255,0.65)', marginTop: spacing.sm },
  heroCtas: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  ctaDeals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 42,
    ...shadows.raised,
  },
  ctaDealsText: { ...typography.bodyStrong, color: colors.textOnAccent },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(47,191,113,0.15)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 42,
    flexShrink: 1,
  },
  escrowText: { ...typography.micro, color: colors.secondaryLight, flexShrink: 1 },
  signIn: { ...typography.bodyStrong, color: colors.accent, marginTop: spacing.md },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h2, color: colors.text, fontSize: 18 },
  directTag: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.5 },
  seeAll: { ...typography.captionStrong, color: colors.primary },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  toolWrap: { width: '48.5%', marginBottom: spacing.md },
  toolCard: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  toolHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTag: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  toolTagText: { ...typography.micro, color: colors.secondary },
  toolTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.sm },
  toolBody: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  catRail: { gap: spacing.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    ...shadows.card,
  },
  catImg: { width: 24, height: 24, borderRadius: 12 },
  catImgFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  catName: { ...typography.body, color: colors.text, maxWidth: 120 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '49%', marginBottom: spacing.sm },
  escrowStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  escrowStripText: { ...typography.caption, color: colors.text, flex: 1 },
});
