import { useEffect } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useGroupBuyBySlug, useMyGroupBuyParticipation } from '@/features/deals/queries';
import { buildDealShareUrl, getDealWindowState, trackShareClick } from '@/features/deals/api';
import { useDealRealtimeSync } from '@/features/deals/realtime';
import { ProgressBar } from '@/features/deals/components';
import { EmptyState, ErrorState } from '@/components/States';
import { DetailSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';

export default function GroupBuyLandingScreen() {
  useDealRealtimeSync();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const q = useGroupBuyBySlug(slug);
  const deal = q.data;
  const myParticipation = useMyGroupBuyParticipation(deal?.id, session?.user.id);

  // Share-click attribution — once per session, mirrors useTrackShareClick.
  useEffect(() => {
    if (slug) void trackShareClick('group_buy', slug, session?.user.id, 'sme');
  }, [slug, session?.user.id]);

  if (q.isLoading) return <View style={{ flex: 1, padding: 16 }}><DetailSkeleton /></View>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (!deal) return <EmptyState title="Deal not found" hint="This group buy may have ended." />;

  const window = getDealWindowState(deal);
  const progress = deal.target_quantity
    ? ((deal.current_quantity ?? 0) / deal.target_quantity) * 100
    : 0;
  const alreadyPaid =
    myParticipation.data?.status === 'active' || myParticipation.data?.status === 'completed';
  const joinable = window === 'joinable' && deal.status === 'active' && !alreadyPaid;

  const onShare = async () => {
    const url = await buildDealShareUrl('group_buy', deal.slug ?? slug!);
    await Share.share({
      title: deal.title,
      message: `${deal.title} — group buy on ShieldVase\n${url}`,
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Group Buy' }} />
      <Image
        source={{ uri: deal.product?.images?.[0] }}
        style={styles.hero}
        contentFit="cover"
        transition={150}
      />
      <ScreenColumn>
      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
            <Ionicons name="people" size={12} color="#fff" />
            <Text style={styles.badgeText}>GROUP BUY</Text>
          </View>
          {!!deal.discount_percentage && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>SAVE {deal.discount_percentage}%</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{deal.title}</Text>
        {!!deal.description && <Text style={styles.desc}>{deal.description}</Text>}
        {!!deal.product?.slug && (
          <Pressable
            onPress={() =>
              router.push(
                `/product/${buildProductParam({ id: deal.unified_product_id, slug: deal.product!.slug })}` as any,
              )
            }
          >
            <Text style={styles.productLink}>{deal.product.name} →</Text>
          </Pressable>
        )}

        <View style={styles.priceBox}>
          <View>
            <Text style={styles.priceLabel}>Group price</Text>
            <Text style={styles.price}>{formatNaira(deal.group_buy_price ?? 0)}</Text>
          </View>
          {!!deal.original_price && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceLabel}>Retail</Text>
              <Text style={styles.strike}>{formatNaira(deal.original_price)}</Text>
            </View>
          )}
        </View>

        <View style={styles.progressBox}>
          <View style={styles.progressHead}>
            <Text style={styles.progressLabel}>
              {deal.current_quantity ?? 0} of {deal.target_quantity ?? 0}{' '}
              {deal.unit_of_measurement ?? 'units'}
            </Text>
            <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
          </View>
          <ProgressBar progress={progress / 100} />
          <Text style={styles.meta}>
            {deal.participants.length} participant{deal.participants.length === 1 ? '' : 's'}
            {deal.min_participants ? ` · needs ${deal.min_participants}` : ''}
            {deal.end_date
              ? ` · ends ${new Date(deal.end_date).toLocaleDateString()}`
              : ''}
            {deal.location ? ` · ${deal.location}` : ''}
          </Text>
        </View>

        {window === 'upcoming' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              This deal starts {deal.start_date ? new Date(deal.start_date).toLocaleDateString() : 'soon'}.
            </Text>
          </View>
        )}
        {window === 'expired' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>This group buy has ended.</Text>
          </View>
        )}
        {alreadyPaid && (
          <View style={[styles.notice, { backgroundColor: colors.secondarySoft }]}>
            <Text style={[styles.noticeText, { color: colors.secondary }]}>
              You’ve joined this deal — payment confirmed.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            style={[styles.primary, !joinable && styles.primaryDisabled]}
            disabled={!joinable}
            onPress={() => {
              if (!session) {
                router.push(`/(auth)/sign-in?redirect=${encodeURIComponent(`/deals/join/group-buy/${deal.id}`)}` as any);
                return;
              }
              router.push(`/deals/join/group-buy/${deal.id}`);
            }}
          >
            <Text style={styles.primaryText}>
              {alreadyPaid ? 'Already joined' : 'Join group buy'}
            </Text>
          </Pressable>
          <Pressable style={styles.share} onPress={onShare}>
            <Ionicons name="share-social" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>
      </ScreenColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  hero: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.border },
  body: { padding: spacing.lg },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { ...typography.caption, color: colors.textOnPrimary, fontFamily: 'Inter_700Bold' },
  title: { ...typography.h2, color: colors.text, marginTop: spacing.sm },
  desc: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  productLink: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.sm },
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceLabel: { ...typography.caption, color: colors.textMuted },
  price: { ...typography.h2, color: colors.primary },
  strike: { ...typography.body, color: colors.textMuted, textDecorationLine: 'line-through' },
  progressBox: { marginTop: spacing.lg },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...typography.bodyStrong, color: colors.text },
  progressPct: { ...typography.bodyStrong, color: colors.secondary },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  notice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  primary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  share: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
