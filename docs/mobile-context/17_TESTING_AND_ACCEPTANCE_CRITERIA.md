# 17 — Testing & Acceptance Criteria

## Stack
Unit: vitest/jest · Component: RNTL · API mocks: MSW against recorded
Supabase shapes · E2E: Maestro (device-farm friendly) · Contract: schema
diff on generated types in CI.

## P0 acceptance criteria
| Feature | Criteria |
|---|---|
| Auth | register/OTP/login/logout/refresh; redirect preserved; session survives restart; revoked → auth gate |
| Catalog | grid loads <2.5s on 3G, infinite scroll no-dupes, filters/sort applied server-side, skeletons |
| PDP | all vendor offers listed with correct price/stock; deal shortcut appears iff active deal exists; share copies configured prefix |
| Cart/checkout | totals == server `convert_cart_to_order` response; credits/discount reflected; empty-cart guarded |
| Payment | initiate→hosted→return→poll; success shows webhook-verified status only; "verifying" until DB paid; failed → retry path; double-tap = single session |
| Group buy | join→pay→participant active; capacity-full join blocked w/ message; late-callback can't revive cancelled (server-guarded) |
| Price lock | deposit→`deposit_paid`; balance (`-balance`)→`fully_paid`; expiry shown; oversell rejected |
| RFQ | create→list→quote compare→accept→order created |
| Orders | list/detail/timeline reflect DB; cancel only where allowed |

## Edge scenarios (all P0 testable)
slow 3G · airplane mid-checkout (recover via pending order) · webhook
delay (verifying UX 60s+, never trust redirect) · expired session
mid-flow · duplicate submit taps · empty catalog/deals · OOS between PDP
and checkout · image 404 (placeholder) · RLS denial → not-found state ·
app kill during PalmPay WebView (deep-link/order resume) · clock skew on
deal countdowns (server times authoritative).

## Regression
Snapshot tokens, navigation map, API contract types; run e2e payment-path
smoke on staging before each release.

## Performance/accessibility gates
Hermes cold start <3s mid-Android; list scroll 60fps; zero axe-critical
violations; all interactive targets ≥44pt labeled.
