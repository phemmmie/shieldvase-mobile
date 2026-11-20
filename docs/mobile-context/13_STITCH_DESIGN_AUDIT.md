# 13 — Stitch Design Audit

## Asset inventory (verified on disk)
`OptiForge/stitch_shieldvase_mobile_ui_flow/` — 15 PNG screens:
```
01_splash_welcome              02_home_marketplace
03_account_registration        03_search
04_category_product_results    04_sign_in_fast_auth
05_product_details             06_cart_preview
06a_request_for_quote          06a_success_rfq_submitted
06b_price_lock                 06b_success_price_locked
07_shopping_cart               08_delivery_site_offloading_checkout
09_payment_escrow_settlement
```
Project: stitch.google.com/projects/7577265126521399227.

## Coverage vs real functionality
| Stitch screen | Real feature? | Verdict |
|---|---|---|
| Splash/welcome | yes | keep; brand-forward |
| Home marketplace | yes | keep; add deals rail (missing in Stitch) |
| Registration/sign-in | yes | merge w/ real auth options (OTP, Google) |
| Search + category results | yes | keep; needs filter/sort affordances |
| Product details | yes | keep; **add vendor-offer comparison** + deal shortcut (web has these; Stitch lacks them) |
| Cart preview + shopping cart | yes | dedupe — two cart concepts; unify into one cart + bottom-sheet preview |
| RFQ + success | yes | keep; add multi-item + attachments (web supports) |
| Price lock + success | yes | keep; **add deposit %, balance-due, expiry** — Stitch shows confirmation only |
| Checkout/offloading | yes | keep; reflect server-computed fees |
| Payment "escrow settlement" | **partially** | rename — platform uses PalmPay payment verification, not a true escrow product; do NOT market "escrow" unless confirmed |

## Missing from Stitch entirely (must design new)
- Group-buy flow (discovery, join, pool progress, tracking).
- Orders list/detail/tracking timeline.
- Vendor profile/storefront.
- Notifications inbox, profile/account, addresses, wallet/rewards.
- Payment verifying/failed states, RFQ quote comparison, deal share.

## Issues
- Terminology: "escrow" vs actual PalmPay-verify model — flag to owner.
- No empty/error/loading states in export.
- Numbering collision (03×2, 04×2, 06a/b) suggests ad-hoc export order.
- No vendor/bizdev/admin screens — acceptable (web dashboards).

## Redesign direction
Keep Stitch layouts as **wireframe references only**; restyle onto the
verified brand tokens (14 doc) and extend with missing surfaces above.
