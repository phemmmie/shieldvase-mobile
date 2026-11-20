# 21 — Assumptions & Open Questions (resolved Nov 18)

## Resolved
1. **`process-bank-transfer` accepts `callBackUrl`** — verified in function
   source; forwarded to VPS (`callBackUrl || DEFAULT_CALLBACK_URL`).
   Mobile supplies its own return URL; hosted bridge
   `shieldvase.io/app-return` recommended (PalmPay http(s) requirement),
   `shieldvase://` scheme as fallback.
2. **Google OAuth** — `signInWithOAuth({provider:'google'|'facebook'})` in
   `src/components/auth/SocialAuthButtons.tsx`; owner confirms Supabase
   provider configured. Mobile uses `openAuthSessionAsync` +
   `redirectTo` deep link.
3. **`notifications` table = in-app inbox** — confirmed by owner.
   Owner: allow both marketing + transactional, **properly categorised**
   (use/introduce a `category`/`type` column — verify current schema;
   if absent, log as small gap).
4. **Brand font** — no webfont is loaded; `index.css` sets OpenType
   feature flags (`ss01`, `cv01`…) on the system stack — effectively
   Inter-flavoured. Mobile standardises on **Inter** (single family,
   weight contrast) — matches intended look, ships as bundled font.
5. **Credits/discount/referral at checkout** — expose all three (same as
   web); all amounts remain server-computed via `convert_cart_to_order`.
6. **OS floor** — Android 8 / iOS 15 approved.
7. **Auth parity** — implement both WhatsApp-bot verification and
   Supabase OTP paths as web supports; no preference enforced.
8. **App name** — "ShieldVase Marketplace".
9. **Cart** — verified `src/contexts/CartContext.tsx`: DB `cart_items`
   keyed by anonymous `cart_session_id` (localStorage), merges on login,
   realtime channel sync. Mobile uses the **identical server cart**
   (better than local-only: cross-device persistence, abandoned-cart
   analytics parity).

## Decisions updated
- Escrow: wanted long-term as a payment option → P3 backend extension;
  MVP copy avoids the term (see doc 20).

## Verified-false (do not implement)
- No `bizdev` enum value → it's `business_developer`.
- No escrow/certificate-crypto infra in price locks today.
- No mobile API tier exists — everything runs on the same Supabase.

## Remaining minor verifications (Phase 1, non-blocking)
- Confirm `notifications` categorisation column exists (else tiny
  migration for marketing/transactional split).
- Confirm Supabase Google/Facebook provider toggles enabled for the app
  redirect URLs.
- Confirm PalmPay accepts non-shieldvase.io `callBackUrl` (bridge page
  keeps it same-origin anyway — lowest risk).
