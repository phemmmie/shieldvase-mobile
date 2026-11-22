import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';

/**
 * Stitch 14b — price-lock certificate. Document-style card shown after a
 * lock is secured: ref, product, locked price, term, escrow status.
 */
export function LockCertificate({
  reference,
  title,
  lockedPrice,
  quantity,
  unit,
  days,
  createdAt,
  paymentStatus,
}: {
  reference: string;
  title: string;
  lockedPrice: number;
  quantity: number;
  unit?: string | null;
  days: number;
  createdAt?: string | null;
  paymentStatus?: string | null;
}) {
  const expiry =
    createdAt != null ? new Date(new Date(createdAt).getTime() + days * 86400000) : null;
  const fullyPaid = paymentStatus === 'fully_paid';

  return (
    <View style={styles.doc}>
      {/* Document head */}
      <View style={styles.docHead}>
        <View>
          <Text style={styles.docKicker}>SHIELDVASE VAULT</Text>
          <Text style={styles.docTitle}>Price Lock Certificate</Text>
        </View>
        <View style={styles.seal}>
          <Ionicons name="lock-closed" size={18} color={colors.secondary} />
        </View>
      </View>

      <View style={styles.refRow}>
        <Text style={styles.refLabel}>LOCK REF</Text>
        <Text style={styles.refValue}>{reference.slice(0, 8).toUpperCase()}</Text>
      </View>

      <View style={styles.divider} />

      {/* Terms grid */}
      <View style={styles.grid}>
        <Field label="COMMODITY" value={title} />
        <Field
          label="LOCKED PRICE"
          value={`${formatNaira(lockedPrice)}${unit ? `/${unit}` : ''}`}
          highlight
        />
        <Field label="QUANTITY" value={`${quantity}${unit ? ` ${unit}` : ''}`} />
        <Field label="LOCK TERM" value={`${days} days`} />
        {expiry && (
          <Field
            label="VALID UNTIL"
            value={expiry.toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          />
        )}
        <Field
          label="SETTLEMENT"
          value={fullyPaid ? 'FULLY SETTLED' : 'DEPOSIT SECURED'}
          good
        />
      </View>

      <View style={styles.divider} />

      {/* Escrow footer */}
      <View style={styles.escrowRow}>
        <Ionicons name="shield-checkmark" size={14} color={colors.secondary} />
        <Text style={styles.escrowText}>
          Price guaranteed under CBN-regulated escrow. Market movements do not affect this lock.
        </Text>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  highlight,
  good,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  good?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text
        style={[
          styles.fieldValue,
          highlight && { color: colors.primary },
          good && { color: colors.secondary },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  doc: {
    ...shadows.card,
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docKicker: { ...typography.micro, color: colors.textMuted, letterSpacing: 1 },
  docTitle: { ...typography.h2, fontSize: 18, color: colors.text, marginTop: 2 },
  seal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  refLabel: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.6 },
  refValue: { ...typography.bodyStrong, color: colors.text, letterSpacing: 1 },
  divider: {
    borderStyle: 'dashed',
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    marginVertical: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  field: { width: '48%', marginBottom: spacing.md },
  fieldLabel: { ...typography.micro, color: colors.textMuted, letterSpacing: 0.5 },
  fieldValue: { ...typography.bodyStrong, color: colors.text, marginTop: 2 },
  escrowRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  escrowText: { ...typography.micro, color: colors.textMuted, flex: 1, lineHeight: 15 },
});
