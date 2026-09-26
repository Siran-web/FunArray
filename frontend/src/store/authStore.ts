import { create } from 'zustand';
import { AuthUser, authApi } from '../services/authApi';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  initAuth: () => Promise<void>;
}

const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  isAuthenticated: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    set({ user, accessToken: token, isAuthenticated: true });
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
    }
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  initAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ user: null, accessToken: null, isAuthenticated: false });
      return;
    }

    try {
      const user = await authApi.getCurrentUser();
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user, accessToken: token, isAuthenticated: true });
      }
    } catch {
      // If token expired and cannot refresh, clear auth
      if (!localStorage.getItem('refresh_token')) {
        get().logout();
      }
    }
  },
}));
