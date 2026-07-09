/**
 * SipClient — jssip UA driving react-native-webrtc.
 *
 * M1 status: skeleton with correct event surface. Wiring `RTCPeerConnection`
 * from `react-native-webrtc` into jssip's session desc handler is done in M2.
 * See docs/SPEC.md §5 (CallKeep wiring).
 */
import JsSIP from 'jssip';
import { useSipStore } from '@/store/sip.store';
import { APP_CONFIG } from '@/config';

export interface SipCreds {
  username: string;
  password: string;
  wss?: string;
  domain?: string;
}

export class SipClient {
  private ua: JsSIP.UA | null = null;
  private currentSession: any = null;

  async connect(creds: SipCreds) {
    const wss = creds.wss ?? APP_CONFIG.SIP_WSS_URL;
    const domain = creds.domain ?? APP_CONFIG.SIP_DOMAIN;
    const socket = new JsSIP.WebSocketInterface(wss);
    this.ua = new JsSIP.UA({
      sockets: [socket],
      uri: `sip:${creds.username}@${domain}`,
      password: creds.password,
      session_timers: true,
      register_expires: 300,
    });

    this.ua.on('registered', () => useSipStore.getState().setStatus('registered'));
    this.ua.on('unregistered', () => useSipStore.getState().setStatus('idle'));
    this.ua.on('registrationFailed', () => useSipStore.getState().setStatus('error'));

    this.ua.on('newRTCSession', ({ session, originator }) => {
      this.currentSession = session;
      if (originator === 'remote') {
        useSipStore.getState().setIncoming({
          uuid: session.id,
          peer: session.remote_identity.uri.toString(),
        });
        useSipStore.getState().setStatus('incoming');
      }
      session.on('ended', () => this.onEnded());
      session.on('failed', () => this.onEnded());
      session.on('accepted', () => {
        useSipStore.getState().setStatus('in_call');
        useSipStore.getState().setActive({
          uuid: session.id,
          peer: session.remote_identity.uri.toString(),
          direction: originator === 'remote' ? 'inbound' : 'outbound',
          startedAt: Date.now(),
          onHold: false,
          muted: false,
        });
      });
    });

    useSipStore.getState().setStatus('registering');
    this.ua.start();
  }

  call(number: string) {
    if (!this.ua) throw new Error('SIP UA not started');
    // TODO(M2): pass mediaConstraints + pcConfig for react-native-webrtc.
    return this.ua.call(`sip:${number}@${APP_CONFIG.SIP_DOMAIN}`, {
      mediaConstraints: { audio: true, video: false },
    });
  }

  answer() { this.currentSession?.answer({ mediaConstraints: { audio: true, video: false } }); }
  hangup() { this.currentSession?.terminate(); }
  hold(h: boolean) { h ? this.currentSession?.hold() : this.currentSession?.unhold(); useSipStore.getState().patchActive({ onHold: h }); }
  mute(m: boolean) { m ? this.currentSession?.mute({ audio: true }) : this.currentSession?.unmute({ audio: true }); useSipStore.getState().patchActive({ muted: m }); }
  dtmf(digit: string) { this.currentSession?.sendDTMF(digit); }

  disconnect() { this.ua?.stop(); this.ua = null; }

  private onEnded() {
    this.currentSession = null;
    useSipStore.getState().setActive(null);
    useSipStore.getState().setIncoming(null);
    useSipStore.getState().setStatus('registered');
  }
}

export const sipClient = new SipClient();
