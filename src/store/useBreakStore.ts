import { create } from 'zustand';
import { BreakLocationConfig } from '../types';



interface BreakStoreState {
  breaks: BreakLocationConfig[];
  setBreaks: (breaks: BreakLocationConfig[]) => void;
  addBreak: (newBreak: Omit<BreakLocationConfig, 'id'>) => void;
  updateBreak: (updatedBreak: BreakLocationConfig) => void;
  deleteBreak: (id: string) => void;
}

export const useBreakStore = create<BreakStoreState>((set) => ({
  breaks: [],
  setBreaks: (breaks) => set({ breaks }),
  
  addBreak: (newBreak) => {
    const id = `brk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    set((state) => ({
      breaks: [...state.breaks, { ...newBreak, id }],
    }));
  },
  
  updateBreak: (updatedBreak) => {
    set((state) => ({
      breaks: state.breaks.map((b) => (b.id === updatedBreak.id ? updatedBreak : b)),
    }));
  },
  
  deleteBreak: (id) => {
    set((state) => ({
      breaks: state.breaks.filter((b) => b.id !== id),
    }));
  },
}));
