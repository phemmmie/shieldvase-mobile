import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { ProgressBar } from '@/components/ProgressBar';
import { Badge } from '@/components/Badge';
import type { GroupBuy, PriceLock } from './api';

// Re-export so existing deal screens keep working with the animated bar.
export { ProgressBar } from '@/components/ProgressBar';

const daysLeft = (endDate?: string | null) => {
  if (!endDate) return null;
  const ms = new Date(endDate).setHours(23, 59, 59, 999) - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
};

// Urgency treatment — "ends in Nd" gets hotter as the deadline closes.
function UrgencyChip({ days }: { days: number | null }) {
  if (days === null) return null;
  const urgent = days <= 2;
  return (
    <View style={[styles.urgency, urgent ? styles.urgencyHot : styles.urgencyCalm]}>
      <Ionicons name="time-outline" size={12} color={urgent ? colors.primary : colors.textMuted} />
      <Text style={[styles.urgencyText, urgent && { color: colors.primary }]}>
        {days === 0 ? 'Ends today' : `${days}d left`}
      </Text>
    </View>
  );
}

function DealShell({
  image,
  badgeRow,
  title,
  product,
  price,
  strike,
  progress,
  progressColor,
  meta,
  days,
  href,
}: {
  image?: string;
  badgeRow: React.ReactNode;
  title: string;
  product?: string;
  price: number;
  strike?: number | null;
  progress: number;
  progressColor: string;
  meta: string;
  days: number | null;
  href: string;
}) {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.springify()}>
      <Pressable
        style={styles.card}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(href as any);
        }}
      >
        <View>
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" transition={150} />
          <View style={styles.urgencyWrap}>
            <UrgencyChip days={days} />
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.badgeRow}>{badgeRow}</View>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {!!product && <Text style={styles.product} numberOfLines={1}>{product}</Text>}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatNaira(price)}</Text>
            {!!strike && <Text style={styles.strike}>{formatNaira(strike)}</Text>}
          </View>
          <ProgressBar progress={progress / 100} color={progressColor} height={6} />
          <Text style={styles.meta}>{meta}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function GroupBuyCard({ deal }: { deal: GroupBuy }) {
  const progress = deal.target_quantity
    ? ((deal.current_quantity ?? 0) / deal.target_quantity) * 100
    : 0;
  const days = daysLeft(deal.end_date);
  const href = deal.slug
    ? `/deals/group-buy/${deal.slug}`
    : `/deals/join/group-buy/${deal.id}`;

  return (
    <DealShell
      image={deal.product?.images?.[0]}
      href={href}
      days={days}
      title={deal.title}
      product={deal.product?.name ?? undefined}
      price={deal.group_buy_price ?? 0}
      strike={deal.original_price}
      progress={progress}
      progressColor={colors.secondary}
      meta={`${deal.current_quantity ?? 0}/${deal.target_quantity ?? 0} ${deal.unit_of_measurement ?? 'units'} claimed`}
      badgeRow={
        <>
          <Badge label="GROUP BUY" color="secondary" variant="filled" />
          {!!deal.discount_percentage && (
            <Badge label={`-${deal.discount_percentage}%`} color="accent" variant="filled" />
          )}
        </>
      }
    />
  );
}

export function PriceLockCard({ deal }: { deal: PriceLock }) {
  const total = deal.total_available_quantity ?? 0;
  const locked = deal.current_locked_quantity ?? 0;
  const progress = total ? (locked / total) * 100 : 0;
  const days = daysLeft(deal.end_date);
  const href = deal.slug
    ? `/deals/price-lock/${deal.slug}`
    : `/deals/join/price-lock/${deal.id}`;

  return (
    <DealShell
      image={deal.product?.images?.[0]}
      href={href}
      days={days}
      title={deal.title}
      product={deal.product?.name ?? undefined}
      price={deal.locked_price ?? 0}
      strike={deal.original_price}
      progress={progress}
      progressColor={colors.accent}
      meta={
        `${total - locked} of ${total} available` +
        (deal.lock_duration_days ? ` · locks ${deal.lock_duration_days}d` : '')
      }
      badgeRow={<Badge label="PRICE LOCK" color="primary" variant="filled" />}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    ...shadows.card,
  },
  image: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.border },
  urgencyWrap: { position: 'absolute', top: spacing.sm, right: spacing.sm },
  urgency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  urgencyCalm: { backgroundColor: 'rgba(255,255,255,0.92)' },
  urgencyHot: { backgroundColor: colors.primarySoft },
  urgencyText: { ...typography.micro, color: colors.textMuted },
  body: { padding: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  title: { ...typography.bodyStrong, color: colors.text },
  product: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.sm },
  price: { ...typography.h3, color: colors.primary },
  strike: { ...typography.caption, color: colors.textMuted, textDecorationLine: 'line-through' },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
