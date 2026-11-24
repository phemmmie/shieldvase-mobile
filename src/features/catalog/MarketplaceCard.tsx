import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';
import { useCart } from '@/features/cart/CartContext';
import type { MarketplaceProduct } from './marketplaceApi';

/**
 * Mobile port of the web marketplace/MarketplaceProductCard — white image
 * area (contain), stock badge, "From ₦X /unit", supplier count, location
 * line, eye + add-to-cart actions.
 */
export function MarketplaceCard({
  product,
  accent = colors.primary,
}: {
  product: MarketplaceProduct;
  accent?: string;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const img = product.images[0];
  const canBuy = !!product.cheapest_vendor_product_id && product.display_price != null;

  const openProduct = () => router.push(`/product/${buildProductParam(product)}` as any);

  const add = async () => {
    if (!canBuy || adding) return;
    setAdding(true);
    const ok = await addToCart({
      vendor_product_id: product.cheapest_vendor_product_id!,
      unified_product_id: product.id,
      name: product.name,
      price: product.display_price!,
      image: img ?? null,
      vendor_id: product.cheapest_vendor_id,
      category: product.subcategory_name ?? product.category_name ?? null,
    });
    setAdding(false);
    if (ok) Alert.alert('Added to cart', product.name);
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={openProduct} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        <View style={styles.imgWrap}>
          {img ? (
            <Image source={{ uri: img }} style={styles.img} contentFit="contain" transition={150} />
          ) : (
            <View style={[styles.img, styles.imgFallback]}>
              <Ionicons name="cube-outline" size={30} color={colors.textFaint} />
            </View>
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text numberOfLines={2} style={styles.name}>
              {product.name}
            </Text>
            <View
              style={[
                styles.stockBadge,
                { backgroundColor: product.in_stock ? '#22C55E' : '#EF4444' },
              ]}
            >
              <Text style={styles.stockText}>{product.in_stock ? 'In Stock' : 'Out of Stock'}</Text>
            </View>
          </View>
          {(product.subcategory_name || product.category_name) && (
            <Text numberOfLines={1} style={styles.sub}>
              {product.subcategory_name ?? product.category_name}
            </Text>
          )}
          {product.display_price != null ? (
            <Text style={[styles.price, { color: accent }]}>
              {product.vendor_count > 1 ? 'From ' : ''}
              {formatNaira(product.display_price)}
              {!!product.price_unit && product.price_unit !== 'unit' && (
                <Text style={styles.priceUnit}>/{product.price_unit}</Text>
              )}
            </Text>
          ) : (
            <Text style={[styles.price, { color: accent }]}>Price on request</Text>
          )}
          {product.vendor_count > 1 && (
            <Text style={styles.meta}>Available from {product.vendor_count} suppliers</Text>
          )}
          {product.cities.length > 0 && (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text numberOfLines={1} style={styles.cityText}>
                {product.cities.slice(0, 2).join(', ')}
                {product.cities.length > 2 ? ` +${product.cities.length - 2}` : ''}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          onPress={openProduct}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionOutline,
            { borderColor: accent },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityLabel="View details"
        >
          <Ionicons name="eye-outline" size={17} color={accent} />
        </Pressable>
        <Pressable
          onPress={add}
          disabled={!canBuy || adding}
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionFill,
            { backgroundColor: canBuy ? accent : colors.border },
            pressed && { opacity: 0.85 },
          ]}
          accessibilityLabel="Add to cart"
        >
          {adding ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="cart-outline" size={17} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  imgWrap: {
    height: 160,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  img: { width: '100%', height: '100%' },
  imgFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.sm, paddingBottom: spacing.xs, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  name: { ...typography.caption, color: colors.text, fontWeight: '600', flex: 1, minHeight: 34 },
  stockBadge: { borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  stockText: { fontSize: 9, color: '#FFFFFF', fontWeight: '700' },
  sub: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  price: { ...typography.bodyStrong, marginTop: 6 },
  priceUnit: { ...typography.micro, color: colors.textMuted, fontWeight: '500' },
  meta: { ...typography.micro, color: colors.textMuted, marginTop: 3 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  cityText: { ...typography.micro, color: colors.textMuted, flexShrink: 1 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  actionBtn: {
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionOutline: { width: 42, borderWidth: 1 },
  actionFill: { flex: 1 },
});
