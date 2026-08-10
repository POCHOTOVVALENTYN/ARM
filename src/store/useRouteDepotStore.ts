import { create } from 'zustand';
import { RouteDepotConfig, PullOutInDetails } from '../types';
interface RouteDepotStore {
  configs: RouteDepotConfig[];
  setConfigs: (configs: RouteDepotConfig[]) => void;
  addConfig: (config: RouteDepotConfig) => void;
  updateConfig: (config: RouteDepotConfig) => void;
  deleteConfig: (id: string) => void;
  upsertConfig: (config: RouteDepotConfig) => void;
}

export const useRouteDepotStore = create<RouteDepotStore>((set) => ({
  configs: [],

  setConfigs: (configs) => set({ configs }),

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

  upsertConfig: (config) =>
    set((state) => {
      const exists = state.configs.some((c) => c.routeId === config.routeId && c.depotId === config.depotId);
      if (exists) {
        return {
          configs: state.configs.map((c) => (c.routeId === config.routeId && c.depotId === config.depotId ? config : c)),
        };
      }
      return { configs: [...state.configs, config] };
    }),
}));
