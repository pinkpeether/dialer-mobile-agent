import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return;
    setBusy(true);
    try { await login(email, password); }
    catch (e: any) { Alert.alert('Sign in failed', e?.message ?? 'Unknown error'); }
    finally { setBusy(false); }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.brand}>PTDT Agent</Text>
      <Text style={s.sub}>Sign in with your agent credentials</Text>
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={s.btn} onPress={onSubmit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Sign in</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#0b0d12' },
  brand: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  sub: { color: '#8a94a6', marginTop: 6, marginBottom: 32 },
  input: { backgroundColor: '#151922', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#fb0b8c', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
