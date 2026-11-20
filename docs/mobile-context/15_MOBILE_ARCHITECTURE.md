# 15 — Mobile Architecture

## Stack (validated)
Expo SDK (latest stable) · React Native · **TypeScript strict** ·
**Expo Router** (file-based, matches web mental model + universal links) ·
`@supabase/supabase-js` + SecureStore adapter · **TanStack Query** ·
Zustand (client state: cart, session UI) · zod + react-hook-form ·
lucide-react-native · expo-image · expo-web-browser ·
`date-fns` (parity with web).

## Tree
```
shieldvase-mobile/
├── app/
│   ├── (auth)/        welcome, sign-in, register, verify, forgot
│   ├── (tabs)/        home, deals, cart, orders, profile
│   ├── product/[slug]
│   ├── category/[slug]
│   ├── store/[vendorSlug]
│   ├── deals/[dealType]/[slug]
│   ├── rfq/           index, new, [id], quotes
│   ├── checkout/      index, payment, result
│   ├── payment-callback/[id]
│   └── _layout.tsx    providers + auth gate + deep links
├── src/
│   ├── api/           supabase client, typed wrappers per domain
│   ├── components/    design-system primitives (doc 14)
│   ├── features/      catalog, cart, checkout, rfq, deals, orders,
│   │                  auth, profile, rewards — screens consume these
│   ├── hooks/         useAuth, useCart, useDealJoin, usePayment…
│   ├── store/         zustand: cart, ui, filters
│   ├── theme/         tokens (colors, type, spacing) — single source
│   ├── types/         generated database.ts + domain models
│   ├── schemas/       zod forms
│   ├── utils/         money (₦/kobo), formatting, deeplink, share
│   └── config/        env, constants
├── assets/            images, fonts, icons
├── docs/              (symlink/copy of this context)
├── tests/             unit (vitest/jest), component (RNTL), e2e (maestro)
└── app.config.ts, eas.json, package.json, tsconfig.json
```

## Layering rules
1. `app/` = routing + composition only — no business logic.
2. `features/` own queries/mutations/hooks per domain.
3. `api/` is the only place `supabase` is instantiated/imported.
4. `theme/` tokens are the only color source — no raw hex in screens.
5. Server truths (prices, statuses, totals) never live in `store/`.

## State strategy
- Server state → TanStack Query (staleTime 30–60s catalog; 5s payment poll;
  invalidate on mutation).
- **Cart is DB-backed, not local** — web uses `cart_items` rows keyed by
  anonymous `cart_session_id` (guests) that merge into the user on login,
  with realtime sync. Mobile reuses the identical pattern: insert/update
  `cart_items` under RLS (anon session via anon client where the web
  anonClient does), keep only `cart_session_id` in AsyncStorage.
- Client state → Zustand: UI prefs, search history, filters only.
- Auth → Supabase session via `AuthProvider` context + `onAuthStateChange`.
  Google OAuth exists (`signInWithOAuth` in SocialAuthButtons) — mobile
  uses `expo-auth-session`/`openAuthSessionAsync` with `redirectTo` pointed
  at the app deep link; verify provider enabled in Supabase dashboard.

## Navigation
Expo Router groups mirror roles: `(tabs)` for buyer; vendor group mounted
conditionally (P1). Deep-link config `scheme: 'shieldvase'` + associated
domains for `shieldvase.io` paths (product/deal/store/callback) so web
share links open the app.

## Payments boundary (architectural, repeat of doc 06)
initiate via edge fn → hosted PalmPay → deep link back → screen polls DB.
The app NEVER computes totals, NEVER marks paid from redirect params.

## Standards
- strict TS, eslint+prettier, path alias `@/`.
- Env via `app.config.ts` extra + EAS env; secrets only anon key + URLs.
- Logging: structured `logger` → dev console / Sentry (DSN via env).
- ErrorBoundary per route; QueryClient retry policy per doc 06.
- Accessibility: labels, ≥44pt hits, contrast-checked tokens.
