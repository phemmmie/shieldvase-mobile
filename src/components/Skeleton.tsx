import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/theme';

export function Skeleton({
  width,
  height,
  borderRadius = radius.sm,
  style,
}: {
  width?: number | `${number}%` | '100%';
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: width ?? '100%', height, borderRadius, backgroundColor: colors.border },
        anim,
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={180} borderRadius={0} />
      <View style={{ padding: spacing.sm, gap: spacing.xs }}>
        <Skeleton height={14} width="90%" />
        <Skeleton height={14} width="60%" />
        <Skeleton height={16} width="45%" />
      </View>
    </View>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.gridItem}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

export function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={44} height={44} borderRadius={radius.md} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="40%" />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </View>
  );
}

export function DetailSkeleton() {
  return (
    <View style={{ gap: spacing.lg }}>
      <Skeleton height={220} borderRadius={radius.lg} />
      <View style={{ gap: spacing.sm }}>
        <Skeleton height={22} width="75%" />
        <Skeleton height={14} width="45%" />
      </View>
      <Skeleton height={110} borderRadius={radius.lg} />
      <Skeleton height={52} borderRadius={radius.pill} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '49%', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
