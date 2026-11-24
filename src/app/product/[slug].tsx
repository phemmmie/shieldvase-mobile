import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCategories, useCategoryProducts, useProduct, useVendorOffers } from '@/features/catalog/queries';
import { useProductDeals } from '@/features/deals/queries';
import { useWishlistToggle } from '@/features/wishlist/queries';
import { useAuth } from '@/features/auth/AuthContext';
import type { VendorOffer } from '@/features/catalog/api';
import { fetchStorefrontByVendorId } from '@/features/vendors/api';
import { useCart } from '@/features/cart/CartContext';
import { EmptyState, ErrorState } from '@/components/States';
import { DetailSkeleton } from '@/components/Skeleton';
import { Button } from '@/components/Button';
import { Stepper } from '@/components/Stepper';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { buildProductParam } from '@/utils/productUrl';

function OfferCard({
  offer,
  qty,
  productName,
  unifiedProductId,
  image,
  best,
  onAdded,
}: {
  offer: VendorOffer;
  qty: number;
  productName: string;
  unifiedProductId: string;
  image: string | null;
  best?: boolean;
  onAdded?: (quantity: number, unitPrice: number) => void;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [busy, setBusy] = useState(false);

  const goToStore = async () => {
    const sf = await fetchStorefrontByVendorId(offer.vendor_id);
    if (sf?.slug) router.push(`/store/${sf.slug}`);
  };

  const add = async () => {
    setBusy(true);
    const quantity = Math.max(qty, offer.min_order_quantity ?? 1);
    const ok = await addToCart({
      vendor_product_id: offer.id,
      unified_product_id: unifiedProductId,
      vendor_id: offer.vendor_id,
      name: productName,
      price: offer.price ?? 0,
      image,
      quantity,
    });
    setBusy(false);
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdded?.(quantity, offer.price ?? 0);
    }
  };

  return (
    <View style={[styles.offer, best && styles.offerBest]}>
      {best && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>LOWEST</Text>
        </View>
      )}
      <View style={styles.offerHead}>
        <Pressable onPress={goToStore} hitSlop={6} style={{ flex: 1 }}>
          <View style={styles.vendorRow}>
            <Ionicons name="business" size={14} color={colors.secondary} />
            <Text style={styles.offerVendor} numberOfLines={1}>
              {offer.vendor_display_id ?? 'Vendor'}
            </Text>
            <Ionicons name="checkmark-circle" size={14} color={colors.secondary} />
          </View>
          {(() => {
            const locs = locationNames(offer.available_locations);
            return locs.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="location-outline" size={11} color={colors.textMuted} />
                <Text style={styles.offerVendorMeta}>{locs.slice(0, 2).join(', ')}</Text>
              </View>
            ) : null;
          })()}
        </Pressable>
        <View style={styles.offerPriceBox}>
          <Text style={styles.offerPrice}>{formatNaira(offer.price)}</Text>
          {!!offer.price_unit && <Text style={styles.offerUnit}>/{offer.price_unit}</Text>}
        </View>
      </View>

      <View style={styles.offerMetaRow}>
        <View style={styles.offerMetaItem}>
          <Ionicons name="cube-outline" size={12} color={colors.textMuted} />
          <Text style={styles.offerMeta}>
            {offer.stock_quantity != null ? `${offer.stock_quantity} in stock` : 'Stock on request'}
          </Text>
        </View>
        {!!offer.min_order_quantity && (
          <View style={styles.offerMetaItem}>
            <Ionicons name="layers-outline" size={12} color={colors.textMuted} />
            <Text style={styles.offerMeta}>MOQ {offer.min_order_quantity}</Text>
          </View>
        )}
        {!!offer.lead_time_days && (
          <View style={styles.offerMetaItem}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.offerMeta}>{offer.lead_time_days}d lead</Text>
          </View>
        )}
      </View>

      <Button
        title={busy ? 'Adding…' : `Add ${Math.max(qty, offer.min_order_quantity ?? 1)} to cart`}
        variant={best ? 'primary' : 'outline'}
        size="sm"
        loading={busy}
        onPress={add}
      />
    </View>
  );
}

const locationNames = (v: unknown): string[] =>
  Array.isArray(v)
    ? v
        .map((x) => (typeof x === 'string' ? x : (x as any)?.city ?? (x as any)?.name ?? ''))
        .filter(Boolean)
    : [];

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const heroWidth = Math.min(width, 560) - spacing.lg * 2;
  const { session } = useAuth();
  const { addToCart } = useCart();
  const product = useProduct(slug);
  const categories = useCategories();
  const offers = useVendorOffers(product.data?.id);
  const related = useCategoryProducts(product.data?.category_id ?? undefined);
  const deals = useProductDeals(product.data?.id);
  const wishlist = useWishlistToggle(session?.user.id);
  const [qty, setQty] = useState(1);
  const [staged, setStaged] = useState<{ quantity: number; unitPrice: number } | null>(null);

  if (product.isLoading)
    return <View style={styles.screen}><View style={{ padding: spacing.lg }}><DetailSkeleton /></View></View>;
  if (product.isError) return <ErrorState onRetry={() => product.refetch()} />;
  if (!product.data) return <EmptyState title="Product not found" />;

  const p: any = product.data;
  const images: string[] = p.images?.length ? p.images : p.shared_vendor_images ?? [];
  const hero = images[0] ?? null;
  const bestOffer = offers.data?.length
    ? offers.data.reduce((a, b) => ((a.price ?? Infinity) < (b.price ?? Infinity) ? a : b))
    : null;
  const dealChips = [
    ...(deals.data?.groupBuys ?? []).map((d) => ({
      key: `gb-${d.id}`,
      label: 'Group buy',
      icon: 'people' as const,
      color: colors.secondary,
      href: d.slug ? `/deals/group-buy/${d.slug}` : `/deals/join/group-buy/${d.id}`,
    })),
    ...(deals.data?.priceLocks ?? []).map((d) => ({
      key: `pl-${d.id}`,
      label: 'Price lock',
      icon: 'lock-closed' as const,
      color: colors.primary,
      href: d.slug ? `/deals/price-lock/${d.slug}` : `/deals/join/price-lock/${d.id}`,
    })),
  ];
  const subtotal = bestOffer?.price != null ? bestOffer.price * qty : null;
  const category = categories.data?.find((c) => c.id === p.category_id);
  const offerList = offers.data ?? [];
  const allLocations = Array.from(new Set(offerList.flatMap((o) => locationNames(o.available_locations))));
  const totalStock = offerList.reduce((n, o) => n + (o.stock_quantity ?? 0), 0);
  const priceUnit = bestOffer?.price_unit || 'unit';
  const relatedItems = (related.data ?? []).filter((r) => r.id !== p.id).slice(0, 4);

  const addBestOffer = async (then?: () => void) => {
    if (!bestOffer) return;
    const ok = await addToCart({
      vendor_product_id: bestOffer.id,
      unified_product_id: p.id,
      name: p.name,
      price: bestOffer.price ?? 0,
      image: hero,
      quantity: Math.max(qty, bestOffer.min_order_quantity ?? 1),
    });
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (then) {
        then();
      } else {
        setStaged({ quantity: Math.max(qty, bestOffer.min_order_quantity ?? 1), unitPrice: bestOffer.price ?? 0 });
      }
    }
  };

  const shareProduct = () =>
    Share.share({ message: `${p.name} — https://shieldvase.io/${category?.slug ?? 'products'}/${slug}` });

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: 'Product Details',
          headerRight: () => (
            <Pressable
              hitSlop={8}
              onPress={() => {
                if (!session) {
                  router.push('/(auth)/sign-in');
                  return;
                }
                wishlist.toggle.mutate({ productId: p.id });
              }}
            >
              <Ionicons
                name={wishlist.isSaved(p.id) ? 'heart' : 'heart-outline'}
                size={22}
                color={colors.primary}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenColumn>
          {/* Cert badges + hero */}
          <View style={styles.heroWrap}>
            {images.length > 1 ? (
              <FlatList
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={images}
                keyExtractor={(u, i) => `${u}-${i}`}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={[styles.hero, { width: heroWidth }]}
                    contentFit="cover"
                    transition={150}
                  />
                )}
              />
            ) : hero ? (
              <Image source={{ uri: hero }} style={styles.hero} contentFit="cover" transition={150} />
            ) : (
              <View style={[styles.hero, styles.heroFallback]}>
                <Ionicons name="cube-outline" size={40} color={colors.textFaint} />
              </View>
            )}
            <View style={styles.heroBadges}>
              {!!p.grade && (
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>{p.grade}</Text>
                </View>
              )}
              <View style={styles.certBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.secondary} />
                <Text style={styles.certBadgeText}>NIS CERTIFIED</Text>
              </View>
            </View>
            {images.length > 1 && (
              <View style={styles.photoCount}>
                <Text style={styles.photoCountText}>{images.length} Photos</Text>
              </View>
            )}
          </View>

          {/* Badges — web: category badge + brand outline + In Stock */}
          <View style={styles.badgeRow}>
            {!!category && (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{category.name}</Text>
              </View>
            )}
            {!!p.brand && (
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>{p.brand}</Text>
              </View>
            )}
            {totalStock > 0 && (
              <View style={styles.inStockBadge}>
                <Text style={styles.inStockBadgeText}>In Stock</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{p.name}</Text>
          {Number(p.rating) > 0 && (
            <View style={styles.ratingRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={14}
                  color={i < Math.round(p.rating) ? '#FACC15' : colors.border}
                />
              ))}
              <Text style={styles.ratingText}>
                {Number(p.rating).toFixed(1)} ({p.reviews_count || 0} reviews)
              </Text>
            </View>
          )}

          {bestOffer ? (
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatNaira(bestOffer.price)}</Text>
              <Text style={styles.priceUnit}>/ {priceUnit}</Text>
              {offerList.length > 1 && (
                <View style={styles.lowestBadge}>
                  <Text style={styles.lowestBadgeText}>Lowest from {offerList.length} suppliers</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.price}>Price on request</Text>
          )}
          {!!bestOffer?.vendor_display_id && (
            <Text style={styles.soldBy}>
              Sold by <Text style={styles.soldById}>{bestOffer.vendor_display_id}</Text>
            </Text>
          )}

          {/* Quick facts — web: MOQ / Availability / Fulfils from / Supplier dispatch / Manufacturer */}
          {!!bestOffer && (
            <View style={styles.factsGrid}>
              <View style={styles.factCell}>
                <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.factLabel}>MOQ</Text>
                  <Text style={styles.factValue}>
                    {bestOffer.min_order_quantity ?? 1} {priceUnit}
                  </Text>
                </View>
              </View>
              <View style={styles.factCell}>
                <Ionicons name="car-outline" size={14} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.factLabel}>Availability</Text>
                  <Text style={styles.factValue}>
                    {totalStock > 0 ? `${totalStock} ${priceUnit} in stock` : 'Out of stock'}
                  </Text>
                </View>
              </View>
              {allLocations.length > 0 && (
                <View style={styles.factCell}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.factLabel}>Fulfils from</Text>
                    <Text style={styles.factValue} numberOfLines={1}>
                      {allLocations.slice(0, 2).join(', ')}
                      {allLocations.length > 2 ? ` +${allLocations.length - 2}` : ''}
                    </Text>
                  </View>
                </View>
              )}
              {!!bestOffer.lead_time_days && (
                <View style={styles.factCell}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.factLabel}>Supplier dispatch</Text>
                    <Text style={styles.factValue}>{bestOffer.lead_time_days} days</Text>
                  </View>
                </View>
              )}
              {!!bestOffer.manufacturer && (
                <View style={styles.factCell}>
                  <Ionicons name="business-outline" size={14} color={colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.factLabel}>Manufacturer</Text>
                    <Text style={styles.factValue}>{bestOffer.manufacturer}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
          {!!p.description && <Text style={styles.desc}>{p.description}</Text>}

          {dealChips.length > 0 && (
            <View style={styles.dealRow}>
              {dealChips.map((chip) => (
                <Pressable
                  key={chip.key}
                  style={[styles.dealChip, { borderColor: chip.color, backgroundColor: chip.color + '14' }]}
                  onPress={() => router.push(chip.href as any)}
                >
                  <Ionicons name={chip.icon} size={14} color={chip.color} />
                  <Text style={[styles.dealChipText, { color: chip.color }]}>{chip.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Delivery & Logistics — web ProductDetailPage section */}
          <View style={styles.sectionHead}>
            <Ionicons name="car-outline" size={18} color={colors.text} />
            <Text style={styles.sectionTitleInline}>Delivery & Logistics</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.cardCell}>
                <Text style={styles.cardLabel}>Dispatch</Text>
                <Text style={styles.cardValue}>Confirmed after order placement</Text>
              </View>
              <View style={styles.cardCell}>
                <Text style={styles.cardLabel}>Fulfilment source</Text>
                <Text style={styles.cardValue}>
                  {allLocations.length > 0 ? allLocations.join(', ') : 'Assigned during vendor fulfilment'}
                </Text>
              </View>
              <View style={styles.cardCell}>
                <Text style={styles.cardLabel}>Delivery destination</Text>
                <Text style={styles.cardValue}>Enter your site location at checkout</Text>
              </View>
              <View style={styles.cardCell}>
                <Text style={styles.cardLabel}>Delivery fee</Text>
                <Text style={styles.cardValue}>Calculated for your destination at checkout</Text>
              </View>
            </View>
            <Text style={styles.cardNote}>
              Final transit timing, vehicle requirements, and delivery confirmation are handled
              during vendor fulfilment after payment is confirmed.
            </Text>
          </View>

          {/* Quantity + subtotal */}
          <View style={styles.qtyCard}>
            <View>
              <Text style={styles.qtyTitle}>Quantity</Text>
              {bestOffer?.min_order_quantity ? (
                <Text style={styles.qtyMeta}>MOQ {bestOffer.min_order_quantity} {priceUnit}</Text>
              ) : null}
            </View>
            <Stepper value={qty} onChange={setQty} min={1} />
          </View>
          {subtotal != null && (
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Total</Text>
              <Text style={styles.subtotalValue}>{formatNaira(subtotal)}</Text>
            </View>
          )}

          {/* Supplier offers — web: "Available from N vendors" */}
          <Text style={styles.sectionTitle}>
            Available from {offerList.length} vendor{offerList.length === 1 ? '' : 's'}
          </Text>
          <Text style={styles.sectionSub}>Lowest price is highlighted.</Text>
          {offers.isLoading ? (
            <DetailSkeleton />
          ) : !offers.data?.length ? (
            <EmptyState title="No verified suppliers yet" hint="Try requesting a quote instead." />
          ) : (
            offers.data.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                qty={qty}
                productName={p.name}
                unifiedProductId={p.id}
                image={hero}
                best={bestOffer?.id === o.id}
                onAdded={(quantity, unitPrice) => setStaged({ quantity, unitPrice })}
              />
            ))
          )}

          {/* CTAs — web: Add to Cart / Buy Now / Request Quote / Wishlist */}
          <View style={styles.ctaGrid}>
            <View style={styles.ctaCell}>
              <Button
                title="Add to Cart"
                icon={<Ionicons name="cart-outline" size={16} color={colors.textOnPrimary} />}
                onPress={() => addBestOffer()}
                disabled={!bestOffer}
              />
            </View>
            <View style={styles.ctaCell}>
              <Button
                title="Buy Now"
                variant="outline"
                icon={<Ionicons name="checkmark" size={16} color={colors.primary} />}
                onPress={() => addBestOffer(() => router.push('/cart' as any))}
                disabled={!bestOffer}
              />
            </View>
            <View style={styles.ctaCell}>
              <Button
                title="Request Quote"
                variant="outline"
                icon={<Ionicons name="chatbox-outline" size={16} color={colors.primary} />}
                onPress={() => router.push('/rfq/new' as any)}
              />
            </View>
            <View style={styles.ctaCell}>
              <Button
                title={wishlist.isSaved(p.id) ? 'Wishlisted' : 'Wishlist'}
                variant="outline"
                icon={
                  <Ionicons
                    name={wishlist.isSaved(p.id) ? 'heart' : 'heart-outline'}
                    size={16}
                    color={colors.primary}
                  />
                }
                onPress={() => {
                  if (!session) {
                    router.push('/(auth)/sign-in');
                    return;
                  }
                  wishlist.toggle.mutate({ productId: p.id });
                }}
              />
            </View>
          </View>
          <Pressable style={styles.shareRow} onPress={shareProduct} hitSlop={6}>
            <Ionicons name="share-social-outline" size={15} color={colors.textMuted} />
            <Text style={styles.shareText}>Share</Text>
          </Pressable>

          {/* Customer Reviews — web placeholder, copy exact */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Customer Reviews</Text>
          <View style={[styles.card, styles.reviewsCard]}>
            <Text style={styles.reviewsText}>
              Reviews from verified buyers will appear here once available.
            </Text>
          </View>

          {/* Related products */}
          {relatedItems.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Related products</Text>
              <View style={styles.relatedGrid}>
                {relatedItems.map((r) => (
                  <Pressable
                    key={r.id}
                    style={styles.relatedCard}
                    onPress={() =>
                      router.push(`/product/${buildProductParam(r as any)}` as any)
                    }
                  >
                    {r.images?.[0] ? (
                      <Image
                        source={{ uri: r.images[0] }}
                        style={styles.relatedImg}
                        contentFit="cover"
                        transition={150}
                      />
                    ) : (
                      <View style={[styles.relatedImg, styles.heroFallback]}>
                        <Ionicons name="cube-outline" size={24} color={colors.textFaint} />
                      </View>
                    )}
                    <View style={{ padding: spacing.sm }}>
                      <Text style={styles.relatedName} numberOfLines={2}>{r.name}</Text>
                      {r.min_price != null && (
                        <Text style={styles.relatedPrice}>{formatNaira(r.min_price)}</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </ScreenColumn>
      </ScrollView>

      {/* Sticky bottom bar — web PDP: Total + Add */}
      {bestOffer && (
        <View style={styles.stickyBar}>
          <View>
            <Text style={styles.stickyLabel}>Total</Text>
            <Text style={styles.stickyPrice}>{subtotal != null ? formatNaira(subtotal) : '—'}</Text>
          </View>
          <Pressable
            onPress={() => addBestOffer()}
            style={({ pressed }) => [styles.stickyBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="cart" size={16} color={colors.textOnPrimary} />
            <Text style={styles.stickyBtnText}>Add</Text>
          </Pressable>
        </View>
      )}

      {/* Cart preview sheet — stitch 06 */}
      <Modal
        visible={!!staged}
        transparent
        animationType="slide"
        onRequestClose={() => setStaged(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setStaged(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <View style={styles.sheetCheck}>
              <Ionicons name="checkmark" size={18} color={colors.textOnPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Added to cart</Text>
              {staged && (
                <Text style={styles.sheetMeta}>
                  {p.name} · {staged.quantity} × {formatNaira(staged.unitPrice)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.sheetLogistics}>
            <Ionicons name="car-outline" size={14} color={colors.secondary} />
            <Text style={styles.sheetLogisticsText}>
              Delivery is calculated for your destination at checkout.
            </Text>
          </View>
          <View style={styles.sheetActions}>
            <View style={{ flex: 1 }}>
              <Button
                title="Continue Shopping"
                variant="outline"
                onPress={() => setStaged(null)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="View Cart"
                onPress={() => {
                  setStaged(null);
                  router.push('/cart' as any);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: spacing.lg, paddingBottom: 120 },
  heroWrap: { marginBottom: spacing.lg },
  hero: { height: 280, borderRadius: radius.lg, backgroundColor: colors.surface },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  heroBadges: { position: 'absolute', top: spacing.md, left: spacing.md, flexDirection: 'row', gap: spacing.sm },
  gradeBadge: {
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  gradeBadgeText: { ...typography.micro, color: colors.textOnSecondary },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  certBadgeText: { ...typography.micro, color: colors.secondary },
  photoCount: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(26,26,46,0.7)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  photoCountText: { ...typography.micro, color: colors.background },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  catBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  catBadgeText: { ...typography.caption, color: colors.text, fontSize: 12 },
  brandBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  brandBadgeText: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  inStockBadge: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  inStockBadgeText: { ...typography.captionStrong, color: colors.secondary, fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.sm },
  ratingText: { ...typography.caption, color: colors.textMuted, marginLeft: 4 },
  lowestBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.xs,
  },
  lowestBadgeText: { ...typography.micro, color: colors.textMuted },
  soldBy: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  soldById: { fontFamily: 'monospace' as any, color: colors.text },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  factCell: { width: '46%', flexGrow: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  factLabel: { ...typography.caption, color: colors.textMuted },
  factValue: { ...typography.bodyStrong, color: colors.text, fontSize: 13, marginTop: 1 },
  name: { ...typography.h1, color: colors.text, fontSize: 22, marginTop: 4 },
  brand: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.md },
  price: { ...typography.h1, color: colors.secondary, fontSize: 24 },
  priceUnit: { ...typography.body, color: colors.textMuted },
  stock: { ...typography.captionStrong, color: colors.secondary, marginLeft: 'auto' },
  desc: { ...typography.body, color: colors.text, marginTop: spacing.md, lineHeight: 22 },
  dealRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  dealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dealChipText: { ...typography.bodyStrong, fontSize: 13 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitleInline: { ...typography.h3, color: colors.text },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cardCell: { width: '46%', flexGrow: 1 },
  cardLabel: { ...typography.caption, color: colors.textMuted },
  cardValue: { ...typography.bodyStrong, color: colors.text, marginTop: 2, fontSize: 13 },
  cardNote: { ...typography.micro, color: colors.textMuted, marginTop: spacing.md, lineHeight: 16 },
  qtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    ...shadows.card,
  },
  qtyTitle: { ...typography.bodyStrong, color: colors.text },
  qtyMeta: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  subtotalLabel: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.5 },
  subtotalValue: { ...typography.h3, color: colors.secondary },
  sectionTitle: { ...typography.h2, fontSize: 18, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  offer: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  offerBest: { borderWidth: 1.5, borderColor: colors.secondary },
  bestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  bestBadgeText: { ...typography.micro, color: colors.secondary, letterSpacing: 0.5 },
  offerHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  offerVendor: { ...typography.bodyStrong, color: colors.primary, flexShrink: 1 },
  offerVendorMeta: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  offerPriceBox: { alignItems: 'flex-end' },
  offerPrice: { ...typography.h3, color: colors.secondary },
  offerUnit: { ...typography.micro, color: colors.textMuted },
  offerMetaRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  offerMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  offerMeta: { ...typography.caption, color: colors.textMuted },
  sectionSub: { ...typography.body, color: colors.textMuted, marginTop: -spacing.sm, marginBottom: spacing.sm },
  ctaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  ctaCell: { width: '48%', flexGrow: 1 },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  shareText: { ...typography.body, color: colors.textMuted },
  reviewsCard: { alignItems: 'center', paddingVertical: spacing.xl },
  reviewsText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  relatedCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  relatedImg: { width: '100%', aspectRatio: 1, backgroundColor: colors.surface },
  relatedName: { ...typography.bodyStrong, color: colors.text, fontSize: 13, lineHeight: 18 },
  relatedPrice: { ...typography.bodyStrong, color: colors.primary, marginTop: 4 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sheetCheck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { ...typography.bodyStrong, color: colors.text },
  sheetMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  sheetLogistics: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  sheetLogisticsText: { ...typography.caption, color: colors.text, flex: 1 },
  sheetActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  stickyLabel: { ...typography.micro, color: 'rgba(255,255,255,0.6)' },
  stickyPrice: { ...typography.h3, color: colors.background },
  stickyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    height: 46,
  },
  stickyBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
