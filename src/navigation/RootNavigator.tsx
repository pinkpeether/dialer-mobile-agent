import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/auth.store';
import LoginScreen from '@/screens/LoginScreen';
import WorkspaceScreen from '@/screens/WorkspaceScreen';
import DialerScreen from '@/screens/DialerScreen';
import ContactsScreen from '@/screens/ContactsScreen';
import CallbacksScreen from '@/screens/CallbacksScreen';
import CallsScreen from '@/screens/CallsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import IncomingCallScreen from '@/screens/IncomingCallScreen';

export type RootStackParamList = {
  Login: undefined;
  Workspace: undefined;
  Dialer: undefined;
  Contacts: undefined;
  Callbacks: undefined;
  Calls: undefined;
  Settings: undefined;
  IncomingCall: { uuid: string; peer: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isAuth = useAuthStore((s) => s.isAuth);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0b0d12' }, headerTintColor: '#fff' }}>
        {!isAuth ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Workspace" component={WorkspaceScreen} options={{ title: 'PTDT Agent' }} />
            <Stack.Screen name="Dialer" component={DialerScreen} />
            <Stack.Screen name="Contacts" component={ContactsScreen} />
            <Stack.Screen name="Callbacks" component={CallbacksScreen} />
            <Stack.Screen name="Calls" component={CallsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ presentation: 'fullScreenModal', headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
