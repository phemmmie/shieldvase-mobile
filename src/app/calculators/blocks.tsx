import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenColumn } from '@/components/Responsive';
import { Input } from '@/components/Input';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatNaira } from '@/utils/money';
import { calculateBlocks } from '@/features/calculators/blocks';

// Mirrors web /calculators/blocks (BlockCalculatorClient): wall L×H,
// openings deduction, optional local prices → block/mortar counts + cost,
// RFQ CTA.

const AFRICAN_RED = '#E42D40';
const CREAM = '#FDF5E6';

export default function BlockCalculatorScreen() {
  const router = useRouter();
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [openings, setOpenings] = useState('');
  const [pricePerBlock, setPricePerBlock] = useState('');
  const [pricePerCementBag, setPricePerCementBag] = useState('');

  const result = useMemo(
    () =>
      calculateBlocks({
        wallLengthM: parseFloat(length),
        wallHeightM: parseFloat(height),
        openingsAreaM2: openings ? parseFloat(openings) : 0,
      }),
    [length, height, openings],
  );

  const blockCost = result && pricePerBlock ? result.blockCount * parseFloat(pricePerBlock) : null;
  const mortarCost = result && pricePerCementBag ? result.mortarCementBags * parseFloat(pricePerCementBag) : null;
  const totalCost = blockCost !== null || mortarCost !== null ? (blockCost || 0) + (mortarCost || 0) : null;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Block Calculator' }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenColumn pad={false}>
          <View style={styles.breadcrumb}>
            <Pressable onPress={() => router.push('/(tabs)' as any)}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/calculators' as any)}>
              <Text style={styles.breadcrumbLink}> / Calculators</Text>
            </Pressable>
            <Text style={styles.breadcrumbSep}> / Blocks</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.twoCol}>
              <Input label="Wall length (m)" placeholder="e.g. 20" keyboardType="decimal-pad" value={length} onChangeText={setLength} />
              <Input label="Wall height (m)" placeholder="e.g. 3" keyboardType="decimal-pad" value={height} onChangeText={setHeight} />
            </View>
            <Input
              label="Doors/windows area to subtract (m², optional)"
              placeholder="e.g. 6"
              keyboardType="decimal-pad"
              value={openings}
              onChangeText={setOpenings}
            />
            <Text style={styles.note}>
              We don&apos;t have verified vendor pricing for blocks yet — enter your local prices
              below for a cost estimate.
            </Text>
            <View style={styles.twoCol}>
              <Input label="Price per block (₦, optional)" placeholder="e.g. 450" keyboardType="decimal-pad" value={pricePerBlock} onChangeText={setPricePerBlock} />
              <Input label="Price per bag of cement (₦, optional)" placeholder="e.g. 13000" keyboardType="decimal-pad" value={pricePerCementBag} onChangeText={setPricePerCementBag} />
            </View>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Estimated Materials</Text>
            {result ? (
              <>
                <View style={styles.costRow}>
                  <Text style={styles.rowLabel}>Wall area</Text>
                  <Text style={styles.rowValue}>{result.netAreaM2.toFixed(2)} m²</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.rowLabel}>Blocks needed</Text>
                  <Text style={styles.rowValue}>{result.blockCount.toLocaleString()}</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.rowLabel}>Cement for mortar</Text>
                  <Text style={styles.rowValue}>{result.mortarCementBags} bags</Text>
                </View>
                {totalCost !== null && (
                  <View style={styles.costBlock}>
                    <View style={styles.costRow}>
                      <Text style={styles.rowLabel}>Estimated total cost</Text>
                      <Text style={styles.costValue}>{formatNaira(totalCost)}</Text>
                    </View>
                    <Text style={styles.costNote}>
                      Based on the local prices you entered — not ShieldVase vendor data.
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.placeholder}>Enter dimensions to see estimated quantities.</Text>
            )}
          </View>

          <Pressable style={styles.cta} onPress={() => router.push('/rfq' as any)}>
            <Text style={styles.ctaText}>Request a Quote for Blocks</Text>
            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </Pressable>
        </ScreenColumn>
      </ScrollView>
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
  note: { ...typography.micro, color: colors.textMuted, marginTop: spacing.sm },
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
