# 23 — Mobile Agent Instructions

Operating rules for any AI agent developing **ShieldVase Marketplace Mobile**.

## Before writing code
1. Read `24_MASTER_MOBILE_DEVELOPMENT_PROMPT.md`, then the docs your task
   touches (05/06 for API, 11/12 for screens, 14 for styling, 16 for
   security boundaries).
2. Regenerate `src/types/database.ts` from the live project if it predates
   your session — schema is the contract.

## Hard rules
- **Never fabricate** endpoints, tables, columns, enum values, or business
  rules. If doc 05 doesn't list it, verify against the repo/DB first, then
  document the gap instead of inventing it.
- **Never compute money client-side.** Display only server-returned totals
  (`convert_cart_to_order`, participant `total_amount`, `extra_charges`).
- **Never trust redirect/callback params for payment status** — poll DB
  rows written by `payment-webhook`.
- **Never bypass RLS** or request service keys; anon key + user JWT only.
- Role literal is `business_developer` — `bizdev` does not exist.
- Keep payment flows isolated: pass `flow=order|group_buy|price_lock`
  exactly as the web does; balance payments keep the `-balance` order-id
  suffix.
- Design tokens only — no raw hex/pixels outside `src/theme/`.
- Identity masking: render display IDs, not counterparty names.

## Working style
- Small verifiable phases (doc 19); each phase ships runnable.
- Match web data shapes — reuse query key conventions and field names.
- Every screen implements loading/empty/error/success before PR.
- Tests: unit for utils/hooks, RNTL for screens, Maestro for journeys in
  doc 11.
- Additions to backend surface → update docs 05/20 + DECISION_LOG.

## Red flags — stop and ask
Need for a new endpoint/table · a payment behaving unexpectedly ·
schema/type mismatch vs docs · any request to store secrets in the app.
