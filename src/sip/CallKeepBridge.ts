/**
 * CallKeepBridge — glues CallKeep UI events to SipClient, and mirrors SIP
 * events back into CallKeep. Also drives InCallManager audio session.
 */
import RNCallKeep from "react-native-callkeep";
import { Platform } from "react-native";
import { v4 as uuid } from "uuid";
import { sipClient } from "./SipClient";
import { audio } from "./audio";

const OPTIONS = {
  ios: { appName: "PTDT Agent" },
  android: {
    alertTitle: "Permissions required",
    alertDescription: "PTDT Agent needs phone-call permissions to place calls.",
    cancelButton: "Cancel",
    okButton: "Ok",
    imageName: "ic_launcher",
    additionalPermissions: [],
    selfManaged: false,
    foregroundService: {
      channelId: "com.ptdt.dialer.agent.calls",
      channelName: "Active Calls",
      notificationTitle: "Call in progress",
      notificationIcon: "ic_notification",
    },
  },
};

let started = false;
const sipToCallKeepId = new Map<string, string>();

export const CallKeepBridge = {
  async setup() {
    if (started) return;
    started = true;
    await RNCallKeep.setup(OPTIONS as any);
    if (Platform.OS === "android") RNCallKeep.setAvailable(true);

    RNCallKeep.addEventListener("answerCall", ({ callUUID }) => {
      sipClient.answer();
      audio.startCall();
      RNCallKeep.setCurrentCallActive(callUUID);
    });
    RNCallKeep.addEventListener("endCall", () => {
      sipClient.hangup();
      audio.stopCall();
    });
    RNCallKeep.addEventListener("didPerformSetMutedCallAction", ({ muted }) =>
      audio.setMute(muted),
    );
    RNCallKeep.addEventListener("didToggleHoldCallAction", ({ hold }) =>
      sipClient.hold(hold),
    );
    RNCallKeep.addEventListener("didPerformDTMFAction", ({ digits }) => {
      for (const d of String(digits)) sipClient.sendDTMF(d);
    });

    sipClient.on("incoming", ({ id, from, displayName }: any) => {
      const cuid = uuid();
      sipToCallKeepId.set(id, cuid);
      RNCallKeep.displayIncomingCall(cuid, from, displayName ?? from, "number", false);
    });
    sipClient.on("accepted", (call: any) => {
      const cuid = sipToCallKeepId.get(call?.id);
      if (cuid) RNCallKeep.setCurrentCallActive(cuid);
      audio.startCall();
    });
    sipClient.on("ended", (call: any) => {
      const cuid = sipToCallKeepId.get(call?.id);
      if (cuid) RNCallKeep.endCall(cuid);
      audio.stopCall();
    });
    sipClient.on("failed", () => audio.stopCall());
  },

  async startOutgoing(to: string, displayName?: string) {
    const cuid = uuid();
    RNCallKeep.startCall(cuid, to, displayName ?? to, "number", false);
    await sipClient.placeCall(to);
    // Map on next tick once session id exists.
    setTimeout(() => {
      const active = sipClient.getActive();
      if (active) sipToCallKeepId.set(active.id, cuid);
    }, 0);
  },
};
