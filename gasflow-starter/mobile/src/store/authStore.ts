import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, me as apiMe } from '../api/client';
import { clearToken, loadToken, saveToken } from '../storage/session';
import { AppMode } from '../utils/mode';

interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'REPARTIDOR';
}

interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  token: string | null;
  user: User | null;
  mode: AppMode | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  setMode: (mode: AppMode | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      status: 'idle',
      token: null,
      user: null,
      mode: null,

      login: async (username, password) => {
        set({ status: 'loading' });
        try {
          const token = await apiLogin(username, password);
          const profile = await apiMe(token);
          await saveToken(token);
          set({
            status: 'authenticated',
            token,
            user: { id: profile.id, username: profile.username, role: profile.role },
            mode: null,
          });
        } catch (error) {
          set({ status: 'unauthenticated', token: null, user: null });
          throw error;
        }
      },

      logout: async () => {
        set({ status: 'loading' });
        await clearToken();
        set({ status: 'unauthenticated', token: null, user: null, mode: null });
      },

      bootstrap: async () => {
        // Only run bootstrap if we don't have a token in the persisted state
        // or if we want to re-verify on every app start.
        // For security, it's better to re-verify the token with /me.
        set({ status: 'loading' });
        try {
          const token = await loadToken();
          if (!token) {
            set({ status: 'unauthenticated' });
            return;
          }
          const profile = await apiMe(token);
          set({
            status: 'authenticated',
            token,
            user: { id: profile.id, username: profile.username, role: profile.role },
          });
        } catch {
          await clearToken();
          set({ status: 'unauthenticated' });
        }
      },

      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'gasflow-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        mode: state.mode,
      }),
    }
  )
);
