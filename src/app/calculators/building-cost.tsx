import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { Input } from '@/components/Input';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { calculateConcrete, MIX_RATIOS } from '@/features/calculators/concrete';
import { calculateBlocks } from '@/features/calculators/blocks';
import { findMaterial } from '@/features/prices/priceIndexMaterials';
import { useMaterialCityPrice } from '@/features/prices/queries';

// Mirrors web /calculators/building-cost (MaterialsCostEstimatorClient):
// combined cement + blocks + roofing sections with optional per-city
// verified pricing (lazy per-city fetch vs web's server prefetch),
// combined total, RFQ CTA.

const AFRICAN_RED = '#E42D40';
const CREAM = '#FDF5E6';
const NO_CITY = '__none__';

export default function MaterialsCostEstimatorScreen() {
  const router = useRouter();
  const cementMaterial = findMaterial('cement');
  const roofingMaterial = findMaterial('roofing-sheets');
  const cementCities = cementMaterial?.cities ?? [];
  const roofingCities = roofingMaterial?.cities ?? [];

  // Cement / concrete
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [thicknessMm, setThicknessMm] = useState('');
  const mixRatio = MIX_RATIOS[1];
  const [cementCity, setCementCity] = useState(NO_CITY);

  const concrete = useMemo(
    () =>
      calculateConcrete({
        lengthM: parseFloat(length),
        widthM: parseFloat(width),
        thicknessM: parseFloat(thicknessMm) / 1000,
        mixRatio,
      }),
    [length, width, thicknessMm, mixRatio],
  );
  const cementPriceQuery = useMaterialCityPrice(
    cementMaterial?.unifiedProductIds ?? [],
    cementCity !== NO_CITY ? cementCity : undefined,
  );
  const cementPrice = cementCity !== NO_CITY ? (cementPriceQuery.data ?? null) : null;
  const cementCost = concrete && cementPrice ? concrete.cementBags * cementPrice.avgPrice : null;

  // Blocks
  const [wallLength, setWallLength] = useState('');
  const [wallHeight, setWallHeight] = useState('');
  const [pricePerBlock, setPricePerBlock] = useState('');

  const blocks = useMemo(
    () => calculateBlocks({ wallLengthM: parseFloat(wallLength), wallHeightM: parseFloat(wallHeight) }),
    [wallLength, wallHeight],
  );
  const blockCost = blocks && pricePerBlock ? blocks.blockCount * parseFloat(pricePerBlock) : null;

  // Roofing
  const [sheetCount, setSheetCount] = useState('');
  const [roofingCity, setRoofingCity] = useState(NO_CITY);
  const roofingPriceQuery = useMaterialCityPrice(
    roofingMaterial?.unifiedProductIds ?? [],
    roofingCity !== NO_CITY ? roofingCity : undefined,
  );
  const roofingPrice = roofingCity !== NO_CITY ? (roofingPriceQuery.data ?? null) : null;
  const roofingCost = sheetCount && roofingPrice ? parseFloat(sheetCount) * roofingPrice.avgPrice : null;

  const total = [cementCost, blockCost, roofingCost].reduce<number | null>(
    (sum, v) => (v === null ? sum : (sum || 0) + v),
    null,
  );

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Materials Cost Estimator' }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenColumn pad={false}>
          <View style={styles.breadcrumb}>
            <Pressable onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/calculators' as any)}>
              <Text style={styles.breadcrumbLink}> / Calculators</Text>
            </Pressable>
            <Text style={styles.breadcrumbSep}> / Cost Estimator</Text>
          </View>
          <Text style={styles.intro}>
            Estimate cement, block and roofing quantities for your project. We price cement and
            roofing using today&apos;s verified ShieldVase vendor rates where available.
          </Text>

          {/* 1. Cement & Concrete */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>1. Cement &amp; Concrete</Text>
            <View style={styles.twoCol}>
              <Input label="Length (m)" keyboardType="decimal-pad" value={length} onChangeText={setLength} />
              <Input label="Width (m)" keyboardType="decimal-pad" value={width} onChangeText={setWidth} />
            </View>
            <Input label="Thickness (mm)" keyboardType="decimal-pad" value={thicknessMm} onChangeText={setThicknessMm} />
            {cementCities.length > 0 && (
              <CityChips label="City (optional)" cities={cementCities} value={cementCity} onChange={setCementCity} />
            )}
            {concrete && (
              <Text style={styles.resultText}>
                {concrete.cementBags} bags of cement, {concrete.sandTonnes.toFixed(2)} tonnes of
                sand, {concrete.graniteTonnes.toFixed(2)} tonnes of granite.
                {cementCost !== null && (
                  <>
                    {' '}Estimated cement cost in {cementCity}:{' '}
                    <Text style={styles.costStrong}>{formatNaira(cementCost)}</Text>.
                  </>
                )}
                {cementCity !== NO_CITY && cementCost === null && (
                  <> No verified cement price for {cementCity} yet.</>
                )}
              </Text>
            )}
          </View>

          {/* 2. Blocks */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>2. Blocks</Text>
            <View style={styles.twoCol}>
              <Input label="Wall length (m)" keyboardType="decimal-pad" value={wallLength} onChangeText={setWallLength} />
              <Input label="Wall height (m)" keyboardType="decimal-pad" value={wallHeight} onChangeText={setWallHeight} />
            </View>
            <Input label="Price per block (₦, optional)" keyboardType="decimal-pad" value={pricePerBlock} onChangeText={setPricePerBlock} />
            {blocks && (
              <Text style={styles.resultText}>
                {blocks.blockCount.toLocaleString()} blocks needed, plus {blocks.mortarCementBags}{' '}
                bags of cement for mortar.
                {blockCost !== null && (
                  <>
                    {' '}Estimated block cost (your price):{' '}
                    <Text style={styles.costStrong}>{formatNaira(blockCost)}</Text>.
                  </>
                )}
              </Text>
            )}
          </View>

          {/* 3. Roofing Sheets */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>3. Roofing Sheets</Text>
            <Input label="Number of sheets" keyboardType="decimal-pad" value={sheetCount} onChangeText={setSheetCount} />
            {roofingCities.length > 0 && (
              <CityChips label="City" cities={roofingCities} value={roofingCity} onChange={setRoofingCity} />
            )}
            <Text style={styles.note}>
              Verified roofing sheet pricing is currently only available for{' '}
              {roofingCities.join(', ') || 'no cities yet'}.
            </Text>
            {roofingCost !== null && (
              <Text style={styles.resultText}>
                Estimated roofing cost: <Text style={styles.costStrong}>{formatNaira(roofingCost)}</Text>.
              </Text>
            )}
          </View>

          {/* Total */}
          {total !== null && (
            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Estimated total (materials only)</Text>
                <Text style={styles.totalValue}>{formatNaira(total)}</Text>
              </View>
              <Text style={styles.note}>
                Only includes the sections above with a price available. Excludes labour, finishing,
                transport and design costs.
              </Text>
            </View>
          )}

          <Pressable style={styles.cta} onPress={() => router.push('/rfq' as any)}>
            <Text style={styles.ctaText}>Request a Quote for These Materials</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </Pressable>
        </ScreenColumn>
      </ScrollView>
    </View>
  );
}

function CityChips({
  label,
  cities,
  value,
  onChange,
}: {
  label: string;
  cities: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chips}>
        <Pressable
          style={[styles.chip, value === NO_CITY && styles.chipActive]}
          onPress={() => onChange(NO_CITY)}
        >
          <Text style={[styles.chipText, value === NO_CITY && styles.chipTextActive]}>None</Text>
        </Pressable>
        {cities.map(c => (
          <Pressable key={c} style={[styles.chip, value === c && styles.chipActive]} onPress={() => onChange(c)}>
            <Text style={[styles.chipText, value === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: CREAM },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, flexWrap: 'wrap' },
  breadcrumbLink: { ...typography.caption, color: colors.textMuted },
  breadcrumbSep: { ...typography.caption, color: colors.textMuted },
  intro: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, ...shadows.card,
  },
  cardTitle: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.sm },
  twoCol: { flexDirection: 'row', gap: spacing.sm },
  fieldLabel: { ...typography.captionStrong, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceRaised, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  chipActive: { backgroundColor: AFRICAN_RED, borderColor: AFRICAN_RED },
  chipText: { ...typography.caption, color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  resultText: { ...typography.caption, color: colors.text, marginTop: spacing.sm },
  costStrong: { color: AFRICAN_RED, fontWeight: '700' },
  note: { ...typography.micro, color: colors.textMuted, marginTop: spacing.xs },
  totalCard: {
    backgroundColor: CREAM, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(228,45,64,0.2)', marginBottom: spacing.md,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  totalValue: { ...typography.h3, color: AFRICAN_RED },
  cta: {
    marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, alignSelf: 'flex-start', backgroundColor: AFRICAN_RED, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, ...shadows.card,
  },
  ctaText: { ...typography.bodyStrong, color: '#fff' },
});
