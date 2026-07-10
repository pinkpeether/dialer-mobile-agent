import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { useDispositions } from "../hooks/useCalls";
import { callsApi } from "../api/calls.api";

export default function CallDispositionModal(props: {
  visible: boolean;
  callId: string | null;
  onClose: () => void;
}) {
  const { visible, callId, onClose } = props;
  const { data: dispos } = useDispositions();
  const [code, setCode] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const submit = async () => {
    if (!callId || !code) return;
    await callsApi.disposition(callId, { code, note: note || undefined });
    setCode(null); setNote(""); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <Text style={s.title}>Call disposition</Text>
          <ScrollView style={{ maxHeight: 200 }}>
            {(dispos ?? []).map(d => (
              <Pressable
                key={d.code}
                style={[s.opt, code === d.code && s.optActive]}
                onPress={() => setCode(d.code)}
              >
                <Text style={s.optTxt}>{d.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <TextInput
            style={s.note}
            placeholder="Notes (optional)"
            placeholderTextColor="#64748b"
            value={note}
            onChangeText={setNote}
            multiline
          />
          <View style={s.row}>
            <Pressable style={[s.btn, s.cancel]} onPress={onClose}>
              <Text style={s.btnTxt}>Cancel</Text>
            </Pressable>
            <Pressable style={[s.btn, s.save, !code && { opacity: 0.5 }]}
              onPress={submit} disabled={!code}>
              <Text style={s.btnTxt}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#0f172a", padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  opt: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#1e293b" },
  optActive: { backgroundColor: "#1e293b" },
  optTxt: { color: "#fff" },
  note: { backgroundColor: "#1e293b", color: "#fff", padding: 12, borderRadius: 8, marginTop: 12, minHeight: 60 },
  row: { flexDirection: "row", marginTop: 16, gap: 12 },
  btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  cancel: { backgroundColor: "#334155" },
  save: { backgroundColor: "#16a34a" },
  btnTxt: { color: "#fff", fontWeight: "700" },
});
