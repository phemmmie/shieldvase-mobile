# 20 — Backend Gap Analysis

## Blocking (needed for scoped features)
| Gap | Need | Effort | Priority |
|---|---|---|---|
| No push-token registry/sender | `push_tokens` table + send edge fn (Expo Push API or FCM) | S | P1 (Phase 5) |
| No universal-link hosting | `/.well-known/assetlinks.json` + `apple-app-site-association` on shieldvase.io | XS | P0 (deep links) |

## Non-blocking adaptations
| Item | Mobile approach |
|---|---|
| No OpenAPI spec | generate TS types from DB; doc 05 is the contract |
| No dedicated home-feed endpoint | compose client-side from existing queries (as web does) |
| ~~`process-bank-transfer` returns web callback URL~~ | **RESOLVED** — accepts `callBackUrl` body param, forwarded to VPS (`callBackUrl || DEFAULT_CALLBACK_URL`). Recommend hosted bridge page `shieldvase.io/app-return` → app-link (PalmPay likely requires http(s)); `shieldvase://` scheme as fallback. Bridge page = tiny backend addition. |
| Shipments = status rows only | render timeline; no map in scope |
| Payments table lacks mobile-source flag | reuse `orders.order_source`-style column if desired (proposal only) |

## Pre-existing issues surfaced (for remediation plan, not mobile work)
- Unguarded/unwrapped order triggers (`trg_notify_vendor_order_paid`,
  `trg_restore_credits`, `trg_reverse_order_rewards`,
  `order_activity_trigger`, `trg_sync_order_to_transaction`) — a failing
  side-effect could still abort order writes; recommend same
  `payment_side_effect_errors` wrapper pass.
- Stale local `VPS/palmpay-service` mirror (logs signed bodies; predates
  `?flow=` support) — ensure it is never deployed.
- Stitch "escrow" wording ≠ actual PalmPay-verify model — copy risk.
  Owner direction (Nov 18): escrow payment option is wanted **long-term**
  but mobile ships on current PalmPay-verified flow; keep "escrow" out of
  MVP copy, log as future payment-method extension (P3).

## Future: escrow payment option (P3)
Owner wants an escrow-style payment option eventually. No escrow backend
exists today — when scoped, this is a new backend capability (hold/release
state machine on orders + settlement triggers), not a mobile concern.
Mobile work: payment-method selector UI + status copy only.

## Confirmed sufficient as-is
Auth, catalog reads, offers, cart→order RPC, payment init/webhook/finalize,
deal joins + capacity guards + resurrection guard, RFQ lifecycle, quotations,
notifications rows, share-link settings + click tracking, vendor doc upload,
reward wallets, referral codes, identity masking, RLS everywhere.
