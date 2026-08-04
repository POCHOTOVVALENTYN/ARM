import { create } from 'zustand';
import { RouteDepotConfig, PullOutInDetails } from '../types';
import { MOCK_ROUTE_DEPOT_CONFIGS } from '../data/mockData';

interface RouteDepotStore {
  configs: RouteDepotConfig[];
  addConfig: (config: RouteDepotConfig) => void;
  updateConfig: (config: RouteDepotConfig) => void;
  deleteConfig: (id: string) => void;
}

export const useRouteDepotStore = create<RouteDepotStore>((set) => ({
  configs: [...MOCK_ROUTE_DEPOT_CONFIGS],

  addConfig: (config) =>
    set((state) => ({ configs: [...state.configs, config] })),

  updateConfig: (config) =>
    set((state) => ({
      configs: state.configs.map((c) => (c.id === config.id ? config : c)),
    })),

  deleteConfig: (id) =>
    set((state) => ({
      configs: state.configs.filter((c) => c.id !== id),
    })),
}));
