import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useDealPaymentState,
  useMyPriceLockParticipation,
  usePriceLock,
} from '@/features/deals/queries';
import {
  getDealWindowState,
  getDepositInfo,
  initiateDealPayment,
  joinPriceLock,
  type DeliveryAddress,
} from '@/features/deals/api';
import {
  calculatePriceLockCharges,
  useActiveChargeRules,
  useOrderCharges,
  type ChargeBreakdown,
} from '@/features/deals/charges';
import { DeliveryForm, isAddressComplete } from '@/features/deals/DeliveryForm';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { DetailSkeleton } from '@/components/Skeleton';
import { colors, radius, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { supabase } from '@/api/supabase';
import { ScreenColumn } from '@/components/Responsive';
import { StepProgress } from '@/components/StepProgress';
import { LockCertificate } from '@/features/deals/LockCertificate';

type Step = 'quantity' | 'delivery' | 'pay' | 'confirming' | 'done';

/**
 * Price-lock join + payment screen. Resumes from an existing participation:
 * unpaid → pay deposit; deposit_paid → pay balance (gateway ref gets the
 * `-balance` suffix so PalmPay treats it as a distinct transaction).
 */
export default function JoinPriceLockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const q = usePriceLock(id);
  const deal = q.data;
  const myParticipation = useMyPriceLockParticipation(id, userId);
  const existing = myParticipation.data;
  const chargesQ = useOrderCharges();
  const rulesQ = useActiveChargeRules();

  const [step, setStep] = useState<Step>('quantity');
  const [quantity, setQuantity] = useState(1);
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

  const resumeMode: 'none' | 'deposit' | 'balance' =
    !existing ? 'none' : existing.payment_status === 'deposit_paid' ? 'balance' : existing.payment_status === 'fully_paid' ? 'done' as any : 'deposit';
  const activeParticipantId = existing?.id ?? participantId;
  const paymentStep: 'deposit' | 'balance' = resumeMode === 'balance' ? 'balance' : 'deposit';

  const paymentState = useDealPaymentState(
    'price_lock',
    activeParticipantId ?? undefined,
    step === 'confirming',
  );

  const dep = getDepositInfo(deal?.payment_plan);
  const planFullPayment = dep.percentage >= 1;
  const lockQty = existing?.locked_quantity ?? quantity;
  const totalAmount = Number(deal?.locked_price ?? 0) * lockQty;

  // Live charge breakdown — settlement charges (everything except the product
  // deposit) attach to the deposit for full-payment plans, else the balance.
  // Computed inline — React Compiler memoizes; a manual useMemo here can't
  // express the `existing` dependency precisely enough.
  const breakdown: ChargeBreakdown | null =
    !deal || !chargesQ.data
      ? null
      : calculatePriceLockCharges(
          totalAmount,
          chargesQ.data,
          existing?.delivery_address
            ? {
                state: existing.delivery_address.state,
                city: existing.delivery_address.city,
              }
            : { state: address.state || undefined, city: address.city || undefined },
          rulesQ.data,
          { productId: deal.product_id ?? undefined, vendorId: deal.vendor_id ?? undefined },
        );

  const chargesTotal = breakdown
    ? breakdown.adminFee + breakdown.vat + breakdown.delivery + breakdown.customChargesTotal
    : 0;
  const depositDue =
    resumeMode === 'balance'
      ? 0
      : planFullPayment
        ? totalAmount + chargesTotal
        : totalAmount * dep.percentage;
  const balanceDue =
    resumeMode === 'balance' || planFullPayment === false
      ? totalAmount * (1 - dep.percentage) + (planFullPayment ? 0 : chargesTotal)
      : 0;

  if (q.isLoading || chargesQ.isLoading || myParticipation.isLoading)
    return <View style={{ flex: 1, padding: 16 }}><DetailSkeleton /></View>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (!deal) return <EmptyState title="Deal not found" />;
  if (!userId)
    return <EmptyState title="Sign in required" hint="Sign in to lock this price." />;

  const window = getDealWindowState(deal);
  const remaining = Math.max(
    0,
    (deal.total_available_quantity ?? 0) - (deal.current_locked_quantity ?? 0),
  );
  const maxQty = Math.min(remaining, deal.max_quantity_per_sme ?? remaining) || 1;

  const refreshSnapshot = async (pid: string) => {
    if (!breakdown) return;
    await supabase
      .from('price_lock_participants')
      .update({
        purchase_order_id: paymentStep === 'balance' ? `${pid}-balance` : pid,
        extra_charges: {
          adminFee: breakdown.adminFee,
          vat: breakdown.vat,
          delivery: breakdown.delivery,
          customCharges: breakdown.customCharges,
          total: chargesTotal,
          applied_rules: breakdown.appliedRules || [],
          snapshotAt: new Date().toISOString(),
        },
      } as any)
      .eq('id', pid);
  };

  const startPayment = async () => {
    if (!deal || !userId) return;
    setBusy(true);
    setPayError(null);
    try {
      let pid = existing?.id;

      // New join — insert participant (pending/unpaid).
      if (!pid) {
        pid = await joinPriceLock({
          priceLock: deal,
          userId,
          quantity,
          deliveryAddress: address,
          charges: chargesQ.data!,
          rules: rulesQ.data,
          ruleContext: {
            productId: deal.product_id ?? undefined,
            vendorId: deal.vendor_id ?? undefined,
          },
        });
        setParticipantId(pid);
      }

      // Balance payments must re-validate: webhook may have settled the
      // deposit (or cancelled) since this screen loaded.
      const { data: fresh } = await supabase
        .from('price_lock_participants')
        .select('id, status, payment_status')
        .eq('id', pid)
        .maybeSingle();
      if (!fresh) throw new Error('Participation not found — please restart.');
      if (paymentStep === 'balance' && fresh.payment_status !== 'deposit_paid') {
        if (fresh.payment_status === 'fully_paid') {
          setStep('done');
          return;
        }
        throw new Error('Deposit is not confirmed yet — wait for it to settle first.');
      }
      if (paymentStep === 'deposit' && fresh.payment_status !== 'unpaid') {
        setStep('done');
        return;
      }

      // Web refreshes extra_charges to live config at pay time.
      await refreshSnapshot(pid);

      const amount = paymentStep === 'balance' ? balanceDue : depositDue;
      const url = await initiateDealPayment({
        participantId: pid,
        amount,
        userId,
        title: deal.title,
        description:
          paymentStep === 'balance'
            ? `Price lock balance: ${deal.title} × ${lockQty}`
            : `Price lock deposit (${dep.label}): ${deal.title} × ${lockQty}`,
        dealType: 'price_lock',
        step: paymentStep,
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
  const fullyPaid = (paymentState.data as any)?.fullyPaid;
  const successTitle =
    paymentStep === 'balance' || fullyPaid ? 'Price locked!' : 'Deposit confirmed!';
  const successBody =
    paymentStep === 'balance' || fullyPaid
      ? `Your price is locked for ${deal.lock_duration_days ?? 30} days.`
      : `Deposit received — pay the ${dep.balanceLabel} balance before your lock expires.`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenColumn>
      <Stack.Screen
        options={{ title: paymentStep === 'balance' ? 'Pay balance' : 'Lock price' }}
      />
      {step !== 'done' && step !== 'confirming' && resumeMode === 'none' && (
        <StepProgress
          steps={['Quantity', 'Delivery', 'Pay']}
          current={step === 'quantity' ? 0 : step === 'delivery' ? 1 : 2}
        />
      )}

      {step !== 'done' && step !== 'confirming' && (
        <>
          <Text style={styles.dealTitle}>{deal.title}</Text>
          <Text style={styles.dealMeta}>
            {formatNaira(deal.locked_price ?? 0)} / unit · {remaining} available · locks{' '}
            {deal.lock_duration_days ?? 30} days
          </Text>
          {window !== 'joinable' && !existing && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                {window === 'upcoming' ? 'This deal has not started yet.' : 'This deal has ended.'}
              </Text>
            </View>
          )}
          {resumeMode === 'balance' && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Deposit confirmed — complete the {dep.balanceLabel} balance to finish your lock.
              </Text>
            </View>
          )}
        </>
      )}

      {step === 'quantity' && resumeMode === 'none' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How many units?</Text>
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
          <Text style={styles.hint}>
            Max {maxQty} units
            {deal.max_quantity_per_sme ? ` (${deal.max_quantity_per_sme} per buyer)` : ''}
          </Text>
          <Pressable
            style={[styles.primary, (window !== 'joinable' || remaining <= 0) && styles.disabled]}
            disabled={window !== 'joinable' || remaining <= 0}
            onPress={() => setStep('delivery')}
          >
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
        </View>
      )}

      {step === 'delivery' && resumeMode === 'none' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <DeliveryForm value={address} onChange={setAddress} />
          <View style={styles.rowButtons}>
            <Pressable style={styles.ghost} onPress={() => setStep('quantity')}>
              <Text style={styles.ghostText}>Back</Text>
            </Pressable>
            <Pressable
              style={[styles.primary, !isAddressComplete(address) && styles.disabled]}
              disabled={!isAddressComplete(address)}
              onPress={() => setStep('pay')}
            >
              <Text style={styles.primaryText}>Review</Text>
            </Pressable>
          </View>
        </View>
      )}

      {(step === 'pay' || (resumeMode !== 'none' && step === 'quantity')) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {paymentStep === 'balance' ? 'Balance due' : 'Review & pay'}
          </Text>
          <View style={styles.breakdown}>
            <Row
              label={`${lockQty} × ${formatNaira(deal.locked_price ?? 0)}`}
              value={totalAmount}
            />
            {!planFullPayment && paymentStep === 'deposit' && (
              <Row label={`Deposit (${dep.label})`} value={totalAmount * dep.percentage} />
            )}
            {planFullPayment || paymentStep === 'balance' ? (
              <>
                {breakdown && breakdown.adminFee > 0 && <Row label="Admin fee" value={breakdown.adminFee} />}
                {breakdown && breakdown.vat > 0 && <Row label="VAT" value={breakdown.vat} />}
                {breakdown && breakdown.delivery > 0 && <Row label="Delivery" value={breakdown.delivery} />}
                {breakdown?.customCharges.map((c) => (
                  <Row key={c.id} label={c.label} value={c.amount} />
                ))}
              </>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {paymentStep === 'balance' ? 'Balance due now' : 'Due now'}
              </Text>
              <Text style={styles.totalValue}>
                {formatNaira(paymentStep === 'balance' ? balanceDue : depositDue)}
              </Text>
            </View>
            {!planFullPayment && paymentStep === 'deposit' && (
              <Text style={styles.hint}>
                Balance of {formatNaira(totalAmount * (1 - dep.percentage) + chargesTotal)} due later
                (charges settle with the balance).
              </Text>
            )}
          </View>
          {!!payError && <Text style={styles.errorText}>{payError}</Text>}
          <View style={styles.rowButtons}>
            {resumeMode === 'none' && (
              <Pressable style={styles.ghost} onPress={() => setStep('delivery')}>
                <Text style={styles.ghostText}>Back</Text>
              </Pressable>
            )}
            <Pressable style={styles.primary} disabled={busy} onPress={startPayment}>
              <Text style={styles.primaryText}>
                {busy
                  ? 'Starting…'
                  : `Pay ${formatNaira(paymentStep === 'balance' ? balanceDue : depositDue)}`}
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

      {(step === 'done' || paid || resumeMode === ('done' as any)) && (
        <View style={styles.center}>
          <Ionicons name="checkmark-circle" size={64} color={colors.secondary} />
          <Text style={styles.confirmTitle}>{successTitle}</Text>
          <Text style={styles.confirmBody}>{successBody}</Text>
          {/* Price-lock certificate — stitch 14b */}
          <LockCertificate
            reference={activeParticipantId ?? deal.id}
            title={deal.title}
            lockedPrice={Number(deal.locked_price ?? 0)}
            quantity={lockQty}
            unit={null}
            days={deal.lock_duration_days ?? 30}
            createdAt={(existing as any)?.created_at}
            paymentStatus={existing?.payment_status ?? (paid ? 'fully_paid' : 'deposit_paid')}
          />
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
