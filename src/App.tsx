import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { setupCallKeep } from '@/sip/CallKeepBridge';
import RootNavigator from '@/navigation/RootNavigator';

const qc = new QueryClient();

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await hydrate();
      try { await setupCallKeep(); } catch (e) { console.warn('CallKeep setup failed', e); }
      setReady(true);
    })();
  }, [hydrate]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0d12', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fb0b8c" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0b0d12" />
      <QueryClientProvider client={qc}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
