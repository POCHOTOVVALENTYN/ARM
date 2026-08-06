import { create } from 'zustand';

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
      // Assuming API endpoint is running on localhost:8000
      const response = await fetch(`http://localhost:8000/api/v1/blocks/${vehicleId}/today`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }
      const data: BlockData = await response.json();
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
