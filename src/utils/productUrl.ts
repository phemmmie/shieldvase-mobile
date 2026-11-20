// Port of web utils/productUrl.ts — canonical /{slug}-p-{shortId} URLs so
// shared slugs resolve to the right unified_products row on every platform.

export const slugify = (input: string): string =>
  (input || '')
    .toString()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 80);

export const shortIdFromUuid = (id?: string | null): string =>
  (id || '').replace(/-/g, '').slice(0, 6);

/** Mobile PDP param — the full "{slug}-p-{shortId}" tail from web URLs. */
export const buildProductParam = (p: { id?: string | null; slug?: string | null }): string => {
  const productSlug = p.slug || 'product';
  const short = shortIdFromUuid(p.id);
  return short ? `${productSlug}-p-${short}` : productSlug;
};

// Parse "{slug}-p-{shortId}" → { slug, shortId }
export const parseProductSlug = (
  combined: string,
): { slug: string; shortId: string } | null => {
  const m = /^(.+)-p-([a-f0-9]{4,12})$/i.exec(combined);
  if (!m) return null;
  return { slug: m[1], shortId: m[2].toLowerCase() };
};

/**
 * Web product URLs are /{categorySlug}/{slug}-p-{shortId}; mobile routes use
 * /product/{combined}. Extract the combined tail from either form.
 */
export const productParamFromWebUrl = (url: string): string | null => {
  const parts = url.split('/').filter(Boolean);
  const tail = parts[parts.length - 1];
  return tail && tail.includes('-p-') ? tail : null;
};
