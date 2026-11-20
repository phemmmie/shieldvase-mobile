# 14 — Mobile Design System

## Brand tokens (extracted from `tailwind.config.ts` — verified)
```ts
export const colors = {
  primary:        '#E42D40', // African Red — CTAs, brand, active
  secondary:      '#007749', // African Green — success, verified, deals
  accent:         '#FDB347', // African Gold — highlights, badges, ratings
  background:     '#FFFFFF',
  surface:        '#F8F9FA',
  surfaceRaised:  '#FFFFFF',
  text:           '#1A1A2E',
  textMuted:      '#6B7280',
  border:         '#E5E7EB',
  destructive:    '#DC2626',
  success:        '#007749',
  warning:        '#F59E0B',
} // dark variants: deferred (P3) — brand is light-forward
```
Derived ramps (for design use, not in web code — generate 50–900 scales
around each brand hex; keep AA contrast: primary on white, white on
primary/secondary).

## Typography
Web uses system stack + Tailwind scale. Mobile tokens (pt):
| Token | Size/Wt | Use |
|---|---|---|
| display | 28/700 | hero, deal prices |
| h1 | 24/700 | screen titles |
| h2 | 20/600 | section heads |
| h3 | 17/600 | card titles |
| body | 15/400 | default |
| bodyStrong | 15/600 | prices, key data |
| caption | 13/400 | meta, labels |
| micro | 11/500 | badges, UOM |
Font: **Inter** (resolved) — web loads no webfont but uses Inter-style
OpenType feature flags (`ss01`, `cv01`…); mobile bundles Inter for a
consistent Inter-like brand face. Single family, weight contrast only.

## Spacing/layout
- 4pt grid: 4/8/12/16/20/24/32/40/48.
- Screen margin 16 (20 on tablets ≥768 → 2-col grids).
- Card radius 12 (lg), buttons/inputs 10, chips/badges 999 pill,
  sheets 20 top-radius. Elevation: card = subtle 4dp shadow or 1px border
  (web favors flat+border — prefer border).

## Components (mapped from shadcn/ui web set)
Button (primary red solid, secondary green outline, ghost, destructive;
48pt height, 10 radius, loading state) · Input (48pt, label-above, error
text, right icon) · SearchBar (16 pill radius, leading icon, filter
accessory) · ProductCard (4:5 image, name 2-line, price bodyStrong,
vendor row w/ verification badge, MOQ caption) · VendorOfferRow
(price, stock, delivery, select radio) · DealCard (progress bar
current/target, countdown, tier chip, green accent) · StatusBadge
(color tokens per order/payment_status) · PriceRow (label + amount,
accent for savings/locked price) · BottomNav (5 tabs: Home, Search/Deals,
Cart(badge), Orders, Profile — red active) · BottomSheet (join-deal modals,
filters, cart preview) · BannerCarousel · EmptyState (illustration +
caption + CTA) · Skeleton variants per card · Toast/Snackbar ·
ConfirmDialog · OTPInput (6 cells) · Stepper (checkout/payment states) ·
QuantityStepper (respects MOQ/max) · ShareButton (copies configured
prefix link, records click).

## Imagery
Product photos on surface bg, logo lockups from web assets, gold-star
ratings, green verification tick, red deal ribbon. Trust pattern: verified
badge + masked display IDs (VEND-…) consistent with web masking.

## Iconography
Lucide (matches web `lucide-react` → `lucide-react-native`); outlined,
20/24pt, muted color unless semantic.
