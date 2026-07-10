# APK Distribution (sideload)

No Google Play. Agents install the signed APK directly from an authenticated
download link served by `dialer-backend`.

## One-time setup (release engineer)

1. Generate the release keystore (keep the `.jks` in 1Password):
   ```bash
   keytool -genkeypair -v -keystore ptdt-agent.jks -alias ptdt-agent \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Copy `android/keystore.properties.example` → `android/keystore.properties`
   and set `storeFile`, `storePassword`, `keyAlias`, `keyPassword`.
3. Confirm `bunfig.toml`, `.env.production` (`API_URL`, `SIP_WSS`) are set.

## Per-release build

```bash
bun install
bash scripts/bootstrap.sh          # only needed on first checkout
bash scripts/apk-release.sh
```

Output: `android/app/build/outputs/apk/release/app-release.apk` — record the
printed SHA-256 alongside the semver in the release notes.

## Backend hosting (dialer-backend, once wired)

`dialer-backend` gains three endpoints (behind `FEATURE_MOBILE_AGENT`):

| Endpoint | Purpose |
| --- | --- |
| `POST /downloads/agent/request-link` | Auth-gated: returns a short-lived signed URL |
| `GET  /downloads/agent/latest.apk`   | Streams the signed APK |
| `GET  /downloads/agent/manifest.json`| `{ version, apkUrl, sha256, minSupported }` |

## In-app auto-update

On foreground, the app polls `manifest.json`. If `version` > installed:
1. Show a "New version available" prompt.
2. Download to app cache dir.
3. Launch `PackageInstaller` intent so the OS prompts the user to install.

The user must have "Install unknown apps" enabled for the app source — the
onboarding walks them through this on first run.

## First-run device setup

- Enable "Install unknown apps" for the source used to fetch the APK.
- Disable battery optimization for PTDT Agent (Doze exemption).
- Grant Microphone, Notifications, Phone.
- On Xiaomi / Oppo / Vivo: enable Autostart in the OEM security app.
