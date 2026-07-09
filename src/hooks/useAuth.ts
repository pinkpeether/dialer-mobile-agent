import { useAuthStore } from '@/store/auth.store';
import { authAPI } from '@/api/auth.api';

export function useAuth() {
  const { user, token, isAuth, setAuth, logout } = useAuthStore();

  const login = async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    if (data.user.role !== 'AGENT') {
      throw new Error(
        'This app is for agents only. Supervisors and admins should use the web console.',
      );
    }
    await setAuth(data.user, data.token, data.refreshToken);
    return data;
  };

  const handleLogout = async () => {
    await authAPI.logout();
    await logout();
  };

  return { user, token, isAuth, login, logout: handleLogout };
}
