# ShieldVase Mobile — Expo/EAS Account Setup & Store Build Report

Project: `shieldvase-mobile` · Expo SDK 58 · React Native 0.88 · Expo Router
Repo: https://github.com/phemmmie/shieldvase-mobile (`main`)
Date: 2026-11-20

## 0. Current state — already done

| Item | Status |
|---|---|
| `eas.json` (build/submit profiles) | ✅ committed — base/development/preview/production |
| `app.json` identifiers | ✅ `io.shieldvase.marketplace` — iOS bundleId + Android package |
| `runtimeVersion` policy | ✅ `appVersion` (required for OTA updates) |
| `expo-dev-client`, `expo-updates` | ✅ installed, SDK-58 compatible |
| `EXPO_PUBLIC_*` env | ✅ baked into `eas.json` `base.env` (public-by-design values) |
| Credential files in `.gitignore` | ✅ `play-store-service-account.json`, `credentials.json` |
| `expo-doctor` | ✅ 20/20 checks pass |
| Local changes pushed to remote | ✅ `main` @ `545d91c` — working tree clean |

Everything below needs interactive accounts/credentials — none of it can be completed unattended from the repo.

## 1. Expo account setup (one-time, ~10 min)

1. Create an Expo account: https://expo.dev/signup (free tier works; EAS Build has a free quota — paid plans for larger/faster builds)
2. Install EAS CLI: `npm i -g eas-cli` (or use `npx eas-cli@latest` inline)
3. `npx eas-cli login` — authenticate this machine
4. `npx eas-cli init` — run inside `shieldvase-mobile/`. Links the repo to an EAS project and writes `extra.eas.projectId` into `app.json`. Commit the result.
5. `npx eas-cli update:configure` — writes `updates.url` + finalizes `runtimeVersion` for OTA channels (`development` / `preview` / `production` already defined in `eas.json`)

After step 5, verify: `npx eas-cli build:configure` then `npx expo-doctor`.

## 2. Android — Google Play build

### Account prerequisites (you)
- Google Play Console account — **$25 one-time** (play.google.com/console)
- A Play Console app created for `io.shieldvase.marketplace`
- Service-account JSON for automated submit:
  1. Play Console → Setup → API access → link a Google Cloud project
  2. Create service account → grant "Release manager"
  3. Download key JSON → save as `play-store-service-account.json` in repo root (already gitignored — never commit it)

### Signing
- No keystore needed locally — `eas build` auto-creates and stores an upload keystore on Expo servers (`credentialsSource: remote` is default)
- Play App Signing holds the real signing key on Google's side — enable it in Play Console on first upload

### Commands
```bash
# Internal tester APK (shareable link, no store)
eas build --platform android --profile preview

# Store AAB for Play Console
eas build --platform android --profile production

# Auto-submit to internal track (draft release)
eas submit --platform android --profile production
```

`eas.json` submit config already targets `track: internal`, `releaseStatus: draft` — promote manually in Play Console when ready for production.

## 3. iOS — App Store build

### Account prerequisites (you)
- Apple Developer Program membership — **$99/year** (developer.apple.com)
- App Store Connect access + an app record for `io.shieldvase.marketplace`
- Fill these into `eas.json` → `submit.production.ios`:
  - `appleId` — your Apple ID email
  - `ascAppId` — App Store Connect app ID (numeric, from App Information)
  - `appleTeamId` — 10-char team ID (Membership details)

### Signing
- `eas build` prompts to create distribution certificate + provisioning profile on first iOS build — answer the prompts once; EAS stores them remotely. No Mac/Xcode needed.

### Commands
```bash
# Simulator build (no dev account needed, for previewing)
eas build --platform ios --profile development

# Store IPA (requires Apple Developer account)
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --profile production
```

## 4. Build profile cheat sheet (`eas.json`)

| Profile | Artifact | Use |
|---|---|---|
| `development` | APK / iOS sim build | Dev-client for local `expo start` testing on device |
| `preview` | internal APK | Shareable install link for stakeholders/QA |
| `production` | AAB / IPA | Play Console + App Store submission, OTA `production` channel |

OTA updates (JS-only fixes after release): `eas update --branch production --message "fix"` — ships to the `production` channel without a store re-review.

## 5. Order of operations — suggested first release

1. `eas login` + `eas init` + `eas update:configure` → commit `app.json`
2. `eas build --platform android --profile preview` → install on a device → run through auth → cart → PalmPay checkout → order (the one flow never verified on-device)
3. `eas build --platform android --profile production` → `eas submit --platform android` → internal track
4. Create Play app listing (name, icon already in repo, screenshots, privacy policy) — one-time manual work
5. iOS: enroll Apple Developer → `eas build --platform ios --profile production` → `eas submit` → TestFlight

## 6. Known blockers / notes

- **Live-payment verification** — webhook-verified PalmPay flow has never been run on a real device; do this on the preview build before store submission
- **`assetlinks.json`** for Android App Links — must be hosted at `shieldvase.io/.well-known/assetlinks.json` with the app's SHA-256 fingerprint (get fingerprint via `eas credentials` after first build); needed for payment-callback deep links to auto-open the app instead of the browser
- **`apple-app-site-association`** — same deal for iOS universal links on `shieldvase.io/.well-known/`
- **Push notifications** — deferred; would add `expo-notifications` + FCM/APNs credentials later (`promptToConfigurePushNotifications` already set to `false`)
- **Privacy policy URL** — both stores require one; host on `shieldvase.io` before submission
- **Data-safety/App-privacy questionnaires** — both stores ask what data you collect (auth email/phone, addresses, payment refs); answer from `docs/mobile-context/16_SECURITY_AND_COMPLIANCE.md`
