import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { sipClient } from "../sip/SipClient";

export default function SipSettingsScreen() {
  const [wsUrl, setWsUrl] = useState("wss://pbx.example.com:8089/ws");
  const [uri, setUri] = useState("sip:1001@pbx.example.com");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle"|"connecting"|"registered"|"failed">("idle");

  const connect = () => {
    setStatus("connecting");
    sipClient.once("registered", () => setStatus("registered"));
    sipClient.once("failed", () => setStatus("failed"));
    sipClient.connect({ wsUrl, uri, password });
  };

  return (
    <View style={s.wrap}>
      <Text style={s.label}>WSS URL</Text>
      <TextInput value={wsUrl} onChangeText={setWsUrl} style={s.in} autoCapitalize="none" />
      <Text style={s.label}>SIP URI</Text>
      <TextInput value={uri} onChangeText={setUri} style={s.in} autoCapitalize="none" />
      <Text style={s.label}>Password</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={s.in} />
      <Pressable style={s.btn} onPress={connect}>
        <Text style={s.btnTxt}>Connect</Text>
      </Pressable>
      <Text style={s.status}>Status: {status}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  label: { color: "#94a3b8", marginTop: 12, marginBottom: 4 },
  in: { backgroundColor: "#1e293b", color: "#fff", padding: 12, borderRadius: 8 },
  btn: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10, marginTop: 24, alignItems: "center" },
  btnTxt: { color: "#fff", fontWeight: "700" },
  status: { color: "#cbd5e1", marginTop: 16, textAlign: "center" },
});
