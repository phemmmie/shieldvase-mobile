import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/features/auth/AuthContext';
import { useSMEOrders, useSMEStatistics } from '@/features/sme/queries';
import {
  LinkRow,
  OrderRow,
  StatCard,
} from '@/features/sme/components';
import { EmptyState, LoadingState } from '@/components/States';
import { formatNaira } from '@/utils/money';
import { colors, spacing, typography } from '@/theme';

const DONE_STATUSES = new Set(['delivered', 'completed', 'cancelled', 'canceled']);

export default function SMEDashboard() {
  const { user, userType, loading } = useAuth();
  const ordersQuery = useSMEOrders(user?.id);
  const statsQuery = useSMEStatistics(user?.id);

  const { activeOrders, pastOrders } = useMemo(() => {
    const orders = ordersQuery.data ?? [];
    const active = orders.filter((o) => !DONE_STATUSES.has((o.status || '').toLowerCase()));
    const past = orders.filter((o) => DONE_STATUSES.has((o.status || '').toLowerCase()));
    return { activeOrders: active, pastOrders: past };
  }, [ordersQuery.data]);

  if (loading || ordersQuery.isLoading || statsQuery.isLoading) {
    return <LoadingState label="Loading dashboard…" />;
  }

  if (!user) {
    return <EmptyState title="Sign in required" hint="Sign in to view your SME dashboard." />;
  }

  if (userType !== 'sme') {
    return <EmptyState title="SME accounts only" hint="This dashboard is available to SME buyers." />;
  }

  const stats = statsQuery.data;
  const paidOrders = Math.max((stats?.total_orders ?? 0) - (stats?.pending_payment_orders ?? 0), 0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'SME Dashboard' }} />

      <View style={styles.statGrid}>
        <StatCard
          label="Confirmed Spend"
          value={formatNaira(stats?.total_confirmed_spend ?? 0)}
          icon="wallet-outline"
          tone={colors.primary}
        />
        <StatCard
          label="Paid Orders"
          value={String(paidOrders)}
          icon="checkmark-circle-outline"
          tone={colors.success}
        />
        <StatCard
          label="Credit Utilization"
          value={formatNaira(stats?.credit_utilization ?? 0)}
          icon="card-outline"
          tone={colors.warning}
        />
        <StatCard
          label="Pending Shipments"
          value={String(stats?.pending_shipments ?? 0)}
          icon="cube-outline"
          tone={colors.info}
        />
      </View>

      <View style={styles.card}>
        <LinkRow icon="document-text-outline" label="Invoices" hint="Order, price-lock and group-buy invoices" href="/sme/invoices" />
        <LinkRow icon="cube-outline" label="Shipments" hint="Track deliveries across orders" href="/sme/shipments" />
        <LinkRow icon="stats-chart-outline" label="Reports" hint="Spend overview and CSV export" href="/sme/reports" />
        <LinkRow icon="cash-outline" label="Credit Facility" href="/sme/credit" />
        <LinkRow icon="chatbox-ellipses-outline" label="Request for Quotation" href="/rfq" />
        <LinkRow icon="settings-outline" label="SME Settings" href="/sme/settings" />
        <LinkRow icon="help-circle-outline" label="Contact Support" hint="Manage your support requests" href="/sme/support" />
      </View>

      <Text style={styles.sectionTitle}>Active Orders</Text>
      {activeOrders.length === 0 ? (
        <EmptyState title="No active orders" hint="Orders in progress will appear here." />
      ) : (
        activeOrders.map((o) => <OrderRow key={o.id} order={o} />)
      )}

      <Text style={styles.sectionTitle}>Past Orders</Text>
      {pastOrders.length === 0 ? (
        <EmptyState title="No past orders" hint="Completed and cancelled orders appear here." />
      ) : (
        pastOrders.map((o) => <OrderRow key={o.id} order={o} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
});
