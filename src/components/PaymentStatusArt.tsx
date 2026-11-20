import { useEffect } from 'react';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Animated success ring + check-draw for the payment callback —
// the highest-anxiety moment in the app gets a deliberate "confirmed" beat.
export function PaymentStatusArt({ kind }: { kind: 'success' | 'failed' | 'pending' }) {
  const ring = useSharedValue(0);
  const check = useSharedValue(0);
  const scale = useSharedValue(0.6);

  const isSuccess = kind === 'success';
  const color = isSuccess ? colors.secondary : kind === 'failed' ? colors.destructive : colors.accent;

  useEffect(() => {
    ring.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 12 });
    if (kind === 'success') {
      check.value = withDelay(300, withTiming(1, { duration: 400 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (kind === 'failed') {
      check.value = withDelay(300, withTiming(1, { duration: 300 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [kind, ring, check, scale]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: 283 * (1 - ring.value),
  }));
  const markProps = useAnimatedProps(() => ({
    strokeDashoffset: 60 * (1 - check.value),
  }));
  const wrapStyle = { transform: [{ scale: scale.value }] } as const;

  return (
    <Animated.View style={wrapStyle}>
      <Svg width={110} height={110} viewBox="0 0 100 100">
        <AnimatedCircle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="5"
          fill="none"
          strokeDasharray="283"
          animatedProps={ringProps}
          strokeLinecap="round"
        />
        {kind === 'pending' ? (
          <Circle cx="50" cy="50" r="14" fill={color} opacity={0.9} />
        ) : (
          <AnimatedPath
            d={isSuccess ? 'M30 52 L45 66 L72 36' : 'M34 34 L66 66 M66 34 L34 66'}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray="60"
            animatedProps={markProps}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
    </Animated.View>
  );
}
