# Mobile Onboarding Flow — drop-in patch for `dialer-mobile-agent`

First-run wizard: permissions → OEM autostart → battery optimization → SIP profile → done.
Runs once (persisted in MMKV as `onboarding.completed=true`). Re-openable from Settings → "Run setup again".

Add these files, then wire the two integration points at the bottom.

---

## `src/onboarding/steps.ts`

```ts
export type StepId = 'welcome' | 'permissions' | 'battery' | 'oem' | 'sip' | 'done';
export const STEP_ORDER: StepId[] = ['welcome','permissions','battery','oem','sip','done'];
export const nextStep = (s: StepId) => STEP_ORDER[STEP_ORDER.indexOf(s) + 1] ?? 'done';
```

## `src/onboarding/store.ts`

```ts
import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { StepId } from './steps';
const kv = new MMKV({ id: 'onboarding' });

type S = {
  completed: boolean;
  step: StepId;
  setStep: (s: StepId) => void;
  complete: () => void;
  reset: () => void;
};
export const useOnboarding = create<S>((set) => ({
  completed: kv.getBoolean('completed') ?? false,
  step: (kv.getString('step') as StepId) ?? 'welcome',
  setStep: (step) => { kv.set('step', step); set({ step }); },
  complete: () => { kv.set('completed', true); set({ completed: true }); },
  reset: () => { kv.delete('completed'); kv.set('step', 'welcome'); set({ completed: false, step: 'welcome' }); },
}));
```

## `src/onboarding/permissions.ts`

```ts
import { PERMISSIONS, requestMultiple, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

export async function requestCorePermissions() {
  if (Platform.OS !== 'android') return { ok: true, denied: [] };
  const req = [
    PERMISSIONS.ANDROID.RECORD_AUDIO,
    PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
    PERMISSIONS.ANDROID.READ_PHONE_STATE,
  ];
  const res = await requestMultiple(req);
  const denied = req.filter((p) => res[p] !== RESULTS.GRANTED);
  return { ok: denied.length === 0, denied };
}
```

## `src/onboarding/OemHelper.ts` (bridge to native module already shipped in M4)

```ts
import { NativeModules, Platform } from 'react-native';
const { OemHelper } = NativeModules;

export const oem = {
  manufacturer: () => (Platform.OS === 'android' ? (OemHelper?.getManufacturer?.() ?? 'unknown') : 'ios'),
  isAggressive: (): boolean => Platform.OS === 'android' && !!OemHelper?.isAggressiveOem?.(),
  openAutostart: () => OemHelper?.openAutostartSettings?.(),
  openBatteryOptimization: () => OemHelper?.openBatteryOptimizationSettings?.(),
  isBatteryOptimizationIgnored: async (): Promise<boolean> =>
    (await OemHelper?.isBatteryOptimizationIgnored?.()) ?? false,
};
```

## `src/onboarding/OnboardingScreen.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button } from '../components/Button'; // existing project button
import { useOnboarding } from './store';
import { nextStep } from './steps';
import { requestCorePermissions } from './permissions';
import { oem } from './OemHelper';
import { useNavigation } from '@react-navigation/native';

export default function OnboardingScreen() {
  const { step, setStep, complete } = useOnboarding();
  const nav = useNavigation<any>();
  const [busy, setBusy] = useState(false);
  const [batteryOk, setBatteryOk] = useState(false);

  useEffect(() => { oem.isBatteryOptimizationIgnored().then(setBatteryOk); }, [step]);

  const go = () => setStep(nextStep(step));
  const finish = () => { complete(); nav.reset({ index: 0, routes: [{ name: 'Workspace' }] }); };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      {step === 'welcome' && (
        <Card title="Welcome to PTDT Agent" body="A few quick setup steps so calls always reach you.">
          <Button title="Get started" onPress={go} />
        </Card>
      )}

      {step === 'permissions' && (
        <Card title="Permissions" body="Microphone, notifications, Bluetooth, and phone state are required for calling.">
          <Button title={busy ? 'Requesting…' : 'Grant permissions'} disabled={busy} onPress={async () => {
            setBusy(true);
            const r = await requestCorePermissions();
            setBusy(false);
            if (!r.ok) return Alert.alert('Missing permissions', 'Some permissions were not granted. The app may miss calls.', [
              { text: 'Continue anyway', onPress: go }, { text: 'Try again' },
            ]);
            go();
          }} />
        </Card>
      )}

      {step === 'battery' && (
        <Card title="Battery optimization" body="Disable battery optimization for PTDT Agent so Android doesn't kill it in the background.">
          <Text style={s.status}>Status: {batteryOk ? '✅ Exempted' : '⚠️ Not exempted'}</Text>
          <Button title="Open settings" onPress={() => oem.openBatteryOptimization()} />
          <Button title={batteryOk ? 'Continue' : 'Skip for now'} onPress={go} variant="secondary" />
        </Card>
      )}

      {step === 'oem' && (
        oem.isAggressive() ? (
          <Card
            title={`Autostart on ${oem.manufacturer()}`}
            body="This device aggressively kills background apps. Enable Autostart / background activity for PTDT Agent."
          >
            <Button title="Open autostart settings" onPress={() => oem.openAutostart()} />
            <Button title="I've enabled it" onPress={go} variant="secondary" />
          </Card>
        ) : (
          <Card title="Background activity" body="Your device doesn't need extra autostart tweaks. Continue.">
            <Button title="Continue" onPress={go} />
          </Card>
        )
      )}

      {step === 'sip' && (
        <Card title="SIP profile" body="Your extension details were loaded from the server. Test registration to confirm.">
          <Button title="Open SIP settings" onPress={() => nav.navigate('SipSettings', { from: 'onboarding' })} />
          <Button title="Done" onPress={go} variant="secondary" />
        </Card>
      )}

      {step === 'done' && (
        <Card title="You're ready" body="You can re-run this from Settings → Run setup again.">
          <Button title="Enter workspace" onPress={finish} />
        </Card>
      )}
    </ScrollView>
  );
}

function Card({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <View style={s.card}>
      <Text style={s.h1}>{title}</Text>
      <Text style={s.body}>{body}</Text>
      <View style={s.actions}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 24, gap: 16 },
  card:  { backgroundColor: '#111', borderRadius: 16, padding: 20, gap: 12 },
  h1:    { color: '#fff', fontSize: 22, fontWeight: '700' },
  body:  { color: '#bbb', fontSize: 15, lineHeight: 22 },
  status:{ color: '#ddd', fontSize: 14, marginTop: 4 },
  actions:{ gap: 10, marginTop: 8 },
});
```

---

## Wire-up (2 integration points)

### 1. `src/navigation/RootNavigator.tsx`

Add Onboarding as a route; gate initial route on completion:

```tsx
import OnboardingScreen from '../onboarding/OnboardingScreen';
import { useOnboarding } from '../onboarding/store';

// inside RootNavigator, after auth check:
const onboarded = useOnboarding(s => s.completed);
// ...
<Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
// when authenticated:
initialRouteName={onboarded ? 'Workspace' : 'Onboarding'}
```

### 2. `src/screens/SettingsScreen.tsx`

Add a row:

```tsx
<Row title="Run setup again" onPress={() => { useOnboarding.getState().reset(); nav.reset({ index: 0, routes: [{ name: 'Onboarding' }] }); }} />
```

---

## Native module contract (already partially in `OemHelper.kt` from M4)

Add these methods if missing:

```kotlin
@ReactMethod(isBlockingSynchronousMethod = true)
fun isBatteryOptimizationIgnored(): Boolean {
  val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
  return pm.isIgnoringBatteryOptimizations(reactContext.packageName)
}

@ReactMethod
fun openBatteryOptimizationSettings() {
  val i = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
  i.data = Uri.parse("package:${reactContext.packageName}")
  i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  reactContext.startActivity(i)
}
```

`AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"/>
```

---

## Analytics events to emit

`onboarding_started`, `onboarding_step_completed{step}`, `onboarding_permission_denied{permission}`, `onboarding_completed`, `onboarding_reset`.

---

## QA checklist

- [ ] Fresh install → wizard shows.
- [ ] Deny mic → warning alert, can retry.
- [ ] Battery step reflects real exemption status after returning from settings.
- [ ] Xiaomi/Oppo/Vivo/Huawei/Realme → OEM step appears with correct manufacturer.
- [ ] Pixel/Samsung → OEM step shows generic "no tweaks needed".
- [ ] Complete → next launch skips onboarding, opens Workspace.
- [ ] Settings → Run setup again → wizard shows from step 1.