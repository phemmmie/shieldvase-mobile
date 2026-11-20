# 24 — Master Mobile Development Prompt

> Paste this as the foundational context when opening the ShieldVase
> Marketplace Mobile project in Windsurf / Cursor / Claude Code.
> Companion docs live in `docs/mobile-context/` (00–23) — read the ones
> your current task touches before changing code.

## Mission
Build the Expo + React Native + TypeScript companion app for
**ShieldVase Marketplace** (Optiforge Ltd) — a Nigerian B2B marketplace for
construction/industrial materials. The app extends the existing production
platform: same accounts, same data, same rules. It is a client, not a new
marketplace.

## Platform facts (verified, do not re-derive)
- Web: Next.js 15 App Router + React 19 + Tailwind/shadcn + TanStack Query.
- Backend: Supabase project `dvkghqvouictqsntppaq` — Postgres + RLS +
  ~35 edge functions + SECURITY-DEFINER RPCs. All business rules live here.
- Payments: PalmPay. Initiation = `process-bank-transfer` /
  `process-wallet-payment` edge fns → VPS signer → hosted PalmPay page →
  `payment-webhook` (SOLE status authority) → `finalize_order_payment`.
  Flows are discriminated: `orders.payment_flow`, `payments.flow`,
  webhook `?flow=order|group_buy|price_lock`; price-lock balance uses
  `-balance` order-id suffix. `extra_charges` jsonb carries
  admin/VAT/delivery/custom fees and is part of what was paid.
- Deals: `group_buys`/`group_buy_participants` and
  `price_locks`/`price_lock_participants`. Joins insert participant rows
  (pending/unpaid) then pay; capacity-guarded increments return -1 on
  oversell; cancelled rows cannot be revived (`unpaid && pending` only).
- RFQ: `rfqs`+`rfq_items`+`rfq_assignments` → `quotations` → accept → order.
- Roles (`app_role` enum): `sme`, `vendor`, `admin`,
  `business_developer` (NOT `bizdev`). Identity masking = display IDs.
- Orders: `orders`+`order_items`+`order_status_history`+`payments`;
  `order_group_id` for multi-vendor checkout; `purchase_order_id` gateway ref.
- Rewards/referrals: server-side `evaluate_reward` engine + wallets/credits;
  display only on mobile.
- Brand: African Red `#E42D40`, Green `#007749`, Gold `#FDB347`.
- Share links honor `share_link_settings.path_prefix`; taps logged to
  `share_link_clicks` (session dedup).

## Architecture (approved — doc 15)
Expo SDK, Expo Router file-based routes mirroring web paths
(`/product/[slug]`, `/deals/[type]/[slug]`, `/store/[vendorSlug]`,
`/payment-callback/[id]`), `@supabase/supabase-js` with SecureStore
session, TanStack Query (server state), Zustand (cart/UI), zod+RHF,
lucide icons, generated `database.ts` types. `app/` = routing only;
`src/features` own queries/mutations; `src/theme` owns all tokens.

## Non-negotiable rules
1. Backend is authoritative for prices, totals, eligibility, stock, deal
   capacity, payment status, order status, permissions. Client validates
   for UX only.
2. Payment screens poll DB for status — never trust redirect params.
3. No service keys, no new auth model, no fabricated API surface; gaps go
   in docs 20/21 instead of being invented.
4. Design tokens only; light theme; mobile-first B2B — not generic
   e-commerce skin.
5. Small verifiable phases per doc 19; every screen ships
   loading/empty/error/success states.
6. Write tests (unit/RNTL/Maestro per doc 17); update docs when the API
   surface or decisions change; log decisions in doc 22.

## MVP scope (doc 08)
Auth + home + catalog/search/PDP-with-offer-comparison + vendor profiles +
cart + PalmPay checkout + orders + RFQ lifecycle + group-buy & price-lock
discovery/join/track + profile/addresses/wallet + notifications +
share/deep links. Vendor ops, push, GPS, chat = post-MVP.

## First tasks
1. Scaffold per doc 15; wire env + generated types + theme.
2. Auth journey (doc 11-A/B) with SecureStore session + redirect preserve.
3. Catalog slice (home→grid→PDP) on real REST — proves the data layer.

Then proceed phase-by-phase through doc 19, checking acceptance criteria
in doc 17 before moving on.
