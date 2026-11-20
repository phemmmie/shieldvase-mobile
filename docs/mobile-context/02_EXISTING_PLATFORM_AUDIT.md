# 02 — Existing Platform Audit

## Frontend (`app/` route groups)
- `(marketing)` — home, categories `[categorySlug]`, product `[productSlug]`,
  deals `deals/[dealType]/[slug]`, store `store/[vendorSlug]`, quote, s/v
  short links, about, contact.
- `(auth)` — `/auth` (sign-in/up modal + page, `?redirect=` return).
- `(commerce)` — `orders` (+`?view=cart` shared cart/orders view),
  `order-success`, `payment`, `payment-callback/[id]`, `payment-error`.
- `(dashboard)` — `admin/*` (vendors, deals group-buy/price-lock, rewards,
  storefronts, team, data-protection, analytics, settings…),
  `sme/*` (rewards, group-buy, price-lock, orders, rfq, addresses…),
  `vendor/*` (storefront, products, refer-earn, orders, payouts…),
  `business-developer/*` (analytics, vendors).

## Backend services inventory
- Supabase REST (RLS-scoped tables/views) — primary data path.
- RPCs: `convert_cart_to_order`, `finalize_order_payment`,
  `fail_order_payment`, `evaluate_reward`, `emv_eligible_merchandise_value`,
  `margin_control_evaluate`, `consume_credits`, `discount_amount`,
  `rfqs_matching_vendor`, `regenerate_deal_slug`, `deal_slug_from_pattern`,
  `increment_group_buy_current_quantity`, `increment_price_lock_locked_quantity`,
  `reward_acceptance_tests`, `vendor_update_order_status`, `order_cancel`,
  `check_phone_availability`, `resolve_referral_code`.
- Edge functions (~35): payments (`process-bank-transfer`,
  `process-wallet-payment`, `payment-webhook`), auth (`check-phone-availability`,
  `request-whatsapp-verification`, `log-auth-event`), registration
  (`register-vendor`, `register-bizdev`, `send-admin-invitation`,
  `send-bizdev-invitation`), media (`s3-media-manager`,
  `process-product-image`, `delete-product-image`, `vendor-document-upload`),
  comms (`send-order-email`, `send-deal-email`, `send-contact-reply`,
  `resend-vendor-activation`), ops (`palmpay-recon-sync`,
  `nipost-postcode`, `ip-geolocate`, `parse-rfq-document`,
  `backfill-bot-account-activation`).
- External: PalmPay (VPS signer), WhatsApp Cloud API (bot), S3 media,
  ipify (click IP), NIPOST postcode, email service, pg_net pushes.

## Data quality / integrity patterns
Server-authoritative amounts (`process-bank-transfer` re-resolves totals),
optimistic locks on status transitions, `-balance` suffix for installment
dedup, `payment_flow` + WHEN-guarded side-effec
