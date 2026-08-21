import { create } from 'zustand';
import axios from 'axios';

export interface AirRaidState {
  isAirRaidActive: boolean;
  airRaidStartedAt: string | null;
  airRaidCity: string;
  message: string;
  isLoading: boolean;

  fetchAirRaidStatus: () => Promise<void>;
  toggleAirRaid: (forceState?: boolean) => Promise<void>;
  setAirRaidState: (data: { active: boolean; started_at?: string | null; city?: string; message?: string }) => void;
}

export const useAlertStore = create<AirRaidState>((set, get) => ({
  isAirRaidActive: false,
  airRaidStartedAt: null,
  airRaidCity: 'м. Одеса',
  message: 'Відбій тривоги. Обстановка спокійна.',
  isLoading: false,

  fetchAirRaidStatus: async () => {
    try {
      const res = await axios.get('/api/emergencies/air-raid');
      if (res.data) {
        set({
          isAirRaidActive: Boolean(res.data.active),
          airRaidStartedAt: res.data.started_at || null,
          airRaidCity: res.data.city || 'м. Одеса',
          message: res.data.message || ''
        });
      }
    } catch (e) {
      console.warn('Failed to fetch air raid status', e);
    }
  },

  toggleAirRaid: async (forceState?: boolean) => {
    set({ isLoading: true });
    try {
      const currentState = get().isAirRaidActive;
      const targetState = forceState !== undefined ? forceState : !currentState;
      const res = await axios.post('/api/emergencies/air-raid/toggle', {
        active: targetState,
        city: 'м. Одеса'
      });
      if (res.data) {
        set({
          isAirRaidActive: Boolean(res.data.active),
          airRaidStartedAt: res.data.started_at || null,
          airRaidCity: res.data.city || 'м. Одеса',
          message: res.data.message || ''
        });
      }
    } catch (e) {
      console.error('Failed to toggle air raid status', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setAirRaidState: (data) => {
    set({
      isAirRaidActive: Boolean(data.active),
      airRaidStartedAt: data.started_at || null,
      airRaidCity: data.city || 'м. Одеса',
      message: data.message || ''
    });
  }
}));
