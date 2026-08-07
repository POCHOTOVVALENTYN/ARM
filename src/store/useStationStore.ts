import { create } from 'zustand';
import { Station } from '../types';

export const STATIONS_DATA: Station[] = [
  { id: 'st_starosinna', name: 'Старосінна площа', code: 'СТП', isTerminal: true, lat: 46.4682, lng: 30.7411 },
  { id: 'st_vokzal', name: 'Залізничний вокзал', code: 'ЗВК', isTerminal: true, lat: 46.4671, lng: 30.7405 },
  { id: 'st_vodoprovidna', name: 'вул. Водопровідна', code: 'ВДП', isTerminal: false, lat: 46.4610, lng: 30.7330 },
  { id: 'st_lustdorf_1st', name: '1-ша ст. Люстдорфської дороги', code: 'ЛС1', isTerminal: false, lat: 46.4520, lng: 30.7300 },
  { id: 'st_lustdorf_3rd', name: '3-тя ст. Люстдорфської дороги', code: 'ЛС3', isTerminal: false, lat: 46.4380, lng: 30.7280 },
  { id: 'st_lustdorf_5th', name: '5-та ст. Люстдорфської дороги', code: 'ЛС5', isTerminal: false, lat: 46.4210, lng: 30.7310 },
  { id: 'st_lustdorf_11th', name: '11-та ст. Люстдорфської дороги', code: 'Л11', isTerminal: true, lat: 46.3812, lng: 30.7489 },
  { id: 'st_paustovskoho', name: 'вул. Паустовського', code: 'ПСТ', isTerminal: true, lat: 46.5821, lng: 30.7912 },
  { id: 'st_peresyp', name: 'Пересипський міст', code: 'ПРМ', isTerminal: false, lat: 46.4952, lng: 30.7322 },
  { id: 'st_tiraspol', name: 'Тираспольська площа', code: 'ТРП', isTerminal: true, lat: 46.4828, lng: 30.7315 },
  { id: 'st_zastava_2', name: 'Застава-2', code: 'ЗС2', isTerminal: false, lat: 46.4712, lng: 30.7011 },
];

interface StationState {
  stations: Station[];
  setStations: (stations: Station[]) => void;
  getStationById: (id: string) => Station | undefined;
}

export const useStationStore = create<StationState>((set, get) => ({
  stations: STATIONS_DATA,
  setStations: (stations) => set({ stations }),
  getStationById: (id) => get().stations.find((s) => s.id === id),
}));
