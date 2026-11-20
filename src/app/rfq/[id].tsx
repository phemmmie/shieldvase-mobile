import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRfqDetail } from '@/features/rfq/queries';
import { awardRfqItems, displayUnitPrice } from '@/features/rfq/api';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { ScreenColumn } from '@/components/Responsive';

export default function RfqDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const rfq = useRfqDetail(id);
  const [selected, setSelected] = useState<Record<string, string>>({}); // rfq_item_id → quotation_item_id
  const [busy, setBusy] = useState(false);

  const lowestPerItem = useMemo(() => {
    const map: Record<string, number> = {};
    if (!rfq.data) return map;
    for (const item of rfq.data.items) {
      const prices = rfq.data.bids
        .map((b) => b.items[item.id]?.unit_price)
        .filter((p): p is number => typeof p === 'number' && p > 0);
      if (prices.length) map[item.id] = Math.min(...prices);
    }
    return map;
  }, [rfq.data]);

  if (rfq.isLoading) return <LoadingState />;
  if (rfq.isError) return <ErrorState onRetry={() => rfq.refetch()} />;
  if (!rfq.data) return <EmptyState title="RFQ not found" />;

  const { items, bids, status, rfq_number, title } = rfq.data;
  const awarded = status === 'awarded' || status === 'partially_awarded';
  const allSelected = items.every((it) => selected[it.id]);

  const award = () => {
    const awards = Object.entries(selected).map(([rfq_item_id, quotation_item_id]) => ({
      rfq_item_id,
      quotation_item_id,
    }));
    Alert.alert(
      'Award quotes',
      `Award ${awards.length} item${awards.length === 1 ? '' : 's'} and add them to your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Award',
          onPress: async () => {
            setBusy(true);
            try {
              const res = await awardRfqItems(id!, awards);
              queryClient.invalidateQueries({ queryKey: ['rfq', id] });
              queryClient.invalidateQueries({ queryKey: ['rfqs'] });
              Alert.alert(
                'Awarded & added to cart',
                `${res?.cart_inserts ?? awards.length} item(s) added. Proceed to cart to check out.`,
                [{ text: 'View cart', onPress: () => router.push('/(tabs)/cart') }],
              );
            } catch (e: any) {
              Alert.alert('Award failed', e?.message ?? 'Please try again.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenColumn>
      <Stack.Screen options={{ title: rfq_number }} />
      <Text style={styles.number}>{rfq_number}</Text>
      {!!title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.status}>{status.replace('_', ' ')}</Text>

      <Text style={styles.section}>Your items</Text>
      {items.map((it) => (
        <Text key={it.id} style={styles.itemLine}>
          • {it.product_name} — {it.quantity}
          {it.unit ? ` ${it.unit}` : ''}
        </Text>
      ))}

      <Text style={styles.section}>
        Quotes {bids.length ? `(${bids.length})` : ''}
      </Text>
      {!bids.length ? (
        <EmptyState
          title="No quotes yet"
          hint="Suppliers typically respond within a few hours of approval."
        />
      ) : (
        items.map((it) => (
          <View key={it.id} style={styles.compareCard}>
            <Text style={styles.compareTitle}>
              {it.product_name} × {it.quantity}
              {it.unit ? ` ${it.unit}` : ''}
            </Text>
            {bids.map((b) => {
              const cell = b.items[it.id];
              if (!cell) return null;
              const isLowest = cell.unit_price === lowestPerItem[it.id];
              const isPicked = selected[it.id] === cell.quotation_item_id;
              return (
                <Pressable
                  key={b.quotation_id}
                  style={[styles.bidRow, isPicked && styles.bidRowPicked]}
                  disabled={awarded}
                  onPress={() =>
                    setSelected((s) => ({ ...s, [it.id]: cell.quotation_item_id }))
                  }
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.bidVendorRow}>
                      <Text style={styles.bidVendor}>{b.vendor_label}</Text>
                      {cell.is_winning && (
                        <Ionicons name="trophy" size={14} color={colors.accent} />
                      )}
                      {isLowest && (
                        <Text style={styles.lowestTag}>LOWEST</Text>
                      )}
                    </View>
                    <Text style={styles.bidSub}>{b.vendor_sublabel}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bidPrice}>
                      {formatNaira(displayUnitPrice(cell.unit_price, it))}
                      {it.unit ? `/${it.unit}` : ''}
                    </Text>
                    <Text style={styles.bidTotal}>
                      {formatNaira(displayUnitPrice(cell.subtotal, it))} total
                    </Text>
                  </View>
                  {!awarded && (
                    <Ionicons
                      name={isPicked ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isPicked ? colors.primary : colors.textMuted}
                      style={{ marginLeft: spacing.sm }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))
      )}

      {!awarded && bids.length > 0 && (
        <Pressable
          style={[styles.awardBtn, (!allSelected || busy) && { opacity: 0.6 }]}
          disabled={!allSelected || busy}
          onPress={award}
        >
          <Text style={styles.awardText}>
            {busy ? 'Awarding…' : 'Award selected & add to cart'}
          </Text>
        </Pressable>
      )}
          </ScreenColumn>
</ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  number: { ...typography.h2, color: colors.text },
  title: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  status: {
    ...typography.micro,
    color: colors.secondary,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  section: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  itemLine: { ...typography.body, color: colors.text, paddingVertical: 2 },
  compareCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceRaised,
  },
  compareTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.sm },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bidRowPicked: { backgroundColor: colors.surface, borderRadius: radius.sm },
  bidVendorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bidVendor: { ...typography.bodyStrong, color: colors.text },
  lowestTag: {
    ...typography.micro,
    color: colors.secondary,
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
  },
  bidSub: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  bidPrice: { ...typography.bodyStrong, color: colors.primary },
  bidTotal: { ...typography.micro, color: colors.textMuted },
  awardBtn: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  awardText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
