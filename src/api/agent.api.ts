import api from './axios';

export const agentAPI = {
  // §4.2 in SPEC — must be built on backend behind FEATURE_MOBILE_AGENT
  registerDevice: async (fcmToken: string, appVersion: string) => {
    const res = await api.post('/mobile/agent/devices', {
      platform: 'android',
      fcmToken,
      appVersion,
    });
    return res.data.data as { id: string };
  },

  unregisterDevice: async (id: string) => {
    await api.delete(`/mobile/agent/devices/${id}`);
  },

  bootstrap: async () => {
    const res = await api.get('/mobile/agent/bootstrap');
    return res.data.data as {
      profile: unknown;
      sip: { username: string; password: string; wss: string; domain: string };
      callbacksCount: number;
    };
  },
};
