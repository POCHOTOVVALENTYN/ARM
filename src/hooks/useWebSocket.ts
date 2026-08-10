// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { useScheduleStore } from '../store/useScheduleStore';
import { useIncidentStore } from '../store/useIncidentStore';
import { useDriverStore } from '../store/useDriverStore';

export const useWebSocket = (url: string) => {
  const wsRef = useRef<WebSocket | null>(null);
  const isInitialized = useScheduleStore((state) => state.isInitialized);
  
  // Додайте дію updateTelemetry у ваш useScheduleStore, якщо її ще немає
  const updateTelemetry = useScheduleStore(state => (state as any).updateTelemetry);
  const setLiveSchedule = useScheduleStore(state => (state as any).setLiveSchedule);
  const setValidationWarnings = useScheduleStore(state => (state as any).setValidationWarnings);

  const lastTelemetryUpdate = useRef<number>(0);
  const reconnectAttempts = useRef<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      if (!isInitialized) return;
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket Connected');
        useDriverStore.getState().setConnectionStatus('CONNECTED');
        reconnectAttempts.current = 0; // Reset attempts on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'TELEMETRY_UPDATE':
              // Throttle UI updates to once per 500ms to avoid blocking main thread
              const now = Date.now();
              if (now - lastTelemetryUpdate.current > 500) {
                if (updateTelemetry) updateTelemetry(data.payload);
                lastTelemetryUpdate.current = now;
              } else {
                 // Оновлюємо стан без виклику ре-рендера (zero-diff)
                 useScheduleStore.setState({ telemetry: data.payload });
              }
              break;
            case 'STATE_UPDATE':
              if (setLiveSchedule) setLiveSchedule(data.payload);
              break;
            case 'INCIDENT_UPDATE':
              useIncidentStore.getState().setIncidents(data.payload);
              break;
            case 'VALIDATION_WARNING':
              if (setValidationWarnings) {
                  setValidationWarnings(data.payload);
                  data.payload.forEach((warning: string) => console.warn("УВАГА:", warning));
              }
              break;
            case 'GEOFENCE_EVENT':
              const { vehicle_id, event: geoEvent } = data.payload;
              if (geoEvent === 'DISPATCHED') {
                  console.log(`🚀 [ГЕОЗОНА] Вагон ${vehicle_id} ВИЇХАВ з депо на лінію!`);
              } else if (geoEvent === 'RETURNED') {
                  console.log(`🏠 [ГЕОЗОНА] Вагон ${vehicle_id} ПОВЕРНУВСЯ у депо!`);
              }
              break;
            case 'WAYBILL_UPDATE':
              const updatedVehicleId = data.payload.vehicle_id;
              const currentBlock = useDriverStore.getState().currentBlock;
              if (updatedVehicleId && currentBlock && currentBlock.block_id.includes(updatedVehicleId)) {
                  useDriverStore.getState().fetchBlock(updatedVehicleId);
              }
              break;
            default:
              console.warn('Невідомий тип WebSocket повідомлення:', data.type);
          }
        } catch (error) {
          console.error('Помилка обробки WebSocket повідомлення:', error);
        }
      };

      ws.onclose = () => {
        useDriverStore.getState().setConnectionStatus('OFFLINE');
        
        // Exponential backoff logic
        const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`WebSocket Disconnected. Reconnecting in ${backoffTime / 1000}s...`);
        
        reconnectAttempts.current += 1;
        reconnectTimeout = setTimeout(connect, backoffTime);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnect logic on unmount
        ws.close();
      }
    };
  }, [url, isInitialized, updateTelemetry, setLiveSchedule, setValidationWarnings]);

  return wsRef.current;
};
