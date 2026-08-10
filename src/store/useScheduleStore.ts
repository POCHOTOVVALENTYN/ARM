export type ThemeMode = 'light' | 'dark' | 'system';
export enum UserRole { ADMIN = 'ADMIN', DISPATCHER = 'DISPATCHER', DRIVER = 'DRIVER', OBSERVER = 'OBSERVER' }

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import apiClient from '../utils/apiClient';
import { VehicleBlock, TransportType, DriverDuty } from '../types';

export interface TelemetryData {
  [vehicle_id: string]: {
    lat: number;
    lon: number;
    speed: number;
    status: string;
    timestamp: number;
  };
}

interface ScheduleState {
  liveSchedule: any | null;
  telemetry: TelemetryData;
  isProcessingTransaction: boolean;
  validationWarnings: string[];
  activeDetourId?: string;
  currentPath: string;
  theme: string;
  user: { name: string; role?: UserRole; badge?: string };
  userRole: string;
  
  // Restored mock fields
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

  // Action Handlers
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

  // Global Initialization
  routes: any[];
  stops: any[];
  isInitialized: boolean;
  fetchInitialData: () => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>()(
  immer((set, get) => ({
    liveSchedule: null,
    telemetry: {},
    isProcessingTransaction: false,
    validationWarnings: [],
    activeDetourId: undefined,
    currentPath: '/',
    theme: 'system',
    user: { name: 'Головний Диспетчер', role: UserRole.ADMIN, badge: '12345' },
    userRole: 'DISPATCHER',

    routes: [],
    stops: [],
    isInitialized: false,

    fetchInitialData: async () => {
      try {
        const response = await apiClient.get('/schedule/init');
        set((draft) => {
          draft.routes = response.data.routes || [];
          draft.stops = response.data.stops || [];
          // Assuming blocks and duties also come from this endpoint based on schedule_init.py
          draft.liveBlocks = response.data.blocks || [];
          draft.liveDuties = response.data.driver_duties || [];
          draft.liveSchedule = { current_blocks: response.data.blocks || [] };
          draft.isInitialized = true;
        });
      } catch (error) {
        console.error('Критична помилка ініціалізації розкладу', error);
      }
    },

    // Restored Mock Data Defaults to prevent crashes
    draftBlocks: [],
    selectedDate: new Date().toISOString().split('T')[0],
    setSelectedDate: (date: string) => set((state) => { state.selectedDate = date; }),
    generateMultipleBlocks: (routeId: string, transportType: TransportType, count: number, date?: string) => {
      set((state) => {
        const newBlocks = Array.from({ length: count }).map((_, i) => ({
          id: `B_${routeId}_${Date.now()}_${i}`,
          vehicleNumber: '',
          type: transportType,
          depotId: 'depot_1',
          routeId,
          date: date || state.selectedDate,
          depotExitTime: '05:00',
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
    
    // History
    redoStack: [],
    historyStack: [],
    isDraftModified: false,

    setLiveSchedule: (schedule) => {
      set((state) => {
        if (JSON.stringify(state.liveSchedule) !== JSON.stringify(schedule)) {
          state.liveSchedule = schedule;
        }
      });
    },

    updateTelemetry: (incomingData: any) => set((draft) => {
      // Якщо це об'єкт з багатьма vehicle_id (наприклад, початкове завантаження)
      if (Object.keys(incomingData).length > 0 && !incomingData.vehicle_id) {
        Object.keys(incomingData).forEach(key => {
          draft.telemetry[key] = incomingData[key];
        });
      } else if (incomingData.vehicle_id) {
        // Безпечна пряма мутація для конкретного ТЗ
        draft.telemetry[incomingData.vehicle_id] = incomingData;
      }
    }),
    setIsProcessingTransaction: (status) => set((state) => { state.isProcessingTransaction = status; }),
    setValidationWarnings: (warnings) => set((state) => { state.validationWarnings = warnings; }),
    setActiveDetour: (id) => set((state) => { state.activeDetourId = id; }),
    setPath: (path) => set((state) => { state.currentPath = path; }),
    setTheme: (theme) => set((state) => { state.theme = theme; }),
    setUserRole: (role) => set((state) => { state.userRole = role; }),

    setInitialSchedule: (blocks, duties) => {
      set((state) => {
        state.draftBlocks = blocks;
        state.draftDuties = duties;
        state.liveSchedule = { current_blocks: blocks };
      });
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
