import { Stack, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useSMEOrders, useSMEStatistics } from '@/features/sme/queries';
import { StatCard, OrderRow } from '@/features/sme/components';
import { Button } from '@/components/Button';
import { EmptyState, LoadingState } from '@/components/States';
import { useToast } from '@/components/Toast';
import { formatNaira } from '@/utils/money';
import { colors, radius, spacing, typography } from '@/theme';

function toCsvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function SMEReportsScreen() {
  const { user, userType, loading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useSMEStatistics(user?.id);
  const { data: orders, isLoading: ordersLoading } = useSMEOrders(user?.id);
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const loading = authLoading || statsLoading || ordersLoading;

  if (loading) return <LoadingState label="Loading reports..." />;
  if (!user) return <EmptyState title="Sign in required" hint="Sign in to view your reports." />;
  if (userType !== 'sme') {
    return <EmptyState title="SME accounts only" hint="Switch to an SME account to view reports." />;
  }

  const all = orders ?? [];
  const recent = all.slice(0, 10);

  const exportCsv = async () => {
    if (all.length === 0) {
      toast.show('error', 'No orders to export');
      return;
    }
    setExporting(true);
    try {
      const header = 'Order Number,Product,Vendor,Status,Payment Status,Shipping Status,Order Date,Quantity,Total,Currency';
      const lines = all.map((o) =>
        [
          o.order_number,
          o.product_name,
          o.vendor_name,
          o.status,
          o.payment_status,
          o.shipping_status,
          o.order_date,
          o.total_quantity,
          o.total_amount,
          'NGN',
        ]
          .map(toCsvCell)
          .join(','),
      );
      const file = new File(Paths.cache, `sme-report-${Date.now()}.csv`);
      if (file.exists) file.delete();
      file.write([header, ...lines].join('\n'));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export order report' });
      } else {
        toast.show('success', `Report saved: ${file.uri}`);
      }
    } catch (err) {
      toast.show('error', err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Reports' }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.statGrid}>
          <StatCard label="Total Orders" value={String(stats?.total_orders ?? 0)} icon="receipt-outline" />
          <StatCard label="Total Spend" value={formatNaira(stats?.total_spend ?? 0)} icon="wallet-outline" />
          <StatCard
            label="Pending Shipments"
            value={String(stats?.pending_shipments ?? 0)}
            icon="cube-outline"
          />
          <StatCard
            label="Delivered Orders"
            value={String(stats?.delivered_orders ?? 0)}
            icon="checkmark-done-outline"
          />
        </View>

        <Button title="Export orders as CSV" onPress={exportCsv} variant="secondary" loading={exporting} />

        <Text style={styles.sectionTitle}>Recent orders</Text>
        {recent.length === 0 ? (
          <EmptyState title="No orders yet" hint="Your order history will appear here." />
        ) : (
          <View style={styles.card}>
            {recent.map((order) => (
              <Pressable
                key={order.id}
                onPress={() => router.push(`/order/${order.id}`)}
                style={({ pressed }) => pressed && styles.rowPressed}
              >
                <OrderRow order={order} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'], gap: spacing.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.primarySoft },
});
