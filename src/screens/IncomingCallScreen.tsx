import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useIncomingCall } from "../hooks/useIncomingCall";
import { sipClient } from "../sip/SipClient";
import { audio } from "../sip/audio";

export default function IncomingCallScreen() {
  const info = useIncomingCall();
  if (!info) return null;

  const accept = () => { sipClient.answer(); audio.startCall(); };
  const reject = () => sipClient.hangup();

  return (
    <View style={s.wrap}>
      <Text style={s.label}>Incoming call</Text>
      <Text style={s.name}>{info.displayName ?? info.from}</Text>
      <Text style={s.num}>{info.from}</Text>
      <View style={s.row}>
        <Pressable style={[s.btn, s.reject]} onPress={reject}>
          <Text style={s.btnTxt}>Reject</Text>
        </Pressable>
        <Pressable style={[s.btn, s.accept]} onPress={accept}>
          <Text style={s.btnTxt}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f172a", padding: 24, justifyContent: "center", alignItems: "center" },
  label: { color: "#94a3b8", fontSize: 14, marginBottom: 12 },
  name: { color: "#fff", fontSize: 32, fontWeight: "700" },
  num: { color: "#cbd5e1", fontSize: 18, marginTop: 8 },
  row: { flexDirection: "row", marginTop: 48, gap: 24 },
  btn: { paddingVertical: 20, paddingHorizontal: 32, borderRadius: 40 },
  accept: { backgroundColor: "#16a34a" },
  reject: { backgroundColor: "#dc2626" },
  btnTxt: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
