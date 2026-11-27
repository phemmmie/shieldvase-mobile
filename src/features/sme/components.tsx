import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import type { SMEOrder } from './api';

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_TONES: Record<string, string> = {
  delivered: colors.success,
  completed: colors.success,
  paid: colors.success,
  shipped: colors.info,
  in_transit: colors.info,
  processing: colors.secondary,
  confirmed: colors.secondary,
  pending: colors.warning,
  awaiting_payment: colors.warning,
  cancelled: colors.destructive,
  canceled: colors.destructive,
  failed: colors.destructive,
};

export function statusColor(status: string | null | undefined): string {
  return STATUS_TONES[(status || '').toLowerCase()] ?? colors.textMuted;
}

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const tone = statusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor: tone + '1A', borderColor: tone + '55' }]}>
      <Text style={[styles.badgeText, { color: tone }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = colors.primary,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tone + '1A' }]}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function OrderRow({ order }: { order: SMEOrder }) {
  return (
    <Pressable style={styles.orderRow} onPress={() => router.push(`/order/${order.id}`)}>
      <View style={styles.orderRowTop}>
        <Text style={styles.orderNumber} numberOfLines={1}>
          {order.order_number}
        </Text>
        <StatusBadge status={order.status} />
      </View>
      <Text style={styles.orderProduct} numberOfLines={1}>
        {order.product_name || 'Order'}
      </Text>
      <View style={styles.orderRowBottom}>
        <Text style={styles.orderMeta}>{formatDate(order.order_date || order.created_at)}</Text>
        <Text style={styles.orderAmount}>{formatNaira(order.total_amount)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
      </View>
    </Pressable>
  );
}

export function LinkRow({
  icon,
  label,
  hint,
  href,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  href: string;
}) {
  return (
    <Pressable style={styles.linkRow} onPress={() => router.push(href as never)}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.linkBody}>
        <Text style={styles.linkLabel}>{label}</Text>
        {hint ? <Text style={styles.linkHint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { ...typography.micro, fontWeight: '600' },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minWidth: '45%',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { ...typography.h3, color: colors.text },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  orderRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  orderRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { ...typography.bodyStrong, color: colors.text, flex: 1, marginRight: spacing.sm },
  orderProduct: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  orderRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  orderMeta: { ...typography.caption, color: colors.textFaint, flex: 1 },
  orderAmount: { ...typography.bodyStrong, color: colors.text },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linkBody: { flex: 1 },
  linkLabel: { ...typography.bodyStrong, color: colors.text },
  linkHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
