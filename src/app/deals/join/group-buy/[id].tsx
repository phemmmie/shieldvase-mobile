import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useDealPaymentState,
  useGroupBuy,
  useMyGroupBuyParticipation,
} from '@/features/deals/queries';
import {
  getDealWindowState,
  initiateDealPayment,
  joinGroupBuy,
  type DeliveryAddress,
} from '@/features/deals/api';
import {
  calculateGroupBuyCharges,
  useActiveChargeRules,
  useOrderCharges,
} from '@/features/deals/charges';
import { getMissingAxes, useVariantAxes } from '@/features/deals/variants';
import { VariantPicker } from '@/features/deals/VariantPicker';
import { DeliveryForm, isAddressComplete } from '@/features/deals/DeliveryForm';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { DetailSkeleton } from '@/components/Skeleton';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { supabase } from '@/api/supabase';
import { ScreenColumn } from '@/components/Responsive';
import { StepProgress } from '@/components/StepProgress';

type Step = 'quantity' | 'delivery' | 'pay' | 'confirming' | 'done';

export default function JoinGroupBuyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const q = useGroupBuy(id);
  const deal = q.data;
  const myParticipation = useMyGroupBuyParticipation(id, userId);
  const chargesQ = useOrderCharges();
  const rulesQ = useActiveChargeRules();
  const { axes, availableValues } = useVariantAxes(deal?.unified_product_id, deal?.vendor_id);

  const [step, setStep] = useState<Step>('quantity');
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
  });
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const paymentState = useDealPaymentState('group_buy', participantId ?? undefined, step === 'confirming');

  const eligible = (deal?.eligible_variants ?? {}) as Record<string, string[]>;
  const missingAxes = getMissingAxes(axes, eligible, availableValues, variants);

  const breakdown =
    !deal || !chargesQ.data
      ? null
      : calculateGroupBuyCharges(
          Number(deal.group_buy_price) * quantity,
          chargesQ.data,
          { state: address.state || undefined, city: address.city || undefined },
          rulesQ.data,
          { productId: deal.product_id ?? undefined, vendorId: deal.vendor_id ?? undefined },
        );

  if (q.isLoading || chargesQ.isLoading) return <View style={{ flex: 1, padding: 16 }}><DetailSkeleton /></View>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (!deal) return <EmptyState title="Deal not found" />;
  if (!userId)
    return <EmptyState title="Sign in required" hint="Sign in to join this group buy." />;

  const window = getDealWindowState(deal);
  const remaining = Math.max(0, (deal.target_quantity ?? 0) - (deal.current_quantity ?? 0));
  const maxQty = remaining || 1;
  const dealState = deal.location?.split('-')[0]?.trim();
  const locationMismatch =
    !!dealState && !!address.state && address.state.trim().toLowerCase() !== dealState.toLowerCase();
  const alreadyPaid =
    myParticipation.data?.status === 'active' || myParticipation.data?.status === 'completed';

  const startPayment = async () => {
    if (!deal || !userId) return;
    setBusy(true);
    setPayError(null);
    try {
      const pid = await joinGroupBuy({
        groupBuy: deal,
        userId,
        quantity,
        deliveryAddress: address,
        selectedVariants: variants,
        charges: chargesQ.data!,
        rules: rulesQ.data,
        ruleContext: { productId: deal.product_id ?? undefined, vendorId: deal.vendor_id ?? undefined },
      });
      setParticipantId(pid);

      // Persist resolved variants on the participant row (best-effort).
      if (Object.keys(variants).length) {
        await supabase
          .from('group_buy_participants')
          .update({ selected_variants: variants } as any)
          .eq('id', pid);
      }

      const url = await initiateDealPayment({
        participantId: pid,
        amount: breakdown?.total ?? Number(deal.group_buy_price) * quantity,
        userId,
        title: deal.title,
        description: `Group buy: ${deal.title} × ${quantity}`,
        dealType: 'group_buy',
      });
      setStep('confirming');
      await WebBrowser.openBrowserAsync(url);
    } catch (e: any) {
      setPayError(e?.message ?? 'Could not start payment');
      setStep('pay');
    } finally {
      setBusy(false);
    }
  };

  const paid = paymentState.data?.paid;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenColumn>
      <Stack.Screen options={{ title: 'Join group buy' }} />
      {step !== 'done' && step !== 'confirming' && (
        <StepProgress
          steps={['Quantity', 'Delivery', 'Pay']}
          current={step === 'quantity' ? 0 : step === 'delivery' ? 1 : 2}
        />
      )}

      {step !== 'done' && step !== 'confirming' && (
        <>
          <Text style={styles.dealTitle}>{deal.title}</Text>
          <Text style={styles.dealMeta}>
            {formatNaira(deal.group_buy_price ?? 0)} / {deal.unit_of_measurement ?? 'unit'} ·{' '}
            {remaining} remaining
            {dealState ? ` · ${deal.location}` : ''}
          </Text>
          {window !== 'joinable' && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                {window === 'upcoming' ? 'This deal has not started yet.' : 'This deal has ended.'}
              </Text>
            </View>
          )}
          {alreadyPaid && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>You’ve already joined and paid for this deal.</Text>
            </View>
          )}
        </>
      )}

      {step === 'quantity' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => setQuantity((n) => Math.max(1, n - 1))}>
              <Ionicons name="remove" size={20} color={colors.primary} />
            </Pressable>
            <Text style={styles.stepValue}>{quantity}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setQuantity((n) => Math.min(maxQty, n + 1))}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.hint}>Max {maxQty} {deal.unit_of_measurement ?? 'units'}</Text>

          {axes.length > 0 && (
            <View style={{ marginTop: spacing.lg }}>
              <VariantPicker
                unifiedProductId={deal.unified_product_id}
                vendorId={deal.vendor_id}
                eligibleVariants={eligible}
                value={variants}
                onChange={setVariants}
              />
              {missingAxes.length > 0 && (
                <Text style={styles.errorText}>Select: {missingAxes.join(', ')}</Text>
              )}
            </View>
          )}

          <Pressable
            style={[styles.primary, (window !== 'joinable' || alreadyPaid || missingAxes.length > 0) && styles.disabled]}
            disabled={window !== 'joinable' || alreadyPaid || missingAxes.length > 0}
            onPress={() => setStep('delivery')}
          >
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
        </View>
      )}

      {step === 'delivery' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <DeliveryForm value={address} onChange={setAddress} />
          {locationMismatch && (
            <Text style={styles.errorText}>
              This deal is limited to {deal.location}. Delivery state must be {dealState}.
            </Text>
          )}
          <View style={styles.rowButtons}>
            <Pressable style={styles.ghost} onPress={() => setStep('quantity')}>
              <Text style={styles.ghostText}>Back</Text>
            </Pressable>
            <Pressable
              style={[styles.primary, (!isAddressComplete(address) || locationMismatch) && styles.disabled]}
              disabled={!isAddressComplete(address) || locationMismatch}
              onPress={() => setStep('pay')}
            >
              <Text style={styles.primaryText}>Review</Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 'pay' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review & pay</Text>
          {breakdown && (
            <View style={styles.breakdown}>
              <Row label={`${quantity} × ${formatNaira(deal.group_buy_price ?? 0)}`} value={breakdown.subtotal} />
              {breakdown.adminFee > 0 && <Row label="Admin fee" value={breakdown.adminFee} />}
              {breakdown.vat > 0 && <Row label="VAT" value={breakdown.vat} />}
              {breakdown.delivery > 0 && <Row label="Shared delivery" value={breakdown.delivery} />}
              {breakdown.customCharges.map((c) => (
                <Row key={c.id} label={c.label} value={c.amount} />
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatNaira(breakdown.total)}</Text>
              </View>
            </View>
          )}
          {!!payError && <Text style={styles.errorText}>{payError}</Text>}
          <View style={styles.rowButtons}>
            <Pressable style={styles.ghost} onPress={() => setStep('delivery')}>
              <Text style={styles.ghostText}>Back</Text>
            </Pressable>
            <Pressable style={styles.primary} disabled={busy} onPress={startPayment}>
              <Text style={styles.primaryText}>
                {busy ? 'Starting…' : `Pay ${formatNaira(breakdown?.total ?? 0)}`}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 'confirming' && !paid && (
        <View style={styles.center}>
          <LoadingState label="" />
          <Text style={styles.confirmTitle}>Complete payment in the browser</Text>
          <Text style={styles.confirmBody}>
            We’re waiting for PalmPay to confirm your payment. This page updates automatically.
          </Text>
          {paymentState.data?.failed && (
            <Text style={styles.errorText}>Payment failed — no money was taken.</Text>
          )}
          <Pressable style={styles.ghost} onPress={() => setStep('pay')}>
            <Text style={styles.ghostText}>Back to review</Text>
          </Pressable>
        </View>
      )}

      {(step === 'done' || paid) && (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={72} color={colors.secondary} />
          <Text style={styles.confirmTitle}>You’re in!</Text>
          <Text style={styles.confirmBody}>
            Payment confirmed — you’ve joined {deal.title}. Track progress in My Deals.
          </Text>
          <Pressable style={styles.primary} onPress={() => router.replace('/deals')}>
            <Text style={styles.primaryText}>View my deals</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.ghostText}>Back to shopping</Text>
          </Pressable>
        </View>
      )}
          </ScreenColumn>
</ScrollView>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.breakRow}>
      <Text style={styles.breakLabel}>{label}</Text>
      <Text style={styles.breakValue}>{formatNaira(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  dealTitle: { ...typography.h2, color: colors.text },
  dealMeta: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  section: { marginTop: spacing.xl, gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    alignSelf: 'flex-start',
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { ...typography.h2, color: colors.text, minWidth: 48, textAlign: 'center' },
  hint: { ...typography.caption, color: colors.textMuted },
  primary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  disabled: { opacity: 0.45 },
  ghost: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  ghostText: { ...typography.bodyStrong, color: colors.primary },
  rowButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  breakdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakLabel: { ...typography.body, color: colors.textMuted },
  breakValue: { ...typography.body, color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  totalLabel: { ...typography.bodyStrong, color: colors.text },
  totalValue: { ...typography.bodyStrong, color: colors.primary },
  notice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  errorText: { ...typography.caption, color: colors.destructive },
  center: { alignItems: 'center', paddingVertical: spacing['3xl'], gap: spacing.md },
  confirmTitle: { ...typography.h2, color: colors.text, textAlign: 'center' },
  confirmBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
