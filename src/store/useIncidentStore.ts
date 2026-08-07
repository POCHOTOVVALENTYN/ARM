import { create } from 'zustand';

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
  reportIncident: (vehicle_id: string, description: string) => Promise<void>;
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
    const id = `inc_${Date.now()}`;
    const newInc: Incident = {
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
      incidents: { ...state.incidents, [id]: newInc }
    }));

    try {
      await fetch('http://localhost:8000/api/v1/incidents/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id, description })
      });
    } catch (error) {
      console.error("Помилка відправки інциденту на сервер:", error);
    }
  }
}));
