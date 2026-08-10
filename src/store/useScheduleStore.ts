export type ThemeMode = 'light' | 'dark' | 'system';
export enum UserRole { ADMIN = 'ADMIN', DISPATCHER = 'DISPATCHER', DRIVER = 'DRIVER', OBSERVER = 'OBSERVER' }

import { create } from 'zustand';
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
  updateTelemetry: (data: TelemetryData) => void;
  setIsProcessingTransaction: (status: boolean) => void;
  setValidationWarnings: (warnings: string[]) => void;
  setActiveDetour: (id: string | undefined) => void;
  setPath: (path: string) => void;
  setTheme: (theme: string) => void;
  setUserRole: (role: string) => void;
  
  setInitialSchedule: (blocks: VehicleBlock[], duties: DriverDuty[]) => void;
  updateTripDeparture: (blockId: string, tripId: string, startTime: number, delayMinutes: number) => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  liveSchedule: null,
  telemetry: {},
  isProcessingTransaction: false,
  validationWarnings: [],
  activeDetourId: undefined,
  currentPath: '/',
  theme: 'system',
  user: { name: 'Головний Диспетчер', role: UserRole.ADMIN, badge: '12345' },
  userRole: 'DISPATCHER',

  // Restored Mock Data Defaults to prevent crashes
  draftBlocks: [],
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date: string) => set({ selectedDate: date }),
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
      return {
        draftBlocks: [...state.draftBlocks, ...newBlocks],
        isDraftModified: true
      };
    });
  },
  updateVehicleBlockInfo: (blockId, info) => set((state) => ({
    draftBlocks: state.draftBlocks.map((b: VehicleBlock) => b.id === blockId ? { ...b, ...info } : b),
    isDraftModified: true
  })),
  deleteVehicleBlock: (blockId) => set((state) => ({
    draftBlocks: state.draftBlocks.filter((b: VehicleBlock) => b.id !== blockId),
    isDraftModified: true
  })),
  clearVehicleBlocks: (blockIds) => set((state) => ({
    draftBlocks: blockIds ? state.draftBlocks.filter(b => !blockIds.includes(b.id)) : [],
    isDraftModified: true
  })),
  reorderVehicleBlocks: (activeId, overId) => set((state) => {
    const oldIndex = state.draftBlocks.findIndex(b => b.id === activeId);
    const newIndex = state.draftBlocks.findIndex(b => b.id === overId);
    if (oldIndex === -1 || newIndex === -1) return state;

    const newBlocks = [...state.draftBlocks];
    const [moved] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, moved);
    return { draftBlocks: newBlocks, isDraftModified: true };
  }),
  discardDraft: () => set({ draftBlocks: [], draftDuties: [], isDraftModified: false }),
  commitDraft: () => set((state) => ({
    liveBlocks: [...state.draftBlocks],
    liveDuties: [...state.draftDuties],
    liveSchedule: { current_blocks: [...state.draftBlocks] },
    isDraftModified: false,
    historyStack: [...state.historyStack, { timestamp: Date.now(), label: 'Затвердження нарядів' }]
  })),
  draftDuties: [],
  liveBlocks: [],
  liveDuties: [],
  conflicts: [],
  deploymentPlans: [],
  updateDeploymentPlan: (plan: any) => set((state: any) => ({
      deploymentPlans: [...state.deploymentPlans.filter((p: any) => p.id !== plan.id), plan]
  })),
  applySlackToNode: () => {},
  
  // History
  redoStack: [],
  historyStack: [],
  isDraftModified: false,

  setLiveSchedule: (schedule) => {
    set((state) => {
      if (JSON.stringify(state.liveSchedule) === JSON.stringify(schedule)) {
        return state;
      }
      return { liveSchedule: schedule };
    });
  },

  updateTelemetry: (data) => set({ telemetry: data }),
  setIsProcessingTransaction: (status) => set({ isProcessingTransaction: status }),
  setValidationWarnings: (warnings) => set({ validationWarnings: warnings }),
  setActiveDetour: (id) => set({ activeDetourId: id }),
  setPath: (path) => set({ currentPath: path }),
  setTheme: (theme) => set({ theme }),
  setUserRole: (role) => set({ userRole: role }),

  setInitialSchedule: (blocks, duties) => {
    set({
      draftBlocks: blocks,
      draftDuties: duties,
      liveSchedule: { current_blocks: blocks }
    });
  },

  updateTripDeparture: async (blockId: string, tripId: string, startTime: number, delayMinutes: number) => {
    set({ isProcessingTransaction: true });
    try {
      const response = await fetch('http://localhost:8000/api/v1/solver/apply-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_id: blockId,
          start_time: startTime,
          delay_minutes: delayMinutes,
          schedule_data: get().liveSchedule?.current_blocks || []
        })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.updated_schedule) {
          set({ 
            liveSchedule: { current_blocks: result.updated_schedule },
            validationWarnings: result.warnings || []
          });
        }
      } else {
        console.error("Failed to apply delay on server");
      }
    } catch (error) {
      console.error("Error applying delay:", error);
    } finally {
      set({ isProcessingTransaction: false });
    }
  }
}));
