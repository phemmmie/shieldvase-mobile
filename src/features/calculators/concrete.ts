/**
 * Concrete/cement quantity calculation using the standard dry-volume method
 * (wet volume × 1.54 shrinkage/voids factor, then split by mix-ratio parts)
 * that Nigerian construction guides and most concrete calculators use. These
 * are engineering rules of thumb, not vendor-sourced data — kept separate
 * from priceIndexData.ts, which is real verified pricing. Verbatim port of
 * web src/lib/calculators/concrete.ts.
 */

export interface MixRatio {
  value: string;
  label: string;
  /** [cement, sand, granite] parts. */
  parts: [number, number, number];
}

export const MIX_RATIOS: MixRatio[] = [
  { value: '1:1.5:3', label: '1:1.5:3 — High strength (columns, beams)', parts: [1, 1.5, 3] },
  { value: '1:2:4', label: '1:2:4 — Standard (slabs, general RC work)', parts: [1, 2, 4] },
  { value: '1:3:6', label: '1:3:6 — Mass concrete (foundations, blinding)', parts: [1, 3, 6] },
];

const DRY_VOLUME_FACTOR = 1.54;
const CEMENT_BAG_KG = 50;
const CEMENT_BULK_DENSITY_KG_PER_M3 = 1440;
const SAND_BULK_DENSITY_KG_PER_M3 = 1600;
const GRANITE_BULK_DENSITY_KG_PER_M3 = 1500;
const CEMENT_BAG_VOLUME_M3 = CEMENT_BAG_KG / CEMENT_BULK_DENSITY_KG_PER_M3;

export interface ConcreteInput {
  lengthM: number;
  widthM: number;
  thicknessM: number;
  mixRatio: MixRatio;
}

export interface ConcreteResult {
  wetVolumeM3: number;
  cementBags: number;
  sandM3: number;
  sandTonnes: number;
  graniteM3: number;
  graniteTonnes: number;
}

export function calculateConcrete({ lengthM, widthM, thicknessM, mixRatio }: ConcreteInput): ConcreteResult | null {
  if (!(lengthM > 0) || !(widthM > 0) || !(thicknessM > 0)) return null;

  const wetVolumeM3 = lengthM * widthM * thicknessM;
  const dryVolumeM3 = wetVolumeM3 * DRY_VOLUME_FACTOR;
  const ratioSum = mixRatio.parts[0] + mixRatio.parts[1] + mixRatio.parts[2];

  const cementM3 = dryVolumeM3 * (mixRatio.parts[0] / ratioSum);
  const sandM3 = dryVolumeM3 * (mixRatio.parts[1] / ratioSum);
  const graniteM3 = dryVolumeM3 * (mixRatio.parts[2] / ratioSum);

  return {
    wetVolumeM3,
    cementBags: Math.ceil(cementM3 / CEMENT_BAG_VOLUME_M3),
    sandM3,
    sandTonnes: (sandM3 * SAND_BULK_DENSITY_KG_PER_M3) / 1000,
    graniteM3,
    graniteTonnes: (graniteM3 * GRANITE_BULK_DENSITY_KG_PER_M3) / 1000,
  };
}
