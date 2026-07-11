# M4 + M5 — Background, Push, Hardening

## M4 delivered

| Area | File | Notes |
|---|---|---|
| Network reconnect | `src/net/NetworkWatcher.ts`, `src/sip/reconnect.ts` | NetInfo-driven; 800ms debounce; triggers SIP re-register + ICE restart on active session |
| Proximity sensor | `src/hooks/useProximity.ts` | Wired via InCallManager while a call is active; auto-reverts on unmount |
| App-state hook | `src/hooks/useAppState.ts` | Foreground/background transitions — used by AutoUpdater and re-register logic |
| OEM autostart | `src/oem/OemAutostart.ts`, `android/.../OemHelper.kt` | One-time prompt on hostile vendors (Xiaomi/Oppo/Vivo/Huawei/OnePlus/Meizu). Opens vendor-specific settings, falls back to app-details page. Also handles battery optimization exemption via `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`. |

*SipClient contract additions (M4):*
- `reregister()` -- force new REGISTER
- `restartIceOnActiveSession()` -- ICE restart on any in-progress RTCSession
- `getSipClient()` -- singleton accessor for reconnect flow

Wire `startNetworkWatcher()` in `App.tsx` after auth restore.

## M5 delivered

| Area | File | Notes |
|---|---|---|
| Crash reporting | `src/sentry.ts` | `@sentry/react-native`; DSN via `Config.SENTRY_DSN`; PII scrubbing in `beforeBreadcrumb` (phone-number regex) |
| Analytics facade | `src/analytics/index.ts` | Console-log sink for pilot; swap for Segment/PostHog in v1.1. Event vocabulary is fixed -- no PII allowed |
| Auto-updater | `src/update/AutoUpdater.ts` | Polls `/downloads/agent/manifest.json` on foreground; semver compare; forced update below `minSupported`; opens APK URL via `Linking` --> PackageInstaller intent |
| CI/CD | `.github/workflows/release-apk.yml` (see `docs/CI_RELEASE_WORKFLOW.yml`) | Tag-triggered (`v*.*.*`); decodes keystore from `ANDROID_KEYSTORE_B64` secret; runs `assembleRelease`; publishes APK + SHA-256 as a GitHub Release artifact. The workflow source is vendored under `docs/` because Lovable's GitHub token cannot write `.github/workflows/` -- copy the file into place manually then push. |

*Required GitHub secrets:*
- `ANDROID_KEYSTORE_B64` -- `base64 -w0 ptdt-agent.jks`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

*Runtime env (via `react-native-config`):*
- `SENTRY_DSN` (optional; skips init if missing)
- `APP_ENV` (`production` / `staging`)
- `API_URL` (already used by axios / AutoUpdater)

## App.tsx wiring order (recommended)

```ts
initSentry();
await restoreAuth();
startNetworkWatcher();
registerCallKeep();
initFcmMessaging();
runUpdateCheckOnForeground();   // fire-and-forget
if (await shouldPromptOemAutostart()) showOemPrompt();
```

## Pilot gate (v1.0.0)

- Crash-free sessions >= 99.5% over 72h
- Mean time to answer incoming (FCM --> CallKeep UI) < 3s at p95
- Zero one-way-audio reports over BT SCO on the 3x2 test matrix
- Force-update path verified end-to-end

## Not in v1 (parked for v1.1)

- iOS build
- Offline queue for dispositions
- In-app changelog surface
- Real analytics sink (Segment/PostHog)
- Per-user opt-in for Sentry telemetry
