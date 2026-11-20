import { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/api/supabase';
import { useCart, type CartItem } from '@/features/cart/CartContext';
import { ListSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';

type VendorGroup = { vendorId: string; vendorName: string; items: CartItem[] };

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, totalPrice, loading } = useCart();

  const vendorIds = useMemo(
    () => [...new Set(items.map((i) => i.vendor_id).filter(Boolean))] as string[],
    [items],
  );

  const vendorNames = useQuery({
    queryKey: ['cart-vendor-names', vendorIds],
    enabled: vendorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('vendor_profiles')
        .select('user_id, business_name')
        .in('user_id', vendorIds);
      return new Map(
        (data ?? []).map((v: any) => [v.user_id, v.business_name as string]),
      );
    },
  });

  const groups = useMemo<VendorGroup[]>(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of items) {
      const key = item.vendor_id ?? 'unknown';
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].map(([vendorId, groupItems]) => ({
      vendorId,
      vendorName:
        vendorNames.data?.get(vendorId) ??
        (vendorId === 'unknown' ? 'Supplier' : 'Supplier'),
      items: groupItems,
    }));
  }, [items, vendorNames.data]);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  if (loading && !items.length) return <View style={{ flex: 1, padding: spacing.lg }}><ListSkeleton count={4} /></View>;
  if (!items.length)
    return (
      <View style={styles.screen}>
        <ScreenColumn>
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cart-outline" size={40} color={colors.textFaint} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyHint}>
              Browse products and add supplier offers to get started.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)' as any)}
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.emptyBtnText}>Browse Materials</Text>
            </Pressable>
          </View>
        </ScreenColumn>
      </View>
    );

  return (
    <View style={styles.screen}>
      <ScreenColumn>
        <FlatList
          data={groups}
          keyExtractor={(g) => g.vendorId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(220)} style={styles.group}>
              {/* Vendor head */}
              <View style={styles.vendorHead}>
                <View style={{ flex: 1 }}>
                  <View style={styles.vendorRow}>
                    <Text style={styles.vendorName} numberOfLines={1}>{group.vendorName}</Text>
                    <Ionicons name="checkmark-circle" size={13} color={colors.secondary} />
                  </View>
                  <Text style={styles.vendorMeta}>{group.items.length} item{group.items.length === 1 ? '' : 's'}</Text>
                </View>
                <View style={styles.escrowBadge}>
                  <Ionicons name="shield-checkmark" size={11} color={colors.secondary} />
                  <Text style={styles.escrowBadgeText}>Escrow</Text>
                </View>
              </View>

              {group.items.map((item) => (
                <View key={item.id} style={styles.item}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.thumb, styles.thumbFallback]}>
                      <Ionicons name="cube-outline" size={20} color={colors.textFaint} />
                    </View>
                  )}
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>{formatNaira(item.price)}</Text>
                    {item.selected_specs &&
                      Object.values(item.selected_specs).map((s) => (
                        <Text key={s.label} style={styles.spec}>
                          {s.label}: {s.value}
                        </Text>
                      ))}
                    <View style={styles.itemActions}>
                      <View style={styles.stepper}>
                        <Pressable
                          style={styles.stepBtn}
                          onPress={() => {
                            Haptics.selectionAsync();
                            updateQuantity(item.id, item.quantity - 1);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons name="remove" size={16} color={colors.text} />
                        </Pressable>
                        <Text style={styles.qty}>{item.quantity}</Text>
                        <Pressable
                          style={styles.stepBtn}
                          onPress={() => {
                            Haptics.selectionAsync();
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons name="add" size={16} color={colors.text} />
                        </Pressable>
                      </View>
                      <Pressable onPress={() => removeFromCart(item.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                      </Pressable>
                    </View>
                  </View>
                  <Text style={styles.itemSubtotal}>{formatNaira(item.price * item.quantity)}</Text>
                </View>
              ))}
            </Animated.View>
          )}
          ListFooterComponent={
            <>
              {/* Consolidated logistics — stitch 07 */}
              <View style={styles.logisticsCard}>
                <View style={styles.logisticsHead}>
                  <Ionicons name="bus" size={16} color={colors.secondary} />
                  <Text style={styles.logisticsTitle}>CONSOLIDATED LOGISTICS</Text>
                  <Text style={styles.logisticsMeta}>Dual Dispatch</Text>
                </View>
                <Text style={styles.logisticsBody}>
                  Fleet class and haulage rates are matched automatically at checkout based on
                  your delivery site.
                </Text>
              </View>

              {/* Escrow note */}
              <View style={styles.escrowNote}>
                <Ionicons name="shield-checkmark" size={16} color={colors.secondary} />
                <Text style={styles.escrowNoteText}>
                  ShieldVase CBN-Regulated Escrow — funds are locked securely and will not
                  disburse to vendors until weighbridge manifests & offloading are signed at site.
                </Text>
              </View>

              {/* Valuation summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>ORDER VALUATION SUMMARY</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Materials Subtotal ({items.length} item{items.length === 1 ? '' : 's'} · {totalQty} units)
                  </Text>
                  <Text style={styles.summaryValue}>{formatNaira(totalPrice)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Consolidated Heavy Haulage</Text>
                  <Text style={styles.summaryMuted}>At checkout</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>CBN Escrow Protection Fee</Text>
                  <Text style={[styles.summaryValue, { color: colors.secondary }]}>FREE</Text>
                </View>
              </View>
            </>
          }
        />
      </ScreenColumn>

      {/* Sticky escrow-lock bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.subtotalLabel}>TOTAL ESCROW LOCK</Text>
          <Text style={styles.subtotal}>{formatNaira(totalPrice)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.checkoutBtn, pressed && { opacity: 0.9 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/checkout');
          }}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingTop: spacing.lg, paddingBottom: spacing['4xl'] },
  group: {
    ...shadows.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceRaised,
  },
  vendorHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  vendorName: { ...typography.bodyStrong, color: colors.secondary, flexShrink: 1 },
  vendorMeta: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  escrowBadgeText: { ...typography.micro, color: colors.secondary },
  item: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surface },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1 },
  itemName: { ...typography.bodyStrong, color: colors.text, fontSize: 13 },
  itemPrice: { ...typography.caption, color: colors.primary, marginTop: 2 },
  spec: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  itemSubtotal: { ...typography.captionStrong, color: colors.text, alignSelf: 'flex-start' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  stepBtn: { padding: spacing.sm },
  qty: { ...typography.bodyStrong, color: colors.text, minWidth: 24, textAlign: 'center' },
  logisticsCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  logisticsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logisticsTitle: { ...typography.micro, color: colors.text, letterSpacing: 0.5, flex: 1 },
  logisticsMeta: { ...typography.micro, color: colors.secondary },
  logisticsBody: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  escrowNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  escrowNoteText: { ...typography.caption, color: colors.text, flex: 1 },
  summaryCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  summaryTitle: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.6, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  summaryLabel: { ...typography.caption, color: colors.textMuted, flex: 1 },
  summaryValue: { ...typography.captionStrong, color: colors.text },
  summaryMuted: { ...typography.caption, color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.navy,
    gap: spacing.md,
  },
  subtotalLabel: { ...typography.micro, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
  subtotal: { ...typography.h2, fontSize: 18, color: colors.background },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
  },
  checkoutText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptyHint: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing['2xl'] },
  emptyBtn: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    height: 46,
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
