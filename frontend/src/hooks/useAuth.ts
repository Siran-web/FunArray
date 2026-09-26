import { useAuthStore } from '../store/authStore';
import { authApi, LoginPayload, RegisterPayload } from '../services/authApi';
import { useState } from 'react';

export function useAuth() {
  const { user, accessToken, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(payload);
      setAuth(data.user, data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', data.refreshToken);
      }
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register(payload);
      setAuth(data.user, data.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', data.refreshToken);
      }
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') || undefined : undefined;
      await authApi.logout(refreshToken);
    } finally {
      clearAuth();
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
  };
}
