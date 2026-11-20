# 07 — Product Requirements

## Vision
The ShieldVase procurement desk in your pocket: verified suppliers,
transparent landed pricing, RFQs, group deals and price locks, PalmPay
checkout, and order visibility — same accounts, same data, same rules as web.

## Personas (from verified roles)
1. **SME buyer / contractor** — primary mobile user. Needs: find materials,
   compare vendor prices, land delivery to site, RFQ large orders, join
   deals, pay, track.
2. **Procurement lead** — multi-site buyer; needs repeat orders, addresses,
   order history/export.
3. **Vendor** — post-MVP; mobile ops (RFQ replies, order status, docs).
4. **BizDev/Admin** — web-only; not mobile surfaces.

## MVP value props
- Search + category browse over the unified catalog with per-vendor offers.
- Product detail with supplier comparison, transparent price + charges.
- Cart → checkout → PalmPay (hosted) → authoritative confirmation.
- RFQ create/track; quote comparison → accept → order.
- Group-buy & price-lock discovery, join, deposit/balance payment, tracking.
- Order list + detail with status timeline.
- Profile, addresses, wallet/rewards visibility, share/deep links.

## Requirements (functional, MVP)
F1. Auth: email/password, phone/WhatsApp OTP reuse, Google OAuth if already
    configured; `?redirect`-style post-auth return; session persist/refresh.
F2. Home: promo banners, categories, featured/deal cards, search entry.
F3. Catalog: category tree, product grid, filters (price, vendor, category),
    sort (price, rating, newest), infinite scroll.
F4. PDP: gallery, specs, MOQ/UOM, vendor offer list w/ price+delivery, CTAs
    (add to cart, RFQ, join deal if active — `ProductDealShortcut` parity).
F5. Supplier: vendor card/profile, storefront deep link.
F6. Cart: multi-vendor grouping (order_group semantics), qty edit, fee
    preview server-computed.
F7. Checkout: address select/create, delivery fee, discounts/credits,
    PalmPay initiate → hosted pay → status poll → confirmation.
F8. RFQ: multi-item form, specs/qty/delivery, submit, quote list + compare,
    accept → order conversion.
F9. Deals: group-buy list/detail, join modal parity (qty, location subsidy),
    participant tracking; price-lock list/detail, deposit % selection,
    deposit + balance payment, lock certificate/receipt view.
F10. Orders: list w/ status badges, detail w/ items + timeline + payment info,
     delivery instructions, cancel where permitted.
F11. Account: profile, business info, addresses CRUD, wallet/rewards,
     referral code + share, notifications inbox, support/deep links.
F12. Share links: deal/product share uses `share_link_settings.path_prefix`;
     taps recorded via `share_link_clicks` (dedup per session).

## Non-functional
- Cold start < 3s on mid-range Android; catalog first paint < 2.5s on 3G.
- Every money/totals figure server-computed; client shows loading until then.
- All screens: skeleton/empty/error/success states.
- Accessibility: ≥44pt targets, screen-reader labels, dynamic type.

## Explicitly out of MVP
Vendor suite (moved to P1+), bizdev/admin, live GPS map, in-app chat,
dark mode (unless trivially free via tokens).
