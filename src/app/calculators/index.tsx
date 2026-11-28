import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

// Mirrors web /calculators (app/(marketing)/calculators/page.tsx): cream
// page, breadcrumb, title, intro, 3 tool cards.

const AFRICAN_RED = '#E42D40';
const CREAM = '#FDF5E6';

const TOOLS: { href: string; icon: keyof typeof Ionicons.glyphMap; name: string; description: string }[] = [
  {
    href: '/calculators/cement',
    icon: 'calculator-outline',
    name: 'Cement & Concrete Calculator',
    description: 'Work out bags of cement, sand and granite needed for a slab, column or foundation pour.',
  },
  {
    href: '/calculators/blocks',
    icon: 'grid-outline',
    name: 'Block Calculator',
    description: 'Work out how many blocks (and bags of cement for mortar) you need for a wall.',
  },
  {
    href: '/calculators/building-cost',
    icon: 'home-outline',
    name: 'Materials Cost Estimator',
    description: 'Combine cement, block and roofing quantities into one estimate, priced with verified vendor rates where available.',
  },
];

export default function CalculatorsHubScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Calculators' }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenColumn pad={false}>
          <View style={styles.breadcrumb}>
            <Pressable onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </Pressable>
            <Text style={styles.breadcrumbSep}> / Calculators</Text>
          </View>

          <Text style={styles.title}>Construction Material Calculators</Text>
          <Text style={styles.intro}>
            Free tools to estimate material quantities for your project in Nigeria, then request a
            quote from verified suppliers.
          </Text>

          {TOOLS.map(t => (
            <Pressable key={t.href} style={styles.toolCard} onPress={() => router.push(t.href as any)}>
              <View style={styles.toolIcon}>
                <Ionicons name={t.icon} size={20} color={AFRICAN_RED} />
              </View>
              <Text style={styles.toolName}>{t.name}</Text>
              <Text style={styles.toolDesc}>{t.description}</Text>
            </Pressable>
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
  title: { ...typography.h2, color: colors.text },
  intro: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  toolCard: {
    backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.sm, ...shadows.card,
  },
  toolIcon: {
    width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(228,45,64,0.1)', marginBottom: spacing.sm,
  },
  toolName: { ...typography.bodyStrong, color: colors.text },
  toolDesc: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
