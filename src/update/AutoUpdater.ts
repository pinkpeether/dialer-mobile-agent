import { Alert, Linking, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Config from 'react-native-config';
import axios from 'axios';

type Manifest = {
  version: string;       // semver, e.g. "1.2.3"
  apkUrl: string;        // absolute URL to signed APK
  sha256: string;        // hex, lowercase
  minSupported: string;  // versions below this MUST upgrade
  notes?: string;
};

const MANIFEST_PATH = '/downloads/agent/manifest.json';

function cmp(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const ai = pa[i] ?? 0;
    const bi = pb[i] ?? 0;
    if (ai !== bi) return ai - bi;
  }
  return 0;
}

export async function checkForUpdate(): Promise<Manifest | null> {
  if (Platform.OS !== 'android') return null;
  const base = Config.API_URL;
  if (!base) return null;
  try {
    const { data } = await axios.get<Manifest>(`${base}${MANIFEST_PATH}`, { timeout: 10_000 });
    const current = DeviceInfo.getVersion();
    if (cmp(data.version, current) > 0) return data;
    return null;
  } catch (err) {
    console.warn('[update] manifest fetch failed', err);
    return null;
  }
}

export async function promptUpdate(m: Manifest): Promise<void> {
  const current = DeviceInfo.getVersion();
  const forced = cmp(current, m.minSupported) < 0;
  return new Promise((resolve) => {
    Alert.alert(
      forced ? 'Update required' : 'Update available',
      `Version ${m.version} is available.${m.notes ? `\n\n${m.notes}` : ''}`,
      forced
        ? [{ text: 'Update now', onPress: () => { Linking.openURL(m.apkUrl); resolve(); } }]
        : [
            { text: 'Later', style: 'cancel', onPress: () => resolve() },
            { text: 'Update', onPress: () => { Linking.openURL(m.apkUrl); resolve(); } },
          ],
      { cancelable: !forced }
    );
  });
}

export async function runUpdateCheckOnForeground(): Promise<void> {
  const m = await checkForUpdate();
  if (m) await promptUpdate(m);
}
