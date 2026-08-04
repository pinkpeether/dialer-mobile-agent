# PTDT Dialer — Android Agent App: Release Checklist

Status: **code complete (pilot-ready)**. Everything below is manual ops.

## 1. Backend (`pinkpeether/dialer-backend`)
Apply `docs/BACKEND_PR_MOBILE_AGENT.md` as one PR, then set on staging:
- `FEATURE_MOBILE_AGENT=true`
- `JWT_REFRESH_SECRET=$(openssl rand -hex 64)`
- `FCM_SERVICE_ACCOUNT_JSON=<base64 of Firebase service-account JSON>`
- `MOBILE_APK_MANIFEST_URL=https://github.com/pinkpeether/dialer-mobile-agent/releases/latest/download/manifest.json`

## 2. Firebase
Project "PTDT Dialer Agent" → Android app `com.ptdt.dialer.agent` →
`google-services.json` into `android/app/`.

## 3. Signing
```
keytool -genkeypair -v -keystore ptdt-agent.keystore -alias ptdt -keyalg RSA -keysize 2048 -validity 10000
```
Repo secrets: `PTDT_KEYSTORE_BASE64`, `PTDT_KEYSTORE_PASSWORD`, `PTDT_KEY_ALIAS`, `PTDT_KEY_PASSWORD`.

## 4. CI
Copy `docs/CI_RELEASE_WORKFLOW.yml` → `.github/workflows/release-apk.yml`
(requires a token with `workflow` scope), then tag `v0.1.0`.

## 5. Pilot
`bash scripts/bootstrap.sh` → build → sideload on one Xiaomi + one Pixel →
run onboarding wizard → inbound call with screen locked → check backend log `fcm_wake_sent`.

## Repo contents
- `src/` — RN app: api, sip (jsSIP + react-native-webrtc), CallKeep bridge, stores, screens, onboarding, FCM, reconnect, auto-updater, Sentry
- `android/` — Kotlin native: CallService, IncomingCallReceiver, AudioRoutingModule, OemHelper
- `scripts/` — bootstrap, apk-release, manifest patcher
- `docs/` — SPEC, APK distribution, M4/M5 notes, backend PR, onboarding patch, CI workflow
