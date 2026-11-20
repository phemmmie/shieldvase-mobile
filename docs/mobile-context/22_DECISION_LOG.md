# 22 — Decision Log

| # | Decision | Rationale | Status |
|---|---|---|---|
| D1 | Same Supabase project, no mobile backend | RLS+RPC already enforce everything; duplicating = divergence risk | Approved |
| D2 | Expo + Expo Router | file-based nav mirrors web, universal links, OTA updates, single codebase | Approved |
| D3 | Reuse Supabase Auth (no new auth) | shared accounts with web; OTP/OAuth already exist | Approved |
| D4 | PalmPay via hosted page + deep link | VPS signer + webhook stay authoritative; no PCI surface in app | Approved |
| D5 | TanStack Query + Zustand | same libraries as web; clear server/client split | Approved |
| D6 | DB-generated types as API contract | no OpenAPI; types are authoritative + CI diff | Approved |
| D7 | Vendor lane deferred to P1 | buyer value first; vendor backend already exists for later | Proposed |
| D8 | Server `cart_items` cart w/ anon `cart_session_id`, merge-on-login, realtime | verified web implementation in `CartContext.tsx`; gives cross-device cart + abandoned-cart analytics | Approved |
| D9 | Light theme only at launch | brand is light-forward; dark = P3 | Proposed |
| D10 | No "escrow" wording in MVP UI; escrow as future payment option | owner: escrow wanted long-term, MVP ships PalmPay-verify | Approved |
| D13 | Inter as mobile brand font | web loads no webfont (system stack + Inter-style feature flags); Inter matches intent, bundles cleanly | Approved |
| D14 | Hosted `shieldvase.io/app-return` bridge for PalmPay return | `callBackUrl` param verified end-to-end; http(s) safer than custom scheme for PalmPay redirect | Approved |
| D15 | Notifications: marketing + transactional, categorised | owner direction; verify category column exists | Approved |
| D11 | `app/` routes mirror web paths | shared links open correct app screens | Approved |
| D12 | Push = Phase 5 | requires new table+fn; not MVP-critical | Approved |
