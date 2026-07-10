import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useCallbacks, useMarkCallbackDone, useSnoozeCallback } from "../hooks/useCallbacks";
import { CallKeepBridge } from "../sip/CallKeepBridge";

export default function CallbacksScreen() {
  const { data, isLoading } = useCallbacks("pending");
  const done = useMarkCallbackDone();
  const snooze = useSnoozeCallback();

  return (
    <View style={s.wrap}>
      {isLoading && <Text style={s.dim}>Loading…</Text>}
      <FlatList
        data={data ?? []}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.contactName ?? item.phone}</Text>
              <Text style={s.sub}>
                {new Date(item.scheduledAt).toLocaleString()}
                {item.notes ? ` · ${item.notes}` : ""}
              </Text>
            </View>
            <View style={s.actions}>
              <Pressable style={[s.btn, s.call]}
                onPress={() => CallKeepBridge.startOutgoing(item.phone)}>
                <Text style={s.btnTxt}>Call</Text>
              </Pressable>
              <Pressable style={[s.btn, s.snz]}
                onPress={() => snooze.mutate({ id: item.id, minutes: 30 })}>
                <Text style={s.btnTxt}>+30m</Text>
              </Pressable>
              <Pressable style={[s.btn, s.done]}
                onPress={() =>
                  Alert.alert("Mark done?", "", [
                    { text: "Cancel" },
                    { text: "Yes", onPress: () => done.mutate(item.id) },
                  ])
                }>
                <Text style={s.btnTxt}>Done</Text>
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={!isLoading ? <Text style={s.dim}>No pending callbacks</Text> : null}
      />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f172a", padding: 12 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#1e293b" },
  name: { color: "#fff", fontSize: 15, fontWeight: "600" },
  sub: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", marginTop: 8, gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  call: { backgroundColor: "#16a34a" },
  snz: { backgroundColor: "#334155" },
  done: { backgroundColor: "#2563eb" },
  btnTxt: { color: "#fff", fontWeight: "700" },
  dim: { color: "#64748b", textAlign: "center", marginTop: 24 },
});
