# ShieldVase Mobile — Design Revamp Implementation Spec

**Status:** spec — awaiting design deliverables from web side (see
`docs/DESIGN_AUDIT.md`, mirrored at `shieldvase-marketplace/docs/DESIGN_AUDIT.md`).

**Goal:** high-end mobile UX — real design system, motion, branded surfaces —
while preserving every route, query key, and Supabase behavior already shipped.
This is a **visual + interaction** revamp, not a logic rewrite.

---

## 0. Constraints (non-negotiable)

- Expo SDK 58 / RN 0.88 / Expo Router — routes stay in `src/app/`, logic stays
  out of it. Component work goes in `src/components/` + `src/features/<f>/`.
- `src/theme/index.ts` is the single token source — extend it, don't fork it.
  Any hardcoded hex in screens is a bug once tokens land.
- Everything must run in **Expo Go** (reanimated, haptics, blur, gradients are
  all bundled). No libs requiring a dev build without checking first.
- React Compiler lint is ON — no manual `useMemo` dep arrays it can't preserve;
  prefer inline computation (compiler memoizes).
- `npx tsc --noEmit` + `npx expo lint` must stay clean after every step.

## 1. Dependencies to install (via `npx expo install`)

| Package | Purpose |
|---|---|
| `react-native-reanimated` | All custom animation (bundled in Expo Go) |
| `expo-haptics` | CTA presses, toggles, payment states, tab taps |
| `expo-linear-gradient` | Hero surfaces, brand washes, deal cards |
| `expo-blur` | Sticky header / floating bar materials (optional) |
| `@expo-google-fonts/inter` + `expo-font` | D13 Inter typography |
| `lottie-react-native` | Payment success / empty-state motion (optional) |
| `@gorhom/bottom-sheet` | Filters, pickers, share sheets (needs reanimated) |

## 2. Token upgrade — `src/theme/index.ts`

Extend (keep existing keys so nothing breaks):

```ts
colors: {
  ...existing,
  primarySoft: '#FDF3F4',   // replaces hand-written literals (2 sites today)
  secondarySoft: '#E8F5EE',
  accentSoft: '#FEF6E7',
  overlay: 'rgba(0,0,0,0.5)',
  surfaceElevated: '#FFFFFF', // + shadow tokens
},
shadows: { card, raised, sheet },  // shadowColor/Offset/Radius/Opacity + android elevation
typography: add fontFamily + lineHeight per style once Inter is loaded,
radius: add xl:16, '2xl':24,
```

Then sweep `src/` for hex literals — `'#FDF3F4'`, `'#E8F5EE'`, `primary + '55'`,
`'#fff'` where semantic — and replace with tokens.

## 3. Component primitives — build order

| # | Component | File | Replaces |
|---|---|---|---|
| 1 | `Button` (primary/secondary/ghost/destructive, loading+disabled+pressed states, haptic) | `src/components/Button.tsx` | 4+ copy-pasted `.primary` styles |
| 2 | `Input`/`TextField` (label, focus ring, error, icon slot) — merge auth `Field` + `DeliveryForm`/`address-form` dupes | `src/components/Input.tsx` | 2 duplicated implementations |
| 3 | `Skeleton` family (card, row, grid, hero) | `src/components/Skeleton.tsx` | ActivityIndicator loading states |
| 4 | `Card` variants (base/raised/pressable w/ scale-down press) | `src/components/Card.tsx` | ad-hoc bordered boxes |
| 5 | `Badge` (filled/soft/outline × brand colors) | `src/components/Badge.tsx` | inline badge styles in deal cards/notifications |
| 6 | `Toast`/Snackbar (success/error/info) | `src/components/Toast.tsx` + provider in `_layout` | `Alert.alert`, inline error text |
| 7 | `EmptyState` upgrade (illustration slot + optional CTA) | extend `States.tsx` | text-only empty states |
| 8 | `ProgressBar` (animated fill, brand colors) | upgrade `deals/components.tsx` | static fill |
| 9 | `Stepper` (qty +/−) | `src/components/Stepper.tsx` | duplicated in PDP + join flows |
| 10 | `QuantityStepper`… fold into Stepper | — | — |
| 11 | `Timeline` (icon rail for order status) | `src/components/Timeline.tsx` | text-only order history |
| 12 | `BottomSheet` wrapper | `src/components/Sheet.tsx` | filters/pickers inline |

## 4. Navigation revamp

- **Tab bar** — custom `tabBar` render: filled-vs-outline icon swap on active,
  raised active pill or top indicator, haptic on press, cart badge retained.
  **Decision needed from design:** does Deals get a 5th-tab slot (replace? add?)
  or stay a home destination. Flagged in audit §2.
- **Header** — custom header component: brand mark (needs logo asset), context
  title, notification bell with unread badge (data already exists via
  `useNotifications`), optional cart shortcut on catalog screens.
- **Modal grammar** — auth stays modal; filters/pickers/share → bottom sheets;
  deal join stays push (it's a flow, not an overlay).

## 5. Screen passes (priority order)

1. **Home** — hero/branded top (gradient surface, greeting + name when signed
   in), search bar → real entry, category rail polish, deals strip (urgency
   chips: "ends in Nd", "N left"), featured grid w/ skeletons.
2. **PDP** — image gallery pager (images + shared_vendor_images exist), sticky
   bottom buy bar, wishlist heart on hero, offer rows as cards, delivery/trust
   row, variant display where `category_data` axes exist.
3. **Deals hub + landings** — urgency/exclusivity treatment (countdown to
   end_date, capacity meter as hero stat), joined-state ribbon, share card.
4. **Join/deposit flows** — visible step indicator, order-summary card with
   charge rows, payment button states.
5. **Cart** — vendor section headers, swipe-to-delete or stepper row, sticky
   checkout bar w/ total.
6. **Payment callback** — animated verifying→success (Lottie or reanimated
   check draw), failure treatment. Highest-anxiety screen in the app.
7. **Auth** — branded welcome (logo, tagline, hero art or gradient), cleaner
   field styling; keep flows identical.
8. **Orders** — timeline component, status color coding, card layout.
9. **Account/notifications/saved/addresses/rewards** — consistent list-item +
   card grammar once primitives exist; these restyle almost free.

## 6. Motion spec (defaults unless design overrides)

| Moment | Animation |
|---|---|
| List/grid mount | staggered fade+rise (40ms stagger, 300ms spring) |
| Card press | scale 0.98 spring + haptic light |
| Tab switch | icon crossfade + tint |
| Join-flow steps | slide-in horizontal (step indicator animates) |
| Progress bars | animated fill on value change |
| Payment result | check-draw or confetti + success haptic |
| Pull refresh | default native (keep) |
| Toast | slide-down from top, auto-dismiss 3s |

## 7. Assets needed from design

- ShieldVase logo mark + wordmark (PNG @2x/@3x + SVG source)
- App icon + Android adaptive icon set (replace `assets/` placeholders)
- Splash art (brand wash + centered logo)
- Empty-state illustrations: empty cart, no deals, no orders, no saved items
- Optional: category icons (currently product photos)

## 8. Sequencing

1. Tokens + font load (`_layout` gate on `useFonts`) — PR-able alone
2. Primitives batch 1 (Button/Input/Skeleton/Card/Badge/Toast)
3. Nav (tab bar + header)
4. Screen passes in §5 order — each screen refactor ships independently
5. Motion pass + haptics sweep
6. Assets swap (icons/splash) + `expo-doctor` + e2e sanity on device

## 9. Explicitly out of scope

- Business logic, query keys, route paths, Supabase calls — untouched.
- Dark mode (D9 = light at launch; token layer should still be structured so
  a dark palette can drop in later).
- Push notification UI (backend-blocked, D12).
- Vendor-facing lanes (vendor-lite is a separate surface).
