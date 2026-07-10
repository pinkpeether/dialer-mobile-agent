import { api } from "./axios";

export type CallRecord = {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  disposition?: string;
  recordingUrl?: string;
  contactId?: string;
  campaignId?: string;
};

export type Disposition = {
  code: string;
  label: string;
  requiresNote?: boolean;
  requiresCallback?: boolean;
};

export const callsApi = {
  history: (q?: { page?: number; pageSize?: number }) =>
    api.get<{ items: CallRecord[]; total: number }>("/calls", { params: q }).then(r => r.data),
  get: (id: string) => api.get<CallRecord>(`/calls/${id}`).then(r => r.data),
  dispositions: () => api.get<Disposition[]>("/calls/dispositions").then(r => r.data),
  disposition: (id: string, body: { code: string; note?: string; callbackAt?: string }) =>
    api.post(`/calls/${id}/disposition`, body).then(r => r.data),
  recordingUrl: (id: string) =>
    api.get<{ url: string }>(`/calls/${id}/recording`).then(r => r.data.url),
};
