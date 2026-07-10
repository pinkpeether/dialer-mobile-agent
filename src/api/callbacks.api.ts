import { api } from "./axios";

export type Callback = {
  id: string;
  contactId?: string;
  phone: string;
  contactName?: string;
  scheduledAt: string;
  status: "pending" | "done" | "missed" | "snoozed";
  notes?: string;
};

export const callbacksApi = {
  list: (q?: { status?: string }) =>
    api.get<Callback[]>("/callbacks", { params: q }).then(r => r.data),
  markDone: (id: string) => api.post(`/callbacks/${id}/done`).then(r => r.data),
  snooze: (id: string, minutes: number) =>
    api.post(`/callbacks/${id}/snooze`, { minutes }).then(r => r.data),
  create: (body: { phone: string; contactId?: string; scheduledAt: string; notes?: string }) =>
    api.post<Callback>("/callbacks", body).then(r => r.data),
};
