import { api } from "./axios";

export type Contact = {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  altPhone?: string;
  email?: string;
  company?: string;
  campaignId?: string;
  status?: string;
  notes?: string;
  updatedAt?: string;
};

export const contactsApi = {
  list: (q?: { search?: string; page?: number; pageSize?: number }) =>
    api.get<{ items: Contact[]; total: number }>("/contacts", { params: q }).then(r => r.data),
  get: (id: string) => api.get<Contact>(`/contacts/${id}`).then(r => r.data),
  update: (id: string, patch: Partial<Contact>) =>
    api.patch<Contact>(`/contacts/${id}`, patch).then(r => r.data),
};
