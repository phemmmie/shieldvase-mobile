// vendor_products.price is stored in naira (vendor-entered); the payment
// layer converts to kobo at the VPS. Display formatting only — never math.

export function formatNaira(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}
