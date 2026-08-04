# Backend PR: Mobile Agent Foundation

**Target repo:** `pinkpeether/dialer-backend` @ `main` (26ba3b8)
**Branch:** `feat/mobile-agent-foundation`
**Type:** Additive only. No schema breaks. All new routes/behavior gated by `FEATURE_MOBILE_AGENT=true`.

Apply as one PR. The web app is unaffected when the flag is off.

---

## 1. Environment

Add to Railway (staging first, then prod):

```
FEATURE_MOBILE_AGENT=true
JWT_REFRESH_SECRET=<generate: openssl rand -hex 64>
JWT_REFRESH_TTL=30d
FCM_SERVICE_ACCOUNT_JSON=<base64 of firebase service-account JSON>
MOBILE_APK_MANIFEST_URL=https://github.com/pinkpeether/dialer-mobile-agent/releases/latest/download/manifest.json
```

`.env.example` addition:

```
FEATURE_MOBILE_AGENT=false
JWT_REFRESH_SECRET=
JWT_REFRESH_TTL=30d
FCM_SERVICE_ACCOUNT_JSON=
MOBILE_APK_MANIFEST_URL=
```

## 2. Dependencies

```
npm i firebase-admin@^12 jsonwebtoken@^9
npm i -D @types/jsonwebtoken
```

## 3. Prisma migration

`prisma/migrations/20260714_mobile_agent_foundation/migration.sql`:

```sql
-- AuthRefreshToken
CREATE TABLE "AuthRefreshToken" (
  "id"         TEXT PRIMARY KEY,
  "userId"     INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash"  TEXT NOT NULL UNIQUE,
  "userAgent"  TEXT,
  "ip"         TEXT,
  "expiresAt"  TIMESTAMP(3) NOT NULL,
  "revokedAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AuthRefreshToken_userId_idx" ON "AuthRefreshToken"("userId");

-- AgentDevice
CREATE TABLE "AgentDevice" (
  "id"         TEXT PRIMARY KEY,
  "userId"     INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "platform"   TEXT NOT NULL,
  "fcmToken"   TEXT NOT NULL UNIQUE,
  "appVersion" TEXT,
  "lastSeen"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AgentDevice_userId_idx" ON "AgentDevice"("userId");
```

`prisma/schema.prisma` — append the two models from `docs/PTDT_ANDROID_AGENT_APP_SPEC.md` §4.1–4.2 and add reverse relations to `User`:

```prisma
model User {
  // ...existing fields
  refreshTokens AuthRefreshToken[]
  devices       AgentDevice[]
}
```

Then: `npx prisma migrate deploy && npx prisma generate`.

## 4. Feature flag helper

`src/config/features.ts`:

```ts
export const features = {
  mobileAgent: process.env.FEATURE_MOBILE_AGENT === 'true',
};
export function requireMobileAgent(_req, res, next) {
  if (!features.mobileAgent) return res.status(404).end();
  next();
}
```

## 5. Refresh tokens

`src/services/refreshToken.service.ts`:

```ts
import { randomBytes, createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const TTL = process.env.JWT_REFRESH_TTL ?? '30d';
const SECRET = process.env.JWT_REFRESH_SECRET!;

const hash = (t: string) => createHash('sha256').update(t).digest('hex');

export async function issueRefreshToken(userId: number, meta: { ua?: string; ip?: string }) {
  const raw = randomBytes(48).toString('base64url');
  const token = jwt.sign({ sub: userId, jti: raw }, SECRET, { expiresIn: TTL });
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await prisma.authRefreshToken.create({
    data: { id: raw, userId, tokenHash: hash(token), userAgent: meta.ua, ip: meta.ip, expiresAt },
  });
  return token;
}

export async function rotateRefreshToken(oldToken: string, meta: { ua?: string; ip?: string }) {
  const payload = jwt.verify(oldToken, SECRET) as { sub: number; jti: string };
  const row = await prisma.authRefreshToken.findUnique({ where: { tokenHash: hash(oldToken) } });
  if (!row || row.revokedAt || row.expiresAt < new Date()) throw new Error('invalid_refresh');
  await prisma.authRefreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date() } });
  return issueRefreshToken(payload.sub, meta);
}

export async function revokeAllForUser(userId: number) {
  await prisma.authRefreshToken.updateMany({
    where: { userId, revokedAt: null }, data: { revokedAt: new Date() },
  });
}
```

Patch `src/routes/auth.routes.ts`:

- On successful `POST /auth/login`, also call `issueRefreshToken(user.id, {ua,ip})` and return `{ accessToken, refreshToken, user }`.
- Add `POST /auth/refresh` — body `{ refreshToken }` → returns `{ accessToken, refreshToken }` (rotates).
- Add `POST /auth/logout` — revokes the presented refresh token.

Web callers are unchanged: they ignore the new `refreshToken` field.

## 6. Mobile agent routes

`src/routes/mobile/agent.routes.ts`:

```ts
import { Router } from 'express';
import { auth, requireRole } from '../../middleware/auth';
import { requireMobileAgent } from '../../config/features';
import { prisma } from '../../lib/prisma';

const r = Router();
r.use(requireMobileAgent, auth, requireRole('AGENT'));

// POST /mobile/agent/devices  { fcmToken, platform, appVersion }
r.post('/devices', async (req, res) => {
  const { fcmToken, platform = 'android', appVersion } = req.body ?? {};
  if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' });
  const row = await prisma.agentDevice.upsert({
    where: { fcmToken },
    update: { userId: req.user!.id, platform, appVersion, lastSeen: new Date() },
    create: { userId: req.user!.id, platform, appVersion, fcmToken },
  });
  res.json(row);
});

// DELETE /mobile/agent/devices/:id
r.delete('/devices/:id', async (req, res) => {
  await prisma.agentDevice.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
  res.status(204).end();
});

// GET /mobile/agent/bootstrap
r.get('/bootstrap', async (req, res) => {
  const [profile, sip, queues, apkManifest] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, role: true } }),
    prisma.sipCredential.findFirst({ where: { userId: req.user!.id } }),
    prisma.queueMembership.findMany({ where: { userId: req.user!.id }, include: { queue: true } }),
    Promise.resolve({ url: process.env.MOBILE_APK_MANIFEST_URL ?? null }),
  ]);
  res.json({ profile, sip, queues, apkManifest, serverTime: Date.now() });
});

export default r;
```

Register in `src/app.ts`:

```ts
import mobileAgent from './routes/mobile/agent.routes';
app.use('/mobile/agent', mobileAgent);
```

Adjust the two Prisma includes (`SipCredential`, `QueueMembership`) to the real model names in this repo.

## 7. FCM push-wake

`src/services/fcm.service.ts`:

```ts
import admin from 'firebase-admin';
import { prisma } from '../lib/prisma';

let app: admin.app.App | null = null;
function client() {
  if (app) return app;
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FCM_SERVICE_ACCOUNT_JSON missing');
  const creds = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  app = admin.initializeApp({ credential: admin.credential.cert(creds) });
  return app;
}

export async function wakeAgentForIncomingCall(userId: number, data: {
  callId: string; from: string; campaign?: string;
}) {
  const devices = await prisma.agentDevice.findMany({ where: { userId } });
  if (!devices.length) return;
  const msg = {
    data: { type: 'incoming_call', ts: String(Date.now()), ...data },
    android: { priority: 'high' as const },
    tokens: devices.map(d => d.fcmToken),
  };
  const res = await client().messaging().sendEachForMulticast(msg);
  // prune dead tokens
  const dead = res.responses
    .map((r, i) => (!r.success && ['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(r.error?.code ?? '') ? devices[i].id : null))
    .filter(Boolean) as string[];
  if (dead.length) await prisma.agentDevice.deleteMany({ where: { id: { in: dead } } });
}
```

Hook in `src/services/asteriskAmi.service.ts` where the incoming-call socket emit lives:

```ts
// after: io.to(`user:${agentUserId}`).emit(SOCKET_EVENTS.INCOMING_CALL, payload);
if (features.mobileAgent) {
  wakeAgentForIncomingCall(agentUserId, {
    callId: payload.callId, from: payload.from, campaign: payload.campaign,
  }).catch(err => logger.warn({ err }, 'fcm wake failed'));
}
```

Non-blocking — a failed push must never break the web socket path.

## 8. CORS / rate limits

`src/middleware/cors.ts` — add UA allow-list for `com.ptdt.dialer.agent/*`.
`src/middleware/rateLimit.ts` — mount a looser limiter on `/mobile/agent/*` (e.g. 300 req/min per IP instead of 60).

## 9. APK manifest passthrough (optional; keep in mobile repo GH release if you prefer)

If you'd rather host from backend: `GET /downloads/agent/manifest.json` proxies the GitHub release JSON. Skip if using GH release URL directly (recommended).

## 10. Tests to add

- `refreshToken.service.test.ts` — issue/rotate/revoke/expired.
- `mobile/agent.routes.test.ts` — role gate (MANAGER → 403), flag off → 404, bootstrap shape.
- `fcm.service.test.ts` — dead-token pruning (mock admin).

## 11. Rollout

1. Merge with `FEATURE_MOBILE_AGENT=false` in prod. Verify web app unchanged.
2. Enable flag in **staging**. Point one pilot APK at staging. Verify wake + bootstrap + refresh.
3. Enable flag in **prod** for pilot cohort.
4. Monitor: `fcm_wake_sent`, `fcm_wake_failed`, `refresh_rotated`, `refresh_invalid`.

## 12. Rollback

Set `FEATURE_MOBILE_AGENT=false`. All new routes return 404, wake hook is skipped. Migration is additive; no data loss on rollback.