import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { useOrderGroupPaymentState } from '@/features/orders/queries';
import { useDealPaymentState } from '@/features/deals/queries';
import { useCart } from '@/features/cart/CartContext';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { PaymentStatusArt } from '@/components/PaymentStatusArt';
import { Button } from '@/components/Button';
import { colors, radius, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatNaira } from '@/utils/money';

/**
 * Deep-link target for shieldvase://payment-callback/<ref> AND the
 * post-browser landing screen. Polls the database — the webhook is the sole
 * authority; redirect params are never trusted (doc 06).
 *
 * ?type=group_buy|price_lock → participant payment state; otherwise an order
 * group reference (checkout flow). ?step=balance resolves fully_paid only.
 */
export default function PaymentCallbackScreen() {
  const router = useRouter();
  const { ref, type, step } = useLocalSearchParams<{
    ref: string;
    type?: string;
    step?: string;
  }>();
  const dealType = type === 'group_buy' || type === 'price_lock' ? type : null;
  const { clearCart } = useCart();
  const orderState = useOrderGroupPaymentState(dealType ? undefined : ref);
  const dealState = useDealPaymentState(dealType ?? undefined, ref, !!dealType);

  if (dealType) return <DealCallback dealType={dealType} state={dealState} step={step} />;
  return <OrderCallback refId={ref!} state={orderState} clearCart={clearCart} router={router} />;
}

function EscrowMilestones({ steps }: { steps: string[] }) {
  return (
    <View style={ms.card}>
      <Text style={ms.title}>ESCROW RELEASE PROTOCOL</Text>
      {steps.map((step, i) => (
        <View key={step} style={ms.row}>
          <View style={[ms.dot, i === 0 && ms.dotActive]}>
            {i === 0 ? (
              <Ionicons name="checkmark" size={10} color="#fff" />
            ) : (
              <View style={ms.dotInner} />
            )}
          </View>
          {i < steps.length - 1 && <View style={ms.line} />}
          <Text style={ms.step}>{step}</Text>
          <Text style={ms.tag}>{i === 0 ? 'DONE' : `STEP ${i + 1}`}</Text>
        </View>
      ))}
    </View>
  );
}

const ms = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  title: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.6, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  dot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  dotInner: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textFaint },
  line: { position: 'absolute', left: 8, top: 30, bottom: -12, width: 2, backgroundColor: colors.border },
  step: { ...typography.caption, color: colors.text, flex: 1 },
  tag: { ...typography.micro, color: colors.secondary, letterSpacing: 0.4 },
});

function DealCallback({
  dealType,
  state,
  step,
}: {
  dealType: 'group_buy' | 'price_lock';
  state: ReturnType<typeof useDealPaymentState>;
  step?: string;
}) {
  const router = useRouter();
  const isBalance = step === 'balance';

  if (state.isLoading) return <LoadingState label="Checking payment…" />;
  if (state.isError) return <ErrorState onRetry={() => state.refetch()} />;
  if (state.data && !state.data.found)
    return (
      <EmptyState
        title="Payment not found"
        hint="If you just paid, it may take a moment to appear."
      />
    );

  // Balance step: only fully_paid counts as success.
  const resolved = isBalance
    ? (state.data as any)?.fullyPaid === true
    : state.data?.paid === true;

  if (resolved) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Payment confirmed' }} />
        <PaymentStatusArt kind="success" />
        <Text style={styles.title}>Payment confirmed</Text>
        <Text style={styles.body}>
          {dealType === 'group_buy'
            ? 'You’ve joined the group buy. Track progress in My Deals.'
            : isBalance
              ? 'Balance paid — your price lock is complete.'
              : 'Deposit confirmed — pay the balance before your lock expires.'}
        </Text>
        <EscrowMilestones
          steps={
            dealType === 'group_buy'
              ? ['Commitment Paid', 'Pool Filling', 'Depot Dispatch', 'Site Sign-off']
              : isBalance
                ? ['Deposit Locked', 'Balance Settled', 'Supply Window Active']
                : ['Deposit Locked', 'Balance Due Before Expiry', 'Supply Window Opens']
          }
        />
        <Button title="View my deals" onPress={() => router.replace('/deals')} />
        <Button title="Back to shopping" variant="ghost" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  if (state.data?.failed) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Payment issue' }} />
        <PaymentStatusArt kind="failed" />
        <Text style={styles.title}>Payment failed</Text>
        <Text style={styles.body}>
          This payment didn’t go through. No money was taken — you can retry from My Deals.
        </Text>
        <Button title="My deals" onPress={() => router.replace('/deals')} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Stack.Screen options={{ title: 'Verifying payment' }} />
      <PaymentStatusArt kind="pending" />
      <Text style={styles.title}>Verifying your payment</Text>
      <Text style={styles.body}>
        We’re confirming your payment with PalmPay. This usually takes a few seconds — keep this
        screen open.
      </Text>
      <Button title="Check again" variant="outline" onPress={() => state.refetch()} />
    </View>
  );
}

function OrderCallback({
  refId,
  state,
  clearCart,
  router,
}: {
  refId: string;
  state: ReturnType<typeof useOrderGroupPaymentState>;
  clearCart: () => Promise<void>;
  router: ReturnType<typeof useRouter>;
}) {
  const allPaid = state.data?.allPaid ?? false;
  const anyFailed = state.data?.anyFailed ?? false;

  // Clear the cart once the group settles as paid (same as web PaymentCallback).
  useEffect(() => {
    if (allPaid) void clearCart();
  }, [allPaid, clearCart]);

  if (state.isLoading) return <LoadingState label="Checking payment…" />;
  if (state.isError) return <ErrorState onRetry={() => state.refetch()} />;
  if (!state.data?.orders.length)
    return <EmptyState title="Order not found" hint="If you just paid, it may take a moment to appear." />;

  const total = state.data.orders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const firstOrder = state.data.orders[0];

  if (allPaid) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Payment confirmed' }} />
        <PaymentStatusArt kind="success" />
        <Text style={styles.title}>Payment confirmed</Text>
        <Text style={styles.body}>
          {formatNaira(total)} locked in escrow for order {firstOrder.order_number ?? firstOrder.id}
          {state.data.orders.length > 1
            ? ` (+${state.data.orders.length - 1} more)`
            : ''}
          .
        </Text>
        <EscrowMilestones
          steps={[
            'Escrow Fund Lock Confirmed',
            'Weighbridge Verification at Depot',
            'GPS Transit Telemetry',
            'Engineer PIN Release at Site',
          ]}
        />
        <Button title="View order" onPress={() => router.replace(`/order/${firstOrder.id}`)} />
        <Button title="Back to shopping" variant="ghost" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  if (anyFailed) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Payment issue' }} />
        <PaymentStatusArt kind="failed" />
        <Text style={styles.title}>Payment failed</Text>
        <Text style={styles.body}>
          This payment didn’t go through. No money was taken — you can retry checkout.
        </Text>
        <Button title="Back to cart" onPress={() => router.replace('/(tabs)/cart')} />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Stack.Screen options={{ title: 'Verifying payment' }} />
      <PaymentStatusArt kind="pending" />
      <Text style={styles.title}>Verifying your payment</Text>
      <Text style={styles.body}>
        We’re confirming your payment with PalmPay. This usually takes a few seconds —
        keep this screen open.
      </Text>
      <Button title="Check again" variant="outline" onPress={() => state.refetch()} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: colors.background,
  },
  title: { ...typography.h2, color: colors.text, marginTop: spacing.lg },
  body: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
});
