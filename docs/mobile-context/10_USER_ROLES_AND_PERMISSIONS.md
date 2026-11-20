# 10 — User Roles & Permissions

## Verified role model (`app_role` enum)
`sme`, `vendor`, `admin`, `business_developer` (NOT `bizdev` — enum fix
shipped in vendor-documents migration). Role lives in
`user.user_metadata.user_type` + `user_roles` table.

## Mobile surfaces per role
| Role | Mobile scope |
|---|---|
| Guest | browse catalog/deals/vendor pages; auth-gate on cart/checkout/RFQ/join |
| `sme` | **full MVP** — all buyer features |
| `vendor` | MVP: same browse; P1: vendor ops lane (RFQ, orders, docs, payouts view) |
| `business_developer` | web-only |
| `admin` | web-only |

## Permissions model
- Enforced by Postgres **RLS** — every REST call is already role-scoped.
  Mobile adds no authorization logic; it inherits it.
- Route gating mirrors web: auth state + `user_type` → tab/root selection.
- Identity masking: never render raw counterparty names on shared surfaces —
  use `display_id` fields (SME-…, VEND-…, BD-…) as the views expose them.
- Vendor data boundaries: vendor sees own orders/quotes only — already RLS.

## Auth lifecycle
- Session: Supabase JWT (access ~1h, refresh long-lived) in SecureStore.
- Expiry → auto-refresh; failure → auth gate preserving intended route.
- Sign-out clears SecureStore + query cache; do not leak cached private data.
- Phone verification via existing `request-whatsapp-verification` flow.
