import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type ColorKey = 'primary' | 'secondary' | 'accent' | 'muted' | 'destructive';
type Variant = 'filled' | 'soft' | 'outline';

const palette: Record<ColorKey, { bg: string; soft: string; text: string }> = {
  primary: { bg: colors.primary, soft: colors.primarySoft, text: colors.primary },
  secondary: { bg: colors.secondary, soft: colors.secondarySoft, text: colors.secondary },
  accent: { bg: colors.accent, soft: colors.accentSoft, text: '#8A5A00' },
  muted: { bg: colors.textMuted, soft: colors.surface, text: colors.textMuted },
  destructive: { bg: colors.destructive, soft: '#FDECEC', text: colors.destructive },
};

export function Badge({
  label,
  color = 'primary',
  variant = 'soft',
}: {
  label: string;
  color?: ColorKey;
  variant?: Variant;
}) {
  const p = palette[color];
  const box =
    variant === 'filled'
      ? { backgroundColor: p.bg }
      : variant === 'outline'
        ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: p.text }
        : { backgroundColor: p.soft };
  const textColor = variant === 'filled' ? (color === 'accent' ? colors.textOnAccent : '#fff') : p.text;

  return (
    <View style={[styles.badge, box]}>
      <Text style={[typography.micro, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
});
