import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useSipStore } from '@/store/sip.store';
import { useAuth } from '@/hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Workspace'>;

export default function WorkspaceScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const sipStatus = useSipStore((s) => s.status);
  const { logout } = useAuth();

  const tiles = [
    { title: 'Dialer',    to: 'Dialer'    as const },
    { title: 'Contacts',  to: 'Contacts'  as const },
    { title: 'Callbacks', to: 'Callbacks' as const },
    { title: 'Calls',     to: 'Calls'     as const },
    { title: 'Settings',  to: 'Settings'  as const },
  ];

  return (
    <ScrollView style={s.wrap} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.hi}>Hi {user?.name?.split(' ')[0] ?? 'Agent'}</Text>
      <Text style={s.role}>{user?.agentCode} · ext {user?.extension ?? '—'}</Text>
      <View style={[s.pill, sipStatus === 'registered' && s.pillOk]}>
        <Text style={s.pillTxt}>SIP: {sipStatus}</Text>
      </View>

      {tiles.map((t) => (
        <TouchableOpacity key={t.title} style={s.tile} onPress={() => navigation.navigate(t.to)}>
          <Text style={s.tileTxt}>{t.title}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={logout} style={[s.tile, { backgroundColor: '#2a1420' }]}>
        <Text style={[s.tileTxt, { color: '#ff6b93' }]}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b0d12' },
  hi: { color: '#fff', fontSize: 28, fontWeight: '800' },
  role: { color: '#8a94a6', marginTop: 4 },
  pill: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#1a1f2a' },
  pillOk: { backgroundColor: 'rgba(0,167,71,0.18)' },
  pillTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  tile: { marginTop: 14, backgroundColor: '#151922', padding: 18, borderRadius: 14 },
  tileTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
