/**
 * Block-quantity calculation using standard Nigerian block face dimensions
 * (450mm × 225mm face, regardless of 6"/9" thickness) plus a wastage
 * allowance and a widely-cited mortar rule of thumb. Engineering rules of
 * thumb, not vendor-sourced data. Verbatim port of web
 * src/lib/calculators/blocks.ts.
 */

const BLOCK_FACE_AREA_M2 = 0.45 * 0.225; // 0.10125 m²
const WASTAGE_FACTOR = 0.05;
/** Rule of thumb: 1 bag of cement mixes enough mortar to lay ~65 blocks. */
const BLOCKS_PER_BAG_CEMENT_MORTAR = 65;

export interface BlockInput {
  wallLengthM: number;
  wallHeightM: number;
  /** Total area of doors/windows to subtract, in m². */
  openingsAreaM2?: number;
}

export interface BlockResult {
  wallAreaM2: number;
  netAreaM2: number;
  blockCount: number;
  mortarCementBags: number;
}

export function calculateBlocks({ wallLengthM, wallHeightM, openingsAreaM2 = 0 }: BlockInput): BlockResult | null {
  if (!(wallLengthM > 0) || !(wallHeightM > 0)) return null;

  const wallAreaM2 = wallLengthM * wallHeightM;
  const netAreaM2 = Math.max(0, wallAreaM2 - (openingsAreaM2 || 0));
  const blockCount = Math.ceil((netAreaM2 / BLOCK_FACE_AREA_M2) * (1 + WASTAGE_FACTOR));

  return {
    wallAreaM2,
    netAreaM2,
    blockCount,
    mortarCementBags: Math.ceil(blockCount / BLOCKS_PER_BAG_CEMENT_MORTAR),
  };
}
