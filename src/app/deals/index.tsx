import { useState, type ReactNode } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useActiveGroupBuys,
  useActivePriceLocks,
  useMyGroupBuys,
  useMyPriceLocks,
} from '@/features/deals/queries';
import { getDealWindowState, getDepositInfo } from '@/features/deals/api';
import { useDealRealtimeSync } from '@/features/deals/realtime';
import { GroupBuyCard, PriceLockCard, ProgressBar } from '@/features/deals/components';
import { EmptyState, ErrorState } from '@/components/States';
import { ListSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';

type Segment = 'group' | 'lock' | 'mine';

export default function DealsHubScreen() {
  useDealRealtimeSync();
  // /deals?segment=lock|mine deep-links straight into a tab (marketing CTAs).
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: Segment }>();
  const [segment, setSegment] = useState<Segment>(
    segmentParam === 'lock' || segmentParam === 'mine' ? segmentParam : 'group',
  );
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Deals' }} />
      <View style={styles.tabs}>
        {(
          [
            ['group', 'Group Buys'],
            ['lock', 'Price Locks'],
            ['mine', 'My Deals'],
          ] as [Segment, string][]
        ).map(([key, label]) => (
          <Pressable
            key={key}
            style={[styles.tab, segment === key && styles.tabActive]}
            onPress={() => setSegment(key)}
          >
            <Text style={[styles.tabText, segment === key && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {/* Corridor banner — stitch 12 */}
      <View style={styles.banner}>
        <ScreenColumn pad={false} style={styles.bannerInner}>
          <View>
            <Text style={styles.bannerTitle}>Corridor Pools</Text>
            <Text style={styles.bannerMeta}>Escrow-protected bulk dispatch lanes</Text>
          </View>
          <View style={styles.bannerChip}>
            <Ionicons name="shield-checkmark" size={12} color={colors.background} />
            <Text style={styles.bannerChipText}>CBN ESCROW</Text>
          </View>
        </ScreenColumn>
      </View>
      <View style={{ flex: 1 }}>
        <ScreenColumn>
          {segment === 'group' && <GroupBuyList />}
          {segment === 'lock' && <PriceLockList />}
          {segment === 'mine' && <MyDealsList />}
        </ScreenColumn>
      </View>
    </View>
  );
}

function GroupBuyList() {
  const q = useActiveGroupBuys();
  if (q.isLoading) return <View style={{ padding: 16 }}><ListSkeleton count={4} /></View>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const deals = (q.data ?? []).filter((d) => getDealWindowState(d) === 'joinable');
  if (!deals.length)
    return <EmptyState title="No active group buys" hint="Check back soon for new deals." />;
  return (
    <FlatList
      data={deals}
      keyExtractor={(d) => d.id}
      renderItem={({ item }) => <GroupBuyCard deal={item} />}
      contentContainerStyle={styles.list}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
    />
  );
}

function PriceLockList() {
  const q = useActivePriceLocks();
  if (q.isLoading) return <View style={{ padding: 16 }}><ListSkeleton count={4} /></View>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const deals = (q.data ?? []).filter((d) => getDealWindowState(d) === 'joinable');
  if (!deals.length)
    return <EmptyState title="No active price locks" hint="Check back soon for new deals." />;
  return (
    <FlatList
      data={deals}
      keyExtractor={(d) => d.id}
      renderItem={({ item }) => <PriceLockCard deal={item} />}
      contentContainerStyle={styles.list}
      refreshing={q.isRefetching}
      onRefresh={() => q.refetch()}
    />
  );
}

function MyDealsList() {
  const { session } = useAuth();
  const router = useRouter();
  const gb = useMyGroupBuys(session?.user.id);
  const pl = useMyPriceLocks(session?.user.id);

  if (!session) {
    return (
      <EmptyState
        title="Sign in to see your deals"
        hint="Your joined group buys and price locks appear here."
      />
    );
  }
  if (gb.isLoading || pl.isLoading) return <View style={{ padding: 16 }}><ListSkeleton count={4} /></View>;
  if (gb.isError || pl.isError) return <ErrorState onRetry={() => { gb.refetch(); pl.refetch(); }} />;

  const rows: { key: string; node: ReactNode }[] = [];

  (pl.data ?? []).forEach((p) => {
    const deal = p.price_lock as any;
    const dep = getDepositInfo(deal?.payment_plan);
    const canPayBalance = p.payment_status === 'deposit_paid';
    const statusLabel =
      p.payment_status === 'fully_paid'
        ? 'Fully paid'
        : p.payment_status === 'deposit_paid'
          ? `${dep.label} deposit paid`
          : 'Deposit pending';
    rows.push({
      key: `pl-${p.id}`,
      node: (
        <Pressable
          style={styles.myCard}
          onPress={() => router.push(`/deals/join/price-lock/${deal?.id ?? p.price_lock_id}`)}
        >
          <View style={styles.myHead}>
            <Ionicons name="lock-closed" size={14} color={colors.primary} />
            <Text style={styles.myTitle} numberOfLines={1}>{deal?.title ?? 'Price lock'}</Text>
            <Text
              style={[
                styles.myStatus,
                p.payment_status === 'fully_paid' && { color: colors.secondary },
                canPayBalance && { color: colors.accent },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.myMeta}>
            {p.locked_quantity} units · {formatNaira(p.total_amount ?? 0)} total
            {p.expires_at ? ` · expires ${new Date(p.expires_at).toLocaleDateString()}` : ''}
          </Text>
          {canPayBalance && (
            <View style={styles.balanceCta}>
              <Ionicons name="card" size={14} color="#fff" />
              <Text style={styles.balanceCtaText}>
                Pay balance {formatNaira(p.balance_due ?? 0)}
              </Text>
            </View>
          )}
        </Pressable>
      ),
    });
  });

  (gb.data ?? []).forEach((p) => {
    const deal = p.group_buy;
    const paid = p.status === 'active' || p.status === 'completed';
    const progress = deal?.target_quantity
      ? ((deal.current_quantity ?? 0) / deal.target_quantity) * 100
      : 0;
    rows.push({
      key: `gb-${p.id}`,
      node: (
        <Pressable
          style={styles.myCard}
          onPress={() =>
            router.push(
              (deal?.slug ? `/deals/group-buy/${deal.slug}` : `/deals/join/group-buy/${p.group_buy_id}`) as any,
            )
          }
        >
          <View style={styles.myHead}>
            <Ionicons name="people" size={14} color={colors.secondary} />
            <Text style={styles.myTitle} numberOfLines={1}>{deal?.title ?? 'Group buy'}</Text>
            <Text style={[styles.myStatus, paid && { color: colors.secondary }]}>
              {paid ? 'Joined' : 'Payment pending'}
            </Text>
          </View>
          <ProgressBar progress={progress / 100} />
          <Text style={styles.myMeta}>
            {p.quantity} units · {deal?.current_quantity ?? 0}/{deal?.target_quantity ?? 0} claimed
          </Text>
        </Pressable>
      ),
    });
  });

  if (!rows.length)
    return (
      <EmptyState
        title="No deals joined yet"
        hint="Join a group buy or price lock to see it here."
      />
    );

  return <FlatList data={rows} keyExtractor={(r) => r.key} renderItem={({ item }) => <>{item.node}</>} contentContainerStyle={styles.list} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  banner: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: { ...typography.h2, fontSize: 18, color: colors.background },
  bannerMeta: { ...typography.micro, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  bannerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  bannerChipText: { ...typography.micro, color: colors.background, letterSpacing: 0.5 },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { ...typography.bodyStrong, color: colors.textMuted, fontSize: 13 },
  tabTextActive: { color: colors.textOnPrimary },
  list: { padding: spacing.lg, paddingTop: 0 },
  myCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    ...shadows.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  myHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  myTitle: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  myStatus: { ...typography.caption, color: colors.textMuted, fontFamily: 'Inter_600SemiBold' },
  myMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  balanceCta: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  balanceCtaText: { ...typography.bodyStrong, color: colors.textOnPrimary, fontSize: 13 },
});
