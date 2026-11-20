import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
  pending: colors.warning,
  failed: colors.destructive,
  cancelled: colors.textMuted,
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const orders = useOrders(user?.id);

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
            <FlatList
        data={orders.data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshing={orders.isRefetching}
        onRefresh={() => orders.refetch()}
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
                      (STATUS_COLORS[o.payment_status] ?? colors.textMuted) + '1A',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: STATUS_COLORS[o.payment_status] ?? colors.textMuted },
                  ]}
                >
                  {o.payment_status}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.meta}>
                {new Date(o.created_at).toLocaleDateString()} · {o.status}
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
  list: { padding: spacing.lg },
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
