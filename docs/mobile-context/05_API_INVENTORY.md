# 05 — API Inventory

Legend: **[R]** reusable · **[A]** adapt · **[I]** incomplete · **[M]** missing · **[X]** not for mobile.

## Supabase REST (JWT + RLS) — all [R]
| Resource | Use |
|---|---|
| `unified_products`, `vendor_products`, `categories` | browse, PDP, offers |
| `orders`, `order_items`, `payments` | history, detail, status |
| `rfqs`, `rfq_items`, `quotations` | create/track RFQ, quotes |
| `group_buys`, `group_buy_participants` | deal browse/join/track |
| `price_locks`, `price_lock_participants` | lock browse/join/track |
| `profiles`, `sme_profiles`, `vendor_profiles` | profile, vendor card |
| `vendor_storefronts`, `vendor_documents` | storefront, verification |
| `notifications`, `share_link_settings`/`_clicks` | inbox, share links |
| `reward_wallets`, `referral_codes`, `discount_codes` | wallet, referrals |
| addresses tables | delivery address book |

## RPCs
| Function | Class | Notes |
|---|---|---|
| `convert_cart_to_order` | R | checkout → order creation |
| `finalize_order_payment` / `fail_order_payment` | X | webhook-only |
| `increment_group_buy_current_quantity` | X | webhook-only (capacity-guarded) |
| `increment_price_lock_locked_quantity` | X | webhook-only |
| `rfqs_matching_vendor` | R | vendor-side, post-MVP |
| `consume_credits`, `discount_amount` | A | invoked server-side at checkout; mobile calls via `convert_cart_to_order` path |
| `regenerate_deal_slug`, `deal_slug_from_pattern` | R | admin/share tooling |
| `check_phone_availability`, `resolve_referral_code` | R | signup |
| `vendor_update_order_status`, `order_cancel` | A | vendor lane / buyer cancel |

## Edge functions
| Function | Class | Purpose |
|---|---|---|
| `process-bank-transfer` | R | initiate PalmPay; body: orderId/payload → VPS |
| `process-wallet-payment` | R | wallet/credit checkout path |
| `payment-webhook` | X | PalmPay callback (server) |
| `check-phone-availability` | R | signup phone uniqueness |
| `request-whatsapp-verification` | R | OTP link |
| `register-vendor`, `register-bizdev` | A | partner onboarding (post-MVP) |
| `vendor-document-upload` | R | vendor KYC (post-MVP) |
| `s3-media-manager`, `process-product-image` | R | image serving/upload |
| `send-order-email`, `send-deal-email` | X | server side-effects |
| `nipost-postcode`, `ip-geolocate` | A | address autocomplete / click IP |
| `parse-rfq-document` | A | RFQ attachment parsing |

## VPS service (`palmpay-service`)
`POST /create-order` — RSA-signed PalmPay order create; pins notifyUrl with
`?flow=`. Mobile never calls this directly; only via `process-bank-transfer`.

## Auth
Supabase Auth: email+password, phone OTP (WhatsApp verification fn), Google
OAuth (web). Session = JWT access + refresh; RLS-scoped.

## Missing / gaps
- No push-token registry or push-send function. **[M]**
- No public OpenAPI/schema export; types must be generated from DB.
- No dedicated "home feed" endpoint — composed client-side today.
- Live shipment GPS — `shipments` rows only. **[I]**
