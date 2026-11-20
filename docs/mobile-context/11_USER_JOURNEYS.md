# 11 — User Journeys

All API refs verified in doc 05. `→` = screen nav; `⇢` = API call.

## A — New buyer onboarding
Splash → Welcome → Register (name/phone/email/pass or Google)
→ `check_phone_availability` ⇢ → `signUp` ⇢ → WhatsApp/email verify
(`request-whatsapp-verification`) ⇢ → optional business profile
(`sme_profiles` insert) → Home.
Exit: authenticated, role=`sme`, session persisted.
Errors: phone-taken, weak password, OTP timeout → resend path.

## B — Returning buyer
Splash → (session?) → Home | Sign-in (`signInWithPassword` / OTP / OAuth)
→ redirect-preserved → Home/Search → Product.
Errors: invalid creds, unverified → resend verification.

## C — Product procurement
Home → Search/Category ⇢ `unified_products` → Results → PDP ⇢ product +
`vendor_products` offers → pick vendor/qty → Cart | RFQ | deal join.
Errors: OOS stock, MOQ below, stale offer → re-fetch.

## D — RFQ
PDP/RFQ hub → RFQ form (items, specs, qty, UOM, delivery loc + date,
attachments) → Review ⇢ insert `rfqs`+`rfq_items` → Confirmation (RFQ #)
→ Tracking: RFQ list → detail ⇢ `quotations` → compare → Accept ⇢
quotation status update → converts to order → Journey G.
Errors: validation (qty/delivery), submit-fail retry, expired RFQ.

## E — Group buy
Home/Deals → deal list ⇢ `group_buys` → detail (target/current, tiers,
location, deadline) → Join modal (qty within limits, location subsidy note)
⇢ insert `group_buy_participants` (pending/unpaid) → pay ⇢
`process-bank-transfer` flow=group_buy → PalmPay → callback screen polls
participant row → `payment_status='paid'`, `status='active'` → Pool tracking.
Errors: capacity full (409-style/-1), expired, payment verify delay,
cancelled-deal guard (row not revived — `unpaid && pending` only).

## F — Price lock
Deals → lock list ⇢ `price_locks` → detail (locked vs original price,
window, deposit %, per-SME cap) → Join (qty, deposit % 30/50/100)
⇢ insert participant → pay deposit ⇢ flow=price_lock → poll →
`deposit_paid` → Lock detail shows balance_due + expiry → Balance pay
(`-balance` order) ⇢ → `fully_paid` → certificate/receipt.
Errors: oversell guard, expiry, duplicate balance (suffix idempotency).

## G — Checkout & payment
Cart → Delivery (address, fee calc ⇢ server) → Review totals ⇢
`convert_cart_to_order` (credits/discount/referral server-side) → Payment
⇢ `process-bank-transfer` → PalmPay WebView → deep-link return →
Confirmation screen polls `orders`/`payments` until `paid` (webhook is
authority; show verifying state) → Order detail.
Errors: interrupted WebView (re-open via pending order), verify timeout,
duplicate-tap guard (single in-flight session).

## H — Order tracking
Orders tab ⇢ `orders` → detail (items, totals, timeline ⇢
`order_status_history`, delivery details, payment info) → statuses to
delivered; cancel where policy allows ⇢ `order_cancel`.
Errors: none destructive; stale → pull-to-refresh.

## I — Account
Profile → business details/addresses CRUD ⇢ → orders, wallet ⇢
`reward_wallets`, referral code + share (prefix from `share_link_settings`),
notifications inbox, support links, sign-out.

## J — Vendor (P1)
Vendor ops tab → RFQ inbox ⇢ `rfqs_matching_vendor` → quote form ⇢
`quotations` → orders ⇢ `vendor_update_order_status` → payouts view;
documents ⇢ `vendor-document-upload`.
