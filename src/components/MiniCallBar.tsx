import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { sipClient } from "../sip/SipClient";

export default function MiniCallBar() {
  const [remote, setRemote] = useState<string | null>(null);
  useEffect(() => {
    const onAcc = (c: any) => setRemote(c?.remote ?? null);
    const onEnd = () => setRemote(null);
    sipClient.on("accepted", onAcc);
    sipClient.on("ended", onEnd);
    sipClient.on("failed", onEnd);
    return () => {
      sipClient.off("accepted", onAcc);
      sipClient.off("ended", onEnd);
      sipClient.off("failed", onEnd);
    };
  }, []);
  if (!remote) return null;
  return (
    <View style={s.bar}>
      <Text style={s.txt}>● On call with {remote}</Text>
      <Pressable style={s.btn} onPress={() => sipClient.hangup()}>
        <Text style={s.btnTxt}>End</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#16a34a", paddingHorizontal: 12, paddingVertical: 8,
  },
  txt: { color: "#fff", fontWeight: "600" },
  btn: { backgroundColor: "#dc2626", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnTxt: { color: "#fff", fontWeight: "700" },
});
