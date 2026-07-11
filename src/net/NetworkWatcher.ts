import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onNetworkChange } from '../sip/reconnect';

let unsubscribe: (() => void) | null = null;
let lastType: string | null = null;
let lastConnected = true;

export function startNetworkWatcher() {
  if (unsubscribe) return;
  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const type = state.type;
    const connected = !!state.isConnected && state.isInternetReachable !== false;

    // Ignore initial event
    if (lastType === null) {
      lastType = type;
      lastConnected = connected;
      return;
    }

    const changedTransport = type !== lastType;
    const cameOnline = connected && !lastConnected;

    if (changedTransport || cameOnline) {
      console.log('[net] change', { from: lastType, to: type, connected });
      onNetworkChange({ transport: type, connected });
    }

    lastType = type;
    lastConnected = connected;
  });
}

export function stopNetworkWatcher() {
  unsubscribe?.();
  unsubscribe = null;
  lastType = null;
  lastConnected = true;
}
