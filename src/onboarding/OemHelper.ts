import { NativeModules, Platform } from 'react-native';
const { OemHelper } = NativeModules;

export const oem = {
  manufacturer: () => (Platform.OS === 'android' ? (OemHelper?.getManufacturer?.() ?? 'unknown') : 'ios'),
  isAggressive: (): boolean => Platform.OS === 'android' && !!OemHelper?.isAggressiveOem?.(),
  openAutostart: () => OemHelper?.openAutostartSettings?.(),
  openBatteryOptimization: () => OemHelper?.openBatteryOptimizationSettings?.(),
  isBatteryOptimizationIgnored: async (): Promise<boolean> =>
    (await OemHelper?.isBatteryOptimizationIgnored?.()) ?? false,
};
