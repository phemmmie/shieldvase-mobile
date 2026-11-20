# 04 — Database & Data Model (mobile-relevant)

## Catalog
- `categories` — id, name, slug, parent hierarchy.
- `unified_products` — canonical product: name, slug, description,
  images[], category_id, brand, specs, rating/reviews_count,
  aggregation_key (dedupe/merge key).
- `vendor_products` — purchasable offer: vendor_id, unified_product_id,
  price, base_price/admin_price, stock, uom, min_quantity, vendor_images,
  variant_axes/variant_values, delivery terms.
- Browse unit = `unified_products`; purchasable unit = `vendor_products`.
  PDP aggregates all vendor offers for one unified product.

## Commerce
- `checkout_sessions` — user_id, items payload, referral_slug,
  discount_code, credit_applied/transaction/delivery/discount.
- `orders` — order_number, purchase_order_id, sme_id, vendor_id,
  status(pending→confirmed→processing→shipped→delivered | cancelled),
  payment_status(unpaid/pending/paid/failed/cancelled),
  payment_flow('order'|group_buy|price_lock), total_amount, delivery_fee,
  discount_amount, credit_* columns, order_group_id, order_source
  (incl. 'whatsapp'), shipping_address/delivery_details.
- `order_items` — order_id, vendor_product_id, quantity, unit_price.
- `payments` — order_id, amount, method, status, transaction_id, flow,
  gateway_response.
- `order_status_history`, `activity_logs`.

## RFQ
- `rfqs` (+auto number, buyer, delivery, status) → `rfq_items`,
  `rfq_assignments` (vendor targeting), `quotations` + `quotation_items`.
- RPC `rfqs_matching_vendor(vendor_id)` powers vendor inbox (also bot).

## Deals
- `group_buys` — vendor_product_id, title, slug, location("State - City"),
  target_quantity, current_quantity, max_participants, price tiers,
  start/end_date, status.
- `group_buy_participants` — sme_id, quantity, status(pending/active/
  cancelled/expired/released/completed), payment_status(unpaid/paid/…),
  extra_charges jsonb, purchase_order_id, delivery_instructions.
- `price_locks` — vendor_product_id, slug, locked_price, original_price,
  lock_duration_days, deposit_percentage, total_available_quantity,
  current_locked_quantity, max_quantity_per_sme, window.
- `price_lock_participants` — locked_quantity, deposit_amount, balance_due,
  total_amount, extra_charges, payment_status(unpaid/deposit_paid/
  fully_paid), status, deposit_paid_at, balance_paid_at, expires_at,
  purchase_order_id (balance uses `-balance` suffix).

## Rewards / referrals
`reward_rules`, `reward_program_settings`, `reward_wallets`,
`referral_rewards`, `referral_codes`, `referral_clicks/_visits`,
`credit_redemptions`, `discount_codes`. Evaluated server-side by
`evaluate_reward`/`evaluate_reward__impl` + WHEN-guarded triggers.

## Users / orgs
`profiles` (names, phone), `user_roles`, `sme_profiles`,
`vendor_profiles` (verification_status, display_id, bizdev mapping),
`vendor_documents` (private bucket), `vendor_storefronts`,
`admin_profiles`, `business_developer` profiles, delivery addresses.

## Analytics / config
`share_link_settings` (path_prefix, slug_pattern), `share_link_clicks`
(ip, user_id, user_role, deal_type/slug), `payment_side_effect_errors`,
`system_settings`, `notifications`, `vendor_settlements`, `shipments`.
