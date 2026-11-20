import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

/**
 * Horizontal step indicator for multi-step flows (deal join, checkout).
 * steps: labels in order; current: 0-based index of the active step.
 */
export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View style={styles.row}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.track}>
              {i > 0 && (
                <View style={[styles.line, (done || active) && styles.lineDone]} />
              )}
              <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={10} color={colors.textOnPrimary} />
                ) : (
                  <Text style={[styles.dotNum, active && styles.dotNumActive]}>{i + 1}</Text>
                )}
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.line, done && styles.lineDone]} />
              )}
            </View>
            <Text
              style={[styles.label, active && styles.labelActive, done && styles.labelDone]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.lg },
  step: { flex: 1, alignItems: 'center' },
  track: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 2, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.secondary },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  dotActive: { borderColor: colors.secondary },
  dotNum: { ...typography.micro, fontSize: 10, color: colors.textMuted },
  dotNumActive: { color: colors.secondary },
  label: { ...typography.micro, color: colors.textMuted, marginTop: 4 },
  labelActive: { color: colors.secondary, fontFamily: 'Inter_600SemiBold' },
  labelDone: { color: colors.secondary },
});
