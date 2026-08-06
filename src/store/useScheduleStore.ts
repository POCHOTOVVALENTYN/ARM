export type ThemeMode = 'light' | 'dark' | 'system';
export enum UserRole { ADMIN = 'ADMIN', DISPATCHER = 'DISPATCHER', DRIVER = 'DRIVER', OBSERVER = 'OBSERVER' }
// src/store/useScheduleStore.ts
import { create } from 'zustand';

// Інтерфейс для даних телеметрії від Wialon
export interface TelemetryData {
    [vehicle_id: string]: {
        lat: number;
        lon: number;
        speed: number;
        status: string;
        timestamp: number;
    }
}

// Загальний стан для управління розкладом та даними в реальному часі
interface ScheduleState {
    loadGtfsData?: any;
    isGtfsActive?: any;
    liveBlocks?: any;
    undoLastAction?: any;
    assignDriverToDuty?: any;
    commitDraft?: any;
    loadDefaultMockData?: any;
    applySlackToNode?: any;
    setSelectedDate?: any;
    historyStack?: any;
    assignDriverToBlockShift?: any;
    selectedDate?: any;
    revertToHistoryIndex?: any;
    conflicts?: any;
    liveDuties?: any;
    isDraftModified?: any;
    updateTripDeparture?: any;
    executeHotReserveSwap?: any;
    setPath?: any;
    theme?: any;
    reorderVehicleBlocks?: any;
    setUserRole?: any;
    deleteVehicleBlock?: any;
    redoAction?: any;
    draftBlocks?: any;
    updateVehicleBlockInfo?: any;
    setTheme?: any;
    currentPath?: any;
    user?: any;
    redoStack?: any;
    userRole?: any;
    draftDuties?: any;
    deploymentPlans?: any;
    updateDeploymentPlan?: any;
    generateMultipleBlocks?: any;
    clearVehicleBlocks?: any;
    discardDraft?: any;
    // Основний (і єдиний) графік. Оновлюється через WebSocket після транзакцій.
    liveSchedule: any | null; 
    
    // Дані телеметрії для відображення на мапі
    telemetry: TelemetryData;
    
    // Індикатор завантаження під час очікування відповіді від бекенду
    isProcessingTransaction: boolean;

    validationWarnings?: string[];

    // Actions
    setLiveSchedule: (schedule: any) => void;
    updateTelemetry: (data: TelemetryData) => void;
    setIsProcessingTransaction: (status: boolean) => void;
    setValidationWarnings?: (warnings: string[]) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
    liveSchedule: null,
    telemetry: {},
    isProcessingTransaction: false,
    validationWarnings: [],

    setValidationWarnings: (warnings) => set({ validationWarnings: warnings }),

    // Встановлює новий розклад. Викликається переважно через WebSocket при події STATE_UPDATE
    setLiveSchedule: (schedule) => set({ liveSchedule: schedule }),

    // Оновлює позиції вагонів. Викликається через WebSocket при події TELEMETRY_UPDATE
    updateTelemetry: (data) => set({ telemetry: data }),

    // Використовується для блокування UI під час запитів до бекенду
    setIsProcessingTransaction: (status) => set({ isProcessingTransaction: status })
}));

export default useScheduleStore;
