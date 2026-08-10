import { create } from 'zustand';
import apiClient from '../utils/apiClient';

export interface Incident {
  id: string;
  vehicle_id: string;
  description: string;
  status: 'ANALYZING' | 'ACTIVE' | 'MANUAL_REVIEW' | 'RESOLVED';
  timestamp: number;
  category?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_delay?: number;
  action?: string;
  location?: { lat: number; lon: number };
}

interface IncidentState {
  incidents: Record<string, Incident>;
  setIncidents: (data: Record<string, Incident>) => void;
  reportIncident: (vehicle_id: string, description: string) => Promise<boolean>;
  activateHotReserve: (reserveId: string, tripId: string) => Promise<boolean>;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  incidents: {
    'inc_1': {
      id: 'inc_1',
      vehicle_id: '4020',
      description: 'Затримка через щільний рух біля Залізничного вокзалу',
      status: 'ACTIVE',
      timestamp: Date.now() - 600000,
      category: 'Затор / Інтервал',
      severity: 'HIGH',
      estimated_delay: 8,
      action: 'Застосувати відтяжку +5 хв на наступній контрольній точці'
    }
  },

  setIncidents: (data) => set({ incidents: data }),

  reportIncident: async (vehicle_id, description) => {
    try {
      // API call first
      const response = await apiClient.post('/api/incidents/report', { 
        vehicle_id, 
        description 
      });
      
      const newInc = response.data;
      // Fallback object in case backend doesn't return the full incident
      const incidentToAdd: Incident = newInc?.id ? newInc : {
        id: `inc_${Date.now()}`,
        vehicle_id,
        description,
        status: 'ACTIVE',
        timestamp: Date.now(),
        category: 'Затримка',
        severity: 'MEDIUM',
        estimated_delay: 5,
        action: 'Внесено в оперативний журнал'
      };

      set((state) => ({
        incidents: { ...state.incidents, [incidentToAdd.id]: incidentToAdd }
      }));
      
      return true;
    } catch (error) {
      // Error is caught by axios interceptor and toast is shown
      return false;
    }
  },

  activateHotReserve: async (reserveId, tripId) => {
    try {
      await apiClient.post('/api/incidents/hot-reserve/activate', {
        reserve_vehicle_id: reserveId,
        target_trip_id: tripId,
        reason: "Оперативна заміна"
      });
      
      // Update local state ONLY after successful confirmation (200 OK)
      // Since this is just an example for incidents, you can clear/resolve 
      // related incidents or update state as necessary
      set((state) => ({
         // ... local state logic for reserves
      }));
      return true;
      
    } catch (error) {
      return false; 
    }
  }
}));
