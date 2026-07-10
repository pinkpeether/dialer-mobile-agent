import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootNavigator from "./navigation/RootNavigator";
import { CallKeepBridge } from "./sip/CallKeepBridge";
import { registerForPush } from "./fcm/messaging";
import { useAuthStore } from "./store/auth.store";

const qc = new QueryClient();

export default function App() {
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    CallKeepBridge.setup().catch(console.warn);
  }, []);

  useEffect(() => {
    if (token) registerForPush().catch(console.warn);
  }, [token]);

  return (
    <QueryClientProvider client={qc}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <RootNavigator />
    </QueryClientProvider>
  );
}
