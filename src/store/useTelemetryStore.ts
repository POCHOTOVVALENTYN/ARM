import { create } from 'zustand';

export interface VehicleTelemetry {
  vehicle_id: string;      // Бортовий номер (напр. '3012', '4015') або Wialon ID
  route_id: string;        // Номер маршруту ('7', '1', '28')
  route_number?: string;   // Альтернативний номер маршруту
  duty_number?: number;    // Номер випуску/наряду
  vehicle_type?: string;   // 'TRAM' | 'TROLLEYBUS' | 'SERVICE'
  is_service?: boolean;    // Ознака службової спецтехніки
  lat: number;             // Широта GPS
  lng: number;             // Довгота GPS
  speed: number;           // Швидкість (км/год)
  heading?: number;        // Напрямок руху (0-360)
  last_updated: number;    // Unix timestamp (ms)
  deviation_min: number;   // Відхилення від графіка в хвилинах (+ спізнення, - нагін)
  status?: string;         // 'ON_ROUTE' | 'DETOUR' | 'IN_DEPOT' | 'active' | 'break' | 'depot'
  current_station?: string;
  next_station?: string;
  driver_name?: string;
  has_active_detour?: boolean;
  active_detour_loop?: string;
  source?: string;
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
                route_id: String(v.route_id || v.route_number || ''),
                route_number: String(v.route_number || v.route_id || ''),
                duty_number: v.duty_number || 1,
                vehicle_type: v.vehicle_type || (vId.startsWith('0') ? 'TROLLEYBUS' : 'TRAM'),
                is_service: Boolean(v.is_service),
                lat: v.lat || 46.475,
                lng: v.lng || v.lon || 30.735,
                speed: v.speed || 0,
                heading: v.heading || 0,
                last_updated: Date.now(),
                deviation_min: v.deviation_min || 0,
                status: v.status || 'ON_ROUTE',
                current_station: v.current_station,
                next_station: v.next_station,
                driver_name: v.driver_name,
                has_active_detour: Boolean(v.has_active_detour),
                active_detour_loop: v.active_detour_loop
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

  // Пакетне оновлення живого флоту КП «ОМЕТ» без збереження застарілих "фантомних" бортів
  updateVehicles: (data) =>
    set((state) => {
      if (!Array.isArray(data) || data.length === 0) {
        return state;
      }
      // Якщо прийшов повний пакет флоту (>= 10 ТЗ) — повністю синхронізуємо флот
      if (data.length >= 10) {
        const freshMap: Record<string, VehicleTelemetry> = {};
        for (let i = 0; i < data.length; i++) {
          const v = data[i];
          if (v && (v.vehicle_id || (v as any).id)) {
            const vId = String(v.vehicle_id || (v as any).id);
            freshMap[vId] = {
              ...v,
              vehicle_id: vId,
              route_id: String(v.route_id || v.route_number || ''),
              route_number: String(v.route_number || v.route_id || ''),
            };
          }
        }
        return {
          vehicles: freshMap,
          isConnected: true,
          lastSyncTime: Date.now(),
        };
      }

      // Якщо прийшло точкове оновлення декількох ТЗ — оновлюємо існуючі
      const newVehicles = { ...state.vehicles };
      for (let i = 0; i < data.length; i++) {
        const v = data[i];
        if (v && (v.vehicle_id || (v as any).id)) {
          const vId = String(v.vehicle_id || (v as any).id);
          newVehicles[vId] = {
            ...v,
            vehicle_id: vId,
            route_id: String(v.route_id || v.route_number || ''),
            route_number: String(v.route_number || v.route_id || ''),
          };
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
