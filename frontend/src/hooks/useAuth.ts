// ============================================================
// PetroVision — Auth Store (Zustand + Persist)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authAPI } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.login(username, password);
          localStorage.setItem('token', data.access_token);
          set({ token: data.access_token, isAuthenticated: true, isLoading: false });
          // Fetch user profile
          await get().fetchMe();
        } catch (err: any) {
          const message = err.response?.data?.detail || 'Error de autenticación';
          set({ error: message, isLoading: false, isAuthenticated: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.me();
          set({ user: data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'petrovision-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
