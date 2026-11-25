import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { supabase } from '@/api/supabase';
import { useCart, type CartItem } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import { usePrimaryAddress } from '@/features/addresses/queries';
import { useWishlistToggle } from '@/features/wishlist/queries';
import {
  DEFAULT_CHARGES,
  calculateOrderCharges,
  useOrderCharges,
  useServerOrderCharges,
} from '@/features/deals/charges';
import {
  creditTotal,
  getStoredReferralSlug,
  setCheckoutAdjustments,
  storeReferralSlug,
} from '@/features/checkout/adjustments';
import { ListSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';

type VendorGroup = { vendorId: string; vendorName: string; items: CartItem[] };

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, totalPrice, loading } = useCart();
  const { user } = useAuth();
  const primaryAddress = usePrimaryAddress(user?.id);
  const wishlist = useWishlistToggle(user?.id);

  // Promo / referral / reward-credit state — same fields web CartContent keeps.
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<{ id: string; amount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState('');
  const [appliedRef, setAppliedRef] = useState<string | null>(null);
  const [refError, setRefError] = useState<string | null>(null);
  const [creditTx, setCreditTx] = useState(0);
  const [creditDv, setCreditDv] = useState(0);
  const [creditDc, setCreditDc] = useState(0);
  const [promoBusy, setPromoBusy] = useState(false);

  useEffect(() => {
    getStoredReferralSlug().then((slug) => {
      if (slug) {
        setRefCode(slug);
        setAppliedRef(slug);
      }
    });
  }, []);

  const vendorIds = useMemo(
    () => [...new Set(items.map((i) => i.vendor_id).filter(Boolean))] as string[],
    [items],
  );

  const vendorNames = useQuery({
    queryKey: ['cart-vendor-names', vendorIds],
    enabled: vendorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('vendor_profiles')
        .select('user_id, business_name')
        .in('user_id', vendorIds);
      return new Map(
        (data ?? []).map((v: any) => [v.user_id, v.business_name as string]),
      );
    },
  });

  // "Sold by" uses vendor_id — the reference value used to identify vendors
  // and their products throughout the application (vendor_directory is a
  // public view that resolves regardless of verification_status).
  const vendorLabels = useQuery({
    queryKey: ['cart-vendor-labels', vendorIds],
    enabled: vendorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('vendor_directory')
        .select('user_id, vendor_id')
        .in('user_id', vendorIds);
      return new Map(
        (data ?? []).map((v: any) => [v.user_id, v.vendor_id as string]),
      );
    },
  });

  const groups = useMemo<VendorGroup[]>(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of items) {
      const key = item.vendor_id ?? 'unknown';
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].map(([vendorId, groupItems]) => ({
      vendorId,
      vendorName: vendorNames.data?.get(vendorId) ?? 'Supplier',
      items: groupItems,
    }));
  }, [items, vendorNames.data]);

  // Reward-credit balance (earned, unspent) — reward_wallets by reward_kind.
  const { data: walletRows } = useQuery({
    queryKey: ['credit-balance', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await (supabase.from as any)('reward_wallets')
        .select('wallet_source, reward_kind, available')
        .eq('user_id', user!.id);
      return data || [];
    },
  });
  const creditByKind = (walletRows || []).reduce((m: any, r: any) => {
    m[r.reward_kind || 'transaction_credit'] =
      (m[r.reward_kind || 'transaction_credit'] || 0) + Number(r.available);
    return m;
  }, {});
  const creditTxAvail = creditByKind.transaction_credit || 0;
  const creditDvAvail = creditByKind.delivery_credit || 0;
  const creditDcAvail = creditByKind.discount_credit || 0;
  const credits = creditTotal({
    promoCode: null,
    promoAmount: 0,
    creditTransaction: creditTx,
    creditDelivery: creditDv,
    creditDiscount: creditDc,
    referralSlug: null,
  });

  // Server-authoritative charges — same RPC convert_cart_to_order runs.
  const location = {
    state: primaryAddress.data?.state || undefined,
    city: primaryAddress.data?.city || undefined,
  };
  const hasDestination = !!(location.state || location.city);
  const orderCharges = useOrderCharges();
  const charges = orderCharges.data || DEFAULT_CHARGES;
  const { data: serverCharges } = useServerOrderCharges(items, location);
  const clientBreakdown = calculateOrderCharges(totalPrice, charges, location);
  const { subtotal, adminFee, vat, delivery, customCharges, total } =
    serverCharges?.breakdown ?? clientBreakdown;

  const grandTotal = Math.max(0, total - (appliedCode?.amount || 0) - credits);
  const destinationLabel = [primaryAddress.data?.city, primaryAddress.data?.state]
    .filter(Boolean)
    .join(', ');
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoBusy(true);
    setPromoError(null);
    try {
      const { data: dc } = await (supabase.from as any)('discount_codes')
        .select('id, discount_type, amount, expires_at, max_uses, used_count')
        .ilike('code', promoCode.trim())
        .eq('active', true)
        .maybeSingle();
      if (
        !dc ||
        (dc.expires_at && new Date(dc.expires_at) < new Date()) ||
        (dc.max_uses && dc.used_count >= dc.max_uses)
      ) {
        setPromoError('This code is expired or exhausted.');
        setAppliedCode(null);
        return;
      }
      setAppliedCode({
        id: dc.id,
        amount:
          dc.discount_type === 'percent'
            ? Math.round((total * dc.amount) / 100)
            : Math.min(dc.amount, total),
      });
    } finally {
      setPromoBusy(false);
    }
  };

  const applyRef = async () => {
    if (!refCode.trim()) return;
    setRefError(null);
    const { data: owner } = await (supabase.rpc as any)('resolve_referral_code', {
      p_code: refCode.trim(),
    });
    if (!owner) {
      setRefError('Invalid referral code');
      return;
    }
    setAppliedRef(refCode.trim());
    await storeReferralSlug(refCode.trim());
  };

  const goCheckout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCheckoutAdjustments({
      promoCode: appliedCode ? promoCode.trim().toUpperCase() : null,
      promoAmount: appliedCode?.amount || 0,
      creditTransaction: creditTx,
      creditDelivery: creditDv,
      creditDiscount: creditDc,
      referralSlug: appliedRef,
    });
    router.push('/checkout');
  };

  const creditRows = [
    { label: 'Transaction credit', avail: creditTxAvail, val: creditTx, set: setCreditTx, cap: total },
    { label: 'Delivery credit', avail: creditDvAvail, val: creditDv, set: setCreditDv, cap: delivery || 0 },
    { label: 'Discount credit', avail: creditDcAvail, val: creditDc, set: setCreditDc, cap: total },
  ].filter((c) => c.avail > 0);

  if (loading && !items.length)
    return (
      <View style={{ flex: 1, padding: spacing.lg }}>
        <ListSkeleton count={4} />
      </View>
    );
  if (!items.length)
    return (
      <View style={styles.screen}>
        <ScreenColumn>
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cart-outline" size={40} color={colors.textFaint} />
            </View>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyHint}>
              Browse products and add supplier offers to get started.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)' as any)}
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.emptyBtnText}>Browse Materials</Text>
            </Pressable>
          </View>
        </ScreenColumn>
      </View>
    );

  return (
    <View style={styles.screen}>
      <ScreenColumn>
        <FlatList
          data={groups}
          keyExtractor={(g) => g.vendorId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 60).duration(220)} style={styles.group}>
              {/* Vendor head */}
              <View style={styles.vendorHead}>
                <View style={{ flex: 1 }}>
                  <View style={styles.vendorRow}>
                    <Text style={styles.vendorName} numberOfLines={1}>{group.vendorName}</Text>
                    <Ionicons name="checkmark-circle" size={13} color={colors.secondary} />
                  </View>
                  <Text style={styles.vendorMeta}>{group.items.length} item{group.items.length === 1 ? '' : 's'}</Text>
                </View>
                <View style={styles.escrowBadge}>
                  <Ionicons name="shield-checkmark" size={11} color={colors.secondary} />
                  <Text style={styles.escrowBadgeText}>Escrow</Text>
                </View>
              </View>

              {group.items.map((item) => {
                const vendId = vendorLabels.data?.get(item.vendor_id ?? '');
                const saved = wishlist.isSaved(
                  item.product_id ?? item.unified_product_id,
                  item.vendor_product_id,
                );
                return (
                  <View key={item.id} style={styles.item}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbFallback]}>
                        <Ionicons name="cube-outline" size={20} color={colors.textFaint} />
                      </View>
                    )}
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.soldBy}>
                        Sold by: <Text style={styles.soldById}>{vendId || '…'}</Text>
                      </Text>
                      <Text style={styles.itemPrice}>{formatNaira(item.price)}</Text>
                      {item.selected_specs &&
                        Object.values(item.selected_specs).map((s) => (
                          <Text key={s.label} style={styles.spec}>
                            {s.label}: {s.value}
                          </Text>
                        ))}
                      <View style={styles.itemActions}>
                        <View style={styles.stepper}>
                          <Pressable
                            style={styles.stepBtn}
                            onPress={() => {
                              Haptics.selectionAsync();
                              updateQuantity(item.id, item.quantity - 1);
                            }}
                            hitSlop={8}
                          >
                            <Ionicons name="remove" size={16} color={colors.text} />
                          </Pressable>
                          <Text style={styles.qty}>{item.quantity}</Text>
                          <Pressable
                            style={styles.stepBtn}
                            onPress={() => {
                              Haptics.selectionAsync();
                              updateQuantity(item.id, item.quantity + 1);
                            }}
                            hitSlop={8}
                          >
                            <Ionicons name="add" size={16} color={colors.text} />
                          </Pressable>
                        </View>
                        <View style={styles.itemBtns}>
                          {!!user && (
                            <Pressable
                              onPress={() =>
                                wishlist.toggle.mutate({
                                  productId: item.product_id ?? item.unified_product_id,
                                  vendorProductId: item.vendor_product_id,
                                })
                              }
                              hitSlop={8}
                            >
                              <Ionicons
                                name={saved ? 'heart' : 'heart-outline'}
                                size={18}
                                color={saved ? colors.destructive : colors.textMuted}
                              />
                            </Pressable>
                          )}
                          <Pressable onPress={() => removeFromCart(item.id)} hitSlop={8}>
                            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.itemSubtotal}>{formatNaira(item.price * item.quantity)}</Text>
                  </View>
                );
              })}
            </Animated.View>
          )}
          ListFooterComponent={
            <>
              {/* Consolidated logistics — stitch 07 */}
              <View style={styles.logisticsCard}>
                <View style={styles.logisticsHead}>
                  <Ionicons name="bus" size={16} color={colors.secondary} />
                  <Text style={styles.logisticsTitle}>CONSOLIDATED LOGISTICS</Text>
                  <Text style={styles.logisticsMeta}>Dual Dispatch</Text>
                </View>
                <Text style={styles.logisticsBody}>
                  Fleet class and haulage rates are matched automatically at checkout based on
                  your delivery site.
                </Text>
              </View>

              {/* Promo + referral codes */}
              <View style={styles.codeCard}>
                <View style={styles.codeRow}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="Enter promo code"
                    placeholderTextColor={colors.textFaint}
                    autoCapitalize="characters"
                    value={promoCode}
                    onChangeText={setPromoCode}
                  />
                  <Pressable
                    style={[styles.codeBtn, promoBusy && { opacity: 0.6 }]}
                    onPress={applyPromo}
                    disabled={promoBusy}
                  >
                    <Text style={styles.codeBtnText}>Apply</Text>
                  </Pressable>
                </View>
                {appliedCode && (
                  <Text style={styles.codeOk}>
                    {promoCode.toUpperCase()} discount applied.
                  </Text>
                )}
                {promoError && <Text style={styles.codeErr}>{promoError}</Text>}
                <View style={styles.codeRow}>
                  <TextInput
                    style={styles.codeInput}
                    placeholder="Referral code"
                    placeholderTextColor={colors.textFaint}
                    autoCapitalize="characters"
                    value={refCode}
                    onChangeText={setRefCode}
                  />
                  <Pressable style={styles.codeBtn} onPress={applyRef}>
                    <Text style={styles.codeBtnText}>Apply</Text>
                  </Pressable>
                </View>
                {appliedRef && !refError && (
                  <Text style={styles.codeOk}>Referral code applied</Text>
                )}
                {refError && <Text style={styles.codeErr}>{refError}</Text>}
              </View>

              {/* Reward credits */}
              {creditRows.map((c) => (
                <View key={c.label} style={styles.creditRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.creditLabel}>{c.label}</Text>
                    <Text style={styles.creditAvail}>
                      Available: {formatNaira(c.avail)}
                    </Text>
                  </View>
                  {c.val > 0 ? (
                    <View style={styles.creditApplied}>
                      <Text style={styles.creditAppliedText}>-{formatNaira(c.val)}</Text>
                      <Pressable onPress={() => c.set(0)} hitSlop={6}>
                        <Text style={styles.creditRemove}>Remove</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.creditUseBtn}
                      onPress={() => c.set(Math.min(c.avail, c.cap))}
                    >
                      <Text style={styles.creditUseText}>Use</Text>
                    </Pressable>
                  )}
                </View>
              ))}

              {/* Escrow note */}
              <View style={styles.escrowNote}>
                <Ionicons name="shield-checkmark" size={16} color={colors.secondary} />
                <Text style={styles.escrowNoteText}>
                  ShieldVase CBN-Regulated Escrow — funds are locked securely and will not
                  disburse to vendors until weighbridge manifests & offloading are signed at site.
                </Text>
              </View>

              {/* Order summary — same rows as web CartContent */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>ORDER SUMMARY</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Subtotal ({items.length} item{items.length === 1 ? '' : 's'} · {totalQty} units)
                  </Text>
                  <Text style={styles.summaryValue}>{formatNaira(subtotal)}</Text>
                </View>
                {charges.adminFeePercent > 0 && adminFee > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Admin Fee ({charges.adminFeePercent}%)</Text>
                    <Text style={styles.summaryValue}>{formatNaira(adminFee)}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>VAT ({charges.vatPercent}%)</Text>
                  <Text style={styles.summaryValue}>{formatNaira(vat)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Delivery{destinationLabel ? ` to ${destinationLabel}` : ''}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {delivery === 0 ? 'FREE' : formatNaira(delivery)}
                  </Text>
                </View>
                {customCharges
                  .filter((c) => c.visible)
                  .map((c) => (
                    <View key={c.id} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{c.label}</Text>
                      <Text style={styles.summaryValue}>{formatNaira(c.amount)}</Text>
                    </View>
                  ))}
                {!hasDestination && (
                  <Text style={styles.summaryMuted}>
                    Exact delivery fee is calculated after the destination is selected.
                  </Text>
                )}
                {appliedCode && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Promo discount</Text>
                    <Text style={[styles.summaryValue, { color: colors.secondary }]}>
                      -{formatNaira(appliedCode.amount)}
                    </Text>
                  </View>
                )}
                {credits > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Reward credit</Text>
                    <Text style={[styles.summaryValue, { color: colors.secondary }]}>
                      -{formatNaira(credits)}
                    </Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatNaira(grandTotal)}</Text>
                </View>
              </View>
            </>
          }
        />
      </ScreenColumn>

      {/* Sticky escrow-lock bar */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.subtotalLabel}>TOTAL</Text>
          <Text style={styles.subtotal}>{formatNaira(grandTotal)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.checkoutBtn, pressed && { opacity: 0.9 }]}
          onPress={goCheckout}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingTop: spacing.lg, paddingBottom: spacing['4xl'] },
  group: {
    ...shadows.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceRaised,
  },
  vendorHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  vendorName: { ...typography.bodyStrong, color: colors.secondary, flexShrink: 1 },
  vendorMeta: { ...typography.micro, color: colors.textMuted, marginTop: 1 },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  escrowBadgeText: { ...typography.micro, color: colors.secondary },
  item: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surface },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1 },
  itemName: { ...typography.bodyStrong, color: colors.text, fontSize: 13 },
  soldBy: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  soldById: { fontFamily: 'Inter_600SemiBold', color: colors.textMuted },
  itemPrice: { ...typography.caption, color: colors.primary, marginTop: 2 },
  spec: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  itemActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  itemBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemSubtotal: { ...typography.captionStrong, color: colors.text, alignSelf: 'flex-start' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  stepBtn: { padding: spacing.sm },
  qty: { ...typography.bodyStrong, color: colors.text, minWidth: 24, textAlign: 'center' },
  logisticsCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  logisticsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logisticsTitle: { ...typography.micro, color: colors.text, letterSpacing: 0.5, flex: 1 },
  logisticsMeta: { ...typography.micro, color: colors.secondary },
  logisticsBody: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  codeCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  codeRow: { flexDirection: 'row', gap: spacing.sm },
  codeInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  codeBtn: {
    height: 42,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBtnText: { ...typography.captionStrong, color: colors.textOnPrimary, fontSize: 12 },
  codeOk: { ...typography.micro, color: colors.secondary },
  codeErr: { ...typography.micro, color: colors.destructive },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  creditLabel: { ...typography.bodyStrong, color: colors.text, fontSize: 13 },
  creditAvail: { ...typography.micro, color: colors.textMuted, marginTop: 2 },
  creditUseBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  creditUseText: { ...typography.captionStrong, color: colors.primary, fontSize: 12 },
  creditApplied: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  creditAppliedText: { ...typography.captionStrong, color: colors.secondary },
  creditRemove: { ...typography.micro, color: colors.destructive },
  escrowNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  escrowNoteText: { ...typography.caption, color: colors.text, flex: 1 },
  summaryCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  summaryTitle: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.6, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  summaryLabel: { ...typography.caption, color: colors.textMuted, flex: 1 },
  summaryValue: { ...typography.captionStrong, color: colors.text },
  summaryMuted: { ...typography.micro, color: colors.textMuted, marginTop: spacing.xs, lineHeight: 16 },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalLabel: { ...typography.bodyStrong, color: colors.text },
  totalValue: { ...typography.h3, color: colors.text },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.navy,
    gap: spacing.md,
  },
  subtotalLabel: { ...typography.micro, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
  subtotal: { ...typography.h2, fontSize: 18, color: colors.background },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 48,
  },
  checkoutText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.h2, color: colors.text },
  emptyHint: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing['2xl'] },
  emptyBtn: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    height: 46,
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  emptyBtnText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
