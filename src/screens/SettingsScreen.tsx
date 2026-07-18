import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../onboarding/store';

export default function SettingsScreen() {
  const nav = useNavigation<any>();
  return (
    <View style={s.wrap}>
      <Text style={s.h}>Settings</Text>
      <Pressable
        style={s.row}
        onPress={() => {
          useOnboarding.getState().reset();
          nav.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        }}
      >
        <Text style={s.rowTitle}>Run setup again</Text>
        <Text style={s.rowSub}>Re-run permissions, battery, and OEM autostart wizard.</Text>
      </Pressable>
      <Pressable style={s.row} onPress={() => nav.navigate('SipSettings')}>
        <Text style={s.rowTitle}>SIP profile</Text>
        <Text style={s.rowSub}>Extension, server, transport, codecs.</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0d12', padding: 20, gap: 12 },
  h: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  row: { backgroundColor: '#111827', borderRadius: 14, padding: 16, gap: 4 },
  rowTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  rowSub: { color: '#8a94a6', fontSize: 13 },
});
