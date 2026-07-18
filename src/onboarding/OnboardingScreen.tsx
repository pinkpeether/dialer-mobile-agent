import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button } from '../components/Button';
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
          <Button title={busy ? 'Requestingâ€¦' : 'Grant permissions'} disabled={busy} onPress={async () => {
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
          <Text style={s.status}>Status: {batteryOk ? 'âœ… Exempted' : 'âš ï¸ Not exempted'}</Text>
          <Button title="Open settings" onPress={() => oem.openBatteryOptimization()} />
          <Button title={batteryOk ? 'Continue' : 'Skip for now'} onPress={go} variant="secondary" />
        </Card>
      )}

      {step === 'oem' && (
        oem.isAggressive() ? (
          <Card title={`Autostart on ${oem.manufacturer()}`} body="This device aggressively kills background apps. Enable Autostart / background activity for PTDT Agent.">
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
        <Card title="You're ready" body="You can re-run this from Settings â†’ Run setup again.">
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
