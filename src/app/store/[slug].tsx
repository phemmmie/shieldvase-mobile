import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStorefront, useVendorListings } from '@/features/vendors/queries';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { colors, spacing, typography } from '@/theme';
import { ScreenColumn } from '@/components/Responsive';

export default function StorefrontScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storefront = useStorefront(slug);
  const listings = useVendorListings(storefront.data?.vendor_id);

  if (storefront.isLoading) return <LoadingState />;
  if (storefront.isError) return <ErrorState onRetry={() => storefront.refetch()} />;
  if (!storefront.data) return <EmptyState title="Storefront not found" />;

  const sf = storefront.data;
  const verified =
    sf.verification_status === 'verified' || sf.verification_status === 'approved';

  return (
    <View style={styles.screen}>
    <ScreenColumn pad={false} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: sf.vendor_display_id ?? 'Supplier' }} />

      {sf.banner_url ? (
        <Image source={{ uri: sf.banner_url }} style={styles.banner} contentFit="cover" />
      ) : (
        <View style={[styles.banner, styles.bannerFallback]} />
      )}

      <View style={styles.header}>
        {sf.logo_url ? (
          <Image source={{ uri: sf.logo_url }} style={styles.logo} contentFit="cover" />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Ionicons name="storefront-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{sf.vendor_display_id ?? 'Supplier'}</Text>
            {verified && (
              <Ionicons name="checkmark-circle" size={18} color={colors.secondary} />
            )}
          </View>
          {!!sf.tagline && <Text style={styles.tagline}>{sf.tagline}</Text>}
          {(sf.city || sf.state) && (
            <Text style={styles.location}>
              {[sf.city, sf.state].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
      </View>

      {!!sf.about && <Text style={styles.about}>{sf.about}</Text>}

      <Text style={styles.section}>Products</Text>
      {listings.isLoading ? (
        <LoadingState label="Loading products…" />
      ) : !listings.data?.length ? (
        <EmptyState title="No active listings" />
      ) : (
                    <FlatList
            data={listings.data}
            keyExtractor={(l) => l.id}
            numColumns={2}
            columnWrapperStyle={{ gap: spacing.md }}
            contentContainerStyle={{ paddingBottom: spacing['4xl'], gap: spacing.md }}
            renderItem={({ item }) =>
              item.product_slug ? (
                <ProductCard
                  product={{
                    id: item.unified_product_id ?? item.id,
                    name: item.product_name ?? 'Product',
                    slug: item.product_slug,
                    description: null,
                    images: item.product_images,
                    category_id: null,
                    min_price: item.price,
                    vendor_count: 1,
                  }}
                />
            ) : null
          }
        />
      )}
    </ScreenColumn>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  banner: { height: 120, borderRadius: 12, backgroundColor: colors.surface },
  bannerFallback: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: -20,
    marginBottom: spacing.md,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 2,
    borderColor: colors.background,
  },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.h2, color: colors.text },
  tagline: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  location: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  about: { ...typography.body, color: colors.text, lineHeight: 22, marginBottom: spacing.md },
  section: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
});
