import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '@/theme';

export function Stepper({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const dec = () => {
    const v = value - step;
    if (v >= min) {
      Haptics.selectionAsync();
      onChange(v);
    }
  };
  const inc = () => {
    const v = value + step;
    if (max == null || v <= max) {
      Haptics.selectionAsync();
      onChange(v);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={dec}
        disabled={value - step < min}
        style={[styles.btn, value - step < min && styles.off]}
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons name="remove" size={18} color={value - step < min ? colors.textMuted : colors.text} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        onPress={inc}
        disabled={max != null && value + step > max}
        style={[styles.btn, max != null && value + step > max && styles.off]}
        accessibilityLabel="Increase quantity"
      >
        <Ionicons
          name="add"
          size={18}
          color={max != null && value + step > max ? colors.textMuted : colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  btn: { padding: spacing.sm, paddingHorizontal: spacing.md },
  off: { opacity: 0.4 },
  value: {
    ...typography.bodyStrong,
    color: colors.text,
    minWidth: 36,
    textAlign: 'center',
  },
});
