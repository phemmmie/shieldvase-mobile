import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCategories, useProductSearch } from '@/features/catalog/queries';
import { EmptyState } from '@/components/States';
import { ListSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';
import type { ProductSummary } from '@/features/catalog/api';

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Best Match' },
  { key: 'price_asc', label: 'Lowest Price' },
  { key: 'price_desc', label: 'Highest Price' },
  { key: 'name', label: 'Name A–Z' },
];

const sortResults = (items: ProductSummary[], sort: SortKey): ProductSummary[] => {
  const list = [...items];
  switch (sort) {
    case 'price_asc':
      return list.sort(
        (a, b) => (a.min_price ?? Number.MAX_SAFE_INTEGER) - (b.min_price ?? Number.MAX_SAFE_INTEGER),
      );
    case 'price_desc':
      return list.sort(
        (a, b) => (b.min_price ?? Number.MIN_SAFE_INTEGER) - (a.min_price ?? Number.MIN_SAFE_INTEGER),
      );
    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list;
  }
};

function ResultCard({ product, index }: { product: ProductSummary; index: number }) {
  const img = product.images?.[0];
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(200)}>
      <Link href={`/product/${buildProductParam(product)}`} asChild>
        <Pressable style={({ pressed }) => [styles.resultCard, pressed && { opacity: 0.9 }]}>
          {img ? (
            <Image source={{ uri: img }} style={styles.resultImg} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.resultImg, styles.resultImgFallback]}>
              <Ionicons name="cube-outline" size={26} color={colors.textFaint} />
            </View>
          )}
          <View style={styles.resultBody}>
            <View style={styles.resultBadgeRow}>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={10} color={colors.secondary} />
                <Text style={styles.verifiedText}>SHIELDVASE VERIFIED</Text>
              </View>
            </View>
            <Text numberOfLines={2} style={styles.resultName}>
              {product.name}
            </Text>
            <Text style={styles.resultPrice}>
              {product.min_price != null ? formatNaira(product.min_price) : 'Price on request'}
              {product.min_price != null && <Text style={styles.resultUnit}> /unit</Text>}
            </Text>
            <Text style={styles.resultMeta}>
              {product.vendor_count > 0
                ? `${product.vendor_count} verified depot${product.vendor_count === 1 ? '' : 's'} · Inspect supply →`
                : 'Quote on request'}
            </Text>
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [term, setTerm] = useState(typeof q === 'string' ? q : '');
  const [sort, setSort] = useState<SortKey>('relevance');
  const results = useProductSearch(term);
  const categories = useCategories();
  const sorted = results.data ? sortResults(results.data, sort) : [];
  const searching = term.trim().length >= 2;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Search & Discovery', headerShown: false }} />
      <ScreenColumn>
        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Dangote Cement 50kg"
              placeholderTextColor={colors.textMuted}
              autoFocus
              value={term}
              onChangeText={setTerm}
              returnKeyType="search"
            />
            {!!term && (
              <Pressable onPress={() => setTerm('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {!searching && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Trending searches */}
            <Text style={styles.blockTitle}>RECENT & TRENDING SEARCHES</Text>
            <View style={styles.chipsWrap}>
              {(categories.data ?? []).slice(0, 8).map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.chip}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTerm(c.name);
                  }}
                >
                  <Text style={styles.chipText}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
            <EmptyState
              title="Search the catalogue"
              hint="Find materials, brands and verified depots — type at least 2 characters."
            />
          </ScrollView>
        )}

        {searching && (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortRow}
            >
              {SORTS.map((s) => (
                <Pressable
                  key={s.key}
                  style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
                  onPress={() => {
                    setSort(s.key);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {results.isLoading ? (
              <View style={{ paddingTop: spacing.md }}>
                <ListSkeleton count={4} />
              </View>
            ) : !sorted.length ? (
              <EmptyState title={`No results for “${term}”`} hint="Try a different material or brand." />
            ) : (
              <>
                <Text style={styles.matchedTitle}>
                  Matched Depots <Text style={{ color: colors.secondary }}>{sorted.length} results</Text>
                </Text>
                <FlatList
                  data={sorted}
                  keyExtractor={(p) => p.id}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => <ResultCard product={item} index={index} />}
                />
              </>
            )}
          </>
        )}
      </ScreenColumn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  input: { flex: 1, ...typography.body, color: colors.text, height: '100%' },
  blockTitle: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.6, marginTop: spacing.md, marginBottom: spacing.sm },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
  },
  chipText: { ...typography.caption, color: colors.text },
  sortRow: { gap: spacing.sm, paddingVertical: spacing.sm },
  sortChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  sortText: { ...typography.caption, color: colors.textMuted },
  sortTextActive: { color: colors.textOnSecondary, fontFamily: 'Inter_700Bold' },
  matchedTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
  list: { paddingBottom: spacing['3xl'], gap: spacing.md },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  resultImg: { width: 110, height: 110 },
  resultImgFallback: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  resultBody: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  resultBadgeRow: { flexDirection: 'row', marginBottom: 4 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  verifiedText: { ...typography.micro, fontSize: 9, color: colors.secondary, letterSpacing: 0.4 },
  resultName: { ...typography.bodyStrong, color: colors.text },
  resultPrice: { ...typography.h3, color: colors.secondary, marginTop: 4 },
  resultUnit: { ...typography.caption, color: colors.textMuted },
  resultMeta: { ...typography.micro, color: colors.textMuted, marginTop: 4 },
});
