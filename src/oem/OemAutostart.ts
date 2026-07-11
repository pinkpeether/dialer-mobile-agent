import { NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/**
 * Vendors that aggressively kill background processes / block autostart.
 * We surface a one-time prompt after login on these devices, directing the
 * user to the vendor's autostart + battery-saver settings screen.
 */
const HOSTILE_MANUFACTURERS = new Set([
  'xiaomi', 'redmi', 'poco',
  'oppo', 'realme', 'oneplus',
  'vivo', 'iqoo',
  'huawei', 'honor',
  'meizu', 'letv',
]);

export async function shouldPromptOemAutostart(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const mfg = (await DeviceInfo.getManufacturer()).toLowerCase();
    return HOSTILE_MANUFACTURERS.has(mfg);
  } catch {
    return false;
  }
}

export function openOemAutostartSettings(): Promise<boolean> {
  const mod = (NativeModules as any).OemHelper;
  if (!mod?.openAutostartSettings) return Promise.resolve(false);
  return mod.openAutostartSettings();
}

export function openBatteryOptimizationSettings(): Promise<boolean> {
  const mod = (NativeModules as any).OemHelper;
  if (!mod?.openBatteryOptimizationSettings) return Promise.resolve(false);
  return mod.openBatteryOptimizationSettings();
}
