import { create } from 'zustand';

// Структура пакету телеметрії від Wialon / GPS
export interface VehicleTelemetry {
  vehicle_id: string;      // Бортовий номер (напр. '3012', '4015') або Wialon ID
  route_id: string;        // Номер маршруту ('7', '1', '28')
  duty_number?: number;    // Номер випуску/наряду
  lat: number;             // Широта GPS
  lng: number;             // Довгота GPS
  speed: number;           // Швидкість (км/год)
  heading?: number;        // Напрямок руху (0-360)
  last_updated: number;    // Unix timestamp (ms)
  deviation_min: number;   // Відхилення від графіка в хвилинах (+ спізнення, - нагін)
  status?: string;         // 'ON_ROUTE' | 'DETOUR' | 'IN_DEPOT' | 'active' | 'break' | 'depot'
  driver_name?: string;
}

interface TelemetryState {
  vehicles: Record<string, VehicleTelemetry>;
  isConnected: boolean;
  lastSyncTime: number | null;

  // Високошвидкісні екшени (O(1) Record mapping)
  updateVehicles: (data: VehicleTelemetry[]) => void;
  updateSingleVehicle: (vehicle: VehicleTelemetry) => void;
  setConnectionStatus: (status: boolean) => void;
  clearTelemetry: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  vehicles: {},
  isConnected: false,
  lastSyncTime: null,

  // Оновлюємо лише ті транспортні засоби, які прийшли в пакеті
  updateVehicles: (data) =>
    set((state) => {
      const newVehicles = { ...state.vehicles };
      for (let i = 0; i < data.length; i++) {
        const vehicle = data[i];
        newVehicles[vehicle.vehicle_id] = vehicle;
      }
      return {
        vehicles: newVehicles,
        lastSyncTime: Date.now(),
      };
    }),

  updateSingleVehicle: (vehicle) =>
    set((state) => ({
      vehicles: {
        ...state.vehicles,
        [vehicle.vehicle_id]: vehicle,
      },
      lastSyncTime: Date.now(),
    })),

  setConnectionStatus: (status) => set({ isConnected: status }),
  clearTelemetry: () => set({ vehicles: {}, lastSyncTime: null }),
}));
