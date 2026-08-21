import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import apiClient from '../utils/apiClient';
import { useUIStore } from './useUIStore';

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
        const results = await Promise.allSettled([
          apiClient.get('/v1/emergencies/templates'),
          apiClient.get('/v1/settings/hubs'),
          apiClient.get('/v1/settings/depots'),
          apiClient.get('/v1/settings/route-depots'),
          apiClient.get('/v1/settings/break-locations')
        ]);

        const getVal = (res: PromiseSettledResult<any>) =>
          res.status === 'fulfilled' && Array.isArray(res.value.data) ? res.value.data : [];
        
        set((state) => {
          state.emergencyTemplates = getVal(results[0]);
          state.hubs = getVal(results[1]);
          state.depots = getVal(results[2]);
          state.routeDepotConfigs = getVal(results[3]);
          state.breakLocations = getVal(results[4]);
          state.isLoaded = true;
        });
      } catch (error) {
        console.error('Failed to fetch configs', error);
        set((state) => { state.isLoaded = true; });
      } finally {
        setLoading(false);
      }
    },
    
    addHub: async (hub) => {
      try {
        const res = await apiClient.post('/v1/settings/hubs', hub);
        set((state) => {
          state.hubs.push(res.data);
        });
      } catch (error) {
        console.error('Failed to add hub', error);
      }
    },
    
    deleteHub: async (id) => {
      try {
        await apiClient.delete(`/v1/settings/hubs/${id}`);
        set((state) => {
          state.hubs = state.hubs.filter((h) => h.id !== id);
        });
      } catch (error) {
        console.error('Failed to delete hub', error);
      }
    },
    
    addDepot: async (depot) => {
      try {
        const res = await apiClient.post('/v1/settings/depots', depot);
        set((state) => {
          state.depots.push(res.data);
        });
      } catch (error) {
        console.error('Failed to add depot', error);
      }
    },
    
    deleteDepot: async (id) => {
      try {
        await apiClient.delete(`/v1/settings/depots/${id}`);
        set((state) => {
          state.depots = state.depots.filter((d) => d.id !== id);
        });
      } catch (error) {
        console.error('Failed to delete depot', error);
      }
    },

    addBreakLocation: async (loc) => {
      try {
        const res = await apiClient.post('/v1/settings/break-locations', loc);
        set((state) => {
          state.breakLocations.push(res.data);
        });
      } catch (error) {
        console.error('Failed to add break location', error);
      }
    },
    
    deleteBreakLocation: async (id) => {
      try {
        await apiClient.delete(`/v1/settings/break-locations/${id}`);
        set((state) => {
          state.breakLocations = state.breakLocations.filter((b) => b.id !== id);
        });
      } catch (error) {
        console.error('Failed to delete break location', error);
      }
    },

    addEmergencyTemplate: async (template) => {
      try {
        const res = await apiClient.post('/v1/emergencies/templates', template);
        set((state) => {
          state.emergencyTemplates.push(res.data);
        });
      } catch (error) {
        console.error('Failed to add emergency template', error);
      }
    },
    
    deleteEmergencyTemplate: async (id) => {
      try {
        await apiClient.delete(`/v1/emergencies/templates/${id}`);
        set((state) => {
          state.emergencyTemplates = state.emergencyTemplates.filter((t) => t.id !== id);
        });
      } catch (error) {
        console.error('Failed to delete emergency template', error);
      }
    }
  }))
);
