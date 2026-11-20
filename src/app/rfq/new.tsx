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
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { createRfq, type RfqItemInput } from '@/features/rfq/api';
import { Field, FormError } from '@/features/auth/components';
import { Button } from '@/components/Button';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import * as Haptics from 'expo-haptics';
import { ScreenColumn } from '@/components/Responsive';

type Row = {
  product_name: string;
  quantity: string;
  unit: string;
  specification: string;
  location: string;
};

const emptyRow = (): Row => ({
  product_name: '',
  quantity: '',
  unit: '',
  specification: '',
  location: '',
});

export default function NewRfqScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (idx: number, key: keyof Row) => (v: string) =>
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, [key]: v } : r)));

  const submit = async () => {
    if (!user) return;
    const invalid = rows.some((r) => !r.product_name.trim() || !(Number(r.quantity) > 0));
    if (invalid) {
      setError('Each item needs a product name and a quantity above zero.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const items: RfqItemInput[] = rows.map((r) => ({
        product_name: r.product_name.trim(),
        quantity: Number(r.quantity),
        unit: r.unit.trim() || null,
        specification: r.specification.trim() || null,
        location: r.location.trim() || null,
      }));
      const rfq = await createRfq(user.id, items);
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      router.replace(`/rfq/${rfq.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Could not submit your request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenColumn>
        {/* RFQ hero — stitch 13 */}
        <View style={styles.hero}>
          <View style={styles.heroPill}>
            <Ionicons name="document-text" size={11} color={colors.secondaryLight} />
            <Text style={styles.heroPillText}>REQUEST FOR QUOTE</Text>
          </View>
          <Text style={styles.heroTitle}>Post your BOQ to verified suppliers</Text>
          <Text style={styles.heroMeta}>
            Upload your bill of quantities — Tier-1 depots respond with itemized quotes under escrow terms.
          </Text>
        </View>

        {rows.map((row, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.itemBadge}>
                <Ionicons name="cube-outline" size={13} color={colors.secondary} />
                <Text style={styles.cardTitle}>Material Item {idx + 1}</Text>
              </View>
              {rows.length > 1 && (
                <Pressable
                  onPress={() => setRows((rs) => rs.filter((_, i) => i !== idx))}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                </Pressable>
              )}
            </View>
            <Field
              placeholder="Product name *"
              value={row.product_name}
              onChangeText={update(idx, 'product_name')}
            />
            <View style={styles.split}>
              <View style={{ flex: 1 }}>
                <Field
                  placeholder="Qty *"
                  keyboardType="numeric"
                  value={row.quantity}
                  onChangeText={update(idx, 'quantity')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  placeholder="Unit (e.g. bags)"
                  value={row.unit}
                  onChangeText={update(idx, 'unit')}
                />
              </View>
            </View>
            <Field
              placeholder="Specification (grade, size…)"
              value={row.specification}
              onChangeText={update(idx, 'specification')}
            />
            <Field
              placeholder="Delivery location"
              value={row.location}
              onChangeText={update(idx, 'location')}
            />
          </View>
        ))}

        <Pressable style={styles.addRow} onPress={() => {
          Haptics.selectionAsync();
          setRows((rs) => [...rs, emptyRow()]);
        }}>
          <Ionicons name="add-circle-outline" size={20} color={colors.secondary} />
          <Text style={styles.addRowText}>Add another material item</Text>
        </Pressable>

        <View style={styles.escrowNote}>
          <Ionicons name="shield-checkmark" size={14} color={colors.secondary} />
          <Text style={styles.escrowNoteText}>
            Quotes arrive under CBN-escrow terms — funds only release on verified site delivery.
          </Text>
        </View>

        <FormError message={error} />
              </ScreenColumn>
</ScrollView>
      <View style={styles.footer}>
        <ScreenColumn pad={false}>
          <Button
            title={busy ? 'Broadcasting to suppliers…' : `Submit RFQ · ${rows.length} item${rows.length === 1 ? '' : 's'}`}
            onPress={submit}
            loading={busy}
          />
        </ScreenColumn>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  hero: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47,191,113,0.15)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  heroPillText: { ...typography.micro, color: colors.secondaryLight, letterSpacing: 0.5 },
  heroTitle: { ...typography.h2, fontSize: 18, color: colors.background, marginTop: spacing.sm },
  heroMeta: { ...typography.caption, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs },
  card: {
    ...shadows.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceRaised,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardTitle: { ...typography.bodyStrong, color: colors.text },
  split: { flexDirection: 'row', gap: spacing.md },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
  },
  addRowText: { ...typography.bodyStrong, color: colors.secondary },
  escrowNote: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  escrowNoteText: { ...typography.caption, color: colors.text, flex: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.navy,
  },
});
