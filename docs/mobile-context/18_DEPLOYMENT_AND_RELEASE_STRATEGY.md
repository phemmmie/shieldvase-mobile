# 18 — Deployment & Release Strategy

## Toolchain
EAS Build (cloud) + EAS Submit → Google Play + App Store.
Channels: `development` (Expo dev client) → `preview` (internal dist,
staging Supabase or prod-read-only) → `production`.
OTA via EAS Update for JS-only fixes; native changes → new build.

## Environments
| Channel | Supabase | PalmPay | Notes |
|---|---|---|---|
| development | dev/prod-read | sandbox/unavailable | local dev client |
| preview | production (test accts) | production (small amounts) | PalmPay requires whitelisted prod IP for notifyUrl — webhook still works; hosted page fine |
| production | production | production | store builds |

PalmPay constraint (verified): callbacks only reach shieldvase.io's
whitelisted endpoint — mobile uses the same webhook; no mobile-specific
gateway config exists or is needed.

## Release gates
1. `tsc --noEmit`, eslint, unit+component tests green.
2. Maestro e2e smoke (auth, catalog, checkout-to-verifying) on preview.
3. Type-gen diff vs prod schema reviewed.
4. Store metadata: listing, screenshots (Stitch-restyled real screens),
   privacy policy URL (data-collection disclosure incl. share-click IP),
   age/content ratings.
5. Phased rollout Play 10%→50%→100%; App Store manual release after
   internal TestFlight.

## Versioning/support
SemVer app version + `runtimeVersion` policy for OTA compatibility;
minimum-supported-version check → force-update screen if backend schema
moved. Rollback = EAS Update republish / store halt.
