import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, layout, radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}) {
  const off = disabled || loading;

  const handlePress = () => {
    if (off) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={off}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant].box,
        off && { opacity: 0.5 },
        pressed && !off && { transform: [{ scale: 0.98 }] },
        !fullWidth && { alignSelf: 'flex-start' },
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[typography.bodyStrong, variantStyles[variant].text]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

const sizeStyles = StyleSheet.create({
  sm: { height: 36, paddingHorizontal: spacing.md },
  md: { height: layout.buttonHeight, paddingHorizontal: spacing.xl },
  lg: { height: 56, paddingHorizontal: spacing['2xl'] },
});

const variantStyles = {
  primary: {
    box: { backgroundColor: colors.primary },
    text: { color: colors.textOnPrimary },
  },
  secondary: {
    box: { backgroundColor: colors.secondary },
    text: { color: colors.textOnSecondary },
  },
  outline: {
    box: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
    text: { color: colors.primary },
  },
  ghost: {
    box: { backgroundColor: 'transparent' },
    text: { color: colors.primary },
  },
  destructive: {
    box: { backgroundColor: colors.destructive },
    text: { color: colors.textOnPrimary },
  },
} as const;
