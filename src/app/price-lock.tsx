import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

// Mirrors web /price-lock (app/(marketing)/price-lock/page.tsx): cream page,
// Home breadcrumb, icon + title, intro, Browse CTA → deals hub (lock
// segment), 3 step cards, verified-vendor trust note, FAQ list.

const AFRICAN_RED = '#E42D40';
const CREAM = '#FDF5E6';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  {
    icon: 'lock-closed-outline',
    title: 'Find a Price Lock deal',
    description: 'Browse active Price Lock deals from verified vendors for the materials you need.',
  },
  {
    icon: 'wallet-outline',
    title: 'Pay a deposit to lock the price',
    description: "Pay a deposit — as low as 25%, depending on the deal's payment plan — to lock that vendor's price for the deal's lock period.",
  },
  {
    icon: 'cube-outline',
    title: 'Pay the balance before it expires',
    description: 'Complete the remaining balance before the lock period ends to receive your order at the price you locked in — not whatever the price has moved to by then.',
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is ShieldVase Price Lock?',
    a: "Price Lock lets you secure a verified vendor's current price on a material by paying a deposit up front. The price is held for that deal's lock period even if the vendor's price changes before you complete the purchase.",
  },
  {
    q: 'How much deposit do I need to pay?',
    a: "It depends on the deal's payment plan — some deals require as little as 25% or 30% upfront, others require the full amount. The deposit percentage and lock period are shown on each deal before you join.",
  },
  {
    q: 'What happens if I don’t pay the balance in time?',
    a: 'Stock is only reserved once your deposit clears, and the locked price is only guaranteed through the deal’s lock period. Pay the balance before it ends to complete your order at the locked price.',
  },
  {
    q: 'Is Price Lock available for all products?',
    a: 'Price Lock is available on deals that verified vendors choose to run — not every product has an active Price Lock deal at all times. Check the Price Lock deals list for what’s currently available.',
  },
];

export default function PriceLockScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Price Lock' }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenColumn pad={false}>
          <View style={styles.breadcrumb}>
            <Pressable onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </Pressable>
            <Text style={styles.breadcrumbSep}> / Price Lock</Text>
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="lock-closed-outline" size={20} color={AFRICAN_RED} />
            </View>
            <Text style={styles.title}>ShieldVase Price Lock</Text>
          </View>
          <Text style={styles.intro}>
            Material prices in Nigeria move fast. Price Lock lets you secure a verified
            vendor&apos;s current price with a deposit, so the rest of your budget stays
            predictable — even if the market price changes before your order is complete.
          </Text>

          <Pressable
            style={styles.cta}
            onPress={() => router.push({ pathname: '/deals', params: { segment: 'lock' } } as any)}
          >
            <Text style={styles.ctaText}>Browse Price Lock Deals</Text>
          </Pressable>

          <Text style={styles.sectionTitle}>How Price Lock works</Text>
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
              Every Price Lock deal is run by a verified ShieldVase vendor, and stock is only
              reserved once your deposit clears — so a locked price is never a guess.
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
