import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRfqDetail } from '@/features/rfq/queries';
import { awardRfqItems, displayUnitPrice } from '@/features/rfq/api';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { colors, radius, shadows, spacing, typography } from '@/theme';
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
      {/* Tender hero — stitch 06a/13 */}
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroKicker}>TENDER · {rfq_number}</Text>
            {!!title && <Text style={styles.heroTitle}>{title}</Text>}
          </View>
          <View style={styles.heroPill}>
            <View style={styles.heroDot} />
            <Text style={styles.heroPillText}>{status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.heroMeta}>
          {status === 'open' || status === 'pending'
            ? 'Broadcast to verified depots — quotes arrive under escrow terms.'
            : 'Review supplier quotes and award items to build your cart.'}
        </Text>
      </View>

      <Text style={styles.section}>Your items</Text>
      <View style={styles.itemsCard}>
        {items.map((it, i) => (
          <View key={it.id} style={[styles.itemRow, i > 0 && styles.itemRowBorder]}>
            <View style={styles.itemIcon}>
              <Ionicons name="cube-outline" size={14} color={colors.secondary} />
            </View>
            <Text style={styles.itemLine}>
              {it.product_name}
            </Text>
            <Text style={styles.itemQty}>
              {it.quantity}{it.unit ? ` ${it.unit}` : ''}
            </Text>
          </View>
        ))}
      </View>

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
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  heroKicker: { ...typography.micro, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8 },
  heroTitle: { ...typography.h2, fontSize: 17, color: colors.background, marginTop: 2 },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(47,191,113,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondaryLight },
  heroPillText: { ...typography.micro, color: colors.secondaryLight, letterSpacing: 0.4 },
  heroMeta: { ...typography.caption, color: 'rgba(255,255,255,0.65)', marginTop: spacing.sm },
  itemsCard: {
    ...shadows.card,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  itemRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  itemIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQty: { ...typography.captionStrong, color: colors.textMuted },
  section: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  itemLine: { ...typography.body, color: colors.text, flex: 1 },
  compareCard: {
    ...shadows.card,
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
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    ...shadows.raised,
  },
  awardText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
