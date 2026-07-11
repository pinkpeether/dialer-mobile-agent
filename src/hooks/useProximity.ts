import { useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import InCallManager from 'react-native-incall-manager';

/**
 * Enables proximity sensor while a call is active.
 * When user's ear is near the screen, screen turns off and audio routes to earpiece.
 * When away, screen turns back on. Reverts on unmount.
 */
export function useProximity(active: boolean) {
  useEffect(() => {
    if (!active || Platform.OS !== 'android') return;

    InCallManager.setKeepScreenOn(true);
    // InCallManager auto-enables proximity in MODE_IN_COMMUNICATION on Android.
    // Explicitly re-assert in case audio session was reset.
    try {
      InCallManager.start({ media: 'audio', auto: true });
    } catch (err) {
      console.warn('[proximity] InCallManager.start failed', err);
    }

    const emitter = new NativeEventEmitter(NativeModules.InCallManager);
    const sub = emitter.addListener('Proximity', (data: { isNear: boolean }) => {
      console.log('[proximity]', data.isNear ? 'near' : 'far');
    });

    return () => {
      sub.remove();
      InCallManager.setKeepScreenOn(false);
    };
  }, [active]);
}
