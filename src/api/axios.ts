import axios from 'axios';
import { APP_CONFIG } from '@/config';
import { useAuthStore } from '@/store/auth.store';

const api = axios.create({
  baseURL: APP_CONFIG.API_URL,
  timeout: 15000,
});

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  cfg.headers['X-Client'] = 'ptdt-agent-android';
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401) {
      // TODO(M1): call /auth/refresh, retry once, then logout on fail.
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  },
);

export default api;
