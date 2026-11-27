import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useSMEStatistics } from '@/features/sme/queries';
import { EmptyState, LoadingState } from '@/components/States';
import { formatNaira } from '@/utils/money';
import { colors, radius, spacing, typography } from '@/theme';

export default function SMECreditFacility() {
  const { user, loading } = useAuth();
  const statsQuery = useSMEStatistics(user?.id);

  if (loading) return <LoadingState label="Loading credit facility…" />;
  if (!user) {
    return <EmptyState title="Sign in required" hint="Sign in to view credit facility details." />;
  }

  const stats = statsQuery.data;
  const available = stats?.credit_available ?? 0;
  const used = stats?.credit_utilization ?? 0;
  const total = available + used;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Credit Facility' }} />

      <View style={styles.heroCard}>
        <View style={styles.iconWrap}>
          <Ionicons name="cash-outline" size={32} color={colors.primary} />
        </View>
        <Text style={styles.title}>SME Credit Facility</Text>
        <Text style={styles.subtitle}>
          Buy now, pay later. Credit purchasing for verified SME buyers is coming soon.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
      </View>

      {total > 0 ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Credit limit</Text>
            <Text style={styles.summaryValue}>{formatNaira(total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>In use</Text>
            <Text style={styles.summaryValue}>{formatNaira(used)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Available</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatNaira(available)}
            </Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.note}>
        Credit terms, repayment schedules, and eligibility checks will appear here when the
        facility launches.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  badge: {
    marginTop: spacing.md,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { ...typography.caption, color: colors.warning, fontWeight: '600' },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: { ...typography.body, color: colors.textMuted },
  summaryValue: { ...typography.bodyStrong, color: colors.text },
  note: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
