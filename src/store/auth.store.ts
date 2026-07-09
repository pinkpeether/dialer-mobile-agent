import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'CUSTOMER_ADMIN'
  | 'MANAGER'
  | 'SUPERVISOR'
  | 'AGENT';

export interface User {
  id: number;
  agentCode: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  phone?: string | null;
  extension?: string | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuth: boolean;
  hydrate: () => Promise<void>;
  setAuth: (user: User, token: string, refreshToken?: string) => Promise<void>;
  updateUser: (patch: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

const KEYCHAIN_SERVICE = 'com.ptdt.dialer.agent.token';
const USER_KEY = 'ptdt.user';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuth: false,

  hydrate: async () => {
    try {
      const creds = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (creds && userJson) {
        const parsed = JSON.parse(creds.password) as { token: string; refreshToken?: string };
        set({
          token: parsed.token,
          refreshToken: parsed.refreshToken ?? null,
          user: JSON.parse(userJson),
          isAuth: true,
        });
      }
    } catch { /* first run */ }
  },

  setAuth: async (user, token, refreshToken) => {
    await Keychain.setGenericPassword(
      'agent',
      JSON.stringify({ token, refreshToken }),
      { service: KEYCHAIN_SERVICE },
    );
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, refreshToken: refreshToken ?? null, isAuth: true });
  },

  updateUser: async (patch) => {
    const cur = get().user;
    if (!cur) return;
    const next = { ...cur, ...patch };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(next));
    set({ user: next });
  },

  logout: async () => {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
    await AsyncStorage.removeItem(USER_KEY);
    set({ user: null, token: null, refreshToken: null, isAuth: false });
  },
}));
