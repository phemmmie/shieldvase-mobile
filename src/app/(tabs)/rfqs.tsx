import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useMyRfqs } from '@/features/rfq/queries';
import { ListSkeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { ScreenColumn } from '@/components/Responsive';

const STATUS_COLORS: Record<string, string> = {
  submitted: colors.warning,
  open: colors.warning,
  awarded: colors.secondary,
  partially_awarded: colors.secondary,
  closed: colors.textMuted,
  cancelled: colors.destructive,
};

export default function RfqsScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const rfqs = useMyRfqs(user?.id);

  if (authLoading) return <LoadingState />;

  if (!user) {
    return (
      <View style={styles.guest}>
        <EmptyState
          title="Sign in to request quotes"
          hint="Submit a request and verified suppliers will bid on it."
        />
        <Pressable style={styles.signIn} onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {rfqs.isLoading ? (
        <View style={{ padding: spacing.lg }}><ListSkeleton count={5} /></View>
      ) : rfqs.isError ? (
        <ErrorState onRetry={() => rfqs.refetch()} />
      ) : !rfqs.data?.length ? (
        <EmptyState
          title="No requests yet"
          hint="Can't find a product or want a better price? Request quotes from suppliers."
        />
      ) : (
                  <ScreenColumn pad={false} style={{ flex: 1 }}>
                    <FlatList
            data={rfqs.data}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            refreshing={rfqs.isRefetching}
            onRefresh={() => rfqs.refetch()}
            renderItem={({ item: r, index }) => (
              <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(220)}>
              <Pressable style={styles.card} onPress={() => router.push(`/rfq/${r.id}`)}>
                <View style={styles.row}>
                  <View style={styles.noRow}>
                    <View style={styles.cardIcon}>
                      <Ionicons name="document-text-outline" size={14} color={colors.secondary} />
                    </View>
                    <Text style={styles.number}>{r.rfq_number}</Text>
                  </View>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor:
                          (STATUS_COLORS[r.status] ?? colors.textMuted) + '1A',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: STATUS_COLORS[r.status] ?? colors.textMuted },
                      ]}
                    >
                      {r.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.title} numberOfLines={1}>
                  {r.title ?? 'Request for quotation'}
                </Text>
                <View style={styles.row}>
                  <Text style={styles.meta}>
                    {r.total_items} item{r.total_items === 1 ? '' : 's'} · {r.response_count} quote
                    {r.response_count === 1 ? '' : 's'}
                  </Text>
                  {r.lowest_bid != null && (
                    <Text style={styles.bid}>from {formatNaira(r.lowest_bid)}</Text>
                  )}
                </View>
              </Pressable>
              </Animated.View>
            )}
          />
                  </ScreenColumn>
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/rfq/new')}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  guest: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  signIn: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing['3xl'],
    height: 48,
    justifyContent: 'center',
    marginTop: -spacing['3xl'],
  },
  signInText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  list: { padding: spacing.lg, paddingBottom: 96 },
  card: {
    ...shadows.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceRaised,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  cardIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { ...typography.bodyStrong, color: colors.text },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { ...typography.micro, textTransform: 'uppercase', fontFamily: 'Inter_700Bold' },
  title: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  bid: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing['2xl'],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.text,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
