import { api } from "./axios";

export type SmsThread = {
  id: string;
  phone: string;
  contactName?: string;
  lastMessage?: string;
  lastAt?: string;
  unread: number;
};

export type SmsMessage = {
  id: string;
  threadId: string;
  direction: "in" | "out";
  body: string;
  createdAt: string;
};

export const smsApi = {
  threads: () => api.get<SmsThread[]>("/sms/threads").then(r => r.data),
  messages: (threadId: string) =>
    api.get<SmsMessage[]>(`/sms/threads/${threadId}/messages`).then(r => r.data),
  send: (body: { to: string; text: string }) =>
    api.post<SmsMessage>("/sms/send", body).then(r => r.data),
};
