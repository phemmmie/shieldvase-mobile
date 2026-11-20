import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme';

export function ProgressBar({
  progress, // 0..1
  color = colors.secondary,
  height = 8,
}: {
  progress: number;
  color?: string;
  height?: number;
}) {
  const w = useSharedValue(0);

  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 600 });
  }, [progress, w]);

  const anim = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[styles.fill, anim, { backgroundColor: color, borderRadius: height / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%' },
});
