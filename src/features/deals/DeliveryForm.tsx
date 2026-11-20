import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import type { DeliveryAddress } from './api';

export function DeliveryForm({
  value,
  onChange,
}: {
  value: DeliveryAddress;
  onChange: (next: DeliveryAddress) => void;
}) {
  const set = (key: keyof DeliveryAddress) => (text: string) =>
    onChange({ ...value, [key]: text });

  return (
    <View style={styles.wrap}>
      <Field label="Full name" value={value.fullName} onChange={set('fullName')} />
      <Field
        label="Phone"
        value={value.phone}
        onChange={set('phone')}
        keyboardType="phone-pad"
      />
      <Field
        label="Street address"
        value={value.street_address}
        onChange={set('street_address')}
      />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field label="City" value={value.city} onChange={set('city')} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="State" value={value.state} onChange={set('state')} />
        </View>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

export const isAddressComplete = (a: DeliveryAddress) =>
  !!a.fullName.trim() && !!a.phone.trim() && !!a.street_address.trim() && !!a.city.trim() && !!a.state.trim();

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  field: { gap: 4 },
  label: { ...typography.caption, color: colors.textMuted, fontFamily: 'Inter_600SemiBold' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
});
