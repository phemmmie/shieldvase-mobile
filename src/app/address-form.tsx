import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/AuthContext';
import { useSaveAddress, useUserAddresses, type AddressInput } from '@/features/addresses/queries';
import { LoadingState } from '@/components/States';
import { colors, radius, spacing, typography } from '@/theme';
import { ScreenColumn } from '@/components/Responsive';

export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const q = useUserAddresses(session?.user.id);
  const save = useSaveAddress(session?.user.id);

  const existing = id ? q.data?.find((a) => a.id === id) : undefined;
  const [form, setForm] = useState<Partial<AddressInput> & { loaded?: boolean }>({ loaded: false });

  if (session && q.isLoading) return <LoadingState />;

  // Seed once when editing — form state initialised after the list resolves.
  if (id && existing && !form.loaded) {
    setForm({
      loaded: true,
      full_name: existing.full_name,
      phone: existing.phone ?? '',
      street_address: existing.street_address,
      city: existing.city,
      state: existing.state,
      postal_code: existing.postal_code ?? '',
      delivery_instructions: existing.delivery_instructions ?? '',
      is_primary: existing.is_primary,
      label: existing.label ?? 'Home',
    });
    return null;
  }

  const f = (key: keyof AddressInput) => form[key];

  const set = (key: keyof AddressInput) => (v: any) => setForm((p) => ({ ...p, [key]: v }));

  const valid =
    !!f('full_name')?.toString().trim() &&
    !!f('street_address')?.toString().trim() &&
    !!f('city')?.toString().trim() &&
    !!f('state')?.toString().trim();

  const submit = async () => {
    try {
      await save.mutateAsync({
        ...(id ? { id } : {}),
        full_name: String(f('full_name') ?? ''),
        phone: String(f('phone') ?? ''),
        street_address: String(f('street_address') ?? ''),
        city: String(f('city') ?? ''),
        state: String(f('state') ?? ''),
        postal_code: String(f('postal_code') ?? ''),
        delivery_instructions: String(f('delivery_instructions') ?? ''),
        is_primary: !!f('is_primary'),
        label: String(f('label') ?? 'Home'),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenColumn>
      <Stack.Screen options={{ title: id ? 'Edit address' : 'New address' }} />
      <Field label="Label (e.g. Home, Office)" value={String(f('label') ?? '')} onChange={set('label')} />
      <Field label="Full name" value={String(f('full_name') ?? '')} onChange={set('full_name')} />
      <Field label="Phone" value={String(f('phone') ?? '')} onChange={set('phone')} keyboardType="phone-pad" />
      <Field label="Street address" value={String(f('street_address') ?? '')} onChange={set('street_address')} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="City" value={String(f('city') ?? '')} onChange={set('city')} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="State" value={String(f('state') ?? '')} onChange={set('state')} />
        </View>
      </View>
      <Field label="Postal code (optional)" value={String(f('postal_code') ?? '')} onChange={set('postal_code')} />
      <Field
        label="Delivery instructions (optional)"
        value={String(f('delivery_instructions') ?? '')}
        onChange={set('delivery_instructions')}
        multiline
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Set as primary address</Text>
        <Switch
          value={!!f('is_primary')}
          onValueChange={(v) => setForm((p) => ({ ...p, is_primary: v }))}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <Pressable
        style={[styles.save, (!valid || save.isPending) && styles.saveDisabled]}
        disabled={!valid || save.isPending}
        onPress={submit}
      >
        <Text style={styles.saveText}>{save.isPending ? 'Saving…' : 'Save address'}</Text>
      </Pressable>
          </ScreenColumn>
</ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  row: { flexDirection: 'row', gap: spacing.md },
  field: { gap: 4 },
  fieldLabel: { ...typography.caption, color: colors.textMuted, fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 46,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  switchLabel: { ...typography.body, color: colors.text },
  save: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  saveDisabled: { opacity: 0.45 },
  saveText: { ...typography.bodyStrong, color: colors.textOnPrimary },
});
