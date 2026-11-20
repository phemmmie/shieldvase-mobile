# ShieldVase Mobile — Design Structure Audit

**Purpose:** current-state report for a targeted mobile design revamp.
Goal: a mobile/tab-first design system that exceeds the web app in polish,
motion, and perceived quality — not a port of web styling.

**Stack:** Expo SDK 58 · React Native 0.88 · Expo Router · React 19 (with
React Compiler lint enabled) · TypeScript strict.

---

## 1. Design tokens (`src/theme/index.ts`)

The ONLY source of styling truth — every screen uses these. Currently flat
and minimal:

| Group | Current contents | Gaps |
|---|---|---|
| `colors` | `primary #E42D40` (African Red), `secondary #007749` (Green), `accent #FDB347` (Gold), background/surface/surfaceRaised, text/textMuted, border, destructive, success, warning | No surface elevation scale (surface is one flat `#F8F9FA`), no tint/alpha variants of brand colors (screens hand-write `'#FDF3F4'`, `'#E8F5EE'`, `primary + '55'`), no dark-mode structure (D9 = light at launch, but token layer should be mode-ready), no semantic `onPrimary`/`onAccent` |
| `spacing` | 4–48px in 9 steps | Fine |
| `radius` | `sm 8, md 10, lg 12, pill 999, sheet 20` | No `xl`/`2xl` for hero cards/sheets |
| `typography` | `display 28/700` → `micro 11/500`, 8 styles, system font | D13 intends **Inter-style** typography — never wired. No fontFamily anywhere; RN default font on both platforms. No lineHeight/letterSpacing specs (screens ad-hoc `lineHeight: 22`) |
| `layout` | screenMargin, cardRadius, input/buttonHeight, hitSlop | No elevation/shadow tokens, no zIndex scale, no safe-area constants |
| **missing** | — | No `shadows`/`elevation` group (no `shadow*` or `elevation` used anywhere — cards are flat bordered boxes), no `opacity` scale, no `iconSize` scale |

## 2. Navigation structure

| Element | Current state | Quality issue |
|---|---|---|
| Tab bar | Stock `Tabs` (Expo Router): Home · RFQs · Cart · Orders · Account. Ionicons **outline** icons, active = primary tint. Hand-rolled cart badge bubble. | Stock look, no selected-state treatment (no filled/active icon swap, no indicator pill, no center-fab pattern). **Deals has no tab** — lives as stack screen `/deals` (reachable only via home strip/account row). Consider 5-tab redesign or center action. |
| Stack headers | Default native headers per screen; `headerTintColor: primary`; titles set via `Stack.Screen options`. | No custom header component — no brand mark, no search-in-header, no notification bell anywhere (notifications exist but are 2 taps deep in Account), no cart shortcut on PDP/catalog headers. |
| Hamburger/drawer | **None exists.** | No drawer navigator installed or needed conceptually — but no equivalent overflow/menu affordance either. |
| Screen transitions | Platform-default stack pushes. | No hero/shared-element transitions, no modal/sheet presentations (all screens are full pushes), no gesture-driven interactions. |
| Deep-link parity | `/deals/group-buy/:slug`, `/deals/price-lock/:slug`, `/product/{slug}-p-{id}`, `/store/:slug`, `/payment-callback/:ref` | Working — keep route table unchanged in revamp. |

## 3. Component inventory (`src/components`, `src/features/*/components`)

| Component | State | Reusability problem |
|---|---|---|
| `States.tsx` | `LoadingState` (bare ActivityIndicator + text), `EmptyState` (title+hint text), `ErrorState` (text + retry) | No skeleton screens, no illustrations, no branded loading |
| `ProductCard` | 4:5 image, name, `from ₦x`, supplier count. Flat bordered card. | No price-discount badge, no rating, no wishlist heart (toggle only exists on PDP), no shadow |
| Deal cards (`deals/components.tsx`) | 16:9 image, badge row (color chips), title, price + strike, `ProgressBar`, meta line | No urgency treatment (countdown, "N left"), no joined-state visual, badge style is plain filled rect |
| Buttons | **No shared Button component** — ≥4 hand-rolled Pressable styles duplicated across screens (`.primary` copy-pasted in checkout, join flows, callbacks, account) | Inconsistent heights/radii/states; no disabled/loading/secondary/ghost variants |
| Inputs | `Field` (auth/components) + duplicated in `DeliveryForm`, `address-form` | Two implementations of the same thing; no focus states, no icons, no validation styling |
| Forms | Hand-rolled per screen | No zod/react-hook-form wiring visible to UI layer |
| Images | `expo-image`, `transition={150}` | Placeholder = solid `colors.border` block; no blurhash, no gallery/pager (PDP uses single hero only) |
| Feedback | `Alert.alert` for confirms (sign-out, delete), inline red text for errors | No toast/snackbar system, no haptics, no success animations |
| List | FlatList + pull-to-refresh in a few screens | No list separators/skeletons/section headers pattern |
| Sheet/modal | `presentation: 'modal'` on auth routes only | No bottom-sheet library; filters/pickers render inline |

## 4. Screen-level notes

- **Home** — text wordmark "ShieldVase" (no logo), pressable fake search bar, horizontal category chips (24px round img + name), deals strip (full-width cards), featured 2-col grid. No hero/banner, no personalization, sparse top area.
- **Search** — text input + sort chips + 2-col grid. Functional, plain.
- **PDP** — single hero image, name/brand/desc, deal chips, qty stepper, vendor offer rows with inline add-to-cart. No image gallery, no sticky buy bar, no variant display, no delivery/warranty info rows, no reviews section (exists in web data?).
- **Deals hub** — 3-segment pill tabs (Group Buys / Price Locks / My Deals) + card list. Best-structured screen but plain.
- **Deal landings** — hero image, badge, price box, progress, join CTA + share icon button. Solid bones, lacks urgency/exclusivity treatment that deals need.
- **Join flows** — inline step forms (qty → address → review) — no step indicator, no summary card styling.
- **Cart** — vendor-grouped rows, qty, totals. No swipe-to-delete, no saved-for-later.
- **Orders** — list + detail w/ status timeline (vertical text rows). Timeline is text-only, no icon rail.
- **Payment callback** — centered icon + text + poll. Functional but bare — this is the highest-anxiety screen and deserves real status animation.
- **Auth screens** — modal presentations, Field + button. Plain; no brand moment on first open (no splash story/onboarding).
- **Account** — avatar circle w/ initial + grouped menu rows. Clean, minimal.

## 5. Motion & polish — currently zero

- **No animation library installed.** No `react-native-reanimated`, `moti`, `lottie`, `expo-blur`, `expo-linear-gradient`, `expo-haptics`. Every interaction is instant-static.
- No skeleton loading anywhere (spinners only).
- No haptic feedback (checkout/join CTAs, toggles, badge changes).
- No scroll-driven effects (collapsing headers, parallax hero, sticky bars).
- No press-state design (`Pressable` with no `pressed` styling — buttons don't visibly respond).
- No branded splash/onboarding (stock Expo icon + white splash).

## 6. Assets

- `assets/` = stock Expo template icons (`icon.png`, `android-icon-*`, `favicon.png`, `splash-icon.png`). **No ShieldVase logo file in the repo.** Brand marks needed: app icon, adaptive icon, splash, wordmark, empty-state illustrations.

## 7. What the revamp needs to deliver

Design deliverables that can be implemented without re-architecting:

1. **Expanded token spec** — surface elevation scale (surface/raised/overlay), brand tint/alpha ramps, semantic on-color pairs, shadow/elevation definitions, radius scale up to sheet/hero, full type scale w/ line-heights, **Inter (or chosen) font family** + loading strategy.
2. **Navigation design** — tab bar treatment (icon states, Deals placement decision: 5 tabs vs. deals-in-home vs. center-fab), custom header spec (brand mark, search entry, notification bell w/ badge, contextual actions), screen transition + modal/sheet presentation map.
3. **Component specs** — Button (variants/sizes/states), Input (focus/error/icons), Card variants (product/deal/order/stat), Badge, Progress, Skeleton family, Toast/Snackbar, BottomSheet, Empty-state w/ illustration, QuantityStepper, AddressCard, Timeline.
4. **Motion spec** — which moments animate (list item enter, card press scale, join-flow step slide, payment status success, progress bar fill, tab switch), durations/easing, haptic map.
5. **Key screen comps** (priority): Home, PDP, Deals hub + deal landing, Join/deposit flow, Cart, Payment status, Auth welcome.
6. **Assets** — ShieldVase logo/wordmark SVG/PNG @2x/@3x, app icon + adaptive icon, splash, empty-state illustration set.
7. **Reusability constraints** — components must be theme-driven (no hardcoded hex), RN/Web compatible via `StyleSheet`/`expo-*` (no CSS modules, no DOM libs), and fit Expo Go for dev (reanimated is fine — bundled in Go).

## 8. Implementation notes for whoever consumes this

- Token file: `src/theme/index.ts` — extend, don't fork.
- Components live in `src/components/` + `src/features/<f>/`; screens in `src/app/` must stay thin route files.
- React Compiler lint is ON — avoid patterns it can't memoize.
- Fonts via `expo-font` (`useFonts`) — not wired today.
- Likely additions (all Expo-Go compatible): `react-native-reanimated`, `expo-haptics`, `expo-linear-gradient`, `@expo/vector-icons` (installed), `lottie-react-native` (optional), `expo-blur` (optional), `@gorhom/bottom-sheet` (needs reanimated).
- Existing context docs with web design intent: `docs/mobile-context/14_MOBILE_DESIGN_SYSTEM.md`, `12_SCREEN_BY_SCREEN_SPECIFICATION.md`, `24_MASTER_MOBILE_DEVELOPMENT_PROMPT.md`.
