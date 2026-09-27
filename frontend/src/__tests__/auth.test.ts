import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { AuthUser } from '../services/authApi';

describe('Authentication Flow & Auth Store', () => {
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@funarray.store',
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'CUSTOMER',
    status: 'ACTIVE',
  };

  const mockAdminUser: AuthUser = {
    id: 'admin-1',
    email: 'funarray47@gmail.com',
    firstName: 'Admin',
    lastName: 'Super',
    role: 'ADMIN',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    // Clear localStorage and Zustand store
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  });

  it('should initialize with unauthenticated state when no storage is present', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should authenticate user and store access token upon setAuth', () => {
    useAuthStore.getState().setAuth(mockUser, 'mock-jwt-access-token');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('mock-jwt-access-token');
  });

  it('should correctly authenticate and identify ADMIN role', () => {
    useAuthStore.getState().setAuth(mockAdminUser, 'admin-token-jwt');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.role).toBe('ADMIN');
    expect(state.user?.email).toBe('funarray47@gmail.com');
  });

  it('should update user profile details without affecting authentication status', () => {
    useAuthStore.getState().setAuth(mockUser, 'mock-jwt-access-token');

    const updatedUser: AuthUser = {
      ...mockUser,
      firstName: 'Alexander',
      lastName: 'Vane',
    };

    useAuthStore.getState().setUser(updatedUser);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.firstName).toBe('Alexander');
    expect(state.user?.lastName).toBe('Vane');
  });

  it('should clear all tokens and reset authentication on logout', () => {
    useAuthStore.getState().setAuth(mockUser, 'mock-jwt-access-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});
