import api from './axios';

export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data.data as {
      user: {
        id: number;
        agentCode: string;
        name: string;
        email: string;
        role: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER_ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'AGENT';
        status: string;
        phone?: string | null;
        extension?: string | null;
      };
      token: string;
      refreshToken?: string;
    };
  },

  refresh: async (refreshToken: string) => {
    const res = await api.post('/auth/refresh', { refreshToken });
    return res.data.data as { token: string; refreshToken: string };
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch { /* server-side may be down */ }
  },

  getProfile: async () => {
    const res = await api.get('/auth/profile');
    return res.data.data;
  },
};
