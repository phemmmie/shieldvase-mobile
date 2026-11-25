import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import { useUserAddresses, type UserAddress } from '@/features/addresses/queries';
import {
  createCheckoutSession,
  getDeliveryDetailsValidationError,
  processPayment,
  type DeliveryDetails,
} from '@/features/checkout/api';
import {
  creditTotal,
  getCheckoutAdjustments,
  resetCheckoutAdjustments,
  storeReferralSlug,
} from '@/features/checkout/adjustments';
import {
  DEFAULT_CHARGES,
  calculateOrderCharges,
  useOrderCharges,
  useServerOrderCharges,
} from '@/features/deals/charges';
import { Field, FormError } from '@/features/auth/components';
import { ScreenColumn } from '@/components/Responsive';
import { EmptyState, LoadingState } from '@/components/States';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, totalPrice, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const addresses = useUserAddresses(user?.id);

  const [form, setForm] = useState<DeliveryDetails>({
    fullName: (user?.user_metadata?.full_name as string) ?? '',
    email: user?.email ?? '',
    phone: (user?.user_metadata?.phone as string) ?? '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const adjustments = getCheckoutAdjustments();
  const credits = creditTotal(adjustments);
  const orderCharges = useOrderCharges();
  const charges = orderCharges.data || DEFAULT_CHARGES;
  const { data: serverCharges } = useServerOrderCharges(items, {
    state: form.state,
    city: form.city,
  });
  const clientBreakdown = calculateOrderCharges(totalPrice, charges, {
    state: form.state,
    city: form.city,
  });
  const { subtotal, adminFee, vat, delivery, total } =
    serverCharges?.breakdown ?? clientBreakdown;
  const grandTotal = Math.max(0, total - adjustments.promoAmount - credits);

  const set = (key: keyof DeliveryDetails) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const applyAddress = (a: UserAddress) => {
    setSelectedAddressId(a.id);
    setForm((f) => ({
      ...f,
      fullName: a.full_name || f.fullName,
      phone: a.phone || f.phone,
      address: a.street_address,
      city: a.city,
      state: a.state,
      deliveryInstructions: a.delivery_instructions ?? '',
    }));
  };

  const submit = async () => {
    const validationError = getDeliveryDetailsValidationError(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Server is authoritative for totals — client sends the item subtotal
      // and zeroed fees; convert_cart_to_order applies charge rules.
      const session = await createCheckoutSession({
        deliveryDetails: form,
        paymentMethod: 'transfer',
        items,
        subtotal: totalPrice,
        tax: 0,
        shipping: 0,
        total: grandTotal,
        creditApplied: credits,
        creditTransaction: adjustments.creditTransaction,
        creditDelivery: adjustments.creditDelivery,
        creditDiscount: adjustments.creditDiscount,
        discountCode: adjustments.promoCode,
        referralSlug: adjustments.referralSlug,
      });

      const result = await processPayment(
        session.id,
        'transfer',
        form,
        session.previousCheckoutSessionId,
        session.cartItemIds,
        session.quantities,
      );

      if (result.kind === 'paid') {
        await storeReferralSlug(null);
        resetCheckoutAdjustments();
        router.replace(`/payment-callback/${result.orderGroupId}?type=order`);
        return;
      }

      // Open PalmPay cashier page, then land on the poller screen. The
      // poller (not redirect params) is the source of truth.
      await WebBrowser.openBrowserAsync(result.cashierUrl);
      router.replace(`/payment-callback/${result.orderGroupId}?type=order`);
    } catch (e: any) {
      setError(e?.message ?? 'Checkout failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (cartLoading) return <LoadingState />;
  if (!items.length)
    return <EmptyState title="Nothing to check out" hint="Your cart is empty." />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenColumn>
        <View style={styles.banner}>
          <Ionicons name="shield-checkmark" size={14} color={colors.secondary} />
          <Text style={styles.bannerText}>CBN-REGULATED ESCROW · NIBSS SETTLEMENT</Text>
        </View>
        <Text style={styles.section}>Delivery details</Text>
        {!!addresses.data?.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.addrRail}
          >
            {addresses.data.map((a) => (
              <Pressable
                key={a.id}
                style={[styles.addrChip, selectedAddressId === a.id && styles.addrChipActive]}
                onPress={() => applyAddress(a)}
              >
                <Text
                  style={[
                    styles.addrChipText,
                    selectedAddressId === a.id && styles.addrChipTextActive,
                  ]}
                >
                  {a.label || 'Address'}
                  {a.is_primary ? ' · primary' : ''}
                </Text>
                <Text
                  style={[
                    styles.addrChipMeta,
                    selectedAddressId === a.id && styles.addrChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {a.city}, {a.state}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Field placeholder="Full name" value={form.fullName} onChangeText={set('fullName')} />
        <Field
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={set('email')}
        />
        <Field
          placeholder="Phone"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={set('phone')}
        />
        <Field placeholder="Street address" value={form.address} onChangeText={set('address')} />
        <Field placeholder="City" value={form.city} onChangeText={set('city')} />
        <Field placeholder="State" value={form.state} onChangeText={set('state')} />
        <Field
          placeholder="Delivery instructions (optional)"
          value={form.deliveryInstructions ?? ''}
          onChangeText={set('deliveryInstructions')}
        />

        <Text style={styles.section}>Payment</Text>
        <View style={styles.method}>
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Bank transfer / card</Text>
            <Text style={styles.methodHint}>Secure checkout via PalmPay</Text>
          </View>
          <View style={styles.methodBadge}>
            <Text style={styles.methodBadgeText}>PalmPay</Text>
          </View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
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
              Delivery{form.city || form.state ? ` to ${[form.city, form.state].filter(Boolean).join(', ')}` : ''}
            </Text>
            <Text style={styles.summaryValue}>
              {delivery === 0 ? 'FREE' : formatNaira(delivery)}
            </Text>
          </View>
          {adjustments.promoAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Promo discount</Text>
              <Text style={[styles.summaryValue, { color: colors.secondary }]}>
                -{formatNaira(adjustments.promoAmount)}
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
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatNaira(grandTotal)}</Text>
          </View>
          <Text style={styles.summaryNote}>
            The final total is confirmed server-side when the order is created —
            you’ll see the exact amount on the PalmPay page.
          </Text>
        </View>

        {/* Escrow channel — stitch 08/09 */}
        <View style={styles.channel}>
          <View style={styles.channelHead}>
            <Ionicons name="shield-checkmark" size={18} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.channelTitle}>ShieldVase CBN-Licensed Escrow</Text>
              <Text style={styles.channelMeta}>Funds locked until site sign-off · RECOMMENDED</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
          </View>
          <View style={styles.protocol}>
            {[
              ['Fund Lock & Truck Marshaling', 'Immediate'],
              ['Weighbridge Verified at Depot', 'Gate 2'],
              ['GPS Transit Telemetry', 'En route'],
              ['Engineer PIN Release at Site', 'Auto 72h'],
            ].map(([step, tag], i) => (
              <View key={step} style={styles.protocolRow}>
                <View style={styles.protocolDot} />
                <Text style={styles.protocolStep}>{i + 1}. {step}</Text>
                <Text style={styles.protocolTag}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <FormError message={error} />
        </ScreenColumn>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.payBtn} onPress={submit} disabled={busy}>
          <Text style={styles.payText}>
            {busy ? 'Preparing payment…' : 'Continue to payment'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  addrRail: { gap: spacing.sm, paddingBottom: spacing.md },
  addrChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 120,
  },
  addrChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  addrChipText: { ...typography.bodyStrong, color: colors.text, fontSize: 13 },
  addrChipMeta: { ...typography.micro, color: colors.textMuted, marginTop: 2, maxWidth: 160 },
  addrChipTextActive: { color: colors.primary },
  section: { ...typography.h2, color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  methodTitle: { ...typography.bodyStrong, color: colors.text },
  methodHint: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  methodBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  methodBadgeText: { ...typography.micro, color: colors.text, fontFamily: 'Inter_700Bold' },
  summary: {
    ...shadows.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...typography.body, color: colors.textMuted },
  summaryValue: { ...typography.bodyStrong, color: colors.text },
  summaryTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  summaryTotalLabel: { ...typography.bodyStrong, color: colors.text },
  summaryTotalValue: { ...typography.h3, color: colors.text },
  summaryNote: { ...typography.micro, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.navy,
  },
  payBtn: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  payText: { ...typography.bodyStrong, fontSize: 16, color: colors.textOnPrimary },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.pill,
    paddingVertical: 6,
    marginBottom: spacing.lg,
  },
  bannerText: { ...typography.micro, color: colors.secondary, letterSpacing: 0.6 },
  channel: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  channelHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  channelTitle: { ...typography.bodyStrong, color: colors.text },
  channelMeta: { ...typography.micro, color: colors.secondary, marginTop: 1 },
  protocol: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  protocolRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  protocolDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary },
  protocolStep: { ...typography.caption, color: colors.text, flex: 1 },
  protocolTag: { ...typography.micro, color: colors.textMuted },
});
