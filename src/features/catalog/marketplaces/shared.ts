// Shared constants for marketplace category pages — S3 keys resolved from
// the web app's staticImageRegistry (src/config/staticImageRegistry.ts).
export const S3_BASE = 'https://shieldvase-bronze-images.s3.eu-north-1.amazonaws.com/';

export const MARKETPLACE_IMAGES = {
  constructionHero: `${S3_BASE}static/assets/construction-carousel-2_optimized.jpg`,
  polymersHero: `${S3_BASE}static/assets/polymers-section-image_optimized.jpg`,
  energyHero: `${S3_BASE}static/assets/energy-hero-2_optimized.jpg`,
  agricultureHero: `${S3_BASE}static/products/agriculture-feed-carousel-1_optimized.jpg`,
} as const;
