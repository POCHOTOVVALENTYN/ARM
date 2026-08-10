import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import apiClient from '../utils/apiClient';
import { useUIStore } from './useUIStore';
import { toast } from 'sonner';

export interface EmergencyTemplate {
  id: string;
  title: string;
  cause: string;
  affectedRouteIds: string[];
  affectedStationIds: string[];
  detourDescription: string;
  alternativeStations: string[];
}

export interface HubNode {
  id: string;
  name: string;
  locationDescription: string;
  availableTracksCount: number;
  minHeadwayMin: number;
  routesConnecting: string[];
  channels: any[];
}

export interface Depot {
  id: string;
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  prepTimeMin: number;
}

export interface RouteDepotConfig {
  id: string;
  routeId: string;
  primaryDepotId: string;
  secondaryDepotId?: string;
  defaultOutboundTime: string;
  defaultInboundTime: string;
}

export interface BreakLocationConfig {
  id: string;
  routeId: string;
  locationId: string;
  locationName: string;
  locationType: string;
  maxCapacityVehicles: number;
  durationMin: number;
}

interface ConfigState {
  emergencyTemplates: EmergencyTemplate[];
  hubs: HubNode[];
  depots: Depot[];
  routeDepotConfigs: RouteDepotConfig[];
  breakLocations: BreakLocationConfig[];
  isLoaded: boolean;
  
  fetchConfigs: () => Promise<void>;
  
  // CRUD
  addHub: (hub: HubNode) => Promise<void>;
  deleteHub: (id: string) => Promise<void>;
  addDepot: (depot: Depot) => Promise<void>;
  deleteDepot: (id: string) => Promise<void>;
  addBreakLocation: (loc: BreakLocationConfig) => Promise<void>;
  deleteBreakLocation: (id: string) => Promise<void>;
  addEmergencyTemplate: (template: EmergencyTemplate) => Promise<void>;
  deleteEmergencyTemplate: (id: string) => Promise<void>;
}

export const useConfigStore = create<ConfigState>()(
  immer((set) => ({
    emergencyTemplates: [],
    hubs: [],
    depots: [],
    routeDepotConfigs: [],
    breakLocations: [],
    isLoaded: false,
    
    fetchConfigs: async () => {
      const { setLoading } = useUIStore.getState();
      setLoading(true);
      
      try {
        const [
          templatesRes,
          hubsRes,
          depotsRes,
          configsRes,
          breaksRes
        ] = await Promise.all([
          apiClient.get('/v1/emergencies/templates'),
          apiClient.get('/v1/settings/hubs'),
          apiClient.get('/v1/settings/depots'),
          apiClient.get('/v1/settings/route-depot-configs'),
          apiClient.get('/v1/settings/break-locations')
        ]);
        
        set((state) => {
          state.emergencyTemplates = templatesRes.data;
          state.hubs = hubsRes.data;
          state.depots = depotsRes.data;
          state.routeDepotConfigs = configsRes.data;
          state.breakLocations = breaksRes.data;
          state.isLoaded = true;
        });
      } catch (error) {
        console.error('Failed to fetch configs', error);
        toast.error('Помилка завантаження конфігурацій');
        set((state) => { state.isLoaded = true; });
      } finally {
        setLoading(false);
      }
    },
    
    addHub: async (hub) => {
      try {
        await apiClient.post('/v1/settings/hubs', hub);
        set((state) => { state.hubs.push(hub); });
        toast.success('Хаб додано');
      } catch (error) { toast.error('Помилка додавання хабу'); }
    },
    deleteHub: async (id) => {
      try {
        await apiClient.delete(`/v1/settings/hubs/${id}`);
        set((state) => { state.hubs = state.hubs.filter(h => h.id !== id); });
        toast.success('Хаб видалено');
      } catch (error) { toast.error('Помилка видалення хабу'); }
    },
    addDepot: async (depot) => {
      try {
        await apiClient.post('/v1/settings/depots', depot);
        set((state) => { state.depots.push(depot); });
        toast.success('Депо додано');
      } catch (error) { toast.error('Помилка додавання депо'); }
    },
    deleteDepot: async (id) => {
      try {
        await apiClient.delete(`/v1/settings/depots/${id}`);
        set((state) => { state.depots = state.depots.filter(d => d.id !== id); });
        toast.success('Депо видалено');
      } catch (error) { toast.error('Помилка видалення депо'); }
    },
    addBreakLocation: async (loc) => {
      try {
        await apiClient.post('/v1/settings/break-locations', loc);
        set((state) => { state.breakLocations.push(loc); });
        toast.success('Місце відпочинку додано');
      } catch (error) { toast.error('Помилка додавання місця відпочинку'); }
    },
    deleteBreakLocation: async (id) => {
      try {
        await apiClient.delete(`/v1/settings/break-locations/${id}`);
        set((state) => { state.breakLocations = state.breakLocations.filter(b => b.id !== id); });
        toast.success('Місце відпочинку видалено');
      } catch (error) { toast.error('Помилка видалення місця відпочинку'); }
    },
    addEmergencyTemplate: async (template) => {
      try {
        await apiClient.post('/v1/emergencies/templates', template);
        set((state) => { state.emergencyTemplates.push(template); });
        toast.success('Шаблон додано');
      } catch (error) { toast.error('Помилка додавання шаблону'); }
    },
    deleteEmergencyTemplate: async (id) => {
      try {
        await apiClient.delete(`/v1/emergencies/templates/${id}`);
        set((state) => { state.emergencyTemplates = state.emergencyTemplates.filter(t => t.id !== id); });
        toast.success('Шаблон видалено');
      } catch (error) { toast.error('Помилка видалення шаблону'); }
    }
  }))
);
