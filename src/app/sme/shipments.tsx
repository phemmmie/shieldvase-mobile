import { Stack, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useSMEOrders } from '@/features/sme/queries';
import type { SMEOrder } from '@/features/sme/api';
import { StatusBadge, formatDate } from '@/features/sme/components';
import { EmptyState, LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';

const DONE_STATUSES = new Set(['delivered', 'completed', 'cancelled', 'canceled']);

type StageKey = 'pending' | 'processing' | 'shipped' | 'in_transit' | 'delivered';

const STAGES: { key: StageKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'pending', label: 'Pending', icon: 'time-outline' },
  { key: 'processing', label: 'Processing', icon: 'cube-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'send-outline' },
  { key: 'in_transit', label: 'In Transit', icon: 'navigate-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-outline' },
];

function stageFor(order: SMEOrder): StageKey {
  const raw = (order.shipping_status || order.status || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (raw.includes('transit')) return 'in_transit';
  if (raw.includes('ship') || raw.includes('dispatch')) return 'shipped';
  if (raw.includes('deliver') || raw.includes('complete')) return 'delivered';
  if (raw.includes('process') || raw.includes('confirm') || raw.includes('pack')) return 'processing';
  return 'pending';
}

function ShipmentRow({ order }: { order: SMEOrder }) {
  const eta = order.estimated_delivery_date || order.delivery_eta;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => router.push(`/order/${order.id}`)}
    >
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {order.order_number}
        </Text>
        <StatusBadge status={order.shipping_status || order.status} />
      </View>
      <Text style={styles.rowProduct} numberOfLines={1}>
        {order.product_name}
      </Text>
      <View style={styles.metaLine}>
        {order.carrier ? (
          <View style={styles.metaItem}>
            <Ionicons name="bus-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{order.carrier}</Text>
          </View>
        ) : null}
        {order.tracking_number ? (
          <View style={styles.metaItem}>
            <Ionicons name="barcode-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {order.tracking_number}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.rowFooter}>
        <Text style={styles.eta}>
          {eta ? `ETA ${formatDate(eta)}` : 'Awaiting dispatch'}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

export default function SMEShipmentsScreen() {
  const { user, userType, loading: authLoading } = useAuth();
  const { data: orders, isLoading } = useSMEOrders(user?.id);

  if (authLoading || isLoading) return <LoadingState label="Loading shipments..." />;
  if (!user) return <EmptyState title="Sign in required" hint="Sign in to track your shipments." />;
  if (userType !== 'sme') {
    return <EmptyState title="SME accounts only" hint="Switch to an SME account to view shipments." />;
  }

  const all = orders ?? [];
  const active = all.filter((o) => !DONE_STATUSES.has((o.status || '').toLowerCase()));
  const past = all.filter((o) => DONE_STATUSES.has((o.status || '').toLowerCase()));
  const counts = new Map<StageKey, number>();
  for (const order of active) {
    const stage = stageFor(order);
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Shipments' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.stageGrid}>
          {STAGES.map((stage) => (
            <View key={stage.key} style={styles.stageCard}>
              <Ionicons name={stage.icon} size={18} color={colors.primary} />
              <Text style={styles.stageValue}>{counts.get(stage.key) ?? 0}</Text>
              <Text style={styles.stageLabel}>{stage.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Active shipments</Text>
        {active.length === 0 ? (
          <EmptyState title="No active shipments" hint="Orders in transit will appear here." />
        ) : (
          <View style={styles.card}>{active.map((order) => <ShipmentRow key={order.id} order={order} />)}</View>
        )}

        {past.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Past shipments</Text>
            <View style={styles.card}>{past.map((order) => <ShipmentRow key={order.id} order={order} />)}</View>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  stageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stageCard: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  stageValue: { ...typography.h2, color: colors.text },
  stageLabel: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  rowPressed: { backgroundColor: colors.primarySoft },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowTitle: { ...typography.bodyStrong, color: colors.text, flexShrink: 1 },
  rowProduct: { ...typography.body, color: colors.textMuted },
  metaLine: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption, color: colors.textMuted },
  rowFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  eta: { ...typography.captionStrong, color: colors.primary },
});
