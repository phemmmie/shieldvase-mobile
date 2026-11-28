import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { usePublishedTeamMembers } from '@/features/about/queries';
import {
  filterTeamByOrg,
  getInitials,
  groupTeamByDepartment,
  ORG_LABELS,
  TeamOrg,
  teamMembers,
} from '@/features/about/team';

// Mirrors web /about (views/About.tsx → sections/about/*): dark navy hero
// with badge + tagline + CTAs + 3 trust cards, Platform Showcase,
// Mission/Vision cards, Core Values grid, Our Story w/ stats, Technology
// feature cards, Why ShieldVase stats, Organisations, Team directory,
// Expertise chips, gradient CTA.

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

const TECH_FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[] = [
  { icon: 'git-network-outline', title: 'Comprehensive Marketplace', description: "A unified platform connecting vendors and buyers across Africa's raw materials sector." },
  { icon: 'bar-chart-outline', title: 'AI-Powered Insights', description: 'Advanced machine learning and LLM agents provide real-time market analysis and predictions.' },
  { icon: 'globe-outline', title: 'Market Trend Tools', description: 'Automated tools for tracking prices, demand patterns, and market opportunities.' },
];

const WHY_STATS: { value: string; label: string }[] = [
  { value: '500+', label: 'Active Vendors' },
  { value: '10K+', label: 'Monthly Transactions' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '30%', label: 'Average Cost Savings' },
];

const ORGANISATIONS: { icon: keyof typeof Ionicons.glyphMap; name: string; tag: string; description: string; points: string[] }[] = [
  {
    icon: 'business-outline', name: 'OptiForge', tag: 'Group company',
    description: 'The technology group behind ShieldVase. OptiForge builds and operates digital products that apply software engineering, AI, and data to real operational problems across African markets.',
    points: ['Product engineering', 'AI & data platforms', 'Venture building'],
  },
  {
    icon: 'storefront-outline', name: 'ShieldVase Marketplace', tag: 'Product',
    description: 'A B2B marketplace that aggregates verified vendors so SMEs, contractors, and industrial buyers get transparent pricing, reliable supply, and financing for raw materials.',
    points: ['Verified suppliers', 'Price Lock & Group Buy', 'RFQ & procurement tools'],
  },
];

const TEAM_FILTERS: { value: TeamOrg | 'all'; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'shieldvase', label: 'ShieldVase Marketplace' },
  { value: 'optiforge', label: 'OptiForge' },
];

export default function AboutScreen() {
  const router = useRouter();
  const [orgFilter, setOrgFilter] = useState<TeamOrg | 'all'>('all');
  // Published profiles come from the admin-managed team_members table;
  // the static seed is only a fallback while the table is unreachable.
  const { data: dbMembers, isError } = usePublishedTeamMembers();
  const members = useMemo(
    () => (isError ? teamMembers : (dbMembers ?? [])),
    [isError, dbMembers],
  );
  const groups = useMemo(
    () => groupTeamByDepartment(filterTeamByOrg(members, orgFilter)),
    [members, orgFilter],
  );

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
          {/* Platform Showcase — web PlatformShowcaseSection */}
          <View style={styles.section}>
            <Text style={[styles.kicker, styles.centered]}>One platform</Text>
            <Text style={[styles.sectionTitle, styles.centered]}>
              Everything you need to build smarter and save more
            </Text>
            <Text style={[styles.mvText, styles.centered]}>
              Price Lock, Group Buying, RFQ &amp; Quotes, Verified Suppliers, and a full
              marketplace — all in one place.
            </Text>
          </View>

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

          {/* Technology — web TechnologySection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.centered]}>What We Offer</Text>
            <Text style={[styles.mvText, styles.centered]}>
              Cutting-edge technology powering Africa&apos;s raw materials trade
            </Text>
            {TECH_FEATURES.map(f => (
              <View key={f.title} style={styles.expCard}>
                <Ionicons name={f.icon} size={28} color={colors.primary} />
                <Text style={styles.techTitle}>{f.title}</Text>
                <Text style={styles.expDesc}>{f.description}</Text>
              </View>
            ))}
          </View>

          {/* Why ShieldVase — web WhyShieldVaseSection (bg-gray-50 band) */}
          <View style={styles.whySection}>
            <Text style={[styles.sectionTitle, styles.centered]}>Why ShieldVase?</Text>
            <View style={styles.whyStatsGrid}>
              {WHY_STATS.map(s => (
                <View key={s.label} style={styles.whyStatCard}>
                  <Text style={styles.whyStatValue}>{s.value}</Text>
                  <Text style={styles.whyStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.whyBlurb}>
              <Text style={[styles.mvText, styles.centered]}>
                ShieldVase provides a one-stop solution for businesses to source raw materials
                efficiently. With advanced AI tools and a robust marketplace, we ensure
                transparency, competitive pricing, and up-to-date market trends.
              </Text>
            </View>
          </View>

          {/* Organisations — web OrganisationsSection (bg #f8f5ee band) */}
          <View style={styles.orgsSection}>
            <Text style={[styles.kicker, styles.centered]}>About the organisation</Text>
            <Text style={[styles.sectionTitle, styles.centered]}>One group, one marketplace</Text>
            <Text style={[styles.mvText, styles.centered]}>
              ShieldVase Marketplace is built and operated by OptiForge — the group company
              applying technology to everyday trade problems.
            </Text>
            {ORGANISATIONS.map(org => (
              <View key={org.name} style={styles.orgCard}>
                <View style={styles.orgHeader}>
                  <View style={styles.orgIcon}>
                    <Ionicons name={org.icon} size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orgName}>{org.name}</Text>
                    <Text style={styles.orgTag}>{org.tag}</Text>
                  </View>
                </View>
                <Text style={styles.mvText}>{org.description}</Text>
                <View style={styles.expTags}>
                  {org.points.map(p => (
                    <View key={p} style={styles.expTag}>
                      <Text style={styles.expTagText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <Pressable style={styles.orgLink} onPress={() => router.push('/contact' as any)}>
              <Text style={styles.orgLinkText}>Talk to the team about partnerships</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </Pressable>
          </View>

          {/* Team — web TeamSection (DB-backed w/ static fallback) */}
          <View style={styles.section}>
            <View style={styles.teamBadge}>
              <Ionicons name="people-outline" size={14} color={colors.primary} />
              <Text style={styles.teamBadgeText}>Meet the team</Text>
            </View>
            <Text style={[styles.sectionTitle, styles.centered]}>
              The people behind ShieldVase Marketplace and OptiForge
            </Text>
            <Text style={[styles.mvText, styles.centered]}>
              A cross-functional group covering engineering, data, finance, operations, and
              sustainability — building and running the platform together.
            </Text>
            <View style={styles.teamFilters}>
              {TEAM_FILTERS.map(f => (
                <Pressable
                  key={f.value}
                  style={[styles.teamFilterChip, orgFilter === f.value && styles.teamFilterChipActive]}
                  onPress={() => setOrgFilter(f.value)}
                >
                  <Text
                    style={[styles.teamFilterText, orgFilter === f.value && styles.teamFilterTextActive]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {groups.map(group => (
              <View key={group.department} style={styles.teamGroup}>
                <Text style={styles.teamDept}>{group.department}</Text>
                {group.members.map(m => (
                  <View key={m.id} style={styles.memberCard}>
                    <View style={styles.memberHeader}>
                      {m.photoUrl ? (
                        <Image source={{ uri: m.photoUrl }} style={styles.memberAvatar} contentFit="cover" />
                      ) : (
                        <View style={[styles.memberAvatar, styles.memberAvatarFallback]}>
                          <Text style={styles.memberInitials}>{getInitials(m.name)}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.memberName} numberOfLines={1}>{m.name}</Text>
                        <Text style={styles.memberRole}>{m.role}</Text>
                        {!m.roleVerified && (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>Role pending verification</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {m.organisations.length > 0 && (
                      <View style={styles.expTags}>
                        {m.organisations.map(o => (
                          <View key={o} style={styles.expTag}>
                            <Text style={styles.expTagText}>{ORG_LABELS[o]}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <Text style={[styles.memberBio, !m.bio && styles.memberBioPending]}>
                      {m.bio ?? 'Biography pending — to be added by an administrator once verified.'}
                    </Text>
                    {m.expertise.length > 0 && (
                      <View style={styles.expTags}>
                        {m.expertise.map(tag => (
                          <View key={tag} style={styles.expTag}>
                            <Text style={styles.expTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {(m.linkedinUrl || m.portfolioUrl) && (
                      <View style={styles.memberLinks}>
                        {m.linkedinUrl && (
                          <Pressable style={styles.memberLink} onPress={() => Linking.openURL(m.linkedinUrl!)}>
                            <Ionicons name="logo-linkedin" size={12} color={colors.textMuted} />
                            <Text style={styles.memberLinkText}>LinkedIn</Text>
                          </Pressable>
                        )}
                        {m.portfolioUrl && (
                          <Pressable style={styles.memberLink} onPress={() => Linking.openURL(m.portfolioUrl!)}>
                            <Ionicons name="globe-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.memberLinkText}>Portfolio</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}
            <Text style={styles.teamDisclaimer}>
              Profiles are being verified — roles and organisation affiliations shown here are
              drafts pending confirmation.
            </Text>
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
  centered: { textAlign: 'center' },
  techTitle: { ...typography.bodyStrong, color: colors.text, marginTop: spacing.sm },
  whySection: {
    marginHorizontal: spacing.xl, marginTop: spacing['2xl'],
    backgroundColor: colors.surfaceAlt, borderRadius: radius.xl, padding: spacing.lg,
  },
  whyStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  whyStatCard: {
    width: '47%', alignItems: 'center', backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  whyStatValue: { ...typography.h2, color: colors.primary },
  whyStatLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  whyBlurb: {
    marginTop: spacing.sm, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  orgsSection: {
    marginTop: spacing['2xl'], backgroundColor: '#f8f5ee',
    paddingHorizontal: spacing.xl, paddingVertical: spacing['2xl'],
  },
  orgCard: {
    marginTop: spacing.md, backgroundColor: colors.surfaceRaised, borderRadius: radius.xl,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  orgHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orgIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft,
  },
  orgName: { ...typography.h3, color: colors.text },
  orgTag: { ...typography.caption, color: colors.textMuted },
  orgLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: spacing.lg,
  },
  orgLinkText: { ...typography.captionStrong, color: colors.primary },
  teamBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: colors.primarySoft, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  teamBadgeText: { ...typography.captionStrong, color: colors.primary },
  teamFilters: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: spacing.xs, marginTop: spacing.lg,
  },
  teamFilterChip: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceRaised, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  teamFilterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  teamFilterText: { ...typography.captionStrong, color: colors.textMuted },
  teamFilterTextActive: { color: colors.textOnPrimary },
  teamGroup: { marginTop: spacing.xl },
  teamDept: { ...typography.micro, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.6 },
  memberCard: {
    marginTop: spacing.sm, backgroundColor: colors.surfaceRaised, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.card,
  },
  memberHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  memberAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.border },
  memberAvatarFallback: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  memberInitials: { ...typography.bodyStrong, color: colors.primary },
  memberName: { ...typography.bodyStrong, color: colors.text },
  memberRole: { ...typography.caption, color: colors.primary },
  pendingBadge: {
    alignSelf: 'flex-start', marginTop: spacing.xs, borderRadius: radius.pill,
    borderWidth: 1, borderColor: '#F59E0B', backgroundColor: '#FFFBEB',
    paddingHorizontal: spacing.sm, paddingVertical: 2,
  },
  pendingBadgeText: { ...typography.micro, color: '#B45309' },
  memberBio: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  memberBioPending: { fontStyle: 'italic' },
  memberLinks: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  memberLink: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  memberLinkText: { ...typography.micro, color: colors.textMuted },
  teamDisclaimer: { ...typography.micro, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
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
