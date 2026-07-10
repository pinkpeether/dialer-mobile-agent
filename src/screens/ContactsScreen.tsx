import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from "react-native";
import { useContacts } from "../hooks/useContacts";
import { CallKeepBridge } from "../sip/CallKeepBridge";

export default function ContactsScreen() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useContacts(q);
  const items = data?.items ?? [];

  return (
    <View style={s.wrap}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search contacts"
        placeholderTextColor="#64748b"
        style={s.search}
      />
      {isLoading && <Text style={s.dim}>Loading…</Text>}
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>
                {[item.firstName, item.lastName].filter(Boolean).join(" ") || item.phone}
              </Text>
              <Text style={s.sub}>{item.phone}{item.company ? ` · ${item.company}` : ""}</Text>
            </View>
            <Pressable style={s.call} onPress={() => CallKeepBridge.startOutgoing(item.phone)}>
              <Text style={s.callTxt}>Call</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={!isLoading ? <Text style={s.dim}>No contacts</Text> : null}
      />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f172a", padding: 12 },
  search: {
    backgroundColor: "#1e293b", color: "#fff", padding: 12, borderRadius: 10, marginBottom: 12,
  },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
    borderBottomWidth: 1, borderColor: "#1e293b",
  },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sub: { color: "#94a3b8", fontSize: 13, marginTop: 2 },
  call: { backgroundColor: "#16a34a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  callTxt: { color: "#fff", fontWeight: "700" },
  dim: { color: "#64748b", textAlign: "center", marginTop: 24 },
});
