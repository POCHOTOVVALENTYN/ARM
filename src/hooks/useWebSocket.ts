// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { useScheduleStore } from '../store/useScheduleStore';

const WS_URL = 'ws://localhost:8000/ws';

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  
  // Додайте дію updateTelemetry у ваш useScheduleStore, якщо її ще немає
  const updateTelemetry = useScheduleStore(state => (state as any).updateTelemetry);
  const setLiveSchedule = useScheduleStore(state => (state as any).setLiveSchedule);

  useEffect(() => {
    // Ініціалізація підключення
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Обробка каналів повідомлень
        switch (data.type) {
          case 'TELEMETRY_UPDATE':
            // Оновлюємо координати вагонів у глобальному сторі
            if (updateTelemetry) {
                updateTelemetry(data.payload);
            }
            break;
          case 'STATE_UPDATE':
            // Оновлюємо розклад після транзакції диспетчера
            if (setLiveSchedule) {
                 setLiveSchedule(data.payload);
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
      console.log('WebSocket Disconnected. Reconnecting in 5s...');
      // Проста логіка перепідключення
      setTimeout(() => {
          // Тут можна викликати функцію реініціалізації, якщо потрібно
      }, 5000);
    };

    // Очищення при знищенні компонента
    return () => {
      ws.close();
    };
  }, [updateTelemetry, setLiveSchedule]);

  return wsRef.current;
};
