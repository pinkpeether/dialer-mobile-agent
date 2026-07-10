import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useCalls } from "../hooks/useCalls";

export default function CallsScreen() {
  const { data, isLoading } = useCalls();
  const items = data?.items ?? [];
  return (
    <View style={s.wrap}>
      {isLoading && <Text style={s.dim}>Loading…</Text>}
      <FlatList
        data={items}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.head}>
                {item.direction === "inbound" ? "◀ " : "▶ "}
                {item.direction === "inbound" ? item.from : item.to}
              </Text>
              <Text style={s.sub}>
                {new Date(item.startedAt).toLocaleString()} · {item.durationSec ?? 0}s
                {item.disposition ? ` · ${item.disposition}` : ""}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={!isLoading ? <Text style={s.dim}>No calls yet</Text> : null}
      />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f172a", padding: 12 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#1e293b" },
  head: { color: "#fff", fontSize: 15, fontWeight: "600" },
  sub: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  dim: { color: "#64748b", textAlign: "center", marginTop: 24 },
});
