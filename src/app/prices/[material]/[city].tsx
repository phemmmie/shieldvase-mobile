import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, LoadingState } from '@/components/States';
import { ScreenColumn } from '@/components/Responsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { findCityForMaterial, findMaterial } from '@/features/prices/priceIndexMaterials';
import { useMaterialCityPrice } from '@/features/prices/queries';

// Mirrors web /prices/[material]/[city] (app/(marketing)/prices/[material]/[city]/page.tsx):
// findMaterial + findCityForMaterial → price-range/avg/vendor card, RFQ CTA,
// FAQ section; unknown material or unsupported city → not-found state.

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function MaterialCityPriceScreen() {
  const router = useRouter();
  const { material, city } = useLocalSearchParams<{ material?: string; city?: string }>();

  const mat = useMemo(() => findMaterial(material ?? ''), [material]);
  const cityLabel = useMemo(
    () => (mat ? findCityForMaterial(mat, city ?? '') : undefined),
    [mat, city],
  );

  const { data, isLoading } = useMaterialCityPrice(mat?.unifiedProductIds ?? [], cityLabel);

  const notFound = !mat || !cityLabel;
  const lastUpdated = formatDate(data?.lastUpdated ?? null);

  const faqs = useMemo(() => {
    if (!mat || !cityLabel) return [];
    return [
      {
        q: `What is the current price of ${mat.label.toLowerCase()} in ${cityLabel}?`,
        a: `Verified vendors on ShieldVase are currently listing ${mat.label.toLowerCase()} in ${cityLabel} between ${formatNaira(data?.minPrice ?? 0)} and ${formatNaira(data?.maxPrice ?? 0)}, with an average of ${formatNaira(data?.avgPrice ?? 0)}${data?.priceUnit ? ` per ${data.priceUnit}` : ''}.`,
      },
      {
        q: `Why do ${mat.label.toLowerCase()} prices vary between vendors in ${cityLabel}?`,
        a: 'Prices vary by brand, quantity, delivery distance, and how recently each vendor updated their listing. Prices shown here come only from verified vendors with active listings that serve your city.',
      },
      {
        q: `Can I get a bulk or contract price for ${mat.label.toLowerCase()} in ${cityLabel}?`,
        a: 'Yes — submit a Request for Quotation (RFQ) and verified vendors serving your city will respond with competitive quotes for your exact volume and delivery location.',
      },
      {
        q: 'How often are these prices updated?',
        a: 'This page shows live pricing from active vendor listings — not a historical average. Vendors update their own listings, so figures reflect the most recent update each vendor has made.',
      },
    ];
  }, [mat, cityLabel, data]);

  if (notFound) {
    return (
      <>
        <Stack.Screen options={{ title: 'Price Guide' }} />
        <ScreenColumn>
          <EmptyState
            title="Price guide not found"
            hint="We don't have a verified price guide for this material and city combination yet."
          />
          <Pressable style={styles.backLink} onPress={() => router.replace('/prices' as any)}>
            <Ionicons name="grid-outline" size={16} color={colors.primary} />
            <Text style={styles.backLinkText}>Browse all prices</Text>
          </Pressable>
        </ScreenColumn>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: `${mat.label} in ${cityLabel}` }} />
      <ScreenColumn>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>Live Price Guide</Text>
          <Text style={styles.title}>
            {mat.label} Price in {cityLabel}
          </Text>
          <Text style={styles.subtitle}>
            Current pricing from verified vendors serving {cityLabel}.
          </Text>

          {isLoading ? (
            <LoadingState label={`Fetching ${mat.label.toLowerCase()} prices in ${cityLabel}…`} />
          ) : !data ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>No live listings yet</Text>
              <Text style={styles.cardBody}>
                No verified vendors currently list {mat.label.toLowerCase()} in {cityLabel}. Submit
                an RFQ and we&apos;ll alert vendors who can supply you.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Average price{data.priceUnit ? ` / ${data.priceUnit}` : ''}</Text>
              <Text style={styles.avgPrice}>{formatNaira(data.avgPrice)}</Text>

              <View style={styles.rangeRow}>
                <View style={styles.rangeCell}>
                  <Text style={styles.rangeLabel}>Low</Text>
                  <Text style={styles.rangeValue}>{formatNaira(data.minPrice)}</Text>
                </View>
                <View style={styles.rangeCell}>
                  <Text style={styles.rangeLabel}>High</Text>
                  <Text style={styles.rangeValue}>{formatNaira(data.maxPrice)}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {data.vendorCount} verified listing{data.vendorCount === 1 ? '' : 's'}
                </Text>
              </View>
              {lastUpdated ? (
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.metaText}>Last updated {lastUpdated}</Text>
                </View>
              ) : null}
            </View>
          )}

          <Pressable style={styles.cta} onPress={() => router.push('/rfq' as any)}>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>Request a Quote</Text>
              <Text style={styles.ctaBody}>
                Get competitive {mat.label.toLowerCase()} quotes from verified vendors in{' '}
                {cityLabel}.
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
          </Pressable>

          <Text style={styles.sectionTitle}>Frequently asked questions</Text>
          <View style={styles.faqList}>
            {faqs.map((f) => (
              <View key={f.q} style={styles.faqCard}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Text style={styles.faqA}>{f.a}</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.backLink} onPress={() => router.push('/prices' as any)}>
            <Ionicons name="grid-outline" size={16} color={colors.primary} />
            <Text style={styles.backLinkText}>Browse all price guides</Text>
          </Pressable>
        </ScrollView>
      </ScreenColumn>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  kicker: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
    marginBottom: spacing.lg,
  },
  cardTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  cardBody: { ...typography.body, color: colors.textMuted, lineHeight: 20 },
  cardLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  avgPrice: { ...typography.h1, color: colors.primary, marginBottom: spacing.md },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  rangeCell: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rangeLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  rangeValue: { ...typography.h3, color: colors.text },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  metaText: { ...typography.caption, color: colors.textMuted },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  ctaTextWrap: { flex: 1, marginRight: spacing.md },
  ctaTitle: { ...typography.h3, color: colors.textOnPrimary, marginBottom: spacing.xs },
  ctaBody: { ...typography.caption, color: colors.textOnPrimary, opacity: 0.9 },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  faqList: { gap: spacing.md, marginBottom: spacing.lg },
  faqCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  faqQ: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.xs },
  faqA: { ...typography.caption, color: colors.textMuted, lineHeight: 20 },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  backLinkText: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
