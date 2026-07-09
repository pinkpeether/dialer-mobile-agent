# PTDT Dialer — Android Agent App (v1) Engineering Spec

**Status:** Approved direction, ready for Phase M1 build
**Scope:** Agent role only. APK sideload distribution. No Play Store, no iOS, no supervisor/admin surfaces.
**Source refs:** `pinkpeether/dialer-frontend` @ `1a58b8f`, `pinkpeether/dialer-backend` @ `26ba3b8`

---

## 1. Decisions locked

| # | Decision | Reason |
|---|----------|--------|
| 1 | **Agent role only** in v1 | 6–8 mobile-relevant screens vs. 45+ admin screens; supervisors keep using web |
| 2 | **React Native (bare) + `react-native-webrtc` + `react-native-callkeep` + `jssip`** | Native RTC/audio, ConnectionService for lock-screen calls, ~40% code reuse from web |
| 3 | **APK sideload only**, signed with an internal keystore | No Play Store review, self-hosted download |
| 4 | New repo `dialer-mobile-agent` (do **not** add RN into `dialer-frontend`) | Electron/Vite and RN/Metro in one tree conflict |
| 5 | Backend reused; small additive changes only (no schema breaks) | Ship fast, keep web unaffected |

> If PJSIP-level reliability is later required, we swap `jssip` for a thin Kotlin bridge over **Linphone SDK** while keeping `react-native-webrtc`'s media stack — the JS API surface stays identical.

---

## 2. Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│  Android APK (dialer-mobile-agent)                           │
│                                                              │
│   React Native 0.75+  (New Architecture / Fabric)            │
│   ├── UI: React 19, Zustand, TanStack Query   (from web)     │
│   ├── HTTP: axios wrapper                     (from web)     │
│   ├── Realtime: socket.io-client              (from web)     │
│   ├── SIP signalling: jssip 3.x                              │
│   ├── Media: react-native-webrtc               (native)      │
│   ├── Call UX: react-native-callkeep           (native)      │
│   ├── Push wake: @react-native-firebase/messaging (FCM)      │
│   ├── Storage: react-native-keychain (JWT), MMKV (prefs)     │
│   └── Foreground svc + wake locks    (custom Kotlin module)  │
└──────────────────────────────────────────────────────────────┘
                    │  HTTPS + WSS
                    ▼
┌──────────────────────────────────────────────────────────────┐
│  dialer-backend  (Node/Express + Prisma + Socket.IO)         │
│  + mobile/agent route group  (new, thin)                     │
│  + refresh tokens             (new)                          │
│  + FCM device registration    (new)                          │
│  + push-wake hook in AMI incoming path (new)                 │
└──────────────────────────────────────────────────────────────┘
                    │
                    ▼
           Asterisk / FreePBX  (unchanged)
```

---

## 3. Reuse map (what copy-pastes from web)

| From `dialer-frontend/src/…` | To mobile | Change |
|---|---|---|
| `constants/socketEvents.ts` | verbatim | none |
| `api/axios.ts` + agent-relevant `api/*.api.ts` | verbatim | swap base URL to `Config.API_URL` |
| `store/auth.store.ts` | port | `localStorage` → `AsyncStorage` + `Keychain` for token |
| `store/sip.store.ts` | port | drive from RN-WebRTC events instead of `sip.js` |
| `hooks/useAuth.ts`, `useSocket.ts`, `useCallbacks.ts`, `useContacts.ts`, `useAgents.ts` | port | `useNavigate` → `useNavigation` |
| Screens: `Login`, `AgentWorkspace`, `Dialer`, `Contacts(+Detail)`, `Calls`, `Callbacks`, `SmsConsole`, `SipSettings`, `Settings` | rebuild UI, keep logic | RN components, keyboard-safe |
| Components: `CallDispositionModal`, `IncomingCallModal`, `CallStatusBar`, `MiniCallBar` | rebuild | native modals + CallKeep hooks |

**Explicitly NOT ported:** supervisor / admin / reports / campaigns / monitoring / security / platform / customer / billing.

---

## 4. Backend additions (small, additive, non-breaking)

Guarded so the existing web app is not affected. Feature flag `FEATURE_MOBILE_AGENT=true` gates all new endpoints until pilot.

### 4.1 Refresh tokens
`POST /auth/login` gains `refreshToken` in response. New `POST /auth/refresh` swaps refresh → new access token.

```prisma
model AuthRefreshToken {
  id         String    @id @default(cuid())
  userId     Int
  tokenHash  String    @unique
  userAgent  String?
  ip         String?
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
  user       User      @relation(fields: [userId], references: [id])
  @@index([userId])
}
```

### 4.2 Device registration for FCM
```prisma
model AgentDevice {
  id         String   @id @default(cuid())
  userId     Int
  platform   String   // "android"
  fcmToken   String   @unique
  appVersion String?
  lastSeen   DateTime @default(now())
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  @@index([userId])
}
```

New routes (`src/routes/mobile/agent.routes.ts`, gated by `auth` + AGENT role):

```
POST   /mobile/agent/devices          register/update FCM token
DELETE /mobile/agent/devices/:id      unregister on logout
GET    /mobile/agent/bootstrap        one-call profile+sip+queue snapshot
```

### 4.3 Push-wake hook
In `services/asteriskAmi.service.ts`, at the point the incoming-call event is emitted to the agent's socket room, also enqueue a data-only high-priority FCM push:

```json
{ "type":"incoming_call", "callId":"…", "from":"+91…", "campaign":"…", "ts":1720000000000 }
```

No notification payload — CallKeep renders the incoming UI.

### 4.4 Secrets (Railway)
- `FCM_SERVICE_ACCOUNT_JSON` (base64) — for `firebase-admin`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_TTL` (default `30d`)
- `FEATURE_MOBILE_AGENT` (`true` / `false`)

### 4.5 CORS / rate-limit
Allow-list `com.ptdt.dialer.agent` UA; loosen 429 thresholds for `mobile/agent/*`.

**Migration file:** `prisma/migrations/2026XXXX_mobile_agent_foundation/migration.sql` — additive only.

---

## 5. Android app — module & folder plan (`dialer-mobile-agent`)

```text
dialer-mobile-agent/
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/ptdt/dialer/agent/
│       │   ├── CallService.kt            # ForegroundService (type=phoneCall)
│       │   ├── IncomingCallReceiver.kt   # FCM data-msg → CallKeep.displayIncomingCall
│       │   ├── AudioRoutingModule.kt     # earpiece / speaker / BT toggle
│       │   └── MainApplication.kt
│       └── res/…
├── src/
│   ├── api/                     # copied from web, base URL from Config
│   ├── config.ts
│   ├── store/                   # auth.store, sip.store, ui.store
│   ├── sip/
│   │   ├── SipClient.ts         # jssip UA + RN-WebRTC RTCPeerConnection
│   │   ├── CallKeepBridge.ts    # CallKeep events ↔ SipClient
│   │   └── audio.ts             # InCallManager wrapper
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── WorkspaceScreen.tsx
│   │   ├── DialerScreen.tsx
│   │   ├── IncomingCallScreen.tsx
│   │   ├── ContactsScreen.tsx / ContactDetailScreen.tsx
│   │   ├── CallsScreen.tsx / CallDetailScreen.tsx
│   │   ├── CallbacksScreen.tsx
│   │   ├── SmsScreen.tsx
│   │   ├── SipSettingsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/RootNavigator.tsx
│   ├── hooks/                   # ported from web
│   ├── components/              # RN equivalents
│   └── App.tsx
├── .env.production / .env.staging
└── package.json
```

### Key packages
```
react-native@0.75+
react-native-webrtc@^124
react-native-callkeep@^4
@react-native-firebase/app + /messaging
jssip@^3.10
@react-navigation/native + native-stack + bottom-tabs
react-native-keychain
react-native-mmkv
react-native-incall-manager
react-native-permissions
react-native-config
socket.io-client@^4.8
axios@^1.16
@tanstack/react-query@^5.100
zustand@^5
lucide-react-native
```

### `AndroidManifest.xml` — permissions
```
INTERNET, ACCESS_NETWORK_STATE
RECORD_AUDIO, MODIFY_AUDIO_SETTINGS
BLUETOOTH_CONNECT
POST_NOTIFICATIONS
READ_PHONE_STATE, READ_PHONE_NUMBERS
FOREGROUND_SERVICE, FOREGROUND_SERVICE_PHONE_CALL
USE_FULL_SCREEN_INTENT
WAKE_LOCK
VIBRATE
```

### CallKeep wiring (make-or-break)
- App start: `RNCallKeep.setup({...})` + `setAvailable(true)`.
- FCM data message → native `IncomingCallReceiver` calls `RNCallKeep.displayIncomingCall(uuid, from, name, 'number', false)` **before** JS is guaranteed alive.
- CallKeep events (`answerCall`, `endCall`, `didPerformDTMFAction`, `didToggleHoldCallAction`) proxy into `SipClient`.
- SIP `INVITE` received over WSS while foregrounded → also routed through CallKeep so UI is identical.

---

## 6. Phase plan

```text
M1  Foundations              wk 1-2
    ├─ New repo `dialer-mobile-agent` (RN bare, Kotlin, New Arch)
    ├─ Config, axios wrapper, secure token storage, auth screens
    ├─ Role gate: reject non-AGENT with "use desktop app" message
    ├─ Refresh-token flow (BE + FE)
    └─ Bootstrap endpoint + Workspace shell screen

M2  Softphone core            wk 3-4
    ├─ react-native-webrtc + jssip → outbound working
    ├─ Inbound via WSS while foregrounded
    ├─ CallKeep for both directions
    ├─ Mute / hold / DTMF / speaker / BT audio routing
    └─ Disposition modal wired to /calls API

M3  Agent workflow            wk 5-6
    ├─ Contacts (list, search, detail, click-to-call)
    ├─ Callbacks (list, mark done, snooze)
    ├─ Calls history + recording playback
    ├─ SMS console
    └─ SIP settings + profile

M4  Background & push         wk 7
    ├─ FCM data-only wake pipeline
    ├─ Foreground service during calls (persistent notif)
    ├─ Doze/battery-optimization exemption prompt
    ├─ Network-change reconnect (socket + SIP re-register)
    └─ Proximity sensor for earpiece

M5  Hardening & pilot APK     wk 8-9
    ├─ Sentry (mobile), analytics, crash-free ≥ 99.5% gate
    ├─ APK signing config + versioning
    ├─ Sideload hosting off dialer-backend
    ├─ 3–5 agent pilot, fix critical drops
    └─ v1.0.0 release APK
```

---

## 7. APK distribution (sideload)

- Generate keystore `ptdt-agent.jks`; store real one in 1Password / Railway secret; commit only `keystore.properties.example`.
- Build: `cd android && ./gradlew assembleRelease` → `android/app/build/outputs/apk/release/app-release.apk`.
- Host under backend: `GET /downloads/agent/latest.apk`, protected by signed URL from `POST /downloads/agent/request-link` (logged-in AGENT only).
- Show version + SHA-256 on the download page.
- Auto-update: `GET /downloads/agent/manifest.json` → `{version, apkUrl, sha256, minSupported}`; app polls on foreground, prompts to install if newer, uses `PackageInstaller` intent.
- First-run in-app instructions: enable "Install unknown apps" for the source, disable battery optimization, grant mic + notifications.

---

## 8. Non-goals (v1)

- No supervisor / admin / reports / campaigns / monitoring / security / platform / customer / billing screens.
- No iOS build.
- No offline queue for calls/dispositions.
- No in-app voicemail UI (PBX handles).
- No screen recording, no on-device call recording (server-side only).
- No Play Store listing.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| OEMs (Xiaomi/Oppo/Vivo) kill background sockets | FCM data-wake is the primary trigger; socket is nice-to-have while foregrounded. Onboarding prompts OEM autostart settings. |
| SIP-over-WSS through carrier NAT drops session | STUN + ICE restart on network change; `Contact` refresh on re-register; `session_expires` = 300s. |
| Echo / one-way audio on Bluetooth | `InCallManager` + `AudioManager MODE_IN_COMMUNICATION`; M5 test matrix: 3 handsets × 2 BT headsets. |
| CallKeep incoming UI not shown in Doze | High-priority FCM + `USE_FULL_SCREEN_INTENT` + `setShowWhenLocked`. |
| APK sideload = no store auto-update | In-app manifest poll + install intent (§7). |
| Future MANAGER-on-mobile ask | Role gate is one check; adding a role later is a screen-set decision, not rearchitecture. |

---

## 10. Immediate next actions

1. **Create the new repo** `pinkpeether/dialer-mobile-agent` (RN bare template, Kotlin, New Arch on).
2. **Backend PR** on `dialer-backend`: refresh tokens + `AgentDevice` + `/mobile/agent/bootstrap` + FCM wake in AMI incoming path (behind `FEATURE_MOBILE_AGENT`).
3. **FCM project** in Firebase console, download service account JSON, add as Railway secret.
4. **Signing keystore** generated, stored, wired into Gradle release config.
5. Kick off **M1** against this spec.

---

*This document is the source of truth for mobile v1. Any deviation (new screen, new role, added dependency) requires updating this file first.*
