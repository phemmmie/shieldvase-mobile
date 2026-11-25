import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/AuthContext';
import { useOrders } from '@/features/orders/queries';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { ListSkeleton } from '@/components/Skeleton';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { ScreenColumn } from '@/components/Responsive';

const STATUS_COLORS: Record<string, string> = {
  paid: colors.secondary,
  delivered: colors.secondary,
  pending: colors.warning,
  processing: colors.warning,
  confirmed: colors.warning,
  packed: colors.warning,
  shipped: colors.primary,
  in_transit: colors.primary,
  failed: colors.destructive,
  cancelled: colors.textMuted,
};

const STATUS_LABELS: Record<string, string> = {
  in_transit: 'In Transit',
  shipped: 'Dispatched',
  packed: 'Packed',
};

// Web OrdersContent.tsx tabs + status-group mapping, verbatim.
const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'On the Way' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

const matchesTab = (tab: string, status: string) =>
  tab === 'all' ||
  (tab === 'processing' && ['pending', 'confirmed', 'processing', 'packed'].includes(status)) ||
  (tab === 'shipped' && ['shipped', 'in_transit'].includes(status)) ||
  (tab === 'delivered' && status === 'delivered') ||
  (tab === 'cancelled' && status === 'cancelled');

const statusLabel = (status: string) =>
  STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);

export default function OrdersScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const orders = useOrders(user?.id);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Web OrdersContent stats: processing / shipping / delivered counts.
  const stats = useMemo(() => {
    const s = { processing: 0, shipping: 0, delivered: 0, total: orders.data?.length ?? 0 };
    (orders.data ?? []).forEach((o) => {
      if (['pending', 'confirmed', 'processing', 'packed'].includes(o.status)) s.processing++;
      else if (['shipped', 'in_transit'].includes(o.status)) s.shipping++;
      else if (o.status === 'delivered') s.delivered++;
    });
    return s;
  }, [orders.data]);

  const filtered = useMemo(
    () =>
      (orders.data ?? []).filter((o) => {
        const q = searchTerm.trim().toLowerCase();
        const matchesSearch = q === '' || o.order_number.toLowerCase().includes(q);
        return matchesSearch && matchesTab(activeTab, o.status);
      }),
    [orders.data, activeTab, searchTerm],
  );

  if (authLoading) return <LoadingState />;

  if (!user) {
    return (
      <EmptyState
        title="Sign in to see your orders"
        hint="Your order history is linked to your account."
      />
    );
  }

  if (orders.isLoading) return <View style={{ flex: 1, padding: 16 }}><ListSkeleton count={6} /></View>;
  if (orders.isError) return <ErrorState onRetry={() => orders.refetch()} />;
  if (!orders.data?.length)
    return <EmptyState title="No orders yet" hint="Your purchases will appear here." />;

  return (
    <ScreenColumn pad={false} style={{ flex: 1 }}>
      {/* Stats — web OrdersContent orderStats cards */}
      <View style={styles.statsRow}>
        {[
          { label: 'Processing', value: stats.processing, hint: 'Orders in progress', color: colors.warning },
          { label: 'Shipping', value: stats.shipping, hint: 'Orders in transit', color: colors.primary },
          { label: 'Delivered', value: stats.delivered, hint: 'Completed orders', color: colors.secondary },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statHint}>{s.hint}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={15} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders by number…"
          placeholderTextColor={colors.textFaint}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Status tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshing={orders.isRefetching}
        onRefresh={() => orders.refetch()}
        ListEmptyComponent={
          <View style={styles.noMatch}>
            <Text style={styles.noMatchText}>
              No orders match this filter.
            </Text>
          </View>
        }
        renderItem={({ item: o, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(220)}>
          <Pressable style={styles.card} onPress={() => router.push(`/order/${o.id}`)}>
            <View style={styles.row}>
              <View style={styles.noRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name="receipt-outline" size={14} color={colors.secondary} />
                </View>
                <Text style={styles.orderNo}>{o.order_number}</Text>
              </View>
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor:
                      (STATUS_COLORS[o.status] ?? STATUS_COLORS[o.payment_status] ?? colors.textMuted) + '1A',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: STATUS_COLORS[o.status] ?? STATUS_COLORS[o.payment_status] ?? colors.textMuted },
                  ]}
                >
                  {statusLabel(o.status)}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.meta}>
                {new Date(o.created_at).toLocaleDateString()} · {o.payment_status}
              </Text>
              <Text style={styles.total}>{formatNaira(o.total_amount)}</Text>
            </View>
          </Pressable>
          </Animated.View>
        )}
      />
    </ScreenColumn>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    ...shadows.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
  },
  statValue: { ...typography.h2, fontSize: 20 },
  statLabel: { ...typography.captionStrong, color: colors.text, marginTop: 2 },
  statHint: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, ...typography.body, fontSize: 13, color: colors.text },
  tabs: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tab: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText: { ...typography.captionStrong, color: colors.textMuted, fontSize: 12 },
  tabTextActive: { color: colors.textOnPrimary },
  noMatch: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  noMatchText: { ...typography.caption, color: colors.textMuted },
  list: { padding: spacing.lg, paddingTop: 0 },
  card: {
    ...shadows.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceRaised,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  cardIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNo: { ...typography.bodyStrong, color: colors.text },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { ...typography.micro, textTransform: 'uppercase', fontFamily: 'Inter_700Bold' },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  total: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.xs },
});
