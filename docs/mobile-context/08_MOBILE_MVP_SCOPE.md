# 08 — Mobile MVP Scope

## In scope (release 1)
| Area | Screens/features | Backend |
|---|---|---|
| Auth | welcome, sign-in/up, OTP/verify, forgot, post-auth return | Supabase Auth + check-phone-availability + whatsapp-verification |
| Home | banners, categories, featured products, deal strip | REST catalog + deals + share_link_settings |
| Catalog | category grid, product grid, search, filters, sort | `unified_products`/`vendor_products` |
| PDP | gallery, specs, offers comparison, deal shortcut, share | product joins, group_buys/price_locks by product |
| Vendor | vendor card → storefront page | vendor_profiles + vendor_storefronts |
| Cart | items, qty, vendor grouping, fee estimate | local store → checkout session |
| Checkout | address, fees, credits/discount, PalmPay | convert_cart_to_order + process-bank-transfer |
| Orders | list, detail, timeline, payment status, cancel-if-allowed | orders/order_items/payments REST |
| RFQ | create, list, detail, quote compare, accept | rfqs/rfq_items/quotations REST |
| Deals | group-buy + price-lock lists, detail, join, track | participants tables + payment fns |
| Account | profile, addresses, wallet summary, referral share, notifications, support | profiles, addresses, reward_wallets, notifications |
| Payments | PalmPay hosted flow, callback deep link, status poll | payment-webhook unchanged |

## Deferred (P1)
- Vendor mobile ops (RFQ replies, order status updates, payouts view, doc
  upload — backend already exists via `vendor-document-upload`).
- Push notifications (needs push-token table + sender fn).
- WhatsApp-linked account flows beyond existing OTP.
- Saved products/wishlist sync, recently viewed, order export, chat.
- Live delivery map (shipments has status only).

## Deferred (P2+)
- Vendor registration from mobile, bizdev anything, admin anything.
- Barcode/photo RFQ, bulk ordering, multi-org accounts.

## Not mobile
Admin console, bizdev analytics, reward-rules config, deal creation,
vendor verification review — remain web dashboards.

## MVP acceptance gates
- All F1–F12 (07 doc) pass on Android + iOS.
- Payment e2e verified against production PalmPay (whitelisted IP) using a
  real small order — same constraints as web.
- No client-side totals, no client-side status assertions.
