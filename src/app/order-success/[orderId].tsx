import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/api/supabase';
import { useCart } from '@/features/cart/CartContext';
import { EmptyState, LoadingState } from '@/components/States';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { formatDispatchRange } from '@/utils/distribution';

// Mirrors web /order-success/[orderId] (views/OrderSuccess.tsx): green check
// hero, order detail grid, delivery info card w/ dispatch + fulfilment,
// "What's Next" steps, View Orders / Continue Shopping actions.
// Mobile adaptation: vendor orders path collapses to the shared orders tab
// (vendor dashboard is out of scope for the app).

interface OrderDetails {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status?: string;
  order_group_id?: string | null;
  created_at: string;
  shipping_address?: {
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
  } | null;
  delivery_details?: {
    distribution?: {
      estimatedDispatchMinDays?: number | null;
      estimatedDispatchMaxDays?: number | null;
      fulfilmentLocations?: string[] | null;
    };
  } | null;
  order_items?: unknown[];
}

const NEXT_STEPS = (dispatchLabel: string | null) => [
  {
    title: 'Order Confirmation Email',
    body: "You'll receive an email with your order details and tracking information.",
  },
  {
    title: 'Supplier Fulfilment',
    body: dispatchLabel
      ? `Supplier dispatch is expected ${dispatchLabel.toLowerCase()}.`
      : 'The supplier will confirm dispatch timing during fulfilment.',
  },
  {
    title: 'Delivery Tracking',
    body: 'Delivery updates will appear on your order as the supplier progresses fulfilment.',
  },
];

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { clearCart } = useCart();
  const [cartCleared, setCartCleared] = useState(false);

  const query = useQuery({
    queryKey: ['order-success', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data as OrderDetails;
    },
  });

  const order = query.data ?? null;

  // Clear cart ONLY when this order's payment is verified as paid. For
  // multi-vendor orders, all siblings on the same order_group_id must be paid.
  useEffect(() => {
    if (!order || cartCleared) return;
    const run = async () => {
      let isPaid = order.payment_status === 'paid';
      if (isPaid && order.order_group_id) {
        const { data: siblings } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('order_group_id', order.order_group_id);
        isPaid = (siblings || []).every(o => o.payment_status === 'paid');
      }
      if (!isPaid) return;
      await clearCart();
      setCartCleared(true);
      // Also clear session/checkout references to start fresh.
      await AsyncStorage.removeItem('cart_session_id');
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys.filter(k => k.startsWith('checkout_session_')));
    };
    void run();
  }, [order, cartCleared, clearCart]);

  useEffect(() => {
    if (!orderId) router.replace('/');
  }, [orderId, router]);

  const distribution = order?.delivery_details?.distribution ?? {};
  const dispatchLabel = formatDispatchRange(
    distribution.estimatedDispatchMinDays,
    distribution.estimatedDispatchMaxDays,
  );
  const fulfilmentLocations = Array.isArray(distribution.fulfilmentLocations)
    ? distribution.fulfilmentLocations.filter(Boolean)
    : [];

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Order Confirmed' }} />
      {query.isLoading ? (
        <LoadingState label="Loading order…" />
      ) : !order ? (
        <View style={styles.notFound}>
          <EmptyState title="Order Not Found" hint="We couldn't find the order you're looking for." />
          <Pressable style={styles.homeBtn} onPress={() => router.replace('/')}>
            <Ionicons name="home-outline" size={16} color={colors.textOnPrimary} />
            <Text style={styles.homeBtnText}>Return Home</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ScreenColumn pad={false}>
            {/* Success header */}
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={34} color="#16A34A" />
            </View>
            <Text style={styles.title}>Order Confirmed!</Text>
            <Text style={styles.sub}>
              Thank you for your purchase. Your order has been successfully placed.
            </Text>

            {/* Order details */}
            <View style={styles.detailGrid}>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>Order Number</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{order.order_number}</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>Order Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={styles.detailValue}>{formatNaira(order.total_amount)}</Text>
              </View>
              <View style={styles.detailCell}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, styles.capitalize]}>{order.status}</Text>
              </View>
            </View>

            {/* Delivery information */}
            {order.shipping_address && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Delivery Information</Text>
                <View style={styles.addressCard}>
                  <Text style={styles.addressName}>{order.shipping_address.fullName}</Text>
                  <Text style={styles.addressBody}>
                    {order.shipping_address.address}
                    {'\n'}
                    {order.shipping_address.city}, {order.shipping_address.state}
                    {'\n'}
                    {order.shipping_address.country}
                    {'\n'}
                    Phone: {order.shipping_address.phone}
                  </Text>
                  {(dispatchLabel || fulfilmentLocations.length > 0) && (
                    <View style={styles.addressFoot}>
                      <View style={styles.addressFootRow}>
                        <Ionicons name="car-outline" size={16} color={colors.textMuted} />
                        <Text style={styles.addressFootText}>
                          Supplier dispatch:{' '}
                          <Text style={styles.addressFootStrong}>
                            {dispatchLabel || 'Confirmed by supplier'}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.addressFootRow}>
                        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                        <Text style={styles.addressFootText}>
                          Fulfilment source:{' '}
                          <Text style={styles.addressFootStrong}>
                            {fulfilmentLocations.join(', ') || 'Assigned during fulfilment'}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* What's next */}
            <View style={styles.block}>
              <Text style={styles.blockTitle}>What&apos;s Next?</Text>
              {NEXT_STEPS(dispatchLabel).map((step, i) => (
                <View key={step.title} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepBody}>{step.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Actions */}
            <Pressable style={styles.ordersBtn} onPress={() => router.replace('/(tabs)/orders' as any)}>
              <Ionicons name="cube-outline" size={16} color={colors.primary} />
              <Text style={styles.ordersBtnText}>View Orders</Text>
            </Pressable>
            <Pressable style={styles.shopBtn} onPress={() => router.replace('/(tabs)' as any)}>
              <Ionicons name="home-outline" size={16} color={colors.textOnPrimary} />
              <Text style={styles.shopBtnText}>Continue Shopping</Text>
            </Pressable>
          </ScreenColumn>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  homeBtn: {
    marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  homeBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCFCE7',
  },
  title: { ...typography.h2, color: colors.text, textAlign: 'center', marginTop: spacing.md },
  sub: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.lg,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  detailCell: { width: '50%', paddingVertical: spacing.xs },
  detailLabel: { ...typography.caption, color: colors.textMuted },
  detailValue: { ...typography.bodyStrong, color: colors.text, marginTop: 2 },
  capitalize: { textTransform: 'capitalize' },
  block: { marginTop: spacing.lg },
  blockTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.sm },
  addressCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md,
  },
  addressName: { ...typography.bodyStrong, color: colors.text },
  addressBody: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 18 },
  addressFoot: { marginTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm, gap: spacing.xs },
  addressFootRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressFootText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  addressFootStrong: { color: colors.text, fontWeight: '600' },
  stepRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  stepNumText: { ...typography.captionStrong, color: colors.primary },
  stepTitle: { ...typography.bodyStrong, color: colors.text },
  stepBody: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  ordersBtn: {
    marginTop: spacing['2xl'], flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  ordersBtnText: { ...typography.bodyStrong, color: colors.primary },
  shopBtn: {
    marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: spacing.md, ...shadows.card,
  },
  shopBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
