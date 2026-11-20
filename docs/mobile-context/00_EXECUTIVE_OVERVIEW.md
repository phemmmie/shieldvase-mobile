# 00 — Executive Overview

## What this is
Master context package for **ShieldVase Marketplace Mobile** (Expo + React
Native + TypeScript). It maps the existing production platform so the mobile
app extends it rather than duplicating it.

## The platform today (verified)
- **Web**: Next.js 15 App Router (`app/` route groups: `(auth)`, `(commerce)`,
  `(dashboard)`, `(marketing)`), React 19, TypeScript strict, Tailwind +
  shadcn/ui (Radix), TanStack Query, Supabase JS (`@supabase/ssr`).
- **Backend**: Supabase project `dvkghqvouictqsntppaq` — Postgres + RLS +
  ~35 edge functions + RPC business logic (`convert_cart_to_order`,
  `finalize_order_payment`, `evaluate_reward`, `rfqs_matching_vendor`, …).
- **Payments**: PalmPay via a VPS signing service (`palmpay-service/`:
  Express `/create-order`, RSA-SHA1+MD5 signing) → `payment-webhook` edge fn
  (sole payment authority) → `payment-callback` UI. Flow-isolated since
  Nov 2026 (`payment_flow` discriminator, `?flow=` webhook routing).
- **WhatsApp bot**: separate repo/service (`ShieldVase-WhatsApp-Bot`) calling
  marketplace edge functions + receiving `pg_net` push triggers
  (new-order, settlement-paid).
- **Roles**: `sme` (buyer), `vendor`, `admin`, `business_developer` (bizdev).

## Core commerce entities
`unified_products` (catalog record) ← `vendor_products` (per-vendor offer,
price/stock) → `categories`; `orders`+`order_items`+`order_groups`;
`checkout_sessions`; `payments`; `rfqs`+`rfq_items`+`rfq_assignments`+
`quotations`; `group_buys`+`group_buy_participants`; `price_locks`+
`price_lock_participants`; `shipments`/delivery; `reward_*` engine;
`referral_*`; `vendor_storefronts`/`vendor_profiles`; `vendor_documents`.

## Mobile thesis
The marketplace is **backend-complete** for buyer flows. The mobile app
should be a thin, beautifully branded Expo client over Supabase REST/RPC +
edge functions — zero new business rules, backend stays authoritative for
pricing, eligibility, payment status, deal state.

## Deliverables
Docs 01–24 cover: domain audit, architecture, DB model, API inventory +
mobile coverage matrix, PRD, MVP scope, priority matrix, roles, journeys,
screen specs, Stitch audit, design system, mobile architecture, security,
testing, deployment, roadmap, backend gaps, open questions, decision log,
agent instructions, master dev prompt.

## Non-negotiables
- No new auth model — reuse Supabase auth (email+password, phone/OTP where
  deployed, Google OAuth where configured).
- No client-side payment verdicts — `payment-webhook` is authoritative.
- No duplicated pricing/discount/deal logic — call existing RPCs/REST.
- Brand identity: African Red `#E42D40`, Green `#007749`, Gold `#FDB347`.
