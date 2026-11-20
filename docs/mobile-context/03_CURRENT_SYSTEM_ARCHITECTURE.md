# 03 — Current System Architecture

```
Buyer (Next.js web) ─┐
Vendor dashboard    ─┼─ Supabase JS (JWT) ─→ Postgres (RLS) + REST + RPC
Admin/BizDev        ─┘                        │
WhatsApp bot ── edge fns ────────────────────│
                                             ▼
                              ~35 Edge Functions (Deno)
                               │         │         │
                         PalmPay VPS   S3 media  Email/WhatsApp
                         (Express/RSA)           providers
                                             │
                         PalmPay ── notifyUrl ─→ payment-webhook
                                             → finalize/fail_order_payment
```

## Request paths
- **Reads**: client → `supabase.from(t).select()` under JWT → RLS.
- **Simple writes**: direct inserts under RLS (deal participants, cart,
  wishlist, RFQ rows, share clicks).
- **Business-critical writes**: SECURITY DEFINER RPCs
  (`convert_cart_to_order`, `finalize_order_payment`, deal increments,
  `consume_credits`, `discount_amount`).
- **Payments**: client → `process-bank-transfer` / `process-wallet-payment`
  (JWT + server-resolved totals) → VPS `/create-order` (RSA sign, notifyUrl
  pinned with `?flow=`) → PalmPay hosted page → webhook → DB. Callback UI
  only re-reads state.

## Invariants
- `payment-webhook` is the **sole payment-status authority**; client pages
  re-read, never assert.
- Money math lives server-side (`convert_cart_to_order`, trigger-guarded
  credits/discounts, `extra_charges` jsonb on deal payments).
- Deal flow isolation: `orders.payment_flow` + `payments.flow` + WHEN-guard
  side-effect triggers; `payment_side_effect_errors` logs swallowed errors.
- Identity masking (SME-…/VEND-…/BD-…) enforced in DB views/functions.
- Optimistic-lock status transitions (e.g. group-buy join requires
  `status='pending' AND payment_status='unpaid'` on update).

## Mobile implication
Expo app uses the **same Supabase project** via `supabase-js` with a
SecureStore session adapter; edge functions via `functions.invoke`; PalmPay
via backend-initiated order then redirect/WebView to hosted page; deep
links handle `payment-callback` equivalents inside the app. Zero new
server endpoints are required for the MVP except push-token registration.
