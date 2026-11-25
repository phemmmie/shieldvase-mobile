import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useReferralCode,
  useReferralRewards,
  useReferralVisits,
} from '@/features/rewards/queries';
import { env } from '@/config/env';
import { LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { ScreenColumn } from '@/components/Responsive';

// Mirrors web /rewards-and-benefits (views/RewardsAndBenefits.tsx): marketing
// page — hero, referral dashboard when signed in, "How It Works" 4 cards,
// "What You Get" 4 cards, VIP progress tracker, CTA.

const VIP_THRESHOLD = 20;
const REWARD_AMOUNT = 5000;

const kindLabel = (k: string) =>
  (
    {
      transaction_credit: 'Transaction credit',
      delivery_credit: 'Delivery credit',
      discount_credit: 'Discount credit',
    } as Record<string, string>
  )[k] || k;

const HOW_IT_WORKS: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { icon: 'gift-outline', title: 'Sign Up & Get Your Link', description: 'Register and receive your personal referral code to start sharing.' },
  { icon: 'share-social-outline', title: 'Share with Friends', description: 'Invite vendors, suppliers, and buyers to join ShieldVase.' },
  { icon: 'cart-outline', title: 'They Make a Transaction', description: 'Your referral must complete a successful order or sale.' },
  { icon: 'trophy-outline', title: 'You Earn Rewards!', description: `Receive ₦${REWARD_AMOUNT.toLocaleString()} for every successful referral.` },
];

const WHAT_YOU_GET: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { icon: 'cash-outline', title: 'Cash Rewards', description: `Earn up to ₦${REWARD_AMOUNT.toLocaleString()} per referral after their first transaction.` },
  { icon: 'pricetag-outline', title: 'Exclusive Discounts', description: 'Special deals on ShieldVase services just for you.' },
  { icon: 'star-outline', title: 'Free Product Listings', description: 'Get one free premium product listing for every 5 referrals.' },
  { icon: 'ribbon-outline', title: 'VIP Membership', description: `Refer ${VIP_THRESHOLD}+ businesses and become a VIP member with priority support.` },
];

const TRACK_FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { icon: 'people-outline', title: "See Who's Joined", description: 'Monitor your referral network in real-time.' },
  { icon: 'stats-chart-outline', title: 'Track Your Earnings', description: 'View your rewards and calculate future earnings.' },
  { icon: 'headset-outline', title: '24/7 Support', description: 'Get help anytime with our dedicated support team.' },
];

export default function RewardsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const codeQ = useReferralCode(session?.user.id);
  const rewardsQ = useReferralRewards(session?.user.id);
  const visitsQ = useReferralVisits(codeQ.data?.code);

  const code = codeQ.data?.code;
  const rewards = session ? (rewardsQ.data ?? []) : [];
  const link = code ? `${env.siteUrl}/?ref=${code}` : null;
  const totals = rewards.reduce<Record<string, number>>((acc, r) => {
    if (r.status !== 'cancelled') acc[r.status] = (acc[r.status] || 0) + Number(r.reward_amount);
    return acc;
  }, {});
  const successfulReferrals = rewards.length;
  const referralsToVip = Math.max(0, VIP_THRESHOLD - successfulReferrals);

  const share = async () => {
    if (!link) return;
    await Share.share({
      title: 'Shop on ShieldVase',
      message: `Shop construction materials on ShieldVase — ${link}`,
    });
  };

  const dashboard = session && (codeQ.isLoading || rewardsQ.isLoading)
    ? <LoadingState label="Loading rewards…" />
    : session && rewards.length > 0 ? (
      <View style={styles.dashCard}>
        <Text style={styles.dashTitle}>Your Rewards Dashboard</Text>
        <View style={styles.dashStats}>
          <DashStat label="Total Earned" value={formatNaira(totals.earned ?? 0)} accent />
          <DashStat label="Pending" value={formatNaira(totals.pending ?? 0)} />
          <DashStat label="Paid" value={formatNaira(totals.paid ?? 0)} />
        </View>
        {link && (
          <>
            <View style={styles.linkBox}>
              <Text style={styles.link} numberOfLines={1}>{link}</Text>
            </View>
            <Pressable style={styles.shareBtn} onPress={share}>
              <Ionicons name="share-social" size={16} color={colors.textOnPrimary} />
              <Text style={styles.shareText}>Share link</Text>
            </Pressable>
            <Text style={styles.stats}>
              Code: <Text style={styles.statStrong}>{code}</Text> · Visits:{' '}
              <Text style={styles.statStrong}>{visitsQ.data ?? 0}</Text> · Referred orders:{' '}
              <Text style={styles.statStrong}>{rewards.length}</Text>
            </Text>
          </>
        )}
        <Text style={styles.historyTitle}>Reward history</Text>
        {rewards.map(item => (
          <View key={item.id} style={styles.rewardRow}>
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
        ))}
      </View>
    ) : null;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Rewards & Benefits' }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenColumn>
          {/* Hero — web: "Earn More with ShieldVase Rewards!" */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Earn More with ShieldVase Rewards!</Text>
            <Text style={styles.heroSub}>
              Invite, Refer, and Get Rewarded for Every Successful Connection
            </Text>
          </View>

          {dashboard}

          {/* How It Works — 4 RewardCards */}
          <View style={styles.section}>
            <Text style={styles.h2}>How It Works</Text>
            <View style={styles.cardsGrid}>
              {HOW_IT_WORKS.map(c => <RewardCard key={c.title} {...c} />)}
            </View>
          </View>

          {/* What You Get — 4 RewardCards */}
          <View style={styles.section}>
            <Text style={styles.h2}>What You Get</Text>
            <View style={styles.cardsGrid}>
              {WHAT_YOU_GET.map(c => <RewardCard key={c.title} {...c} />)}
            </View>
          </View>

          {/* VIP Progress — web "Your VIP Progress" */}
          <View style={styles.vipCard}>
            <Text style={styles.vipTitle}>Your VIP Progress</Text>
            <View style={styles.vipBar}>
              <View style={[styles.vipFill, { width: `${Math.min(100, (successfulReferrals / VIP_THRESHOLD) * 100)}%` }]} />
            </View>
            <Text style={styles.vipText}>
              {successfulReferrals >= VIP_THRESHOLD
                ? 'You are a VIP member!'
                : session
                  ? `${referralsToVip} more referrals to unlock VIP status!`
                  : `${VIP_THRESHOLD} referrals to unlock VIP status!`}
            </Text>
          </View>

          {/* Track Your Rewards — 3 features */}
          <View style={styles.section}>
            <Text style={styles.h2}>Track Your Rewards</Text>
            {TRACK_FEATURES.map(f => (
              <View key={f.title} style={styles.trackRow}>
                <View style={styles.trackIcon}>
                  <Ionicons name={f.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trackTitle}>{f.title}</Text>
                  <Text style={styles.trackDesc}>{f.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA — web's bottom section when no rewards */}
          {(!session || rewards.length === 0) && (
            <View style={styles.cta}>
              <Text style={styles.ctaTitle}>Start referring today & turn your connections into rewards!</Text>
              <Pressable style={styles.ctaBtn} onPress={() => router.push(session ? '/(tabs)' : '/(auth)/login' as any)}>
                <Text style={styles.ctaBtnText}>
                  {session ? 'Activate Your Rewards' : 'Sign Up & Get Your Referral Link'}
                </Text>
              </Pressable>
            </View>
          )}
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

function RewardCard({ icon, title, description }: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }) {
  return (
    <View style={styles.rewardCard}>
      <View style={styles.rewardCardIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.rewardCardTitle}>{title}</Text>
      <Text style={styles.rewardCardDesc}>{description}</Text>
    </View>
  );
}

function DashStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.dashStat}>
      <Text style={[styles.dashStatValue, accent && { color: colors.primary }]}>{value}</Text>
      <Text style={styles.dashStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  heroTitle: { ...typography.h1, color: colors.primary, textAlign: 'center' },
  heroSub: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  section: { marginTop: spacing['2xl'] },
  h2: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rewardCard: { width: '47%', backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  rewardCardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  rewardCardTitle: { ...typography.captionStrong, color: colors.text, textAlign: 'center' },
  rewardCardDesc: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  dashCard: { backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginTop: spacing.sm },
  dashTitle: { ...typography.h3, color: colors.text },
  dashStats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  dashStat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  dashStatValue: { ...typography.bodyStrong, color: colors.text },
  dashStatLabel: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  linkBox: { marginTop: spacing.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm },
  link: { ...typography.caption, color: colors.text },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, height: 44, marginTop: spacing.sm },
  shareText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  stats: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  statStrong: { color: colors.text, fontFamily: 'Inter_700Bold' },
  historyTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xs },
  rewardRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rewardLabel: { ...typography.caption, color: colors.text },
  rewardDate: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  rewardAmount: { ...typography.bodyStrong, color: colors.text },
  rewardStatus: { ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' },
  vipCard: { marginTop: spacing['2xl'], backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  vipTitle: { ...typography.h3, color: colors.text },
  vipBar: { width: '100%', height: 10, borderRadius: 5, backgroundColor: colors.border, marginTop: spacing.md, overflow: 'hidden' },
  vipFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
  vipText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  trackRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md, alignItems: 'flex-start' },
  trackIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  trackTitle: { ...typography.bodyStrong, color: colors.text },
  trackDesc: { ...typography.caption, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  cta: { marginTop: spacing['2xl'], backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  ctaTitle: { ...typography.h3, color: colors.textOnPrimary, textAlign: 'center' },
  ctaBtn: { marginTop: spacing.lg, backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  ctaBtnText: { ...typography.bodyStrong, color: colors.primary },
});
