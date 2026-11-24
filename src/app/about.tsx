import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

// Mirrors web /about (views/About.tsx → sections/about/*): dark navy hero
// with badge + tagline + CTAs + 3 trust cards, Mission/Vision cards,
// Core Values grid, Our Story w/ stats, Expertise chips, gradient CTA.

const ABOUT_IMAGE = 'https://shieldvase.io/images/about-us-page.jpg';

const TRUST_CARDS: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { icon: 'shield-checkmark-outline', title: 'Verified supply network', sub: 'Vendors and buyers in one trusted marketplace.' },
  { icon: 'globe-outline', title: 'Built for African trade', sub: 'Local sourcing workflows, procurement-ready.' },
  { icon: 'checkmark-circle-outline', title: 'Transparent purchasing', sub: 'Clearer pricing, quotes, and order coordination.' },
];

const CORE_VALUES: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { icon: 'scale-outline', title: 'Transparency', description: 'Ensuring fair and open transactions across our marketplace.' },
  { icon: 'git-network-outline', title: 'Innovation', description: 'Leveraging AI and ML to provide real-time market insights.' },
  { icon: 'leaf-outline', title: 'Sustainability', description: 'Promoting environmentally friendly trading practices.' },
  { icon: 'trophy-outline', title: 'Empowerment', description: 'Enabling businesses of all sizes to thrive in the market.' },
];

const EXPERTISE: { title: string; description: string; tags: string[] }[] = [
  { title: 'Software Engineering', description: 'Marketplace systems, web applications, backend services, and performance optimisation.', tags: ['Web Applications', 'Backend Services', 'Scalable Platforms', 'REST API Integrations'] },
  { title: 'AI & Data', description: 'AI-powered applications, data engineering, machine learning, and LLM-driven workflows.', tags: ['Data Engineering', 'Machine Learning', 'AI-Driven Automation'] },
  { title: 'Finance & Controls', description: 'Financial reporting, budgeting, financial controls, and business financial management.', tags: ['Financial Reporting', 'Financial Controls', 'Business Financial Management'] },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'About Us' }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero — web About HeroSection: #111827 bg, badge, tagline, CTAs, trust cards */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.accent} />
            <Text style={styles.heroBadgeText}>About ShieldVase Marketplace</Text>
          </View>
          <Text style={styles.heroTitle}>Connecting Africa&apos;s industrial supply chain</Text>
          <Text style={styles.heroSub}>
            ShieldVase helps SMEs, contractors, and procurement teams source raw materials from
            verified vendors with more transparency, better coordination, and less friction.
          </Text>
          <View style={styles.heroCtas}>
            <Pressable style={styles.heroCtaPrimary} onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.heroCtaPrimaryText}>Join the Marketplace</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
            </Pressable>
            <Pressable style={styles.heroCtaSecondary} onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.heroCtaSecondaryText}>Explore Marketplace</Text>
            </Pressable>
          </View>
          {TRUST_CARDS.map(c => (
            <View key={c.title} style={styles.trustCard}>
              <Ionicons name={c.icon} size={18} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trustTitle}>{c.title}</Text>
                <Text style={styles.trustSub}>{c.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        <ScreenColumn pad={false}>
          <View style={styles.section}>
            {/* Mission & Vision — web MissionVisionSection */}
            <Text style={styles.kicker}>What we do</Text>
            <Text style={styles.sectionTitle}>Simplifying procurement for African businesses</Text>
            <View style={[styles.mvCard, { borderTopColor: colors.primary }]}>
              <View style={styles.mvHeader}>
                <View style={[styles.mvIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="rocket-outline" size={22} color={colors.primary} />
                </View>
                <Text style={styles.mvTitle}>Our Mission</Text>
              </View>
              <Text style={styles.mvText}>
                To make raw material sourcing simpler, more transparent, and more reliable for
                businesses across Africa by combining marketplace access with practical procurement
                support.
              </Text>
            </View>
            <View style={[styles.mvCard, { borderTopColor: colors.secondary }]}>
              <View style={styles.mvHeader}>
                <View style={[styles.mvIcon, { backgroundColor: colors.secondarySoft }]}>
                  <Ionicons name="globe-outline" size={22} color={colors.secondary} />
                </View>
                <Text style={styles.mvTitle}>Our Vision</Text>
              </View>
              <Text style={styles.mvText}>
                To become the trusted digital backbone for Africa&apos;s industrial trade —
                connecting verified supply, real demand, and smarter purchasing decisions in one
                ecosystem.
              </Text>
            </View>
          </View>

          {/* Core Values — web CoreValuesSection */}
          <View style={styles.section}>
            <Text style={styles.kicker}>Our Core Values</Text>
            <Text style={styles.sectionTitle}>Built on principles that drive African industrial growth</Text>
            <View style={styles.valuesGrid}>
              {CORE_VALUES.map(v => (
                <View key={v.title} style={styles.valueCard}>
                  <Ionicons name={v.icon} size={24} color={colors.primary} />
                  <Text style={styles.valueTitle}>{v.title}</Text>
                  <Text style={styles.valueDesc}>{v.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Our Story — web OurStorySection */}
          <View style={styles.section}>
            <Image source={{ uri: ABOUT_IMAGE }} style={styles.storyImage} contentFit="cover" />
            <Text style={styles.kicker}>Our Story</Text>
            <Text style={styles.sectionTitle}>Founded to make industrial sourcing simpler across Africa</Text>
            <Text style={styles.mvText}>
              Founded in 2024, ShieldVase was created to close the gap between reliable suppliers and
              the businesses that need raw materials to build, manufacture, and grow. We bring
              marketplace transparency, procurement support, and verified vendor access into one
              practical platform.
            </Text>
            <View style={styles.storyStats}>
              <View style={styles.storyStat}>
                <Text style={styles.storyStatLabel}>Year founded</Text>
                <Text style={styles.storyStatValue}>2024</Text>
              </View>
              <View style={styles.storyStat}>
                <Text style={styles.storyStatLabel}>Marketplace focus</Text>
                <Text style={styles.storyStatValueSmall}>SMEs, contractors &amp; vendors</Text>
              </View>
            </View>
          </View>

          {/* Expertise — web ExpertiseSection */}
          <View style={styles.section}>
            <Text style={styles.kicker}>One platform</Text>
            <Text style={styles.sectionTitle}>Engineering, data and finance under one roof</Text>
            {EXPERTISE.map(e => (
              <View key={e.title} style={styles.expCard}>
                <Text style={styles.expTitle}>{e.title}</Text>
                <Text style={styles.expDesc}>{e.description}</Text>
                <View style={styles.expTags}>
                  {e.tags.map(tag => (
                    <View key={tag} style={styles.expTag}>
                      <Text style={styles.expTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* CTA — web CTASection gradient → primary */}
          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>Ready to Transform Your Procurement Process?</Text>
            <Text style={styles.ctaSub}>
              Join SMEs, contractors and vendors already sourcing smarter on ShieldVase.
            </Text>
            <Pressable style={styles.ctaBtn} onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.ctaBtnText}>Join the Marketplace</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.navy} />
            </Pressable>
          </View>
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: '#111827', padding: spacing.xl, paddingTop: spacing['2xl'], paddingBottom: spacing['2xl'] },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  heroBadgeText: { ...typography.captionStrong, color: 'rgba(255,255,255,0.9)' },
  heroTitle: { ...typography.display, color: '#fff', marginTop: spacing.lg },
  heroSub: { ...typography.body, color: 'rgba(255,255,255,0.85)', marginTop: spacing.md },
  heroCtas: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  heroCtaPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  heroCtaPrimaryText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  heroCtaSecondary: {
    borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroCtaSecondaryText: { ...typography.bodyStrong, color: '#fff' },
  trustCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.sm,
    borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)', padding: spacing.md,
  },
  trustTitle: { ...typography.captionStrong, color: '#fff' },
  trustSub: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  section: { paddingHorizontal: spacing.xl, paddingTop: spacing['2xl'] },
  kicker: { ...typography.micro, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.6 },
  sectionTitle: { ...typography.h2, color: colors.text, marginTop: spacing.xs },
  mvCard: {
    marginTop: spacing.md, backgroundColor: colors.surfaceRaised, borderRadius: radius.xl,
    padding: spacing.lg, borderTopWidth: 4, borderWidth: 1, borderColor: colors.border,
    ...shadows.card,
  },
  mvHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mvIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  mvTitle: { ...typography.h3, color: colors.text },
  mvText: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  valuesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  valueCard: {
    width: '47%', backgroundColor: colors.surfaceRaised, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  valueTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.sm },
  valueDesc: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  storyImage: { height: 180, borderRadius: radius.lg, marginBottom: spacing.lg, backgroundColor: colors.border },
  storyStats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  storyStat: {
    flex: 1, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  storyStatLabel: { ...typography.micro, color: colors.textMuted },
  storyStatValue: { ...typography.h2, color: colors.text, marginTop: 2 },
  storyStatValueSmall: { ...typography.bodyStrong, color: colors.text, marginTop: 2 },
  expCard: {
    marginTop: spacing.sm, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  expTitle: { ...typography.bodyStrong, color: colors.text },
  expDesc: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  expTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  expTag: { backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  expTagText: { ...typography.micro, color: colors.textMuted },
  cta: {
    margin: spacing.xl, marginTop: spacing['2xl'], borderRadius: radius.xl,
    backgroundColor: colors.primary, padding: spacing.xl, alignItems: 'center',
  },
  ctaTitle: { ...typography.h3, color: colors.textOnPrimary, textAlign: 'center' },
  ctaSub: { ...typography.body, color: 'rgba(255,255,255,0.9)', marginTop: spacing.sm, textAlign: 'center' },
  ctaBtn: {
    marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: '#fff', borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  ctaBtnText: { ...typography.bodyStrong, color: colors.navy },
});
