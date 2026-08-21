export type ThemeMode = 'light' | 'dark' | 'system';
export enum UserRole { ADMIN = 'ADMIN', DISPATCHER = 'DISPATCHER', DRIVER = 'DRIVER', OBSERVER = 'OBSERVER' }

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import apiClient from '../utils/apiClient';
import { VehicleBlock, TransportType, DriverDuty, Trip, Route } from '../types';
import { useRouteStore } from './useRouteStore';
import { useStationStore } from './useStationStore';

export interface TelemetryData {
  [vehicle_id: string]: {
    lat: number;
    lon: number;
    speed: number;
    status: string;
    timestamp: number;
  };
}

export const ODESSA_DEFAULT_ROUTES: Route[] = [
  {
    id: "18",
    number: "18",
    name: "Куликове поле — 16-та ст. Великого Фонтану",
    type: "tram",
    status: "active",
    length_km: 11.8,
    default_speed_kmh: 15.0,
    color: "#DC2626",
    description: "Основна магістраль Великого Фонтану (єдине проміжне кільце — 11 ст. Фонтану)",
    segments: []
  },
  {
    id: "7",
    number: "7",
    name: "вул. Паустовського — 11-та ст. Люстдорфської дороги",
    type: "tram",
    status: "active",
    length_km: 33.2,
    default_speed_kmh: 16.5,
    color: "#2563EB",
    description: "Магістральний маршрут «Північ-Південь» через Пересипський міст та Старосінну площу",
    segments: []
  },
  {
    id: "17",
    number: "17",
    name: "Куликове поле — 11-та ст. Великого Фонтану",
    type: "tram",
    status: "active",
    length_km: 8.8,
    default_speed_kmh: 15.2,
    color: "#F59E0B",
    description: "Скорочений маршрут лінії Фонтану до кільця 11 ст. Великого Фонтану",
    segments: []
  },
  {
    id: "5",
    number: "5",
    name: "Аркадія — Центральний Автовокзал",
    type: "tram",
    status: "active",
    length_km: 14.2,
    default_speed_kmh: 14.0,
    color: "#16A34A",
    description: "Зв'язок Аркадії, Французького бульвару, Привозу та Автовокзалу (розворот на кільці «Парк Шевченка»)",
    segments: []
  },
  {
    id: "28",
    number: "28",
    name: "Парк Шевченка — вул. Пастера",
    type: "tram",
    status: "active",
    length_km: 8.4,
    default_speed_kmh: 13.5,
    color: "#9333EA",
    description: "Кільцевий центральний маршрут через вул. Леонтовича та Тираспольську площу",
    segments: []
  },
  {
    id: "8",
    number: "8",
    name: "Залізничний вокзал — вул. Інглезі",
    type: "trolleybus",
    status: "active",
    length_km: 9.6,
    default_speed_kmh: 16.0,
    color: "#EA580C",
    description: "Тролейбусна лінія через вул. Космонавтів та Адміральський проспект",
    segments: []
  },
  {
    id: "9",
    number: "9",
    name: "вул. Інглезі — вул. Рішельєвська / Грецька",
    type: "trolleybus",
    status: "active",
    length_km: 12.0,
    default_speed_kmh: 15.5,
    color: "#0891B2",
    description: "Тролейбусне сполучення Черемушок з центром міста",
    segments: []
  },
  {
    id: "Tr7",
    number: "7",
    name: "вул. Архітекторська — вул. Новосельського",
    type: "trolleybus",
    status: "active",
    length_km: 15.4,
    default_speed_kmh: 15.0,
    color: "#4F46E5",
    description: "Магістральний тролейбус Київського району (Таїрова) до Центру",
    segments: []
  },
  {
    id: "10",
    number: "10",
    name: "вул. Інглезі — Пересипський міст",
    type: "trolleybus",
    status: "active",
    length_km: 13.8,
    default_speed_kmh: 15.2,
    color: "#D97706",
    description: "Швидкісний тролейбусний діагональний маршрут Черемушки — Пересип",
    segments: []
  }
];

interface ScheduleState {
  generatedTrips: Trip[];
  currentTime: number;
  currentScheduleId: number | null;
  currentScheduleStatus: any | null;
  setGeneratedTrips: (trips: Trip[]) => void;
  setCurrentScheduleInfo: (id: number, status: any) => void;
  setDraftSchedule: (schedulePayload: any) => void;
  setCurrentTime: (time: number) => void;
  clearGeneratedSchedule: () => void;
  
  liveSchedule: any | null;
  telemetry: TelemetryData;
  isProcessingTransaction: boolean;
  validationWarnings: string[];
  activeDetourId?: string;
  currentPath: string;
  theme: string;
  user: { name: string; role?: UserRole; badge?: string };
  userRole: string;
  
  loadGtfsData?: any;
  isGtfsActive?: any;
  undoLastAction?: any;
  assignDriverToDuty?: any;
  applySlackToNode?: any;
  historyStack?: any;
  assignDriverToBlockShift?: any;
  revertToHistoryIndex?: any;
  conflicts?: any;
  executeHotReserveSwap?: any;
  redoAction?: any;
  redoStack?: any;
  deploymentPlans?: any;
  updateDeploymentPlan?: any;

  liveBlocks: VehicleBlock[];
  liveDuties: DriverDuty[];
  draftDuties: DriverDuty[];
  isDraftModified: boolean;
  commitDraft: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  draftBlocks: VehicleBlock[];
  generateMultipleBlocks: (routeId: string, transportType: TransportType, count: number, date?: string) => void;
  updateVehicleBlockInfo: (blockId: string, info: Partial<VehicleBlock>) => void;
  deleteVehicleBlock: (blockId: string) => void;
  clearVehicleBlocks: (blockIds?: string[]) => void;
  reorderVehicleBlocks: (activeId: string, overId: string) => void;
  discardDraft: () => void;

  setLiveSchedule: (schedule: any) => void;
  updateTelemetry: (data: any) => void;
  setIsProcessingTransaction: (status: boolean) => void;
  setValidationWarnings: (warnings: string[]) => void;
  setActiveDetour: (id: string | undefined) => void;
  setPath: (path: string) => void;
  setTheme: (theme: string) => void;
  setUserRole: (role: string) => void;
  
  setInitialSchedule: (blocks: VehicleBlock[], duties: DriverDuty[]) => void;
  updateTripDeparture: (blockId: string, tripId: string, startTime: number, delayMinutes: number) => Promise<void>;

  routes: any[];
  stops: any[];
  isInitialized: boolean;
  fetchInitialData: () => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>()(
  immer((set, get) => ({
    generatedTrips: [],
    currentTime: 360,
    currentScheduleId: null,
    currentScheduleStatus: null,
    isDraftModified: false,
    setGeneratedTrips: (trips) => set((state) => { state.generatedTrips = trips; }),
    setCurrentScheduleInfo: (id, status) => set((state) => { 
      state.currentScheduleId = id; 
      state.currentScheduleStatus = status; 
    }),
    setDraftSchedule: (schedulePayload) => {
      const allTrips: Trip[] = [];
      
      if (schedulePayload?.duties) {
        schedulePayload.duties.forEach((duty: any) => {
          if (duty.shifts) {
            duty.shifts.forEach((shift: any) => {
              if (shift.trips) {
                shift.trips.forEach((trip: any) => {
                  if (trip.stop_times && trip.stop_times.length > 0) {
                    allTrips.push({
                      ...trip,
                      id: `T${trip.id || trip.trip_sequence}`,
                      blockId: `B-${duty.id}`,
                      duty_id: duty.duty_number,
                      direction: trip.direction === 'FORWARD' ? 1 : 2,
                      departureTime: trip.stop_times[0].arrival_time?.substring(0, 5) || trip.stop_times[0].arrival_time,
                      arrivalTime: trip.stop_times[trip.stop_times.length - 1].arrival_time?.substring(0, 5) || trip.stop_times[trip.stop_times.length - 1].arrival_time,
                      startStationId: trip.stop_times[0].stop_id,
                      endStationId: trip.stop_times[trip.stop_times.length - 1].stop_id,
                      status: 'normal'
                    });
                  }
                });
              }
            });
          }
        });
      }

      set((state) => { 
        state.currentScheduleId = schedulePayload.id;
        state.currentScheduleStatus = schedulePayload.status;
        state.generatedTrips = allTrips; 
      });
    },
    setCurrentTime: (time) => set((state) => { state.currentTime = time; }),
    clearGeneratedSchedule: () => set((state) => { 
      state.generatedTrips = []; 
      state.currentTime = 360; 
      state.currentScheduleId = null;
      state.currentScheduleStatus = null;
    }),

    liveSchedule: null,
    telemetry: {},
    isProcessingTransaction: false,
    validationWarnings: [],
    activeDetourId: undefined,
    currentPath: '/',
    theme: (typeof window !== 'undefined' ? localStorage.getItem('omet_theme') : null) || 'omet-clean',
    user: { name: 'Головний Диспетчер', role: UserRole.ADMIN, badge: '12345' },
    userRole: 'DISPATCHER',

    routes: ODESSA_DEFAULT_ROUTES,
    stops: [],
    isInitialized: false,

    fetchInitialData: async () => {
      if (get().isInitialized) return;
      set((draft) => { draft.isInitialized = true; });
      try {
        const response = await apiClient.get('/schedule/init');
        const rList = response.data.routes && response.data.routes.length > 0 ? response.data.routes : ODESSA_DEFAULT_ROUTES;
        const sList = response.data.stops || response.data.stations || [];

        // Синхронізуємо useRouteStore з завантаженими маршрутами!
        useRouteStore.getState().setInitialRoutes(rList);

        // Синхронізуємо useStationStore з реальними 638 GTFS зупинками Одеси!
        if (sList && sList.length > 0) {
          const formattedStations = sList.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            code: s.name ? s.name.substring(0, 3).toUpperCase() : `ЗП${s.id}`,
            isTerminal: Boolean(s.is_dispatch_station || s.type === 'TERMINAL'),
            lat: Number(s.lat) || 46.468,
            lng: Number(s.lng || s.lon) || 30.741,
          }));
          useStationStore.getState().setStations(formattedStations);
        }

        set((draft) => {
          draft.routes = rList;
          draft.stops = sList;
          draft.liveBlocks = response.data.blocks || [];
          draft.liveDuties = response.data.driver_duties || [];
          draft.liveSchedule = { current_blocks: response.data.blocks || [] };
        });
      } catch (error) {
        console.error('Критична помилка ініціалізації розкладу', error);
        useRouteStore.getState().setInitialRoutes(ODESSA_DEFAULT_ROUTES);
        set((draft) => { 
          draft.routes = ODESSA_DEFAULT_ROUTES;
        });
      }
    },

    draftBlocks: [],
    selectedDate: new Date().toISOString().split('T')[0],
    setSelectedDate: (date: string) => set((state) => { state.selectedDate = date; }),
    generateMultipleBlocks: (routeId: string, transportType: TransportType, count: number, date?: string) => {
      set((state) => {
        const newBlocks = Array.from({ length: count }).map((_, i) => ({
          id: `B_${routeId}_${i + 1}`,
          vehicleNumber: '',
          type: transportType || 'tram',
          depotId: transportType === 'trolleybus' ? 'depot_trolley_1' : 'depot_tram_1',
          routeId,
          date: date || state.selectedDate,
          depotExitTime: '05:30',
          depotReturnTime: '23:00',
          trips: []
        }));
        state.draftBlocks.push(...newBlocks);
        state.isDraftModified = true;
      });
    },
    updateVehicleBlockInfo: (blockId, info) => set((state) => {
      const blockIndex = state.draftBlocks.findIndex((b: VehicleBlock) => b.id === blockId);
      if (blockIndex !== -1) {
        state.draftBlocks[blockIndex] = { ...state.draftBlocks[blockIndex], ...info };
        state.isDraftModified = true;
      }
    }),
    deleteVehicleBlock: (blockId) => set((state) => {
      state.draftBlocks = state.draftBlocks.filter((b: VehicleBlock) => b.id !== blockId);
      state.isDraftModified = true;
    }),
    clearVehicleBlocks: (blockIds) => set((state) => {
      state.draftBlocks = blockIds ? state.draftBlocks.filter((b: VehicleBlock) => !blockIds.includes(b.id)) : [];
      state.isDraftModified = true;
    }),
    reorderVehicleBlocks: (activeId, overId) => set((state) => {
      const oldIndex = state.draftBlocks.findIndex((b: VehicleBlock) => b.id === activeId);
      const newIndex = state.draftBlocks.findIndex((b: VehicleBlock) => b.id === overId);
      if (oldIndex === -1 || newIndex === -1) return;

      const [moved] = state.draftBlocks.splice(oldIndex, 1);
      state.draftBlocks.splice(newIndex, 0, moved);
      state.isDraftModified = true;
    }),
    discardDraft: () => set((state) => {
      state.draftBlocks = [];
      state.draftDuties = [];
      state.isDraftModified = false;
    }),
    commitDraft: () => set((state) => {
      state.liveBlocks = [...state.draftBlocks];
      state.liveDuties = [...state.draftDuties];
      state.liveSchedule = { current_blocks: [...state.draftBlocks] };
      state.isDraftModified = false;
      state.historyStack.push({ timestamp: Date.now(), label: 'Затвердження нарядів' });
    }),
    draftDuties: [],
    liveBlocks: [],
    liveDuties: [],
    conflicts: [],
    deploymentPlans: [],
    updateDeploymentPlan: (plan: any) => set((state) => {
        state.deploymentPlans = [...state.deploymentPlans.filter((p: any) => p.id !== plan.id), plan];
    }),
    applySlackToNode: () => {},
    
    redoStack: [],
    historyStack: [],

    setLiveSchedule: (schedule) => {
      set((state) => {
        if (JSON.stringify(state.liveSchedule) !== JSON.stringify(schedule)) {
          state.liveSchedule = schedule;
        }
      });
    },

    updateTelemetry: (incomingData: any) => set((draft) => {
      if (Object.keys(incomingData).length > 0 && !incomingData.vehicle_id) {
        Object.keys(incomingData).forEach(key => {
          draft.telemetry[key] = incomingData[key];
        });
      } else if (incomingData.vehicle_id) {
        draft.telemetry[incomingData.vehicle_id] = incomingData;
      }
    }),
    setIsProcessingTransaction: (status) => set((state) => { state.isProcessingTransaction = status; }),
    setValidationWarnings: (warnings) => set((state) => { state.validationWarnings = warnings; }),
    setActiveDetour: (id) => set((state) => { state.activeDetourId = id; }),
    setPath: (path) => set((state) => { state.currentPath = path; }),
    setTheme: (theme) => {
      try {
        localStorage.setItem('omet_theme', theme);
      } catch (e) {}
      set((state) => { state.theme = theme; });
    },
    setUserRole: (role) => set((state) => { state.userRole = role; }),

    setInitialSchedule: (blocks, duties) => {
      set((state) => {
        state.draftBlocks = blocks;
        state.draftDuties = duties;
        state.liveSchedule = { current_blocks: blocks };
      });
    },

    isGtfsActive: true,
    loadGtfsData: async () => {
      set((state) => { state.isProcessingTransaction = true; });
      try {
        await apiClient.post('/api/v1/settings/gtfs/sync-local');
        set((state) => { state.isInitialized = false; });
        await get().fetchInitialData();
      } catch (error) {
        console.error("GTFS Sync error:", error);
      } finally {
        set((state) => { state.isProcessingTransaction = false; });
      }
    },

    updateTripDeparture: async (blockId: string, tripId: string, startTime: number, delayMinutes: number) => {
      set((state) => { state.isProcessingTransaction = true; });
      try {
        const response = await apiClient.post('/api/v1/solver/apply-delay', {
          block_id: blockId,
          start_time: startTime,
          delay_minutes: delayMinutes,
          schedule_data: get().liveSchedule?.current_blocks || []
        });
        
        const result = response.data;
        if (result.updated_schedule) {
          set((state) => { 
            state.liveSchedule = { current_blocks: result.updated_schedule };
            state.validationWarnings = result.warnings || [];
          });
        }
      } catch (error) {
        console.error("Error applying delay:", error);
      } finally {
        set((state) => { state.isProcessingTransaction = false; });
      }
    }
  }))
);
