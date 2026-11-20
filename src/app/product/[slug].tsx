import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProduct, useVendorOffers } from '@/features/catalog/queries';
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
import { useToast } from '@/components/Toast';

function OfferCard({
  offer,
  qty,
  productName,
  unifiedProductId,
  image,
  best,
}: {
  offer: VendorOffer;
  qty: number;
  productName: string;
  unifiedProductId: string;
  image: string | null;
  best?: boolean;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const toast = useToast();
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
      toast.show('success', 'Added to haulage queue');
    }
  };

  return (
    <View style={[styles.offer, best && styles.offerBest]}>
      {best && (
        <View style={styles.bestBadge}>
          <Text style={styles.bestBadgeText}>LOWEST LANDED COST</Text>
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
          <Text style={styles.offerVendorMeta}>Tier-1 Partner · Escrow Backed</Text>
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

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const heroWidth = Math.min(width, 560) - spacing.lg * 2;
  const { session } = useAuth();
  const product = useProduct(slug);
  const offers = useVendorOffers(product.data?.id);
  const deals = useProductDeals(product.data?.id);
  const wishlist = useWishlistToggle(session?.user.id);
  const [qty, setQty] = useState(1);

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

          <Text style={styles.kicker}>HEAVY CONSTRUCTION MATERIALS</Text>
          <Text style={styles.name}>{p.name}</Text>
          {!!p.brand && <Text style={styles.brand}>{p.brand}</Text>}

          {bestOffer && (
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatNaira(bestOffer.price)}</Text>
              {!!bestOffer.price_unit && <Text style={styles.priceUnit}>/ {bestOffer.price_unit}</Text>}
              {bestOffer.stock_quantity != null && (
                <Text style={styles.stock}>In Stock: {bestOffer.stock_quantity}</Text>
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

          {/* Logistics strip */}
          <View style={styles.logistics}>
            <View style={styles.logisticsHead}>
              <Ionicons name="navigate" size={16} color={colors.secondary} />
              <Text style={styles.logisticsTitle}>Proximity & Logistics Intelligence</Text>
              <View style={styles.liveChip}>
                <Text style={styles.liveChipText}>Live Dispatch</Text>
              </View>
            </View>
            <View style={styles.logisticsGrid}>
              <View style={styles.logisticsCell}>
                <Text style={styles.logisticsLabel}>HAULAGE RATE</Text>
                <Text style={styles.logisticsValue}>Quoted at checkout</Text>
              </View>
              <View style={styles.logisticsCell}>
                <Text style={styles.logisticsLabel}>TRANSIT ESTIMATE</Text>
                <Text style={styles.logisticsValue}>
                  {bestOffer?.lead_time_days ? `${bestOffer.lead_time_days} day${bestOffer.lead_time_days === 1 ? '' : 's'}` : '2–3 Hours'}
                </Text>
              </View>
            </View>
            <View style={styles.waybillNote}>
              <Ionicons name="document-text-outline" size={13} color={colors.secondary} />
              <Text style={styles.waybillNoteText}>Waybill tracking: real-time GPS enabled with weighbridge slip copy</Text>
            </View>
          </View>

          {/* Quantity + subtotal */}
          <View style={styles.qtyCard}>
            <View>
              <Text style={styles.qtyTitle}>Order Quantity</Text>
              {bestOffer?.min_order_quantity ? (
                <Text style={styles.qtyMeta}>Min order {bestOffer.min_order_quantity} · Palletized dispatch</Text>
              ) : null}
            </View>
            <Stepper value={qty} onChange={setQty} min={1} />
          </View>
          {subtotal != null && (
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>MATERIALS SUBTOTAL</Text>
              <Text style={styles.subtotalValue}>{formatNaira(subtotal)}</Text>
            </View>
          )}

          {/* Supplier offers */}
          <Text style={styles.sectionTitle}>Verified Supplier Offers</Text>
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
              />
            ))
          )}

          {/* Secondary CTAs */}
          <View style={styles.secondaryRow}>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/rfq/new' as any)}>
              <Ionicons name="document-text-outline" size={16} color={colors.secondary} />
              <Text style={styles.secondaryText}>Request RFQ</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => router.push('/deals' as any)}
            >
              <Ionicons name="lock-closed-outline" size={16} color={colors.primary} />
              <Text style={[styles.secondaryText, { color: colors.primary }]}>Price Lock (30%)</Text>
            </Pressable>
          </View>
        </ScreenColumn>
      </ScrollView>

      {/* Sticky add-to-cart bar */}
      {bestOffer && (
        <View style={styles.stickyBar}>
          <View>
            <Text style={styles.stickyLabel}>Total Price</Text>
            <Text style={styles.stickyPrice}>{subtotal != null ? formatNaira(subtotal) : '—'}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/cart' as any)}
            style={({ pressed }) => [styles.stickyBtn, pressed && { opacity: 0.9 }]}
          >
            <Ionicons name="cart" size={16} color={colors.textOnPrimary} />
            <Text style={styles.stickyBtnText}>View Cart</Text>
          </Pressable>
        </View>
      )}
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
  kicker: { ...typography.micro, color: colors.secondary, letterSpacing: 0.8 },
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
  logistics: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.xl,
    ...shadows.card,
  },
  logisticsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logisticsTitle: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  liveChip: { backgroundColor: colors.secondarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  liveChipText: { ...typography.micro, color: colors.secondary },
  logisticsGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  logisticsCell: { flex: 1 },
  logisticsLabel: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.5 },
  logisticsValue: { ...typography.bodyStrong, color: colors.text, marginTop: 2 },
  waybillNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  waybillNoteText: { ...typography.micro, color: colors.secondary, flex: 1 },
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
  secondaryRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 44,
    backgroundColor: colors.surfaceRaised,
  },
  secondaryText: { ...typography.captionStrong, color: colors.secondary },
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
