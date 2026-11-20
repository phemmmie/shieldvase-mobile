# 12 — Screen-by-Screen Specification

States legend applies to every screen: **Loading** (skeleton), **Empty**,
**Error** (retry), **Success**. Data = verified REST/RPC/edge sources.

## Onboarding cluster
| Screen | Data | Actions | Notes |
|---|---|---|---|
| Splash/Welcome | none | sign-in, register, continue-as-guest | brand hero |
| Sign-In/Register | check-phone-availability | email/pass, OTP, Google, forgot | preserve redirect |
| Verify | request-whatsapp-verification | OTP input, resend | 6-digit |
| Profile setup | sme_profiles | business name/type, skip | optional step |

## Buyer core
| Screen | Data | Actions | Notes |
|---|---|---|---|
| Home | categories, featured unified_products, active group_buys/price_locks, banners | search, cards→PDP/deal | section rails |
| Category | categories tree | drill to grid | breadcrumbs |
| Product grid | unified_products+min vendor price | filter/sort/scroll | skeleton cards |
| Product detail | unified_product + all vendor_products offers + active deals for product | qty, add-cart, RFQ, join-deal, share | offer comparison list = key differentiator |
| Search | unified_products (ilike/FTS), recent/suggested | debounce, filters | empty-state suggestions |
| Vendor profile | vendor_profiles + storefront + their vendor_products | view products, RFQ | verification badge |
| Cart | local cart → server fee preview | qty ±, remove, checkout | group by vendor (order_group) |
| Checkout | addresses, convert_cart_to_order | address pick/new, credits/discount, pay | all totals server-computed |
| Payment | process-bank-transfer → PalmPay URL | open browser, return | WebView/browser sheet |
| Payment result | orders+payments poll | view order, retry | **polls DB only** |

## RFQ
| Screen | Data | Actions |
|---|---|---|
| RFQ create | categories/products lookup | multi-item form, specs, delivery, submit |
| RFQ list/detail | rfqs + items + status | track |
| Quote compare | quotations + items | side-by-side, accept → order |

## Deals
| Screen | Data | Actions |
|---|---|---|
| Deals hub | group_buys + price_locks (status=active) | tabs/segmented |
| Group-buy detail | deal + participants count + tiers + location | join modal (qty, limits), share |
| Price-lock detail | deal + window + deposit % + caps | join modal, share |
| My participations | my participant rows both types | pay-balance CTA, status |
| Join payment | process-bank-transfer (flow=group_buy/price_lock) | pay → poll → status |

## Orders/account
| Screen | Data | Actions |
|---|---|---|
| Orders list | orders + items + payment_status | filter by status |
| Order detail | order + items + status_history + payments | cancel-if-allowed, delivery notes |
| Notifications | notifications | mark read |
| Profile | profiles/sme_profiles, addresses CRUD | edit |
| Wallet/rewards | reward_wallets, referral_codes | share referral |
| Support | static | links/WhatsApp/call |

## Universal
Deep links: `/product/[slug]`, `/deals/[type]/[slug]`,
`/store/[vendorSlug]`, `/payment-callback`, referral `s/`/`v/` codes —
mirror web routes so shared links open the app (universal links).
Share sheets use `share_link_settings.path_prefix`; taps record to
`share_link_clicks` (session-dedup, IP via ipify where available).
