# 01 — Business Domain Context

## Company
ShieldVase Marketplace (Optiforge Ltd) — Nigerian B2B marketplace for
construction and industrial materials. Buyers are SMEs/contractors/
procurement teams; suppliers are verified vendors; bizdevs recruit vendors
per state; admins govern the platform. Currency: NGN (₦, kobo internally).

## Roles (verified `app_role`/`user_type`)
| Role | Surfaces |
|---|---|
| `sme` | browse, cart, checkout, RFQ, deals, orders, rewards, referrals, wishlist, addresses |
| `vendor` | storefront, products, prices/stock, RFQ quotes, order fulfilment, payouts/settlements, documents, verification |
| `admin` | everything + config: deals, rewards rules, team, storefronts, data-protection, vendors, categories |
| `business_developer` | onboarded/assigned vendors only, analytics |

Display IDs mask identity: `SME-…`, `VEND-…`, `BD-{STATE}-####`.

## Commercial workflows (all implemented)
1. **Direct purchase** — catalog → cart → checkout → PalmPay → webhook →
   `finalize_order_payment` → order lifecycle.
2. **RFQ** — buyer creates RFQ (items, specs, delivery, deadline) →
   assigned/auto-matched vendors quote → compare → accept → converts to order.
3. **Group buy** — admin-created pool with `target_quantity`, `end_date`,
   location-scoped delivery subsidy; SMEs join via modal → deposit/full
   PalmPay → participants `pending→active`; deal completes/expired.
4. **Price lock** — vendor deal: lock a unit price for a window; deposit %
   (30/50/100) → `deposit_paid` → balance (`-balance` orderId) → `fully_paid`;
   `extra_charges` jsonb (admin fee, VAT, delivery, custom) included in totals.
5. **Referrals/rewards** — shared rules engine (`evaluate_reward`), wallets,
   credits (transaction/delivery/discount kinds), EMV-based accrual,
   release on delivery; buyer/vendor referral, activation, loyalty,
   construction-professional, project-introducer programmes.
6. **Vendor storefronts** — public `store/[vendorSlug]` pages.
7. **Logistics** — delivery fee/state-city logic, shared delivery on group
   buys, shipments status ladder, waybill/POD concepts (partial).
8. **WhatsApp channel** — bot orders (`order_source='whatsapp'`), vendor
   onboarding, doc upload, RFQ inbox, settlement pushes.

## Trust & compliance
Vendor verification_status (draft→pending→under_review→approved/rejected,
suspended, changes_requested); `vendor_documents` private bucket; identity
masking on public surfaces; audited admin/bizdev mapping; RLS everywhere;
`payment_side_effect_errors` for swallowed side-effect failures.

## What mobile buyers need most
Browse/search rich catalog, compare vendor offers, transparent landed cost
(price + admin fee + VAT + delivery), RFQ for large/site-specific needs,
deal discovery + join, PalmPay checkout, order/deal tracking, notifications.
