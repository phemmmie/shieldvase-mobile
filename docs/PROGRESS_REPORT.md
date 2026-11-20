# ShieldVase Mobile — Progress & Handoff Report

**Date:** 2026-11-19 · **Project:** `shieldvase-mobile/` (Expo SDK 58 · RN 0.88 ·
Expo Router · React 19 · TS strict)

## Where things live

| Item | Location |
|---|---|
| App source | `shieldvase-mobile/src/` |
| Routes | `src/app/` (Expo Router — `(tabs)`, `(auth)`, stack screens) |
| Design tokens | `src/theme/index.ts` — **single source of truth** |
| Components | `src/components/` (primitives), `src/features/<f>/` (domain) |
| Context docs (25 files) | `docs/mobile-context/` (copied from web repo) |
| Design audit + revamp spec | `docs/DESIGN_AUDIT.md`, `docs/DESIGN_REVAMP.md` |
| Brand assets | `assets/brand/` (og-image, placeholder, about-us jpg) |
| Stitch design refs | `assets/design-reference/` (15 PNG screens) |
| Env | `.env` — `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY`, `EXPO_PUBLIC_SITE_URL`, `EXPO_PUBLIC_PAYMENT_CALLBACK_BASE` |

## What's built and verified (tsc + lint + doctor clean)

**Features shipped:** auth (sign-in/up/verify/forgot + OAuth callback),
catalog home (categories rail, featured grid), search, category grid, PDP
(gallery pager, vendor offer cards, deals chips, qty stepper, wishlist
heart), cart (vendor-grouped, server `cart_items`), checkout → PalmPay
hosted pay, payment-callback deep-link verifier, orders list/detail, RFQ
list/create, deals hub (group-buy/price-lock/my-deals), deal landings +
join flows, addresses, saved, rewards, notifications, vendor storefront
deep links.

**Design system (revamp in progress):**
- Tokens: full web palette incl. `african.*` extension + `brandGradient`
  (navbar red→black→green), soft tints, shadows, Inter type scale.
- Primitives: Button, Input, Card, Badge, Skeletons, Toast, Stepper,
  Timeline, ProgressBar, PaymentStatusArt (SVG check-draw).
- Motion: staggered list entrances, animated progress/check-draw,
  haptics on CTAs/tabs/steppers.
- Nav: tab bar with filled/outline icon swap + haptics + cart badge.

**Design revamp screen passes done:** Payment callback (all states),
Home (gradient hero + greeting + bell), PDP (gallery + raised offer cards),
deal cards (urgency chip, "Ends today" ≤2d).

## Pending — remaining revamp passes

- Deal landings: urgency hero, capacity stat, joined ribbon
- Join/deposit flows: step indicator, order-summary card
- Cart: vendor section headers, swipe-delete, sticky checkout bar
- Orders: Timeline component wired into status history
- Auth: branded welcome (needs logo asset)
- BottomSheet wrapper for filters/pickers; EmptyState illustrations
- Toast migration sweep (replace `Alert.alert` + inline error text)
- Input dedupe (auth `Field` ↔ `DeliveryForm` ↔ `address-form`)

## Blocked on external input

1. **ShieldVase logo/app-icon assets** — no logo file exists on web either
   (wordmark text on brand gradient). Provide PNG/SVG or approve generating.
2. **Deals tab decision** — 5th tab vs home-strip destination (currently
   home strip; recommend keeping 5 tabs).
3. Vendor-lite lane priority (P1 per roadmap).

## Verified facts to not re-derive

- Backend: Supabase `dvkghqvouictqsntppaq`, RLS everywhere; reads via
  `supabase.from`, writes via RPCs/edge fns.
- Payments: `process-bank-transfer` accepts `callBackUrl` → forwards to VPS;
  `payment-webhook` sole authority; `?flow=` discriminator; `-balance` suffix.
- Cart: server `cart_items` + anon `cart_session_id`, merges on login.
- Offers: `vendor_products` under `unified_products`; only
  verified/approved vendors purchasable; `vendor_directory` public view
  for display IDs.
- Roles enum: `sme`, `vendor`, `admin`, `business_developer` (no `bizdev`).
- Products: `unified_products` (browse) ← `vendor_products` (buy);
  shared slugs need 6-char shortId disambiguation (TODO on PDP route).

## Commands

```bash
cd shieldvase-mobile
npx expo start            # dev (Expo Go)
npx tsc --noEmit          # typecheck — keep clean
npx expo lint             # lint — React Compiler rules are ON
npx expo-doctor           # env health — 20/20 expected
npx expo install <pkg>    # NEVER npm install for native deps
```

## Coding rules (from docs + AGENTS.md)

- No raw hex outside `src/theme/`; screens stay thin; logic in features.
- React Compiler lint is on — no shared-value mutation in handlers; use
  `pressed`-state or reanimated worklets inside `useAnimatedStyle` only.
- Server is authoritative for prices/totals/status — never trust
  redirect params; poll DB on payment screens.
- `npx expo install` for all deps; everything must run in Expo Go.
