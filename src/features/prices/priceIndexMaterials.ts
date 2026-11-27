/**
 * Curated materials taxonomy for the /prices/[material]/[city] SEO pages.
 *
 * This is a deliberately hand-picked, explicit mapping — not a generic
 * category/aggregation_key query — because it encodes data-quality
 * decisions the catalog itself doesn't capture:
 *
 *  - BUA Cement, Plaster Sand, and Corrugated Roofing Sheets are excluded:
 *    identical prices across every vendor in every city (₦12,000, ₦66,880,
 *    ₦5,512 respectively) look like seed/placeholder data, not real
 *    independent vendor pricing. Excluded until verified.
 *  - Fiberglass Roofing is excluded: its ₦78–₦7,901 range looks like a
 *    unit-price data-entry error (e.g. per-sheet vs. per-bundle), not
 *    genuine market variance.
 *  - Granite and Marine Board don't exist as products in the catalog yet.
 *  - Rebar and blocks aren't modelled at per-size granularity (no separate
 *    12mm/16mm/20mm or 9"/6" products) — only generic diameter/type ranges
 *    — so size-specific price pages aren't possible without catalog work.
 *
 * `cities` lists only cities with verified vendor coverage for that
 * material — not a shared city list across all materials. Kano has no
 * verified coverage on any launch material once the above are excluded
 * (every one of its listings belonged to an excluded product), so it is
 * deliberately absent everywhere here despite appearing in the raw data.
 *
 * Re-run the taxonomy audit query (see the SEO plan) before adding a new
 * material or city — don't add unified_product_ids here without checking
 * their vendor pricing is credible first.
 */

export interface PriceIndexMaterial {
  slug: string;
  label: string;
  /** unified_products.id values that make up this material. */
  unifiedProductIds: string[];
  /** Cities with verified (non-flat, non-outlier) vendor pricing for this material. */
  cities: string[];
}

export const PRICE_INDEX_MATERIALS: PriceIndexMaterial[] = [
  {
    slug: 'cement',
    label: 'Cement',
    unifiedProductIds: [
      'eb164baa-db5d-49f8-815b-4da9e0b0e74a', // Dangote Cement
    ],
    cities: ['Abuja', 'Ibadan', 'Kaduna', 'Lagos', 'Port Harcourt'],
  },
  {
    slug: 'iron-rod',
    label: 'Iron Rod / Rebar',
    unifiedProductIds: [
      '3c942522-0b64-4feb-9f1d-33f5ab0c2060', // Reinforcement Steel Bar (Rebar)
      '828901f7-1f76-4811-9f75-5a64665fb820', // Steel Bar (Rebar)
    ],
    cities: ['Abuja', 'Lagos', 'Kaduna'],
  },
  {
    slug: 'roofing-sheets',
    label: 'Roofing Sheets',
    unifiedProductIds: [
      'f117ef58-a04f-4f1d-b6d5-07cb215908cd', // Metal Roofing Sheets
    ],
    cities: ['Port Harcourt'],
  },
];

export const findMaterial = (slug: string): PriceIndexMaterial | undefined =>
  PRICE_INDEX_MATERIALS.find((m) => m.slug === slug);

export const citySlug = (city: string): string =>
  city.toLowerCase().replace(/\s+/g, '-');

export const findCityForMaterial = (
  material: PriceIndexMaterial,
  slug: string,
): string | undefined => material.cities.find((c) => citySlug(c) === slug);

/** All valid (material, city) combinations — used by the sitemap and generateStaticParams. */
export const allPriceIndexCombinations = (): { materialSlug: string; citySlug: string }[] =>
  PRICE_INDEX_MATERIALS.flatMap((m) =>
    m.cities.map((c) => ({ materialSlug: m.slug, citySlug: citySlug(c) })),
  );
