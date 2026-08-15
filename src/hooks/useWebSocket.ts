// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { useScheduleStore } from '../store/useScheduleStore';
import { useIncidentStore } from '../store/useIncidentStore';
import { useDriverStore } from '../store/useDriverStore';
import { useTelemetryStore, VehicleTelemetry } from '../store/useTelemetryStore';
import { useAuthStore } from '../store/useAuthStore';

export const useWebSocket = (baseUrl: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const isInitialized = useScheduleStore((state) => state.isInitialized);
  const token = useAuthStore((state) => state.token);
  const { updateVehicles, setConnectionStatus: setTelemetryConnected } = useTelemetryStore();
  
  const updateTelemetry = useScheduleStore(state => (state as any).updateTelemetry);
  const setLiveSchedule = useScheduleStore(state => (state as any).setLiveSchedule);
  const setValidationWarnings = useScheduleStore(state => (state as any).setValidationWarnings);

  const reconnectAttempts = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      // Побудова URL з токеном авторизації
      const wsUrl = token ? `${baseUrl}?token=${token}` : baseUrl;
      
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('⚡ [WebSocket] З\'єднання встановлено');
          useDriverStore.getState().setConnectionStatus('CONNECTED');
          setTelemetryConnected(true);
          reconnectAttempts.current = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'TELEMETRY_UPDATE':
              case 'telemetry_update': {
                const payload = data.payload || data.data;
                if (Array.isArray(payload)) {
                  // Високошвидкісне оновлення O(1) у стор телеметрії
                  updateVehicles(payload as VehicleTelemetry[]);
                } else if (payload && payload.vehicle_id) {
                  updateVehicles([payload as VehicleTelemetry]);
                }
                if (updateTelemetry) {
                  updateTelemetry(payload);
                }
                break;
              }

              case 'STATE_UPDATE':
                if (setLiveSchedule) setLiveSchedule(data.payload);
                break;

              case 'INCIDENT_UPDATE':
                useIncidentStore.getState().setIncidents(data.payload);
                break;

              case 'VALIDATION_WARNING':
                if (setValidationWarnings) {
                  setValidationWarnings(data.payload);
                  data.payload.forEach((warning: string) => console.warn("⚠️ [УВАГА]:", warning));
                }
                break;

              case 'GEOFENCE_EVENT': {
                const { vehicle_id, event: geoEvent } = data.payload || {};
                if (geoEvent === 'DISPATCHED') {
                  console.log(`🚀 [ГЕОЗОНА] Вагон ${vehicle_id} ВИЇХАВ з депо на лінію!`);
                } else if (geoEvent === 'RETURNED') {
                  console.log(`🏠 [ГЕОЗОНА] Вагон ${vehicle_id} ПОВЕРНУВСЯ у депо!`);
                }
                break;
              }

              case 'WAYBILL_UPDATE': {
                const updatedVehicleId = data.payload?.vehicle_id;
                const currentBlock = useDriverStore.getState().currentBlock;
                if (updatedVehicleId && currentBlock && currentBlock.block_id.includes(updatedVehicleId)) {
                  useDriverStore.getState().fetchBlock(updatedVehicleId);
                }
                break;
              }

              default:
                // Додаткові типи подій
                break;
            }
          } catch (error) {
            console.error('Помилка парсингу WebSocket повідомлення:', error);
          }
        };

        ws.onclose = () => {
          useDriverStore.getState().setConnectionStatus('OFFLINE');
          setTelemetryConnected(false);

          // Exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 15000);
          console.log(`WebSocket Disconnected. Reconnecting in ${backoffTime / 1000}s...`);

          reconnectAttempts.current += 1;
          reconnectTimeout = setTimeout(connect, backoffTime);
        };

        ws.onerror = (err) => {
          console.warn('WebSocket connection notice:', err);
        };
      } catch (err) {
        console.error('Не вдалося створити WebSocket:', err);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [baseUrl, isInitialized, token, updateVehicles, setTelemetryConnected, updateTelemetry, setLiveSchedule, setValidationWarnings]);

  return wsRef.current;
};
