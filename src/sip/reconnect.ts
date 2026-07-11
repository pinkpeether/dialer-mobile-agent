import { sipClient } from './SipClient';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export type NetChange = { transport: string; connected: boolean };

export function getSipClient() {
  return sipClient;
}

/**
 * Called by NetworkWatcher on transport change / recovery.
 * Debounces then triggers SIP re-register + ICE restart on any active session.
 */
export function onNetworkChange(change: NetChange) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (!change.connected) return;

    try {
      reregister();
      restartIceOnActiveSession();
      console.log('[sip] reregister + ICE restart after network change');
    } catch (err) {
      console.warn('[sip] reconnect failed', err);
    }
  }, 800);
}

/**
 * jssip exposes UA.register()/unregister(). Force a fresh REGISTER so the
 * `Contact` header rebinds to the new transport address.
 */
export function reregister() {
  const ua = (sipClient as any).ua;
  if (!ua) return;
  try { ua.unregister({ all: false }); } catch {}
  try { ua.register(); } catch (err) { console.warn('[sip] register() failed', err); }
}

/**
 * Ask any active RTCPeerConnection to renegotiate with ICE restart.
 * jssip surfaces this via RTCSession.renegotiate({ useUpdate: false, rtcOfferConstraints: { iceRestart: true } }).
 */
export function restartIceOnActiveSession() {
  const active = sipClient.getActive?.();
  if (!active?.session) return;
  try {
    active.session.renegotiate({
      useUpdate: false,
      rtcOfferConstraints: { iceRestart: true },
    });
  } catch (err) {
    console.warn('[sip] ICE restart failed', err);
  }
}
