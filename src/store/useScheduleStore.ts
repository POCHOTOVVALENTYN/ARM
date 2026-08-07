export type ThemeMode = 'light' | 'dark' | 'system';
export enum UserRole { ADMIN = 'ADMIN', DISPATCHER = 'DISPATCHER', DRIVER = 'DRIVER', OBSERVER = 'OBSERVER' }

import { create } from 'zustand';

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
  liveBlocks?: any;
  undoLastAction?: any;
  assignDriverToDuty?: any;
  commitDraft?: any;
  applySlackToNode?: any;
  setSelectedDate?: any;
  historyStack?: any;
  assignDriverToBlockShift?: any;
  selectedDate?: any;
  revertToHistoryIndex?: any;
  conflicts?: any;
  liveDuties?: any;
  isDraftModified?: any;
  executeHotReserveSwap?: any;
  reorderVehicleBlocks?: any;
  deleteVehicleBlock?: any;
  redoAction?: any;
  draftBlocks?: any;
  updateVehicleBlockInfo?: any;
  redoStack?: any;
  draftDuties?: any;
  deploymentPlans?: any;
  updateDeploymentPlan?: any;
  generateMultipleBlocks?: any;
  clearVehicleBlocks?: any;
  discardDraft?: any;

  // Action Handlers
  setLiveSchedule: (schedule: any) => void;
  updateTelemetry: (data: TelemetryData) => void;
  setIsProcessingTransaction: (status: boolean) => void;
  setValidationWarnings: (warnings: string[]) => void;
  setActiveDetour: (id: string | undefined) => void;
  setPath: (path: string) => void;
  setTheme: (theme: string) => void;
  setUserRole: (role: string) => void;
  
  loadDefaultMockData: () => Promise<void>;
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

  loadDefaultMockData: async () => {
    set({ isProcessingTransaction: true });
    try {
      const response = await fetch('http://localhost:8000/api/v1/solver/schedule');
      if (response.ok) {
        const data = await response.json();
        set({ liveSchedule: { current_blocks: data } });
      }
    } catch (error) {
      console.error("Error loading mock data:", error);
    } finally {
      set({ isProcessingTransaction: false });
    }
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
