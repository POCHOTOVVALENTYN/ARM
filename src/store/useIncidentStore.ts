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
    incidents: {},

    setIncidents: (data) => set({ incidents: data }),

    reportIncident: async (vehicle_id, description) => {
        try {
            await fetch('http://localhost:8000/api/v1/incidents/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicle_id, description })
            });
            // Не оновлюємо стан локально одразу.
            // Чекаємо на підтвердження та дані від WebSocket (Single Source of Truth).
        } catch (error) {
            console.error("Помилка відправки інциденту:", error);
        }
    }
}));
