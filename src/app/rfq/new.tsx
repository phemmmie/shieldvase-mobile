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
import { Field, FormError, PrimaryButton } from '@/features/auth/components';
import { colors, radius, spacing, typography } from '@/theme';
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
        <Text style={styles.hint}>
          Describe what you need — verified suppliers will send you quotes to compare.
        </Text>

        {rows.map((row, idx) => (
          <View key={idx} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Item {idx + 1}</Text>
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

        <Pressable style={styles.addRow} onPress={() => setRows((rs) => [...rs, emptyRow()])}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addRowText}>Add another item</Text>
        </Pressable>

        <FormError message={error} />
        <PrimaryButton label="Submit request" onPress={submit} busy={busy} />
              </ScreenColumn>
</ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing['4xl'] },
  hint: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 21 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
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
  cardTitle: { ...typography.bodyStrong, color: colors.text },
  split: { flexDirection: 'row', gap: spacing.md },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  addRowText: { ...typography.bodyStrong, color: colors.primary },
});
