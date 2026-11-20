# 16 — Security & Compliance

## Backend stays authoritative (non-negotiable)
Prices, discounts, credits, fees, stock, MOQ, deal capacity, payment
status, order status, eligibility, permissions — always server-resolved.
Client validation is UX-only.

## Mobile-specific controls
| Risk | Control |
|---|---|
| Token theft | Supabase session in `expo-secure-store` (Keychain/Keystore), never AsyncStorage; auto-refresh; wipe on sign-out |
| Payment spoofing | status only from DB rows written by `payment-webhook`; callback params treated as hints for UI routing only |
| MITM | HTTPS only (Supabase + PalmPay); no cleartext (`allowArbitraryLoads=false`) |
| RLS bypass | none possible — anon key + RLS; never ship service_role |
| PII in logs | logger scrubs auth tokens, phone, addresses; Sentry `beforeSend` redaction |
| Deep-link abuse | validate route params; never trigger payment/accept from link alone |
| Push privacy (P1) | no order contents in payload — deep link into authenticated screen |
| File upload | reuse edge-fn validation: jpeg/png/webp/pdf ≤5MB; no client-side trust |
| Rooted/jailbroken | optional P2 attestation; MVP: no blocking |
| Session on shared device | biometric lock option P1 (expo-local-authentication) |

## Compliance notes
- Nigeria market — Naira (kobo) amounts via server; NDPR-aligned: only
  collect profile data the DB already models; expose data-protection link
  (web has admin data-protection page).
- Identity masking preserved (display IDs only).
- Share-click tracking records IP via ipify + user_id + role — disclose in
  privacy policy (same as web).

## Known existing issues (documented, not fixed here)
- Order-cancel policy breadth, `order_activity_trigger` et al. unwrapped
  (could block writes on side-effect bugs) — flagged for a future
  best-effort wrapper pass.
- Local `VPS/palmpay-service` mirror is a stale draft that logs signed
  request bodies — must never be redeployed.
