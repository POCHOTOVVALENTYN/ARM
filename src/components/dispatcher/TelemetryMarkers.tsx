import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTelemetryStore } from '../../store/useTelemetryStore';

interface TelemetryMarkersProps {
  activeRouteId?: string | null;
}

export const TelemetryMarkers: React.FC<TelemetryMarkersProps> = ({ activeRouteId }) => {
  const map = useMap(); // Отримуємо прямий доступ до нативного екземпляра Leaflet
  
  // Зберігаємо посилання на існуючі маркери, щоб переміщувати їх без перестворення DOM
  const markersRef = useRef<{ [vehicleId: string]: L.Marker }>({});

  useEffect(() => {
    // Підписуємося на високошвидкісний Zustand стор поза життєвим циклом рендеру React
    const unsubscribe = useTelemetryStore.subscribe((state) => {
      // Перевірка на 'ALL', 'all' або порожній рядок (показуємо весь парк)
      const vehicles = Object.values(state.vehicles).filter((v) => {
        if (!activeRouteId || activeRouteId.toUpperCase() === 'ALL' || activeRouteId === '') return true;
        return v.route_id === activeRouteId;
      });

      const currentVehicleIds = new Set(vehicles.map((v) => v.vehicle_id));

      // 1. Видаляємо маркери транспортних засобів, які вийшли з мережі
      Object.keys(markersRef.current).forEach((id) => {
        if (!currentVehicleIds.has(id)) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });

      // 2. Оновлюємо або створюємо маркери на мапі
      vehicles.forEach((vehicle) => {
        const latLng: [number, number] = [vehicle.lat, vehicle.lng];
        
        // Визначаємо колір за величиною відхилення від розкладу або статусу DETOUR
        let colorClass = 'bg-emerald-500 ring-emerald-300'; // У графіку (±2 хв)
        let textColorClass = 'text-emerald-600';
        let devText = vehicle.deviation_min > 0 ? `+${vehicle.deviation_min}хв` : `${vehicle.deviation_min}хв`;
        
        if (vehicle.status === 'DETOUR') {
          colorClass = 'bg-amber-500 ring-amber-300 animate-pulse';
          textColorClass = 'text-amber-700';
          devText = "ОБ'ЇЗД";
        } else if (vehicle.deviation_min > 2.0) {
          colorClass = 'bg-rose-500 ring-rose-300'; // Запізнення
          textColorClass = 'text-rose-600';
        } else if (vehicle.deviation_min < -2.0) {
          colorClass = 'bg-blue-500 ring-blue-300'; // Нагін
          textColorClass = 'text-blue-600';
        }

        const devHtml = (vehicle.deviation_min !== 0 || vehicle.status === 'DETOUR')
          ? `<div class="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono font-extrabold ${textColorClass} bg-white/95 px-1 rounded shadow-sm border border-slate-200 whitespace-nowrap">${devText}</div>`
          : '';

        // HTML розмітка кастомного маркера
        const html = `
          <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-lg ${colorClass} ring-2">
            <div class="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 text-white text-[10px] rounded-md whitespace-nowrap font-black shadow-md border border-slate-700">
              №${vehicle.vehicle_id}
            </div>
            ${devHtml}
          </div>
        `;

        const icon = L.divIcon({
          html: html,
          className: 'custom-vehicle-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        if (markersRef.current[vehicle.vehicle_id]) {
          // Якщо маркер вже на карті — плавно переміщуємо та оновлюємо іконку
          markersRef.current[vehicle.vehicle_id].setLatLng(latLng);
          markersRef.current[vehicle.vehicle_id].setIcon(icon);
        } else {
          // Якщо це новий вагон — додаємо шар
          const marker = L.marker(latLng, { icon }).addTo(map);
          markersRef.current[vehicle.vehicle_id] = marker;
        }
      });
    });

    return () => {
      unsubscribe();
      // Очищення маркерів при розмонтуванні
      Object.values(markersRef.current).forEach((marker) => {
        if (marker) map.removeLayer(marker as L.Layer);
      });
      markersRef.current = {};
    };
  }, [activeRouteId, map]);

  return null;
};

export default TelemetryMarkers;
