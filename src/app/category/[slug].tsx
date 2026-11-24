import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCategories } from '@/features/catalog/queries';
import { LoadingState } from '@/components/States';
import { ConstructionMarketplace } from '@/features/catalog/marketplaces/Construction';
import { PolymersMarketplace } from '@/features/catalog/marketplaces/Polymers';
import { ChemicalsMarketplace } from '@/features/catalog/marketplaces/Chemicals';
import { EnergyMarketplace } from '@/features/catalog/marketplaces/Energy';
import { AgricultureMarketplace } from '@/features/catalog/marketplaces/Agriculture';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors web DynamicMarketplace: the slug resolves a root category whose
// main_category selects the dedicated marketplace view.
const MARKETPLACES: Record<string, ComponentType<{ initialSearch?: string }>> = {
  construction: ConstructionMarketplace,
  polymers: PolymersMarketplace,
  chemicals: ChemicalsMarketplace,
  energy: EnergyMarketplace,
  agriculture: AgricultureMarketplace,
};

export default function CategoryScreen() {
  const { slug, search } = useLocalSearchParams<{ slug: string; search?: string }>();
  const router = useRouter();
  const categories = useCategories();
  const category = categories.data?.find((c) => c.slug === slug);

  if (categories.isLoading) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Category' }} />
        <LoadingState />
      </View>
    );
  }

  // Web parity: "Category Not Found" state with Return to Home.
  if (!category) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <View style={styles.fallback}>
          <Ionicons name="cube-outline" size={56} color={colors.textFaint} />
          <Text style={styles.fallbackTitle}>Category Not Found</Text>
          <Text style={styles.fallbackBody}>
            The category &quot;{slug}&quot; does not exist or has been removed.
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)' as any)}
            style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.homeBtnText}>Return to Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const Page = MARKETPLACES[category.main_category ?? ''];

  // Web parity: categories without a dedicated marketplace view show a
  // "Products coming soon" fallback.
  if (!Page) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ title: category.name }} />
        <View style={styles.fallback}>
          <Ionicons name="cube-outline" size={56} color={colors.textFaint} />
          <Text style={styles.fallbackTitle}>{category.name}</Text>
          <Text style={styles.fallbackBody}>
            {category.description || 'Products coming soon for this category.'}
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)' as any)}
            style={({ pressed }) => [styles.homeBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.homeBtnText}>Return to Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: category.name }} />
      <Page initialSearch={search ?? ''} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  fallbackTitle: { ...typography.h2, color: colors.text, marginTop: spacing.md },
  fallbackBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  homeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  homeBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
