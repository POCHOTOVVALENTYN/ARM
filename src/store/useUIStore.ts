import { create } from 'zustand';

interface UIState {
  isGlobalLoading: boolean;
  activeRequests: number;
  setLoading: (isLoading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  activeRequests: 0,
  setLoading: (isLoading) => set((state) => {
    // Збільшуємо або зменшуємо лічильник активних запитів, не допускаючи від'ємних значень
    const newCount = isLoading 
        ? state.activeRequests + 1 
        : Math.max(0, state.activeRequests - 1);
        
    return {
      activeRequests: newCount,
      isGlobalLoading: newCount > 0
    };
  }),
}));
