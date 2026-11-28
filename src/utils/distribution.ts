// Port of web src/utils/distribution.ts — only the formatter used by
// /order-success (getDispatchWindow stays web-side until a screen needs it).

export const formatDispatchRange = (
  minDays?: number | null,
  maxDays?: number | null,
): string | null => {
  const min = Number.isFinite(Number(minDays)) ? Math.round(Number(minDays)) : null;
  const max = Number.isFinite(Number(maxDays)) ? Math.round(Number(maxDays)) : null;
  if (min === null && max === null) return null;

  const normalizedMin = min ?? max ?? 0;
  const normalizedMax = max ?? min ?? normalizedMin;
  const plural = (value: number) => `${value} day${value === 1 ? '' : 's'}`;

  if (normalizedMax === 0) return 'Same-day';
  if (normalizedMin === 0) return `Same-day to ${plural(normalizedMax)}`;
  return normalizedMin === normalizedMax
    ? `Up to ${plural(normalizedMax)}`
    : `${plural(normalizedMin)}–${plural(normalizedMax)}`;
};
