import { View, Text, StyleSheet } from 'react-native';
export default function ContactsScreen() {
  return (
    <View style={s.wrap}>
      <Text style={s.h}>Contacts</Text>
      <Text style={s.sub}>Coming in M2/M3 — see docs/SPEC.md phase plan.</Text>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0d12', padding: 24, justifyContent: 'center' },
  h: { color: '#fff', fontSize: 28, fontWeight: '800' },
  sub: { color: '#8a94a6', marginTop: 8 },
});
