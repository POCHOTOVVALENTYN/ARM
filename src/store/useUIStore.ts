// src/store/useUIStore.ts
import { create } from 'zustand';

interface UIState {
  isGlobalLoading: boolean;
  activeRequests: number;
  setLoading: (isLoading: boolean) => void;
  // Додати інтеграцію з бібліотекою тостів (напр. react-toastify чи sonner)
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  activeRequests: 0,
  setLoading: (isLoading) => set((state) => {
    const newCount = isLoading ? state.activeRequests + 1 : Math.max(0, state.activeRequests - 1);
    return { activeRequests: newCount, isGlobalLoading: newCount > 0 };
  }),
}));
