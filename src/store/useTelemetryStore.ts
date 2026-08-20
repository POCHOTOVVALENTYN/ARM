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
  fetchLiveTelemetry: () => Promise<void>;
  updateVehicles: (data: VehicleTelemetry[]) => void;
  updateSingleVehicle: (vehicle: VehicleTelemetry) => void;
  setConnectionStatus: (status: boolean) => void;
  clearTelemetry: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set) => ({
  vehicles: {},
  isConnected: true,
  lastSyncTime: null,

  fetchLiveTelemetry: async () => {
    try {
      const res = await fetch('/api/v1/telemetry/vehicles');
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const map: Record<string, VehicleTelemetry> = {};
          list.forEach((v) => {
            if (v && (v.vehicle_id || v.id)) {
              const vId = String(v.vehicle_id || v.id);
              map[vId] = {
                vehicle_id: vId,
                route_id: String(v.route_id || v.route_number || '7'),
                duty_number: v.duty_number || 1,
                lat: v.lat || 46.475,
                lng: v.lng || v.lon || 30.735,
                speed: v.speed || 0,
                heading: v.heading || 0,
                last_updated: Date.now(),
                deviation_min: v.deviation_min || 0,
                status: v.status || 'ON_ROUTE',
                driver_name: v.driver_name
              };
            }
          });
          set({ vehicles: map, isConnected: true, lastSyncTime: Date.now() });
        }
      }
    } catch {
      // Background silent fallback
    }
  },

  // Оновлюємо лише ті транспортні засоби, які прийшли в пакеті
  updateVehicles: (data) =>
    set((state) => {
      const newVehicles = { ...state.vehicles };
      for (let i = 0; i < data.length; i++) {
        const vehicle = data[i];
        if (vehicle && vehicle.vehicle_id) {
          newVehicles[vehicle.vehicle_id] = vehicle;
        }
      }
      return {
        vehicles: newVehicles,
        isConnected: true,
        lastSyncTime: Date.now(),
      };
    }),

  updateSingleVehicle: (vehicle) =>
    set((state) => ({
      vehicles: {
        ...state.vehicles,
        [vehicle.vehicle_id]: vehicle,
      },
      isConnected: true,
      lastSyncTime: Date.now(),
    })),

  setConnectionStatus: (status) => set({ isConnected: status }),
  clearTelemetry: () => set({ vehicles: {}, lastSyncTime: null }),
}));
