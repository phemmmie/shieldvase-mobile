import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import {
  resolveAxisOptions,
  useVariantAxes,
  variantValueLabel,
  type VariantAxis,
} from './variants';
import { useEffect } from 'react';

/**
 * Buyer-side variant picker — one chip row per axis, options constrained to
 * admin-eligible values intersected with stocked values (web VariantPicker).
 */
export function VariantPicker({
  unifiedProductId,
  vendorId,
  eligibleVariants = {},
  value,
  onChange,
}: {
  unifiedProductId: string | null | undefined;
  vendorId?: string | null;
  eligibleVariants?: Record<string, string[]>;
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const { axes, availableValues, isLoading } = useVariantAxes(unifiedProductId, vendorId);

  // Auto-apply single-option axes (web defers via queueMicrotask).
  useEffect(() => {
    axes.forEach((axis) => {
      const opts = resolveAxisOptions(axis, eligibleVariants, availableValues);
      if (opts.length === 1 && value[axis.name] !== opts[0]) {
        onChange({ ...value, [axis.name]: opts[0] });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axes, availableValues, eligibleVariants]);

  if (isLoading || axes.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Select specifications</Text>
      {axes.map((axis) => {
        const opts = resolveAxisOptions(axis, eligibleVariants, availableValues);
        if (opts.length === 0) return null;
        return (
          <View key={axis.name} style={styles.axis}>
            <Text style={styles.axisLabel}>{axis.label}</Text>
            <View style={styles.chips}>
              {opts.map((opt) => {
                const selected = value[axis.name] === opt;
                return (
                  <Pressable
                    key={opt}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => onChange({ ...value, [axis.name]: opt })}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {variantValueLabel(axis, opt)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export type { VariantAxis };

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  heading: { ...typography.bodyStrong, color: colors.text },
  axis: { gap: spacing.xs },
  axisLabel: { ...typography.caption, color: colors.textMuted, fontFamily: 'Inter_600SemiBold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text },
  chipTextSelected: { color: colors.textOnPrimary, fontFamily: 'Inter_700Bold' },
});
