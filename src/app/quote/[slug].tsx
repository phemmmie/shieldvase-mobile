import { useEffect } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabase';
import { useAuth } from '@/features/auth/AuthContext';
import { buildDealShareUrl, trackShareClick } from '@/features/deals/api';
import { EmptyState, ErrorState } from '@/components/States';
import { DetailSkeleton } from '@/components/Skeleton';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, spacing, typography } from '@/theme';

// Mirrors the web QuoteLandingPage view — public RFQ share landing.
export default function QuoteLandingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const q = useQuery({
    queryKey: ['quote-landing', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('rfqs')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const rfq = q.data;

  // Share-click attribution — once per session, mirrors useTrackShareClick.
  useEffect(() => {
    if (slug) void trackShareClick('rfq', slug, session?.user.id, 'sme');
  }, [slug, session?.user.id]);

  if (q.isLoading) return <View style={{ flex: 1, padding: 16 }}><DetailSkeleton /></View>;
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  if (!rfq) return <EmptyState title="Quote unavailable" hint="This quote isn't available." />;

  const specs = (rfq.specifications ?? rfq.items ?? {}) as Record<string, unknown>;
  const specEntries = Object.entries(specs).slice(0, 12);
  const title = rfq.title || `RFQ ${rfq.rfq_number || ''}`;

  const onShare = async () => {
    const url = await buildDealShareUrl('rfq', rfq.slug ?? slug!);
    await Share.share({
      title,
      message: `${title} — request for quotation on ShieldVase\n${url}`,
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Request for Quotation' }} />
      <ScreenColumn>
      <View style={styles.body}>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Ionicons name="document-text" size={12} color="#fff" />
            <Text style={styles.badgeText}>Request for Quotation</Text>
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        {(!!rfq.quantity || !!rfq.unit_of_measurement) && (
          <Text style={styles.meta}>
            Quantity: {rfq.quantity ?? '—'} {rfq.unit_of_measurement ?? ''}
          </Text>
        )}
        {!!rfq.deadline && (
          <Text style={styles.meta}>
            Deadline: {new Date(rfq.deadline).toLocaleDateString()}
          </Text>
        )}
        <View style={styles.verifiedRow}>
          <Ionicons name="shield-checkmark" size={16} color={colors.secondary} />
          <Text style={styles.verifiedText}>Verified ShieldVase suppliers respond</Text>
        </View>

        {specEntries.length > 0 && (
          <View style={styles.specGrid}>
            {specEntries.map(([key, value]) => (
              <View key={key} style={styles.specCell}>
                <Text style={styles.specKey}>{key}</Text>
                <Text style={styles.specValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {!!rfq.notes && <Text style={styles.notes}>{rfq.notes}</Text>}

        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>Need the same deal?</Text>
          <Pressable
            style={styles.primary}
            onPress={() => router.push('/rfq')}
          >
            <Text style={styles.primaryText}>Request your own quote</Text>
          </Pressable>
          <Text style={styles.ctaCaption}>Free — no app install needed.</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.share} onPress={onShare}>
            <Ionicons name="share-social" size={18} color={colors.primary} />
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </View>
      </View>
      </ScreenColumn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing['3xl'] },
  body: { padding: spacing.lg },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { ...typography.caption, color: colors.textOnPrimary, fontFamily: 'Inter_700Bold' },
  title: { ...typography.h2, color: colors.text, marginTop: spacing.sm },
  meta: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  verifiedText: { ...typography.body, color: colors.secondary },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  specCell: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specKey: { ...typography.caption, color: colors.textMuted },
  specValue: { ...typography.bodyStrong, color: colors.text, marginTop: 2 },
  notes: { ...typography.body, color: colors.textMuted, marginTop: spacing.lg },
  ctaBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  ctaTitle: { ...typography.h3, color: colors.text },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 50,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  primaryText: { ...typography.bodyStrong, color: colors.textOnPrimary },
  ctaCaption: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  actions: { marginTop: spacing.xl },
  share: {
    flexDirection: 'row',
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: { ...typography.bodyStrong, color: colors.primary },
});
