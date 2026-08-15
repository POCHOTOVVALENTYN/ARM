import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Інтерфейс користувача, який повертає бекенд (/api/auth/me)
export interface User {
  id: number;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // Екшени
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // Ключ у localStorage
      partialize: (state) => ({ token: state.token }), // Зберігаємо лише токен
    }
  )
);
