# 06 — Mobile API Integration Spec

## Client setup
- `@supabase/supabase-js` v2 in Expo. `createClient(url, anonKey, { auth: {
  storage: SecureStoreAdapter, persistSession: true, autoRefreshToken: true,
  detectSessionInUrl: false }})`.
- SecureStore adapter: chunked JSON session storage (SecureStore 2KB limit —
  split on `.` boundary or use `expo-secure-store` large-item helper).
- Env config via `app.config.ts` → `extra`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
  per channel (dev/staging/prod EAS profiles). **Never ship service keys.**

## Data layer
- TanStack Query (`@tanstack/react-query`) — same library family as web.
  Query keys mirror web: `['products', filters]`, `['product', slug]`,
  `['orders', userId]`, `['deals', type]`.
- Generated types: `supabase gen types typescript --project-id dvkghqvouictqsntppaq`
  → `src/types/database.ts`. All table/RPC calls typed off this.
- Zod schemas for form payloads (RFQ, checkout, address) — web already uses
  zod conventions; mirror shapes from DB types.

## Read patterns
```
supabase.from('unified_products')
  .select('*, vendor_products(price, stock, vendor_id, vendor_profiles(...))')
  .eq('status','active').range(from,to)
```
- Pagination: `.range()` cursor, 24/page on grid, flatlist `onEndReached`.
- Realtime (optional P1): `supabase.channel()` on `orders` /
  `group_buy_participants` filtered to user for live status updates.

## Write patterns (authoritative boundary)
| Action | Path |
|---|---|
| Add to cart | local cart store → `convert_cart_to_order` at checkout |
| Create RFQ | insert `rfqs` + `rfq_items` (RLS) or dedicated fn if exists |
| Join group buy | insert `group_buy_participants` (pending/unpaid) → payment fn |
| Join price lock | insert `price_lock_participants` → payment fn |
| Pay | `functions.invoke('process-bank-transfer', {body})` → returns PalmPay
  checkout URL → open WebView/`Linking` → deep-link return → poll REST |
| Upload doc/image | `vendor-document-upload` / `s3-media-manager` with base64 |

## Payments (critical)
1. Invoke `process-bank-transfer` (JWT) — server resolves amount + charges.
   **Verified**: the function accepts `callBackUrl` in the request body and
   forwards it to the VPS (`callBackUrl || DEFAULT_CALLBACK_URL`) — so
   mobile CAN supply its own return URL. Caveat: PalmPay may require an
   http(s) return page rather than a custom scheme; preferred pattern is a
   hosted bridge (`https://shieldvase.io/app-return/...`) that immediately
   app-links into the app, with `shieldvase://payment-callback/...` as the
   scheme fallback.
2. Response contains PalmPay redirect URL → open `expo-web-browser` /
   in-app WebView.
3. PalmPay returns to the supplied callBackUrl → bridge/deep link → app.
4. Screen **polls the DB** (React Query refetch on `orders`/`payments` +
   participant row) — NEVER trusts redirect params for status.
5. Webhook remains sole authority; show "verifying" state until row flips.

## Error/edge conventions
- Timeouts: 15s reads, 30s payment-init; retry idempotent GETs with
  exponential backoff; mutations require client-generated idempotency
  (checkout_session reuse, `purchase_order_id` uniqueness server-side).
- 401/invalid JWT → silent refresh → single retry → sign-out to auth gate.
- RLS-denied (0 rows / 403): treat as "not found", don't retry.
- Offline: catalog queries cached (stale-while-revalidate), mutations queued
  only for cart/wishlist (never payments/RFQs — block with offline banner).

## File/image handling
- Product images served via S3-backed edge fns / public URLs — render via
  `expo-image` with disk cache + placeholder.
- Uploads (vendor docs P1+, RFQ attachments P1): `expo-document-picker` →
  base64 → `functions.invoke` with `content_type` (jpeg/png/webp/pdf, ≤5MB).
