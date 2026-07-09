# PTDT Dialer — Mobile Agent App (Android)

React Native (bare) app for **AGENT** role only. Distributed as a signed **APK** (sideload).
No Play Store, no iOS build in v1.

Web/desktop client stays at [`dialer-frontend`](https://github.com/pinkpeether/dialer-frontend).
Backend stays at [`dialer-backend`](https://github.com/pinkpeether/dialer-backend) — this app talks to it as-is (plus the additive mobile endpoints listed in `docs/SPEC.md` §4).

## Prerequisites

- Node 20+ (or Bun)
- JDK 17
- Android Studio + Android SDK 34
- A real Android device or emulator (API 30+)

## First-time setup

This repo ships the JS/TS layer (screens, SIP client, API, stores). The RN
**native Android shell** (`android/`) is generated on your machine so nothing
platform-specific is checked in yet.

```bash
git clone https://github.com/pinkpeether/dialer-mobile-agent.git
cd dialer-mobile-agent
bun install                       # or npm install
bash scripts/bootstrap.sh         # generates android/ + links native deps
cp .env.example .env              # then edit values
bun run android                   # or npx react-native run-android
```

`scripts/bootstrap.sh` runs `npx @react-native-community/cli init` into a
temp dir, copies the generated `android/`, `index.js`, `app.json`, and
`babel.config.js` into this repo, then patches `AndroidManifest.xml` with
the permissions listed in `docs/SPEC.md` §5.

## What's in this repo today

```
src/
├── App.tsx
├── config.ts
├── api/           axios + auth + agent APIs
├── constants/     socket event names (mirror of web)
├── hooks/         useAuth, useSocket
├── navigation/    RootNavigator (stack)
├── screens/       Login, Workspace, Dialer (stub), IncomingCall (stub)
├── sip/           SipClient (jssip + RN-WebRTC), CallKeepBridge
└── store/         auth.store, sip.store (Zustand)
docs/SPEC.md       full engineering spec
scripts/           bootstrap + APK release helpers
```

## Building the release APK

```bash
cd android
./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Signing config is read from `android/keystore.properties` (not committed).
Copy `android/keystore.properties.example` and fill in your keystore path.

## Distribution

APK is uploaded to the backend at `/downloads/agent/latest.apk`. Agents get
a signed download URL after logging in. Auto-update checked via
`/downloads/agent/manifest.json` on every foregrounding.

See `docs/SPEC.md` §7 for the full distribution flow.
