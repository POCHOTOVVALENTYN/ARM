import { create } from 'zustand';
import { BreakLocationConfig } from '../types';

export const MOCK_DRIVER_BREAK_LOCATIONS: BreakLocationConfig[] = [
  {
    id: 'brk_1',
    routeId: 'T3',
    locationId: 'st_starosinna',
    locationName: 'Старосінна площа',
    locationType: 'global_hub',
    maxCapacityVehicles: 4,
    durationMin: 15,
  },
  {
    id: 'brk_2',
    routeId: 'T3',
    locationId: 'st_lustdorf_11th',
    locationName: '11-та ст. Люстдорфської дороги',
    locationType: 'opposite_terminal',
    maxCapacityVehicles: 2,
    durationMin: 15,
  },
  {
    id: 'brk_3',
    routeId: 'Tr3',
    locationId: 'st_pivdenny',
    locationName: 'Ринок «Південний» (Диспетчерський пункт)',
    locationType: 'dispatch_point',
    maxCapacityVehicles: 3,
    durationMin: 20,
  },
];

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
