import { create } from 'zustand';
import { BreakLocationConfig } from '../types';
import { MOCK_DRIVER_BREAK_LOCATIONS } from '../data/mockData';

interface BreakStoreState {
  breaks: BreakLocationConfig[];
  addBreak: (newBreak: Omit<BreakLocationConfig, 'id'>) => void;
  updateBreak: (updatedBreak: BreakLocationConfig) => void;
  deleteBreak: (id: string) => void;
}

export const useBreakStore = create<BreakStoreState>((set) => ({
  breaks: MOCK_DRIVER_BREAK_LOCATIONS,
  
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
