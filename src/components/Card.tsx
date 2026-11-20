import { Pressable, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { colors, radius, shadows } from '@/theme';

export function Card({
  children,
  variant = 'flat',
  onPress,
  style,
}: {
  children: React.ReactNode;
  variant?: 'flat' | 'raised';
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const box = [styles.base, variant === 'raised' && shadows.card, style];

  if (!onPress) return <View style={box}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...box, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
