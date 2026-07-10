import { api } from "./axios";

export const devicesApi = {
  register: (body: { fcmToken: string; appVersion?: string }) =>
    api.post<{ id: string }>("/mobile/agent/devices", { platform: "android", ...body })
      .then(r => r.data),
  unregister: (id: string) => api.delete(`/mobile/agent/devices/${id}`).then(r => r.data),
};
