import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { smsApi } from "../api/sms.api";

export default function SmsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["sms-threads"], queryFn: smsApi.threads });
  return (
    <View style={s.wrap}>
      {isLoading && <Text style={s.dim}>Loading…</Text>}
      <FlatList
        data={data ?? []}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.contactName ?? item.phone}</Text>
              <Text style={s.msg} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
            {item.unread > 0 && (
              <View style={s.badge}><Text style={s.badgeTxt}>{item.unread}</Text></View>
            )}
          </View>
        )}
        ListEmptyComponent={!isLoading ? <Text style={s.dim}>No messages</Text> : null}
      />
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0f172a", padding: 12 },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
    borderBottomWidth: 1, borderColor: "#1e293b",
  },
  name: { color: "#fff", fontSize: 15, fontWeight: "600" },
  msg: { color: "#94a3b8", fontSize: 13, marginTop: 2 },
  badge: {
    backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  dim: { color: "#64748b", textAlign: "center", marginTop: 24 },
});
