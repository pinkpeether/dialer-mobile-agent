import { create } from 'zustand';

export type SipStatus = 'idle' | 'registering' | 'registered' | 'incoming' | 'in_call' | 'error';

interface ActiveCall {
  uuid: string;      // CallKeep UUID
  peer: string;      // display + number
  direction: 'inbound' | 'outbound';
  startedAt: number;
  onHold: boolean;
  muted: boolean;
}

interface SipStore {
  status: SipStatus;
  activeCall: ActiveCall | null;
  incomingCall: { uuid: string; peer: string } | null;
  setStatus: (s: SipStatus) => void;
  setActive: (c: ActiveCall | null) => void;
  setIncoming: (c: { uuid: string; peer: string } | null) => void;
  patchActive: (p: Partial<ActiveCall>) => void;
}

export const useSipStore = create<SipStore>((set) => ({
  status: 'idle',
  activeCall: null,
  incomingCall: null,
  setStatus: (status) => set({ status }),
  setActive: (activeCall) => set({ activeCall }),
  setIncoming: (incomingCall) => set({ incomingCall }),
  patchActive: (p) =>
    set((s) => (s.activeCall ? { activeCall: { ...s.activeCall, ...p } } : s)),
}));
