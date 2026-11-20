import { FlatList, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useReferralCode,
  useReferralRewards,
  useReferralVisits,
} from '@/features/rewards/queries';
import { env } from '@/config/env';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { ScreenColumn } from '@/components/Responsive';

const kindLabel = (k: string) =>
  (
    {
      transaction_credit: 'Transaction credit',
      delivery_credit: 'Delivery credit',
      discount_credit: 'Discount credit',
    } as Record<string, string>
  )[k] || k;

export default function RewardsScreen() {
  const { session } = useAuth();
  const codeQ = useReferralCode(session?.user.id);
  const rewardsQ = useReferralRewards(session?.user.id);
  const visitsQ = useReferralVisits(codeQ.data?.code);

  if (!session) return <EmptyState title="Sign in to see rewards" />;
  if (codeQ.isLoading || rewardsQ.isLoading) return <LoadingState label="Loading rewards…" />;
  if (codeQ.isError || rewardsQ.isError)
    return <ErrorState onRetry={() => { codeQ.refetch(); rewardsQ.refetch(); }} />;

  const code = codeQ.data?.code;
  const rewards = rewardsQ.data ?? [];
  const link = code ? `${env.siteUrl}/?ref=${code}` : null;
  const totals = rewards.reduce<Record<string, number>>((acc, r) => {
    if (r.status !== 'cancelled') acc[r.status] = (acc[r.status] || 0) + Number(r.reward_amount);
    return acc;
  }, {});

  const share = async () => {
    if (!link) return;
    await Share.share({
      title: 'Shop on ShieldVase',
      message: `Shop construction materials on ShieldVase — ${link}`,
    });
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Refer & Earn' }} />
              <ScreenColumn pad={false} style={{ flex: 1 }}>
                <FlatList
          data={rewards}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Ionicons name="gift" size={18} color={colors.primary} />
                  <Text style={styles.cardTitle}>Your referral link</Text>
                </View>
                <Text style={styles.hint}>
                  Invite contractors, engineers and friends — you earn credits when they complete a
                  qualifying order.
                </Text>
                {link ? (
                  <>
                    <View style={styles.linkBox}>
                      <Text style={styles.link} numberOfLines={1}>
                        {link}
                      </Text>
                    </View>
                    <Pressable style={styles.shareBtn} onPress={share}>
                      <Ionicons name="share-social" size={16} color="#fff" />
                      <Text style={styles.shareText}>Share link</Text>
                    </Pressable>
                    <Text style={styles.stats}>
                      Code: <Text style={styles.statStrong}>{code}</Text> · Visits:{' '}
                      <Text style={styles.statStrong}>{visitsQ.data ?? 0}</Text> · Referred orders:{' '}
                      <Text style={styles.statStrong}>{rewards.length}</Text>
                    </Text>
                  </>
                ) : (
                  <Text style={styles.hint}>No referral code yet — one will appear here soon.</Text>
                )}
              </View>
              <View style={styles.totals}>
                <Total label="Earned" value={totals.earned ?? 0} />
                <Total label="Pending" value={totals.pending ?? 0} />
                <Total label="Paid" value={totals.paid ?? 0} />
              </View>
              <Text style={styles.sectionTitle}>Reward history</Text>
            </>
          }
          ListEmptyComponent={
            <Text style={styles.emptyLine}>No rewards yet — share your link to start earning.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.rewardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardLabel}>
                  {kindLabel(item.reward_kind)} · order {formatNaira(item.order_amount)}
                </Text>
                <Text style={styles.rewardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rewardAmount}>{formatNaira(item.reward_amount)}</Text>
                <Text style={[styles.rewardStatus, item.status === 'paid' && { color: colors.secondary }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          )}
        />
              </ScreenColumn>
    </View>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.totalBox}>
      <Text style={styles.totalValue}>{formatNaira(value)}</Text>
      <Text style={styles.totalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted, lineHeight: 18 },
  linkBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  link: { ...typography.caption, color: colors.text },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 44,
  },
  shareText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  stats: { ...typography.caption, color: colors.textMuted },
  statStrong: { color: colors.text, fontFamily: 'Inter_700Bold' },
  totals: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  totalBox: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    alignItems: 'center',
  },
  totalValue: { ...typography.bodyStrong, color: colors.primary },
  totalLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing['2xl'], marginBottom: spacing.sm },
  emptyLine: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  rewardRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rewardLabel: { ...typography.body, color: colors.text },
  rewardDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  rewardAmount: { ...typography.bodyStrong, color: colors.text },
  rewardStatus: { ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' },
});
