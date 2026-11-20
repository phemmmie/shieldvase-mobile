# 19 — Implementation Roadmap

## Phase 0 — Context (done)
Platform audit, API inventory, Stitch audit, tokens, this doc set.
Deliverable: docs/mobile-context/*.

## Phase 1 — Foundation
Expo+TS scaffold, Expo Router groups, theme tokens (14), supabase client +
SecureStore auth, TanStack Query, generated DB types, core components,
env/EAS config, error/logging. Exit: sign-in→protected-tab round trip.

## Phase 2 — Marketplace MVP
Home, categories, product grid/search/filters, PDP + offer comparison,
vendor profile/storefront, cart. Exit: browse→PDP→cart works guest+auth.

## Phase 3 — Procurement
Checkout (addresses, fees, credits/discount via convert_cart_to_order),
PalmPay hosted pay + deep-link + status poll, order confirmation, orders
list/detail, RFQ create/list/quotes/accept. Exit: e2e real order paid via
webhook-verified status on production.

## Phase 4 — Deals
Group-buy browse/join/pay/track; price-lock browse/join/deposit/balance/
receipt; deal share + click tracking; My Deals. Exit: live join + deposit +
balance verified against prod data + capacity guards hold.

## Phase 5 — Engagement & vendor-lite (P1)
Notifications inbox, wallet/rewards, referral share, wishlist, push
(tokens table + sender fn = backend gap), vendor RFQ inbox + order-status
lane + doc upload. Exit gated by backend gap items in doc 20.

## Phase 6 — Hardening & launch
Perf, a11y, security review vs doc 16, Maestro e2e suite, store assets,
phased rollout.

## Dependencies/risks
- PalmPay production whitelist → payment e2e only testable on prod
  (mitigate: preview channel + small real transactions, verified pattern
  from web work).
- Push infra absent → Phase 5 partial block (doc 20).
- Live GPS absent → logistics screens limited to status timeline.
- Deep-link/universal-link config needs domain + Apple asset-links hosting
  on shieldvase.io.
