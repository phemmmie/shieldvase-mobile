import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

// Mirrors web /group-buy (app/(marketing)/group-buy/page.tsx): cream page,
// Home breadcrumb, icon + title, intro, Browse CTA → deals hub, 3 step
// cards, verified-vendor trust note, FAQ list.

const AFRICAN_RED = '#E42D40';
const CREAM = '#FDF5E6';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  {
    icon: 'people-outline',
    title: 'Join a Group Buy deal',
    description: 'Find an active Group Buy deal for the material and quantity you need from a verified vendor.',
  },
  {
    icon: 'locate-outline',
    title: 'Buyers pool orders toward a target',
    description: "Your order adds to the deal's running total. Progress toward the vendor's volume target is visible on the deal.",
  },
  {
    icon: 'pricetags-outline',
    title: 'Everyone gets the group price',
    description: "Once the target quantity is reached, every buyer in that deal receives the deal's discounted group price — not the standard listing price.",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is ShieldVase Group Buy?',
    a: "Group Buy lets multiple buyers combine their order quantities toward one vendor's volume target on a specific deal. Reaching that target unlocks a discounted group price for everyone who joined.",
  },
  {
    q: "What if the target quantity isn't reached?",
    a: "Each Group Buy deal runs until its end date. Check the deal's current progress toward its target and minimum participant count before joining.",
  },
  {
    q: 'How is the group price set?',
    a: "The group price is fixed by the vendor when the deal is created and shown upfront on the deal — it's the price you pay once the deal completes, not a price that keeps changing.",
  },
  {
    q: 'Can I buy in bulk without waiting for a Group Buy deal?',
    a: 'Yes — regular bulk orders and RFQs are available outside of Group Buy deals. Group Buy specifically unlocks deeper, vendor-set volume discounts once enough buyers join together.',
  },
];

export default function GroupBuyScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Group Buy' }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenColumn pad={false}>
          <View style={styles.breadcrumb}>
            <Pressable onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </Pressable>
            <Text style={styles.breadcrumbSep}> / Group Buy</Text>
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="people-outline" size={20} color={AFRICAN_RED} />
            </View>
            <Text style={styles.title}>ShieldVase Group Buy</Text>
          </View>
          <Text style={styles.intro}>
            Bulk-buying power without needing to place the whole bulk order yourself. Group Buy
            pools your order with other buyers on the same deal — reach the vendor&apos;s volume
            target together, and everyone gets the discounted group price.
          </Text>

          <Pressable
            style={styles.cta}
            onPress={() => router.push({ pathname: '/deals', params: { segment: 'group' } } as any)}
          >
            <Text style={styles.ctaText}>Browse Group Buy Deals</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>How Group Buy works</Text>
          {STEPS.map((step, i) => (
            <View key={step.title} style={styles.stepCard}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <View style={styles.stepHeader}>
                <Ionicons name={step.icon} size={15} color={AFRICAN_RED} />
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              <Text style={styles.stepDesc}>{step.description}</Text>
            </View>
          ))}

          <View style={styles.trustCard}>
            <Ionicons name="shield-checkmark-outline" size={22} color={AFRICAN_RED} style={{ marginTop: 2 }} />
            <Text style={styles.trustText}>
              Every Group Buy deal is run by a verified ShieldVase vendor with a fixed group price
              set upfront — no bidding, no surprise pricing once the target is reached.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQS.map(f => (
            <View key={f.q} style={styles.faqItem}>
              <Text style={styles.faqQ}>{f.q}</Text>
              <Text style={styles.faqA}>{f.a}</Text>
            </View>
          ))}
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  breadcrumbLink: { ...typography.caption, color: colors.textMuted },
  breadcrumbSep: { ...typography.caption, color: colors.textMuted },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: {
    width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(228,45,64,0.1)',
  },
  title: { ...typography.h2, color: colors.text, flex: 1 },
  intro: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  cta: {
    alignSelf: 'flex-start', marginTop: spacing.lg, marginBottom: spacing.xl,
    backgroundColor: AFRICAN_RED, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, ...shadows.card,
  },
  ctaText: { ...typography.bodyStrong, color: '#fff' },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  stepCard: {
    backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.sm, ...shadows.card,
  },
  stepNum: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(228,45,64,0.1)', marginBottom: spacing.sm,
  },
  stepNumText: { ...typography.bodyStrong, color: AFRICAN_RED },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xs },
  stepTitle: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  stepDesc: { ...typography.caption, color: colors.textMuted },
  trustCard: {
    flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start',
    backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg,
    marginTop: spacing.lg, ...shadows.card,
  },
  trustText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  faqItem: { borderBottomWidth: 1, borderColor: colors.border, paddingBottom: spacing.md, marginBottom: spacing.md },
  faqQ: { ...typography.bodyStrong, color: colors.text },
  faqA: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
