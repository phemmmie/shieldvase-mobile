import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';
import type { ProductSummary } from '@/features/catalog/api';

export function ProductCard({ product }: { product: ProductSummary }) {
  const img = product.images?.[0];

  return (
    <Link href={`/product/${buildProductParam(product)}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.imageWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.image} contentFit="cover" transition={150} />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.imageFallbackText}>No image</Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text numberOfLines={2} style={styles.name}>
            {product.name}
          </Text>
          <Text style={styles.price}>
            {product.min_price != null ? `from ${formatNaira(product.min_price)}` : 'Price on request'}
          </Text>
          {product.vendor_count > 0 && (
            <Text style={styles.meta}>
              {product.vendor_count} supplier{product.vendor_count === 1 ? '' : 's'}
            </Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  imageWrap: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    margin: spacing.xs,
    marginBottom: 0,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { ...typography.caption, color: colors.textMuted },
  body: { padding: spacing.sm },
  name: { ...typography.body, color: colors.text, minHeight: 38 },
  price: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.xs },
  meta: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
});
