import { create } from 'zustand';
import { Station } from '../types';
import { GTFS_STATIONS } from '../data/gtfsStopsData';

interface StationState {
  stations: Station[];
  setStations: (stations: Station[]) => void;
  getStationById: (id: string) => Station | undefined;
}

export const useStationStore = create<StationState>((set, get) => ({
  stations: GTFS_STATIONS,
  setStations: (stations) => set({ stations }),
  getStationById: (id) => get().stations.find((s) => s.id === id),
}));
