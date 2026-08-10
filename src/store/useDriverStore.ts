import { create } from 'zustand';
import apiClient from '../utils/apiClient';

export interface TripData {
  id: string;
  route_id: string;
  start_time: number; // in minutes from midnight
  end_time: number;
  start_station_id: string;
  end_station_id: string;
}

export interface BlockData {
  block_id: string;
  vehicle_type: string;
  trips: TripData[];
}

interface DriverStoreState {
  currentBlock: BlockData | null;
  connectionStatus: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
  activeTripId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchBlock: (vehicleId: string) => Promise<void>;
  setConnectionStatus: (status: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE') => void;
  setActiveTripId: (tripId: string) => void;
}

export const useDriverStore = create<DriverStoreState>((set) => ({
  currentBlock: null,
  connectionStatus: 'OFFLINE',
  activeTripId: null,
  isLoading: false,
  error: null,
  
  fetchBlock: async (vehicleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/api/v1/blocks/${vehicleId}/today`);
      const data: BlockData = response.data;
      set({ 
        currentBlock: data, 
        isLoading: false,
        activeTripId: data.trips.length > 0 ? data.trips[0].id : null 
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setActiveTripId: (tripId) => set({ activeTripId: tripId }),
}));
