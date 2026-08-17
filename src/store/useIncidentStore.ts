import { create } from 'zustand';
import apiClient from '../utils/apiClient';

export interface Incident {
  id: string | number;
  vehicle_id: string;
  route_id?: string;
  description: string;
  status: 'ANALYZING' | 'ACTIVE' | 'MANUAL_REVIEW' | 'RESOLVED' | 'NEW' | string;
  source?: string;
  timestamp: number | string;
  category?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_delay?: number;
  action?: string;
  location?: { lat: number; lon: number };
}

interface IncidentState {
  incidents: Record<string, Incident>;
  activeIncidents: Incident[];
  
  // Додавання нового інциденту з WebSocket на початок списку
  addLiveIncident: (incident: Incident | any) => void;
  // Оновлення повного списку інцидентів
  setIncidents: (data: Record<string, Incident> | Incident[]) => void;
  
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
  activeIncidents: [],

  addLiveIncident: (incident) => set((state) => {
    const rawId = String(incident.id || `inc_${Date.now()}`);
    const normalizedIncident: Incident = {
      id: rawId,
      vehicle_id: incident.vehicle_id,
      route_id: incident.route_id,
      description: incident.description,
      status: incident.status || 'NEW',
      source: incident.source || 'SYSTEM',
      timestamp: typeof incident.timestamp === 'number' ? incident.timestamp : Date.now(),
      category: incident.category || 'Критичне запізнення',
      severity: incident.severity || 'HIGH',
      estimated_delay: incident.estimated_delay || 5,
      action: incident.action || 'Оперативний контроль / відтяжка'
    };

    const existsInArray = state.activeIncidents.some((i) => String(i.id) === rawId);
    const updatedArray = existsInArray ? state.activeIncidents : [normalizedIncident, ...state.activeIncidents];

    return {
      incidents: {
        [rawId]: normalizedIncident,
        ...state.incidents
      },
      activeIncidents: updatedArray
    };
  }),

  setIncidents: (data) => set(() => {
    if (Array.isArray(data)) {
      const incMap: Record<string, Incident> = {};
      data.forEach((inc) => {
        incMap[String(inc.id)] = inc;
      });
      return { incidents: incMap, activeIncidents: data };
    }
    return {
      incidents: data,
      activeIncidents: Object.values(data)
    };
  }),

  reportIncident: async (vehicle_id, description) => {
    try {
      const response = await apiClient.post('/api/incidents/report', { 
        vehicle_id, 
        description 
      });
      
      const newInc = response.data;
      const id = String(newInc?.id || `inc_${Date.now()}`);
      const incidentToAdd: Incident = {
        id,
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
        incidents: { [id]: incidentToAdd, ...state.incidents },
        activeIncidents: [incidentToAdd, ...state.activeIncidents]
      }));
      
      return true;
    } catch (error) {
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
      return true;
    } catch (error) {
      return false; 
    }
  }
}));
