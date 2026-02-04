import { create } from 'zustand';
import { authApi, api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  role: 'admin' | 'sales' | 'developers' | 'designers';
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  signup: (email: string, password: string, full_name?: string, role?: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  signup: async (email: string, password: string, full_name?: string, role?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.signup(email, password, full_name, role);
      if (response.success && response.data) {
        const { token, user } = response.data;
        api.setToken(token);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({ error: response.error || 'Failed to create account', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error', isLoading: false });
      return false;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        const { token, user } = response.data;
        api.setToken(token);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({ error: response.error || 'Invalid email or password', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      api.setToken(null);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token invalid, logout
        get().logout();
      }
    } catch (error) {
      get().logout();
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setToken: (token: string | null) => {
    api.setToken(token);
    set({ token, isAuthenticated: !!token });
  },
}));

// Persist to localStorage manually
if (typeof window !== 'undefined') {
  // Load from localStorage on mount
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.token) {
        api.setToken(parsed.token);
        useAuthStore.setState({
          token: parsed.token,
          user: parsed.user,
          isAuthenticated: parsed.isAuthenticated || false,
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Save to localStorage on changes
  useAuthStore.subscribe((state) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      token: state.token,
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }));
  });
}
