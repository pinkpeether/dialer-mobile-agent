/**
 * FCM wire-up: registers the device with the backend and handles data-only
 * push wake events. Notification presentation is CallKeep's job, not ours.
 */
import messaging from "@react-native-firebase/messaging";
import DeviceInfo from "react-native-device-info";
import { devicesApi } from "../api/devices.api";
import RNCallKeep from "react-native-callkeep";
import { v4 as uuid } from "uuid";

let registeredDeviceId: string | null = null;

export async function registerForPush() {
  await messaging().requestPermission();
  const token = await messaging().getToken();
  const appVersion = await DeviceInfo.getVersion().catch(() => undefined);
  const res = await devicesApi.register({ fcmToken: token, appVersion });
  registeredDeviceId = res.id;

  messaging().onTokenRefresh(async (t) => {
    await devicesApi.register({ fcmToken: t, appVersion });
  });

  messaging().onMessage(handlePushPayload);
  messaging().setBackgroundMessageHandler(handlePushPayload);
}

export async function unregisterForPush() {
  if (!registeredDeviceId) return;
  try { await devicesApi.unregister(registeredDeviceId); } catch {}
  registeredDeviceId = null;
}

async function handlePushPayload(msg: any) {
  const data = msg?.data ?? {};
  if (data.type === "incoming_call") {
    RNCallKeep.displayIncomingCall(
      uuid(),
      data.from ?? "unknown",
      data.from ?? "Incoming",
      "number",
      false,
    );
  }
}
