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
  rememberMe: boolean;
  
  // Actions
  signup: (email: string, password: string, full_name?: string) => Promise<boolean>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initialize: () => void;
}

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  REMEMBER_ME: 'auth_remember_me',
  CACHED_USER: 'cached_user',
  CACHED_TIME: 'cached_user_time',
};

// Get storage based on remember me preference
const getStorage = (rememberMe: boolean) => {
  return rememberMe ? localStorage : sessionStorage;
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to prevent flash
  error: null,
  rememberMe: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true' : false,

  signup: async (email: string, password: string, full_name?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.signup(email, password, full_name);
      if (response.success) {
        set({ isLoading: false, error: null });
        return true; // Signup successful, but user needs approval
      } else {
        set({ error: response.error || 'Failed to create account', isLoading: false });
        return false;
      }
    } catch (error) {
      set({ error: 'Network error', isLoading: false });
      return false;
    }
  },

  login: async (email: string, password: string, rememberMe: boolean = false) => {
    set({ isLoading: true, error: null, rememberMe });
    try {
      const response = await authApi.login(email, password);
      
      if (response.success) {
        const token = response.token || response.data?.token;
        const user = response.user || response.data?.user;
        
        if (token && user) {
          // Store remember me preference
          if (typeof window !== 'undefined') {
            if (rememberMe) {
              localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
            } else {
              localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
            }
          }

          // Store token and user in appropriate storage
          const storage = getStorage(rememberMe);
          if (typeof window !== 'undefined') {
            storage.setItem(STORAGE_KEYS.TOKEN, token);
            storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
            // Also store in localStorage for API client
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          }

          api.setToken(token);
          
          // Cache user data with longer TTL if remember me
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
            localStorage.setItem(STORAGE_KEYS.CACHED_TIME, Date.now().toString());
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            rememberMe,
          });
          return true;
        } else {
          set({ error: 'Login response incomplete', isLoading: false });
          return false;
        }
      } else {
        const errorMsg = response.error || 'Invalid email or password';
        set({ error: errorMsg, isLoading: false });
        return false;
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.message || 'Network error';
      set({ error: errorMsg, isLoading: false });
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
      
      // Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
        localStorage.removeItem(STORAGE_KEYS.CACHED_TIME);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem('auth-storage');
      }
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
        rememberMe: false,
      });
    }
  },

  checkAuth: async () => {
    // First, try to load token from storage
    if (typeof window !== 'undefined') {
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      const storage = getStorage(rememberMe);
      
      // Try to get token from storage
      let storedToken = storage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN);
      let storedUser = storage.getItem(STORAGE_KEYS.USER);
      
      // If we have stored data, restore it immediately
      if (storedToken && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          api.setToken(storedToken);
          set({
            token: storedToken,
            user,
            isAuthenticated: true,
            rememberMe,
            isLoading: false, // Set to false initially, will be true during verification
          });
        } catch (e) {
          // Invalid stored data, clear it
          storage.removeItem(STORAGE_KEYS.TOKEN);
          storage.removeItem(STORAGE_KEYS.USER);
        }
      }
    }

    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    // Check if we have cached user data and it's recent
    const rememberMe = get().rememberMe;
    const cacheTTL = rememberMe ? 30 * 60 * 1000 : 5 * 60 * 1000; // 30 min if remember me, 5 min otherwise
    
    if (typeof window !== 'undefined') {
      const cachedUser = localStorage.getItem(STORAGE_KEYS.CACHED_USER);
      const cacheTime = localStorage.getItem(STORAGE_KEYS.CACHED_TIME);
      
      if (cachedUser && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime);
        if (cacheAge < cacheTTL) {
          try {
            const user = JSON.parse(cachedUser);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            // Verify in background without blocking
            authApi.getMe().then((response) => {
              if (response.success && response.data) {
                const updatedUser = response.data.user;
                localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(updatedUser));
                localStorage.setItem(STORAGE_KEYS.CACHED_TIME, Date.now().toString());
                const storage = getStorage(rememberMe);
                storage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
                set({ user: updatedUser });
              }
            }).catch(() => {
              // Ignore background errors, keep cached user
            });
            return;
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }
      }
    }

    set({ isLoading: true });
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        const user = response.data.user;
        const rememberMe = get().rememberMe;
        const storage = getStorage(rememberMe);
        
        // Cache user data
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
          localStorage.setItem(STORAGE_KEYS.CACHED_TIME, Date.now().toString());
          storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        }
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token invalid, logout
        get().logout();
      }
    } catch (error) {
      // If we have cached user, use it even if API fails (offline support)
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem(STORAGE_KEYS.CACHED_USER);
        if (cachedUser) {
          try {
            const user = JSON.parse(cachedUser);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch (e) {
            // Invalid cache
          }
        }
      }
      get().logout();
    }
  },

  initialize: () => {
    if (typeof window === 'undefined') return;
    
    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    const storage = getStorage(rememberMe);
    
    // Load token and user from storage
    const storedToken = storage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem(STORAGE_KEYS.TOKEN);
    const storedUser = storage.getItem(STORAGE_KEYS.USER);
    
    if (storedToken) {
      api.setToken(storedToken);
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          set({
            token: storedToken,
            user,
            isAuthenticated: true,
            rememberMe,
            isLoading: false,
          });
          // Verify in background
          get().checkAuth();
          return;
        } catch (e) {
          // Invalid stored data
        }
      }
      // If we have token but no user, verify it
      set({ token: storedToken, rememberMe, isLoading: true });
      get().checkAuth();
    } else {
      set({ isLoading: false });
    }
  },

  setUser: (user: User | null) => {
    const rememberMe = get().rememberMe;
    const storage = getStorage(rememberMe);
    
    if (user && typeof window !== 'undefined') {
      storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.CACHED_TIME, Date.now().toString());
    } else if (typeof window !== 'undefined') {
      storage.removeItem(STORAGE_KEYS.USER);
    }
    
    set({ user, isAuthenticated: !!user });
  },

  setToken: (token: string | null) => {
    api.setToken(token);
    const rememberMe = get().rememberMe;
    const storage = getStorage(rememberMe);
    
    if (token && typeof window !== 'undefined') {
      storage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.TOKEN, token); // Always store in localStorage for API client
    } else if (typeof window !== 'undefined') {
      storage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
    
    set({ token, isAuthenticated: !!token });
  },
}));

// Initialize on mount
if (typeof window !== 'undefined') {
  // Initialize immediately
  useAuthStore.getState().initialize();
}
