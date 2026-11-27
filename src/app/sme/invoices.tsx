import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useAuth } from '@/features/auth/AuthContext';
import { useSMEInvoices } from '@/features/sme/queries';
import type { InvoiceRecord } from '@/features/sme/api';
import { StatusBadge, formatDate, statusLabel } from '@/features/sme/components';
import { EmptyState, LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'order', label: 'Orders' },
  { key: 'price_lock', label: 'Price Lock' },
  { key: 'group_buy', label: 'Group Buy' },
] as const;

const STATUS_FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'awaiting_payment', label: 'Awaiting payment' },
  { key: 'failed', label: 'Failed' },
] as const;

const TYPE_LABELS: Record<InvoiceRecord['type'], string> = {
  order: 'Order',
  price_lock: 'Price Lock',
  group_buy: 'Group Buy',
};

export default function SMEInvoicesScreen() {
  const { user, userType, loading: authLoading } = useAuth();
  const invoices = useSMEInvoices(user?.id);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]['key']>('all');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]['key']>('all');
  const [selected, setSelected] = useState<InvoiceRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (invoices.data ?? []).filter((inv) => {
      if (typeFilter !== 'all' && inv.type !== typeFilter) return false;
      if (statusFilter !== 'all' && inv.paymentStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.productName.toLowerCase().includes(q)
      );
    });
  }, [invoices.data, query, typeFilter, statusFilter]);

  if (authLoading || invoices.isLoading) {
    return <LoadingState label="Loading invoices…" />;
  }
  if (!user) {
    return <EmptyState title="Sign in required" hint="Sign in to view your invoices." />;
  }
  if (userType !== 'sme') {
    return <EmptyState title="SME accounts only" hint="Invoices are available to SME buyers." />;
  }
  if (invoices.isError) {
    return <EmptyState title="Couldn't load invoices" hint="Pull to retry later." />;
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Invoices' }} />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textFaint} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoice or product"
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textFaint} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {TYPE_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.chip, typeFilter === f.key && styles.chipActive]}
            onPress={() => setTypeFilter(f.key)}
          >
            <Text style={[styles.chipText, typeFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
        <View style={styles.chipDivider} />
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.chip, statusFilter === f.key && styles.chipActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.chipText, statusFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No invoices found"
            hint={
              query || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Invoices for orders, price locks and group buys will appear here.'
            }
          />
        ) : (
          filtered.map((inv) => (
            <Pressable key={inv.id} style={styles.card} onPress={() => setSelected(inv)}>
              <View style={styles.cardTop}>
                <Text style={styles.invoiceNumber} numberOfLines={1}>
                  {inv.invoiceNumber}
                </Text>
                <StatusBadge status={inv.paymentStatus} />
              </View>
              <Text style={styles.cardProduct} numberOfLines={1}>
                {inv.productName}
              </Text>
              <View style={styles.cardBottom}>
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{TYPE_LABELS[inv.type]}</Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(inv.date)}</Text>
                <Text style={styles.cardAmount}>{formatNaira(inv.amount)}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selected ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.modalTitle}>{selected.invoiceNumber}</Text>
                    <Text style={styles.modalSubtitle}>
                      {TYPE_LABELS[selected.type]} · {formatDate(selected.date)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <Ionicons name="close" size={22} color={colors.textMuted} />
                  </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.modalBody}>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <StatusBadge status={selected.paymentStatus} />
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Payment method</Text>
                    <Text style={styles.modalValue}>{statusLabel(selected.paymentMethod)}</Text>
                  </View>

                  <Text style={styles.sectionTitle}>Items</Text>
                  {selected.items.map((item, i) => (
                    <View key={`${item.name}-${i}`} style={styles.itemRow}>
                      <View style={styles.itemText}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {item.quantity} × {formatNaira(item.unitPrice)}
                        </Text>
                      </View>
                      <Text style={styles.itemTotal}>{formatNaira(item.total)}</Text>
                    </View>
                  ))}

                  <Text style={styles.sectionTitle}>Breakdown</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Subtotal</Text>
                    <Text style={styles.modalValue}>{formatNaira(selected.breakdown.subtotal)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Delivery</Text>
                    <Text style={styles.modalValue}>{formatNaira(selected.breakdown.delivery)}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>
                      VAT{selected.breakdown.vatRate ? ` (${selected.breakdown.vatRate}%)` : ''}
                    </Text>
                    <Text style={styles.modalValue}>{formatNaira(selected.breakdown.vat)}</Text>
                  </View>
                  {selected.breakdown.adminFee != null && selected.breakdown.adminFee > 0 ? (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>
                        Admin fee
                        {selected.breakdown.adminFeeRate
                          ? ` (${selected.breakdown.adminFeeRate}%)`
                          : ''}
                      </Text>
                      <Text style={styles.modalValue}>
                        {formatNaira(selected.breakdown.adminFee)}
                      </Text>
                    </View>
                  ) : null}
                  {selected.breakdown.discount != null && selected.breakdown.discount > 0 ? (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Discount</Text>
                      <Text style={[styles.modalValue, { color: colors.success }]}>
                        −{formatNaira(selected.breakdown.discount)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={[styles.modalRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatNaira(selected.amount)}</Text>
                  </View>

                  {selected.priceLock ? (
                    <>
                      <Text style={styles.sectionTitle}>Price-lock schedule</Text>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>
                          Deposit
                          {selected.priceLock.depositPercentage != null
                            ? ` (${selected.priceLock.depositPercentage}%)`
                            : ''}
                        </Text>
                        <View style={styles.scheduleValue}>
                          <Text style={styles.modalValue}>
                            {formatNaira(selected.priceLock.depositAmount)}
                          </Text>
                          <Text style={styles.scheduleDate}>
                            {selected.priceLock.depositPaidAt
                              ? `Paid ${formatDate(selected.priceLock.depositPaidAt)}`
                              : 'Unpaid'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Balance</Text>
                        <View style={styles.scheduleValue}>
                          <Text style={styles.modalValue}>
                            {formatNaira(selected.priceLock.balanceDue)}
                          </Text>
                          <Text style={styles.scheduleDate}>
                            {selected.priceLock.balancePaidAt
                              ? `Paid ${formatDate(selected.priceLock.balancePaidAt)}`
                              : 'Unpaid'}
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : null}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceAlt },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text, paddingVertical: spacing.sm },
  chips: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textMuted },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  chipDivider: { width: 1, height: 20, backgroundColor: colors.borderStrong },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceNumber: { ...typography.bodyStrong, color: colors.text, flex: 1, marginRight: spacing.sm },
  cardProduct: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  typePill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typePillText: { ...typography.micro, color: colors.textMuted, fontWeight: '600' },
  cardDate: { ...typography.caption, color: colors.textFaint, flex: 1 },
  cardAmount: { ...typography.bodyStrong, color: colors.text },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalHeaderText: { flex: 1 },
  modalTitle: { ...typography.h3, color: colors.text },
  modalSubtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  modalBody: { padding: spacing.lg, paddingBottom: spacing.xl },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  modalLabel: { ...typography.body, color: colors.textMuted },
  modalValue: { ...typography.bodyStrong, color: colors.text, textAlign: 'right' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  itemText: { flex: 1 },
  itemName: { ...typography.body, color: colors.text },
  itemMeta: { ...typography.caption, color: colors.textFaint, marginTop: 2 },
  itemTotal: { ...typography.bodyStrong, color: colors.text },
  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  totalLabel: { ...typography.bodyStrong, color: colors.text },
  totalValue: { ...typography.h3, color: colors.primary },
  scheduleValue: { alignItems: 'flex-end' },
  scheduleDate: { ...typography.micro, color: colors.textFaint, marginTop: 2 },
});
