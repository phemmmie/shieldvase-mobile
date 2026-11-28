import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { Input } from '@/components/Input';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { calculateConcrete, MIX_RATIOS } from '@/features/calculators/concrete';
import { findMaterial } from '@/features/prices/priceIndexMaterials';
import { useMaterialCityPrice } from '@/features/prices/queries';

// Mirrors web /calculators/cement (CementCalculatorClient): L×W×thickness
// inputs, mix-ratio select, optional city priced via fetchMaterialCityPrice
// (lazy per-city fetch on mobile vs web's server prefetch), result card,
// RFQ CTA.

const AFRICAN_RED = '#E42D40';
const CREAM = '#FDF5E6';
const NO_CITY = '__none__';

export default function CementCalculatorScreen() {
  const router = useRouter();
  const material = findMaterial('cement');
  const cities = material?.cities ?? [];

  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thicknessMm, setThicknessMm] = useState('');
  const [mixRatioValue, setMixRatioValue] = useState(MIX_RATIOS[1].value);
  const [city, setCity] = useState(NO_CITY);

  const mixRatio = MIX_RATIOS.find(m => m.value === mixRatioValue) || MIX_RATIOS[1];
  const result = useMemo(
    () =>
      calculateConcrete({
        lengthM: parseFloat(length),
        widthM: parseFloat(width),
        thicknessM: parseFloat(thicknessMm) / 1000,
        mixRatio,
      }),
    [length, width, thicknessMm, mixRatio],
  );

  const priceQuery = useMaterialCityPrice(
    material?.unifiedProductIds ?? [],
    city !== NO_CITY ? city : undefined,
  );
  const price = city !== NO_CITY ? (priceQuery.data ?? null) : null;
  const unitPhrase = price?.priceUnit ? `per ${price.priceUnit.replace(/^per\s+/i, '')}` : null;
  const cementCost = result && price ? result.cementBags * price.avgPrice : null;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Cement & Concrete Calculator' }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenColumn pad={false}>
          <View style={styles.breadcrumb}>
            <Pressable onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/calculators' as any)}>
              <Text style={styles.breadcrumbLink}> / Calculators</Text>
            </Pressable>
            <Text style={styles.breadcrumbSep}> / Cement &amp; Concrete</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.twoCol}>
              <Input label="Length (m)" placeholder="e.g. 6" keyboardType="decimal-pad" value={length} onChangeText={setLength} />
              <Input label="Width (m)" placeholder="e.g. 4" keyboardType="decimal-pad" value={width} onChangeText={setWidth} />
            </View>
            <Input label="Thickness (mm)" placeholder="e.g. 150 for a slab" keyboardType="decimal-pad" value={thicknessMm} onChangeText={setThicknessMm} />

            <Text style={styles.fieldLabel}>Mix Ratio</Text>
            <View style={styles.chips}>
              {MIX_RATIOS.map(m => (
                <Pressable
                  key={m.value}
                  style={[styles.chip, mixRatioValue === m.value && styles.chipActive]}
                  onPress={() => setMixRatioValue(m.value)}
                >
                  <Text style={[styles.chipText, mixRatioValue === m.value && styles.chipTextActive]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {cities.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>See today&apos;s cost in (optional)</Text>
                <View style={styles.chips}>
                  <Pressable
                    style={[styles.chip, city === NO_CITY && styles.chipActive]}
                    onPress={() => setCity(NO_CITY)}
                  >
                    <Text style={[styles.chipText, city === NO_CITY && styles.chipTextActive]}>
                      No city selected
                    </Text>
                  </Pressable>
                  {cities.map(c => (
                    <Pressable
                      key={c}
                      style={[styles.chip, city === c && styles.chipActive]}
                      onPress={() => setCity(c)}
                    >
                      <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Estimated Materials</Text>
            {result ? (
              <>
                <Row label="Concrete volume" value={`${result.wetVolumeM3.toFixed(2)} m³`} />
                <Row label="Cement" value={`${result.cementBags} bags (50kg)`} />
                <Row label="Sharp sand" value={`${result.sandTonnes.toFixed(2)} tonnes`} />
                <Row label="Granite" value={`${result.graniteTonnes.toFixed(2)} tonnes`} />
                {city !== NO_CITY && (
                  <View style={styles.costBlock}>
                    {price && cementCost !== null ? (
                      <>
                        <View style={styles.costRow}>
                          <Text style={styles.rowLabel}>Est. cement cost in {city}</Text>
                          <Text style={styles.costValue}>{formatNaira(cementCost)}</Text>
                        </View>
                        <Text style={styles.costNote}>
                          Based on {result.cementBags} bags at today&apos;s average verified price
                          {unitPhrase ? ` (${unitPhrase})` : ''} across {price.vendorCount} verified
                          vendor{price.vendorCount === 1 ? '' : 's'} in {city}.
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.rowLabel}>No verified cement price for {city} yet.</Text>
                    )}
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.placeholder}>Enter dimensions to see estimated quantities.</Text>
            )}
          </View>

          <Pressable style={styles.cta} onPress={() => router.push('/rfq' as any)}>
            <Text style={styles.ctaText}>Request a Quote for Cement</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </Pressable>
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.costRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, flexWrap: 'wrap' },
  breadcrumbLink: { ...typography.caption, color: colors.textMuted },
  breadcrumbSep: { ...typography.caption, color: colors.textMuted },
  card: {
    backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg,
    ...shadows.card,
  },
  twoCol: { flexDirection: 'row', gap: spacing.sm },
  fieldLabel: { ...typography.captionStrong, color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceRaised, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  chipActive: { backgroundColor: AFRICAN_RED, borderColor: AFRICAN_RED },
  chipText: { ...typography.caption, color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  resultCard: {
    marginTop: spacing.md, backgroundColor: CREAM, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  resultTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.sm },
  placeholder: { ...typography.caption, color: colors.textMuted },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  rowLabel: { ...typography.caption, color: colors.textMuted, flex: 1 },
  rowValue: { ...typography.bodyStrong, color: colors.text },
  costBlock: { marginTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm },
  costValue: { ...typography.bodyStrong, color: AFRICAN_RED },
  costNote: { ...typography.micro, color: colors.textMuted, marginTop: spacing.xs },
  cta: {
    marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, alignSelf: 'flex-start', backgroundColor: AFRICAN_RED, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, ...shadows.card,
  },
  ctaText: { ...typography.bodyStrong, color: '#fff' },
});
