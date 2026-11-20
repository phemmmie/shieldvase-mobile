import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCategories, useCategoryProducts } from '@/features/catalog/queries';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState } from '@/components/States';
import { ProductGridSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const categories = useCategories();
  const category = categories.data?.find((c) => c.slug === slug);
  const products = useCategoryProducts(category?.id);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: category?.name ?? 'Category' }} />
      <ScreenColumn>
        {/* Depot-count summary — stitch 04 header */}
        <View style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>{category?.name ?? 'Products'}</Text>
            <Text style={styles.summarySub}>
              {products.data?.length ?? 0} verified listing
              {(products.data?.length ?? 0) === 1 ? '' : 's'} · ShieldVase escrow protected
            </Text>
          </View>
          <View style={styles.summaryBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.secondary} />
          </View>
        </View>

        {products.isLoading ? (
          <ProductGridSkeleton />
        ) : products.isError ? (
          <ErrorState onRetry={() => products.refetch()} />
        ) : !products.data?.length ? (
          <EmptyState title="No products in this category" hint="Try another category or request a quote." />
        ) : (
          <FlatList
            data={products.data}
            keyExtractor={(p) => p.id}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.sm }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <ProductCard product={item} />
              </View>
            )}
            ListFooterComponent={
              /* Bulk RFQ banner — stitch 04 bottom CTA */
              <View style={styles.rfqBanner}>
                <Text style={styles.rfqTitle}>Need 1,000+ bags or direct mill allocation?</Text>
                <Text style={styles.rfqBody}>
                  Bypass retail depot markups — issue a multi-depot RFQ directly to verified
                  plants with custom weighbridge escrow.
                </Text>
                <View style={styles.rfqTags}>
                  <View style={styles.rfqTag}>
                    <Ionicons name="shield-checkmark" size={10} color={colors.secondaryLight} />
                    <Text style={styles.rfqTagText}>Escrow Protected</Text>
                  </View>
                  <View style={styles.rfqTag}>
                    <Text style={styles.rfqTagText}>Custom BoQ</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push('/rfq/new' as any)}
                  style={({ pressed }) => [styles.rfqBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.rfqBtnText}>Launch RFQ</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
                </Pressable>
              </View>
            }
          />
        )}
      </ScreenColumn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  summaryTitle: { ...typography.h2, color: colors.text },
  summarySub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  summaryBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingBottom: spacing['3xl'], gap: spacing.sm },
  item: { flex: 1 },
  rfqBanner: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.raised,
  },
  rfqTitle: { ...typography.h3, color: colors.background },
  rfqBody: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  rfqTags: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  rfqTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  rfqTagText: { ...typography.micro, color: colors.secondaryLight },
  rfqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    height: 46,
    marginTop: spacing.md,
  },
  rfqBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
