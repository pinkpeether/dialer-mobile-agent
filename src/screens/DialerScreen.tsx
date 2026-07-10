import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { CallKeepBridge } from "../sip/CallKeepBridge";

const KEYS = ["1","2","3","4","5","6","7","8","9","*","0","#"];

export default function DialerScreen() {
  const [num, setNum] = useState("");

  const call = async () => {
    if (!num.trim()) return;
    try { await CallKeepBridge.startOutgoing(num.trim()); }
    catch (e: any) { Alert.alert("Call failed", e?.message ?? "Unknown error"); }
  };

  return (
    <View style={s.wrap}>
      <TextInput
        value={num}
        onChangeText={setNum}
        placeholder="+1 555 0100"
        keyboardType="phone-pad"
        style={s.input}
        autoFocus
      />
      <View style={s.grid}>
        {KEYS.map(k => (
          <Pressable key={k} onPress={() => setNum(n => n + k)} style={s.key}>
            <Text style={s.keyTxt}>{k}</Text>
          </Pressable>
        ))}
      </View>
      <View style={s.actions}>
        <Pressable onPress={() => setNum(n => n.slice(0, -1))} style={[s.btn, s.back]}>
          <Text style={s.btnTxt}>⌫</Text>
        </Pressable>
        <Pressable onPress={call} style={[s.btn, s.callBtn]}>
          <Text style={s.btnTxt}>Call</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, backgroundColor: "#0f172a" },
  input: {
    fontSize: 28, color: "#fff", borderBottomWidth: 1, borderColor: "#334155",
    paddingVertical: 12, textAlign: "center", letterSpacing: 2,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 24 },
  key: {
    width: "30%", aspectRatio: 1.4, alignItems: "center", justifyContent: "center",
    margin: "1.5%", borderRadius: 12, backgroundColor: "#1e293b",
  },
  keyTxt: { color: "#fff", fontSize: 26, fontWeight: "600" },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  btn: { flex: 1, paddingVertical: 18, marginHorizontal: 6, borderRadius: 12, alignItems: "center" },
  back: { backgroundColor: "#334155" },
  callBtn: { backgroundColor: "#16a34a" },
  btnTxt: { color: "#fff", fontSize: 20, fontWeight: "700" },
});
