# ShieldVase Web → Mobile Page Parity Plan

Source of truth: `shieldvase-marketplace` (web). The mobile app copies each web
page's content, structure, copy, and style — adapted only for mobile/tablet
responsiveness, touch usability, and Expo Router navigation.

Workflow: one page (or tightly-coupled page group) at a time → user review →
next page. Checkboxes track review sign-off.

---

## Phase 0 — Foundation (done)

- [x] Home `/` — mirrors web homepage section-for-section (through `53d6b0a`)
- [x] App header — tricolor gradient, logo, search pill, cart/bell badges
- [x] Category rail — mirrors `MainNavbar` (navy, dynamic categories)
- [x] OTA pipeline — `fallbackToCacheTimeout` + in-app "Check for updates"

## Phase 1 — Catalog & discovery (MainNavbar destinations)

Core commerce flow — highest traffic after home.

| # | Web page | Mobile route | Status |
|---|----------|--------------|--------|
| 1.1 | `/[categorySlug]` — category product grid | `category/[slug]` | exists — needs parity review |
| 1.2 | `/[categorySlug]/[productSlug]` — product detail | `product/[slug]` | exists — needs parity review |
| 1.3 | Search results UX | `search` | exists — needs parity review |
| 1.4 | `/store/[vendorSlug]` — vendor storefront | `store/[slug]` | exists — needs parity review |

## Phase 2 — TopNavbar pages

| # | Web page | Mobile route | Status |
|---|----------|--------------|--------|
| 2.1 | `/prices` + `/prices/[material]/[city]` — price index/lookup | — | missing |
| 2.2 | `/podcast` + `/podcast/[slug]` | — | missing (currently links out to web) |
| 2.3 | `/about` | — | missing (links out) |
| 2.4 | `/contact` | — | missing (links out) |
| 2.5 | `/logistics-hub` | — | missing (links out) |
| 2.6 | `/rfq` — marketing RFQ entry | `rfq/new`, `rfqs` tab | exists — compare vs web entry page |

## Phase 3 — Footer pages

| # | Web page | Mobile route | Status |
|---|----------|--------------|--------|
| 3.1 | `/faq` | — | missing (accordion lives on home only) |
| 3.2 | `/services` | — | missing (links out) |
| 3.3 | `/guides` + `/guides/[slug]` | — | missing |
| 3.4 | `/rewards-and-benefits` | `rewards` | partial — compare marketing vs dashboard versions |
| 3.5 | `/privacy-policy` | — | missing |
| 3.6 | `/terms-and-conditions` | — | missing |
| 3.7 | `/whatsapp-bot` | — | missing |

## Phase 4 — Commerce flow

Web has no `/cart` or `/checkout` routes — cart is a drawer/modal pattern.
Verify web cart UI before mobile parity pass.

| # | Web page | Mobile route | Status |
|---|----------|--------------|--------|
| 4.1 | Cart drawer/flow (web) | `cart` tab | exists — review vs web cart UX |
| 4.2 | Checkout flow | `checkout` | exists — needs parity review |
| 4.3 | `/orders` — order list | `orders` tab | exists — needs parity review |
| 4.4 | Order detail | `order/[id]` | exists — needs parity review |
| 4.5 | `/order-success/[orderId]` | — | missing/review |
| 4.6 | `/payment-callback/[id]`, `/payment/return`, `/payment-error` | `payment-callback/[ref]` | exists — needs parity review |

## Phase 5 — Deals

| # | Web page | Mobile route | Status |
|---|----------|--------------|--------|
| 5.1 | `/deals/[dealType]/[slug]` — deal landing | `deals/group-buy/[slug]`, `deals/price-lock/[slug]` | exists — needs parity review |
| 5.2 | `/group-buy` — marketing page | — | missing |
| 5.3 | `/price-lock` — marketing page | — | missing |
| 5.4 | `/quote/[slug]` — shared quote | — | missing |
| 5.5 | Join flows | `deals/join/*` | mobile adaptation — review |

## Phase 6 — SME (buyer) dashboard (done)

Web `/sme/*` — the "user dashboard". Ported as `sme/*` stack screens reached
from an SME hub card on the `account` tab (gated on `userType === 'sme'`).
Shipped in OTA `299ba495-ce42-486f-b56e-c8f5c2be7d77` (commit `90d77e4`).

| # | Web page | Mobile route | Status |
|---|----------|--------------|--------|
| 6.1 | `/sme/dashboard` — overview | `sme` hub + `account` card | done |
| 6.2 | `/sme/orders` | `orders` tab | covered — review |
| 6.3 | `/sme/group-buy` — my group buys | `deals` hub | partial — review |
| 6.4 | `/sme/price-lock` — my price locks | `deals` hub | partial — review |
| 6.5 | `/sme/rfq` — my RFQs | `rfqs` tab, `rfq/[id]` | exists — review |
| 6.6 | `/sme/quotations` | `sme/quotations` → redirects to `/rfq` | done |
| 6.7 | `/sme/invoices` | `sme/invoices` | done |
| 6.8 | `/sme/reports` | `sme/reports` (CSV export) | done |
| 6.9 | `/sme/rewards` | `rewards` | exists — review |
| 6.10 | `/sme/saved` | `saved` | exists — review |
| 6.11 | `/sme/shipments` | `sme/shipments` | done |
| 6.12 | `/sme/credit` | `sme/credit` (Coming Soon placeholder) | done |
| 6.13 | `/sme/support` | — | missing |
| 6.14 | `/sme/settings` + `/sme/settings/profile` | `sme/settings` (+ `addresses`, `address-form`) | done |

## Out of scope (flagged, not modeled)

- `/vendor/*` — vendor dashboard (~15 pages) — seller app concern
- `/admin/*` — admin dashboard (~40 pages)
- `/business-developer/*`, `/bizdev/*` — internal roles
- SEO static landers: `/agriculture/*` (20 pages), `/metals/mild-steel`,
  `/construction-materials`, `/building-in-nigeria-from-abroad` — web SEO,
  not app UX (revisit if wanted as content pages)
- `/calculators/*` (4 pages) — tools; candidate for mobile-extras phase
- `/s/[code]`, `/v/[code]` — share shortlinks; handle via deep-link
  resolution later

## Notes for each page pass

- Copy web text verbatim — including headings, CTAs, empty states.
- Preserve Supabase queries/contracts; reuse existing mobile query hooks
  where the data model already exists.
- Mobile adaptations allowed: horizontal rails instead of grids,
  accordions instead of multi-column layouts, bottom sheets instead of
  modals, `ScreenColumn` max-width on tablets.
- Do not invent screens, links, or content not present on the web page.
- After each page: `npx tsc --noEmit` + `npx expo lint` clean, commit,
  push, then user review before the next page.
