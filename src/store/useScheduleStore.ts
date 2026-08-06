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
    // Основний (і єдиний) графік. Оновлюється через WebSocket після транзакцій.
    liveSchedule: any | null; 
    
    // Дані телеметрії для відображення на мапі
    telemetry: TelemetryData;
    
    // Індикатор завантаження під час очікування відповіді від бекенду
    isProcessingTransaction: boolean;

    // Actions
    setLiveSchedule: (schedule: any) => void;
    updateTelemetry: (data: TelemetryData) => void;
    setIsProcessingTransaction: (status: boolean) => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
    liveSchedule: null,
    telemetry: {},
    isProcessingTransaction: false,

    // Встановлює новий розклад. Викликається переважно через WebSocket при події STATE_UPDATE
    setLiveSchedule: (schedule) => set({ liveSchedule: schedule }),

    // Оновлює позиції вагонів. Викликається через WebSocket при події TELEMETRY_UPDATE
    updateTelemetry: (data) => set({ telemetry: data }),

    // Використовується для блокування UI під час запитів до бекенду
    setIsProcessingTransaction: (status) => set({ isProcessingTransaction: status })
}));

export default useScheduleStore;
