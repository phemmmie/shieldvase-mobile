# 09 — Feature Priority Matrix

Effort: S <1wk · M 1–2wk · L >2wk. Backend deps reference docs 05/06.

| Feature | Pri | Why | Deps | Effort |
|---|---|---|---|---|
| Auth (email/OTP/OAuth) | P0 | gate for all buyer actions | Supabase Auth, phone-check fn | M |
| Home + categories + featured | P0 | entry surface | REST | M |
| Product grid/search/filters | P0 | core discovery | REST + indexes | M |
| PDP + vendor offer comparison | P0 | decision point | product/vendor joins | M |
| Cart + multi-vendor checkout | P0 | revenue path | convert_cart_to_order | M |
| PalmPay hosted payment | P0 | monetization | process-bank-transfer, deep link | M |
| Order list/detail/timeline | P0 | post-purchase trust | orders REST | S |
| Addresses + profile | P0 | checkout requirement | REST | S |
| Group-buy browse/join/track | P0 | differentiator | participants + payment fn | M |
| Price-lock browse/join/deposit+balance | P0 | differentiator | participants + balance flow | M |
| RFQ create/track | P0 | B2B core | rfqs REST | M |
| Quote compare + accept | P0 | RFQ completion | quotations REST | S |
| Notifications inbox | P0 | status visibility | notifications REST | S |
| Wallet/rewards summary | P1 | retention | reward_wallets REST | S |
| Referral code + share | P1 | growth | referral_codes + share links | S |
| Deal/product share + click tracking | P1 | existing infra | share_link_* | S |
| Wishlist/saved products | P1 | engagement | REST | S |
| Push notifications | P1 | re-engagement | **new table + sender fn** | M |
| Vendor RFQ inbox (mobile) | P1 | vendor ops | rfqs_matching_vendor | M |
| Vendor order status updates | P1 | fulfilment | vendor_update_order_status | M |
| Vendor doc upload | P1 | KYC parity w/ bot | vendor-document-upload | S |
| Vendor storefront mgmt | P2 | | REST | M |
| Live delivery map | P2 | | **needs GPS backend** | L |
| In-app chat | P2 | | messages infra partial | L |
| Vendor registration | P2 | | register-vendor | M |
| Multi-org procurement | P3 | | new schema | L |
| Barcode/photo RFQ | P3 | | parse-rfq-document ext. | M |
| Offline order drafts | P3 | | queue infra | M |
