import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useOrder, useOrderItems, useOrderStatusHistory } from '@/features/orders/queries';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { DetailSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useOrder(id);
  const items = useOrderItems(id);
  const history = useOrderStatusHistory(id);

  if (order.isLoading) return <View style={{ flex: 1, padding: 16 }}><DetailSkeleton /></View>;
  if (order.isError) return <ErrorState onRetry={() => order.refetch()} />;
  if (!order.data) return <EmptyState title="Order not found" />;

  const o: any = order.data;
  const orderNo = o.order_number || o.purchase_order_id || o.id;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: `Order ${orderNo}` }} />
      <ScreenColumn>
      {/* Waybill hero — stitch 11 */}
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>CONSOLIDATED WAYBILL</Text>
        <Text style={styles.heroTitle}>Order {orderNo}</Text>
        <Text style={styles.heroMeta}>Heavy Materials · ShieldVase Escrow Channel</Text>
        <View style={styles.heroChips}>
          <View style={styles.heroChip}>
            <View style={styles.chipDot} />
            <Text style={styles.heroChipText}>{(o.status ?? 'PENDING').toUpperCase()}</Text>
          </View>
          <View style={styles.heroChip}>
            <Ionicons name="shield-checkmark" size={10} color={colors.background} />
            <Text style={styles.heroChipText}>{(o.payment_status ?? 'pending').toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{o.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment</Text>
          <Text
            style={[
              styles.value,
              { color: o.payment_status === 'paid' ? colors.secondary : colors.warning },
            ]}
          >
            {o.payment_status ?? 'pending'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Placed</Text>
          <Text style={styles.value}>{new Date(o.created_at).toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
          <Text style={[styles.value, { color: colors.primary }]}>
            {formatNaira(o.total_amount)}
          </Text>
        </View>
      </View>

      <Text style={styles.section}>Items</Text>
      {items.isLoading ? (
        <LoadingState label="Loading items…" />
      ) : (
        (items.data ?? []).map((i) => (
          <View key={i.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{i.product_name}</Text>
              {!!i.vendor_name && <Text style={styles.itemMeta}>{i.vendor_name}</Text>}
              {i.selected_specs &&
                Object.values(i.selected_specs).map((s) => (
                  <Text key={s.label} style={styles.itemMeta}>
                    {s.label}: {s.value}
                  </Text>
                ))}
            </View>
            <Text style={styles.itemQty}>×{i.quantity}</Text>
            <Text style={styles.itemPrice}>{formatNaira(i.total_price)}</Text>
          </View>
        ))
      )}

      {!!o.delivery_details && (
        <>
          <Text style={styles.section}>Delivery</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              {o.delivery_details.address}
              {'\n'}
              {o.delivery_details.city}, {o.delivery_details.state}
              {o.delivery_details.phone ? `\n${o.delivery_details.phone}` : ''}
            </Text>
          </View>
        </>
      )}

      <Text style={styles.section}>Escrow Release Protocol</Text>
      <View style={styles.card}>
        {[
          ['Fund Lock Confirmed', 'DONE'],
          ['Weighbridge Verified at Depot', 'STEP 2'],
          ['GPS Transit Telemetry', 'STEP 3'],
          ['Engineer PIN Release at Site', 'STEP 4'],
        ].map(([step, tag], i) => (
          <View key={step} style={styles.escrowRow}>
            <View style={[styles.escrowDot, i === 0 && styles.escrowDotDone]}>
              {i === 0 && <Ionicons name="checkmark" size={10} color="#fff" />}
            </View>
            <Text style={styles.escrowStep}>{step}</Text>
            <Text style={[styles.escrowTag, i !== 0 && { color: colors.textMuted }]}>{tag}</Text>
          </View>
        ))}
      </View>

      {!!history.data?.length && (
        <>
          <Text style={styles.section}>Timeline</Text>
          <View style={styles.card}>
            {history.data.map((h, idx) => (
              <View key={`${h.changed_at}-${idx}`} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineStatus}>{h.status}</Text>
                  <Text style={styles.timelineMeta}>
                    {new Date(h.changed_at).toLocaleString()}
                    {h.notes ? ` · ${h.notes}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
      </ScreenColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  card: {
    ...shadows.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceRaised,
  },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroKicker: { ...typography.micro, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  heroTitle: { ...typography.h2, fontSize: 20, color: colors.background, marginTop: spacing.xs },
  heroMeta: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroChips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondaryLight },
  heroChipText: { ...typography.micro, color: colors.background },
  escrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  escrowDot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  escrowDotDone: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  escrowStep: { ...typography.caption, color: colors.text, flex: 1 },
  escrowTag: { ...typography.micro, color: colors.secondary },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  label: { ...typography.caption, color: colors.textMuted },
  value: { ...typography.bodyStrong, color: colors.text },
  section: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing['2xl'],
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemName: { ...typography.bodyStrong, color: colors.text },
  itemMeta: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  itemQty: { ...typography.body, color: colors.textMuted },
  itemPrice: { ...typography.bodyStrong, color: colors.text },
  bodyText: { ...typography.body, color: colors.text, lineHeight: 22 },
  timelineRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    marginTop: 6,
  },
  timelineStatus: { ...typography.bodyStrong, color: colors.text },
  timelineMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
