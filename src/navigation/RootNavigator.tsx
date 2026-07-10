import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../store/auth.store";
import LoginScreen from "../screens/LoginScreen";
import WorkspaceScreen from "../screens/WorkspaceScreen";
import DialerScreen from "../screens/DialerScreen";
import ContactsScreen from "../screens/ContactsScreen";
import CallsScreen from "../screens/CallsScreen";
import CallbacksScreen from "../screens/CallbacksScreen";
import SmsScreen from "../screens/SmsScreen";
import SipSettingsScreen from "../screens/SipSettingsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import IncomingCallScreen from "../screens/IncomingCallScreen";
import MiniCallBar from "../components/MiniCallBar";
import { View } from "react-native";
import { useIncomingCall } from "../hooks/useIncomingCall";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AgentTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1e293b" },
        tabBarActiveTintColor: "#60a5fa",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen name="Workspace" component={WorkspaceScreen} />
      <Tabs.Screen name="Dialer" component={DialerScreen} />
      <Tabs.Screen name="Contacts" component={ContactsScreen} />
      <Tabs.Screen name="Calls" component={CallsScreen} />
      <Tabs.Screen name="Callbacks" component={CallbacksScreen} />
      <Tabs.Screen name="SMS" component={SmsScreen} />
    </Tabs.Navigator>
  );
}

function AuthedApp() {
  const incoming = useIncomingCall();
  if (incoming) return <IncomingCallScreen />;
  return (
    <View style={{ flex: 1 }}>
      <MiniCallBar />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen name="Agent" component={AgentTabs} options={{ headerShown: false }} />
        <Stack.Screen name="SipSettings" component={SipSettingsScreen}
          options={{ title: "SIP Settings" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </View>
  );
}

export default function RootNavigator() {
  const token = useAuthStore(s => s.token);
  return (
    <NavigationContainer>
      {token ? <AuthedApp /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
