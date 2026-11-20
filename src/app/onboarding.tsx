import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/features/auth/AuthContext';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export const ONBOARDING_KEY = 'shieldvase:onboarded';

const SAFEGUARDS = [
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Verified Vendors',
    body: 'Vetted quarries, mills & distributors',
    tint: colors.infoSoft,
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'Price Lock',
    body: 'Hedge against volatile fx & fuel',
    tint: colors.accentSoft,
  },
  {
    icon: 'location-outline' as const,
    title: 'Waybill Tracking',
    body: 'Weighbridge manifests & GPS',
    tint: colors.secondarySoft,
  },
  {
    icon: 'navigate-outline' as const,
    title: 'Geo-Routing',
    body: 'Closest depots across 36 states',
    tint: colors.primarySoft,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();

  const finish = async (target: '/(tabs)' | '/(auth)/sign-in') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(ONBOARDING_KEY, '1').catch(() => {});
    router.replace(target as any);
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.navy, '#11141f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing['2xl'] }]}
      >
        <ScreenColumn>
          <Animated.View entering={FadeInDown.duration(500)}>
            <View style={styles.citiesPill}>
              <Ionicons name="location" size={12} color={colors.accent} />
              <Text style={styles.citiesText}>Lagos · Port Harcourt · Abuja</Text>
            </View>
            <View style={styles.logoCard}>
              <Image
                source={require('../../assets/brand/shieldvase-logo.png')}
                style={styles.logo}
                contentFit="cover"
              />
            </View>
            <Text style={styles.brand}>
              Shield<Text style={{ color: colors.secondaryLight }}>Vase</Text>
            </Text>
            <View style={styles.taglinePill}>
              <Ionicons name="construct-outline" size={13} color={colors.accent} />
              <Text style={styles.tagline}>BUILD FROM ANYWHERE.</Text>
            </View>
            <Text style={styles.sub}>
              Nigeria’s Premier Marketplace for Certified Construction & Industrial
              Materials.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>VERIFIED ESCROW</Text>
                <Text style={styles.statValue}>₦4.2B+ Secured</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>ACTIVE FLEET</Text>
                <Text style={[styles.statValue, { color: colors.accent }]}>850+ Tippers</Text>
              </View>
            </View>
          </Animated.View>
        </ScreenColumn>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          <View style={styles.safeguardHeader}>
            <Text style={styles.safeguardTitle}>INSTITUTIONAL SAFEGUARDS</Text>
            <Text style={styles.safeguardMeta}>Standardized</Text>
          </View>
          <View style={styles.safeguardGrid}>
            {SAFEGUARDS.map((s, i) => (
              <Animated.View
                key={s.title}
                entering={FadeInUp.delay(120 + i * 70).duration(420)}
                style={styles.safeguardCard}
              >
                <View style={[styles.safeguardIcon, { backgroundColor: s.tint }]}>
                  <Ionicons name={s.icon} size={20} color={colors.text} />
                </View>
                <Text style={styles.safeguardName} numberOfLines={1}>
                  {s.title}
                </Text>
                <Text style={styles.safeguardBody} numberOfLines={2}>
                  {s.body}
                </Text>
              </Animated.View>
            ))}
          </View>

          <Pressable
            onPress={() => finish('/(tabs)')}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
          >
            <Ionicons name="construct" size={20} color={colors.textOnPrimary} />
            <Text style={styles.ctaText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textOnPrimary} />
          </Pressable>

          {!session && (
            <Pressable
              onPress={() => finish('/(auth)/sign-in')}
              style={({ pressed }) => [styles.signIn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
              <Text style={styles.signInText}>Merchant & Contractor Sign In</Text>
            </Pressable>
          )}

          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark" size={16} color={colors.secondary} />
            <Text style={styles.trustText}>
              CBN licensed payment escrow & physical inspection clause
            </Text>
            <Text style={styles.trustBadge}>GUARANTEED</Text>
          </View>
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy },
  hero: { paddingBottom: spacing['3xl'], borderBottomLeftRadius: radius['2xl'], borderBottomRightRadius: radius['2xl'] },
  citiesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    marginBottom: spacing.xl,
  },
  citiesText: { ...typography.caption, color: colors.background },
  logoCard: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: radius['2xl'],
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.raised,
  },
  logo: { width: 80, height: 80, borderRadius: radius.xl },
  brand: { ...typography.display, color: colors.background, textAlign: 'center' },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginTop: spacing.md,
  },
  tagline: { ...typography.captionStrong, color: colors.background, letterSpacing: 1 },
  sub: {
    ...typography.body,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLabel: { ...typography.micro, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.8 },
  statValue: { ...typography.h3, color: colors.secondaryLight, marginTop: 4 },
  body: { paddingVertical: spacing.xl },
  safeguardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  safeguardTitle: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.8 },
  safeguardMeta: { ...typography.micro, color: colors.textMuted },
  safeguardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  safeguardCard: {
    width: '48.5%',
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  safeguardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  safeguardName: { ...typography.bodyStrong, color: colors.text },
  safeguardBody: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    height: 54,
    marginTop: spacing.xl,
    ...shadows.raised,
  },
  ctaText: { ...typography.bodyStrong, fontSize: 17, color: colors.textOnPrimary },
  signIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    height: 54,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  signInText: { ...typography.bodyStrong, color: colors.primary },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  trustText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  trustBadge: { ...typography.micro, color: colors.secondary, letterSpacing: 0.5 },
});
