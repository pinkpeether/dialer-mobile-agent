/**
 * SipClient
 * jssip UA driving react-native-webrtc's RTCPeerConnection for media.
 *
 * Emits high-level events that CallKeepBridge and the UI subscribe to:
 *   'registered' | 'unregistered' | 'incoming' | 'accepted' | 'ended' | 'failed'
 */
import { EventEmitter } from "events";
// @ts-ignore — jssip ships its own types
import JsSIP from "jssip";
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";

// Force jssip to use react-native-webrtc primitives instead of browser WebRTC.
// jssip reads these off the global at UA construction.
(global as any).RTCPeerConnection = RTCPeerConnection;
(global as any).RTCSessionDescription = RTCSessionDescription;
(global as any).RTCIceCandidate = RTCIceCandidate;
(global as any).navigator = (global as any).navigator || {};
(global as any).navigator.mediaDevices = mediaDevices;

export type SipConfig = {
  wsUrl: string;         // wss://pbx.example.com:8089/ws
  uri: string;           // sip:1001@pbx.example.com
  password: string;
  displayName?: string;
  stun?: string[];
};

export type CallSide = "inbound" | "outbound";

export type ActiveCall = {
  id: string;
  side: CallSide;
  remote: string;
  session: any; // JsSIP RTCSession
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  startedAt: number;
};

export class SipClient extends EventEmitter {
  private ua: any = null;
  private cfg: SipConfig | null = null;
  private active: ActiveCall | null = null;

  connect(cfg: SipConfig) {
    this.disconnect();
    this.cfg = cfg;
    const socket = new JsSIP.WebSocketInterface(cfg.wsUrl);
    this.ua = new JsSIP.UA({
      sockets: [socket],
      uri: cfg.uri,
      password: cfg.password,
      display_name: cfg.displayName,
      session_timers: true,
      register: true,
      register_expires: 300,
    });
    this.ua.on("registered", () => this.emit("registered"));
    this.ua.on("unregistered", () => this.emit("unregistered"));
    this.ua.on("registrationFailed", (e: any) =>
      this.emit("failed", { stage: "register", cause: e?.cause }),
    );
    this.ua.on("newRTCSession", ({ session, originator }: any) => {
      const side: CallSide = originator === "remote" ? "inbound" : "outbound";
      this.attachSession(session, side);
      if (side === "inbound") {
        this.emit("incoming", {
          id: session.id,
          from: session.remote_identity?.uri?.user ?? "unknown",
          displayName: session.remote_identity?.display_name,
        });
      }
    });
    this.ua.start();
  }

  disconnect() {
    try { this.ua?.stop(); } catch {}
    this.ua = null;
  }

  async placeCall(to: string): Promise<void> {
    if (!this.ua || !this.cfg) throw new Error("SIP not connected");
    const target = to.startsWith("sip:") ? to : `sip:${to}@${this.hostFromUri()}`;
    const iceServers = (this.cfg.stun ?? ["stun:stun.l.google.com:19302"]).map(
      (u) => ({ urls: u }),
    );
    this.ua.call(target, {
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers },
      rtcOfferConstraints: { offerToReceiveAudio: true, offerToReceiveVideo: false },
    });
  }

  answer() {
    if (!this.active) return;
    const iceServers = (this.cfg?.stun ?? ["stun:stun.l.google.com:19302"]).map(
      (u) => ({ urls: u }),
    );
    this.active.session.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig: { iceServers },
    });
  }

  hangup() {
    try { this.active?.session.terminate(); } catch {}
    this.active = null;
  }

  hold(on: boolean) {
    if (!this.active) return;
    on ? this.active.session.hold() : this.active.session.unhold();
  }

  sendDTMF(digit: string) {
    this.active?.session.sendDTMF(digit);
  }

  getActive() { return this.active; }

  private attachSession(session: any, side: CallSide) {
    const remoteId =
      session.remote_identity?.uri?.user ?? session.remote_identity?.display_name ?? "unknown";
    this.active = { id: session.id, side, remote: remoteId, session, startedAt: Date.now() };
    session.on("accepted", () => this.emit("accepted", this.active));
    session.on("confirmed", () => this.emit("accepted", this.active));
    session.on("ended", () => { this.emit("ended", this.active); this.active = null; });
    session.on("failed", (e: any) => {
      this.emit("failed", { stage: "session", cause: e?.cause });
      this.active = null;
    });
    session.on("peerconnection", ({ peerconnection }: any) => {
      peerconnection.addEventListener("track", (ev: any) => {
        if (this.active) this.active.remoteStream = ev.streams?.[0];
        this.emit("stream", { remote: ev.streams?.[0] });
      });
    });
  }

  private hostFromUri(): string {
    const uri = this.cfg?.uri ?? "";
    return uri.split("@")[1] ?? "";
  }
}

export const sipClient = new SipClient();
