import { PERMISSIONS, requestMultiple, RESULTS } from 'react-native-permissions';
import { Platform } from 'react-native';

export async function requestCorePermissions() {
  if (Platform.OS !== 'android') return { ok: true, denied: [] as string[] };
  const req = [
    PERMISSIONS.ANDROID.RECORD_AUDIO,
    PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
    PERMISSIONS.ANDROID.READ_PHONE_STATE,
  ];
  const res = await requestMultiple(req);
  const denied = req.filter((p) => res[p] !== RESULTS.GRANTED);
  return { ok: denied.length === 0, denied };
}
