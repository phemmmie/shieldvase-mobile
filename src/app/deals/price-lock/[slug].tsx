import { useEffect } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useMyPriceLockParticipation, usePriceLockBySlug } from '@/features/deals/queries';
import { buildDealShareUrl, getDealWindowState, getDepositInfo, trackShareClick } from '@/features/deals/api';
import { useDealRealtimeSync } from '@/features/deals/realtime';
import { ProgressBar } from '@/features/deals/components';
import { EmptyState, ErrorState } from '@/components/States';
import { DetailSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';
import { LockCertificate } from '@/features/deals/LockCertificate';

export default function PriceLockLandingScreen() {
  useDealRealtimeSync();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const q = usePriceLockBySlug(slug);
  const deal = q.data;
  const myParticipation = useMyPriceLockParticipation(deal?.id, session?.user.id);

  useEffect(() => {
    if (slug) void trackShareClick('price_lock', slug, session?.user.id, 'sme');
  }, [slug, session?.user.id]);

  if (q.isLoading) return <View style={{ flex: 1, padding: 16 }}><DetailSkeleton /></View>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (!deal) return <EmptyState title="Deal not found" hint="This price lock may have ended." />;

  const window = getDealWindowState(deal);
  const total = deal.total_available_quantity ?? 0;
  const locked = deal.current_locked_quantity ?? 0;
  const remaining = total - locked;
  const progress = total ? (locked / total) * 100 : 0;
  const dep = getDepositInfo(deal.payment_plan);
  const p = myParticipation.data;
  const completed = p?.status === 'active' && p?.payment_status === 'fully_paid';
  const joinable = window === 'joinable' && deal.status === 'active' && remaining > 0 && !completed;

  const onShare = async () => {
    const url = await buildDealShareUrl('price_lock', deal.slug ?? slug!);
    await Share.share({ title: deal.title, message: `${deal.title} — price lock on ShieldVase\n${url}` });
  };

  const openJoin = () => {
    const path = `/deals/join/price-lock/${deal.id}`;
    if (!session) {
      router.push(`/(auth)/sign-in?redirect=${encodeURIComponent(path)}` as any);
      return;
    }
    router.push(path);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Price Lock' }} />
      <Image
        source={{ uri: deal.product?.images?.[0] }}
        style={styles.hero}
        contentFit="cover"
        transition={150}
      />
      <ScreenColumn>
      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Ionicons name="lock-closed" size={12} color="#fff" />
            <Text style={styles.badgeText}>PRICE LOCK</Text>
          </View>
          {!!deal.original_price && !!deal.locked_price && deal.original_price > deal.locked_price && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>
                SAVE {Math.round(((deal.original_price - deal.locked_price) / deal.original_price) * 100)}%
              </Text>
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
            <Text style={styles.priceLabel}>Locked price</Text>
            <Text style={styles.price}>{formatNaira(deal.locked_price ?? 0)}</Text>
          </View>
          {!!deal.original_price && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceLabel}>Retail</Text>
              <Text style={styles.strike}>{formatNaira(deal.original_price)}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <InfoRow icon="time" label="Lock duration" value={`${deal.lock_duration_days ?? 30} days`} />
          <InfoRow icon="card" label="Payment plan" value={`${dep.label} deposit · ${dep.balanceLabel} later`} />
          {!!deal.max_quantity_per_sme && (
            <InfoRow icon="cube" label="Max per buyer" value={`${deal.max_quantity_per_sme} units`} />
          )}
          {!!deal.end_date && (
            <InfoRow icon="calendar" label="Deal ends" value={new Date(deal.end_date).toLocaleDateString()} />
          )}
        </View>

        <View style={styles.progressBox}>
          <View style={styles.progressHead}>
            <Text style={styles.progressLabel}>{remaining} of {total} units available</Text>
            <Text style={styles.progressPct}>{Math.round(progress)}% locked</Text>
          </View>
          <ProgressBar progress={progress / 100} color={colors.accent} />
        </View>

        {window === 'upcoming' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              This deal starts {deal.start_date ? new Date(deal.start_date).toLocaleDateString() : 'soon'}.
            </Text>
          </View>
        )}
        {(window === 'expired' || remaining <= 0) && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              {remaining <= 0 && window === 'joinable' ? 'Fully locked — no units remaining.' : 'This price lock has ended.'}
            </Text>
          </View>
        )}
        {p && (
          <View style={[styles.notice, { backgroundColor: colors.secondarySoft }]}>
            <Text style={[styles.noticeText, { color: colors.secondary }]}>
              {p.payment_status === 'fully_paid'
                ? 'You’ve completed this price lock.'
                : p.payment_status === 'deposit_paid'
                  ? `Deposit paid — balance of ${formatNaira(p.balance_due ?? 0)} due.`
                  : 'You have a pending reservation — complete payment to lock your price.'}
            </Text>
          </View>
        )}
        {p && p.payment_status !== 'pending' && (
          <LockCertificate
            reference={p.id}
            title={deal.title}
            lockedPrice={Number(deal.locked_price ?? 0)}
            quantity={p.locked_quantity ?? 1}
            unit={null}
            days={deal.lock_duration_days ?? 30}
            createdAt={(p as any).created_at}
            paymentStatus={p.payment_status}
          />
        )}

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, !joinable && !p && styles.primaryDisabled]}
            disabled={!joinable && !p}
            onPress={openJoin}
          >
            <Text style={styles.primaryText}>
              {completed
                ? 'Completed'
                : p?.payment_status === 'deposit_paid'
                  ? 'Pay balance'
                  : p
                    ? 'Continue payment'
                    : 'Lock this price'}
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

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  infoBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoLabel: { ...typography.body, color: colors.textMuted, flex: 1 },
  infoValue: { ...typography.bodyStrong, color: colors.text },
  progressBox: { marginTop: spacing.lg },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { ...typography.bodyStrong, color: colors.text },
  progressPct: { ...typography.bodyStrong, color: colors.accent },
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
  primaryButton: {
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
