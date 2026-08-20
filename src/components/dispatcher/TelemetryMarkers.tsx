import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTelemetryStore, VehicleTelemetry } from '../../store/useTelemetryStore';
import { useSettingsStore, VehicleMarkerStyle } from '../../store/useSettingsStore';

interface TelemetryMarkersProps {
  activeRouteId?: string | null;
  hideServiceVehicles?: boolean;
  hideDepotVehicles?: boolean;
  stylePreset?: VehicleMarkerStyle;
}

export const TelemetryMarkers: React.FC<TelemetryMarkersProps> = ({ 
  activeRouteId,
  hideServiceVehicles = true,
  hideDepotVehicles = false,
  stylePreset
}) => {
  const map = useMap();
  const markersRef = useRef<{ [vehicleId: string]: L.Marker }>({});
  const storeMarkerStyle = useSettingsStore((state) => state.markerStyle);
  const activeStyle = stylePreset || storeMarkerStyle || 'balanced';

  useEffect(() => {
    const updateMarkers = () => {
      const state = useTelemetryStore.getState();
      const currentZoom = map.getZoom();

      // Фільтрація транспорту
      const rawVehicles = Object.values(state.vehicles);
      const filteredVehicles = rawVehicles.filter((v: VehicleTelemetry & any) => {
        // 1. Фільтр спецтехніки (аварійні машини, ревізори тощо)
        if (hideServiceVehicles && (v.is_service || v.vehicle_type === 'SERVICE')) {
          return false;
        }

        // 2. Фільтр вагонів у депо (швидкість = 0 у межах депо)
        if (hideDepotVehicles && v.status === 'depot') {
          return false;
        }

        // 3. Фільтр за маршрутом
        if (!activeRouteId || activeRouteId.toUpperCase() === 'ALL' || activeRouteId === '') {
          return true;
        }
        return v.route_id === activeRouteId;
      });

      const currentIds = new Set(filteredVehicles.map((v) => v.vehicle_id));

      // Видаляємо маркери, які більше не активні або відфільтровані
      Object.keys(markersRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          map.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });

      // Створюємо або оновлюємо маркери
      filteredVehicles.forEach((vehicle: VehicleTelemetry & any) => {
        const latLng: [number, number] = [vehicle.lat, vehicle.lng];
        
        // Визначаємо тип транспорту (Трамвай, Тролейбус, Спецтехніка)
        const isService = vehicle.is_service || vehicle.vehicle_type === 'SERVICE';
        const isTrolley = !isService && (vehicle.vehicle_type === 'TROLLEYBUS');
        const isTram = !isService && !isTrolley;

        // Кольори та стилі за типами
        const typeBg = isService
          ? 'bg-amber-600 border-amber-800 text-white'
          : isTram
            ? 'bg-indigo-600 border-indigo-800 text-white'
            : 'bg-blue-600 border-blue-800 text-white';

        const typeIconSvg = isService
          ? `<svg class="w-3 h-3 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>`
          : isTram
            ? `<svg class="w-3 h-3 text-indigo-100" fill="currentColor" viewBox="0 0 24 24"><path d="M8 2h8a2 2 0 012 2v12a3 3 0 01-3 3h1a1 1 0 110 2H8a1 1 0 110-2h1a3 3 0 01-3-3V4a2 2 0 012-2zm0 2v4h8V4H8zm0 6v4h8v-4H8zm1.5 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 1a1 1 0 011 1v0h-2V2a1 1 0 011-1z"/></svg>`
            : `<svg class="w-3.5 h-3.5 text-blue-100" fill="currentColor" viewBox="0 0 24 24"><path d="M4 8a3 3 0 013-3h10a3 3 0 013 3v8a3 3 0 01-3 3H7a3 3 0 01-3-3V8zm3-1h10a1 1 0 011 1v4H6V8a1 1 0 011-1zm11 7H6v2a1 1 0 001 1h10a1 1 0 001-1v-2zm-10.5 1a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM7 2l3 3m7-3l-3 3"/></svg>`;

        // Кольори та стилі стрілочки за типами та сайтом (синій / блакитний)
        const arrowColor = isService
          ? 'text-amber-600 stroke-amber-600'
          : isTram
            ? 'text-indigo-600 stroke-indigo-600'
            : 'text-blue-600 stroke-blue-600';

        const circleBorder = isService
          ? 'border-amber-300'
          : isTram
            ? 'border-indigo-200'
            : 'border-blue-200';

        const circleBg = isService
          ? 'bg-amber-50/95'
          : isTram
            ? 'bg-indigo-50/95'
            : 'bg-blue-50/95';

        const typeLabel = isService ? 'Спецтехніка' : isTram ? 'Трамвай' : 'Тролейбус';

        // Статус відхилення від розкладу
        let statusRing = 'ring-2 ring-indigo-400/40';
        let statusGlowRgba = isTram ? 'rgba(79,70,229,0.5)' : isTrolley ? 'rgba(37,99,235,0.5)' : 'rgba(217,119,6,0.5)';
        let statusBadgeBg = 'bg-emerald-600 text-white';
        let statusText = 'У графіку';
        const dev = vehicle.deviation_min || 0;

        if (vehicle.status === 'DETOUR') {
          statusRing = 'ring-2 ring-amber-500 animate-pulse';
          statusGlowRgba = 'rgba(245,158,11,0.8)';
          statusBadgeBg = 'bg-amber-600 text-white';
          statusText = "ОБ'ЇЗД";
        } else if (dev > 2.0) {
          statusRing = 'ring-2 ring-rose-500';
          statusGlowRgba = 'rgba(225,29,72,0.8)';
          statusBadgeBg = 'bg-rose-600 text-white';
          statusText = `+${dev} хв`;
        } else if (dev < -2.0) {
          statusRing = 'ring-2 ring-blue-500';
          statusGlowRgba = 'rgba(14,165,233,0.8)';
          statusBadgeBg = 'bg-blue-600 text-white';
          statusText = `${dev} хв`;
        }

        // Чіткий 4-значний бортовий номер (розміщується позаду нової стрілочки)
        const full4DigitNumber = String(vehicle.display_name || vehicle.vehicle_id);
        const heading = vehicle.heading || 0;
        const speed = vehicle.speed || 0;

        // SVG точної стрілочки навігації (як на фото користувача)
        const navigationArrowSvg = `
          <svg class="w-4 h-4 ${arrowColor} transition-transform duration-300 drop-shadow-xs" 
               style="transform: rotate(${heading}deg); transform-origin: center;" 
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.5L19.5 20.5L12 16.5L4.5 20.5L12 2.5Z"/>
          </svg>
        `;

        let html = '';
        let iconSize: [number, number] = [36, 46];
        let iconAnchor: [number, number] = [18, 16];

        // -------------------------------------------------------------
        // 1. СТИЛЬ: HALO (Кільце-ореол навколо стрілочки)
        // -------------------------------------------------------------
        if (activeStyle === 'halo') {
          iconSize = [40, 50];
          iconAnchor = [20, 18];
          html = `
            <div class="relative group cursor-pointer flex flex-col items-center select-none" style="transform: translate3d(0,0,0);">
              <!-- Пульсуючий ореол навколо стрілочки вагона -->
              <div class="absolute top-0 w-8 h-8 rounded-full animate-ping opacity-30" style="background: ${statusGlowRgba};"></div>
              
              <!-- Круглий білий диск зі стрілочкою -->
              <div class="relative w-8 h-8 rounded-full bg-white border-2 ${circleBorder} flex items-center justify-center shadow-lg transition-transform hover:scale-125"
                   style="box-shadow: 0 0 12px ${statusGlowRgba};">
                ${navigationArrowSvg}
              </div>

              <!-- 4-значний номер позаду стрілочки вагона -->
              <div class="mt-0.5 px-1.5 py-0.2 bg-slate-900/90 text-white text-[9px] font-mono font-black rounded-md shadow border border-slate-700 leading-tight whitespace-nowrap">
                ${full4DigitNumber}
              </div>
            </div>
          `;
        }
        // -------------------------------------------------------------
        // 2. СТИЛЬ: DUAL-TONE (Двотоновий: коло стрілочки + синій номер)
        // -------------------------------------------------------------
        else if (activeStyle === 'dualtone') {
          iconSize = [40, 50];
          iconAnchor = [20, 18];
          html = `
            <div class="relative group cursor-pointer flex flex-col items-center select-none" style="transform: translate3d(0,0,0);">
              <!-- Круглий диск зі стрілочкою в кольорі сайту -->
              <div class="relative w-8 h-8 rounded-full ${circleBg} border-2 ${circleBorder} flex items-center justify-center shadow-md ${statusRing} transition-transform hover:scale-125">
                ${navigationArrowSvg}
              </div>

              <!-- Двотоновий бейдж номера позаду стрілочки -->
              <div class="mt-0.5 px-1.5 py-0.2 ${isTram ? 'bg-indigo-700' : isTrolley ? 'bg-blue-700' : 'bg-amber-700'} text-white text-[9px] font-mono font-black rounded shadow border border-white/40 leading-tight whitespace-nowrap">
                ${full4DigitNumber}
              </div>
            </div>
          `;
        }
        // -------------------------------------------------------------
        // 3. СТИЛЬ: MUTED (Спокійний тон / Пастельний мінімалізм)
        // -------------------------------------------------------------
        else if (activeStyle === 'muted') {
          iconSize = [36, 46];
          iconAnchor = [18, 16];
          html = `
            <div class="relative group cursor-pointer flex flex-col items-center select-none" style="transform: translate3d(0,0,0);">
              <!-- Матовий спокійний диск зі стрілочкою -->
              <div class="relative w-7 h-7 rounded-full bg-slate-800/90 border border-slate-600 flex items-center justify-center shadow-sm backdrop-blur-xs transition-transform hover:scale-125">
                <svg class="w-3.5 h-3.5 text-slate-200" 
                     style="transform: rotate(${heading}deg); transform-origin: center;" 
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2.5L19.5 20.5L12 16.5L4.5 20.5L12 2.5Z"/>
                </svg>
              </div>

              <!-- Спокійний номер позаду стрілочки -->
              <div class="mt-0.5 px-1 py-0.1 bg-slate-800 text-slate-300 text-[8px] font-mono font-bold rounded shadow-xs border border-slate-700 leading-tight whitespace-nowrap">
                ${full4DigitNumber}
              </div>
            </div>
          `;
        }
        // -------------------------------------------------------------
        // 4. СТИЛЬ: BALANCED (За замовчуванням - точна відповідність фото)
        // -------------------------------------------------------------
        else {
          iconSize = [36, 48];
          iconAnchor = [18, 16];
          html = `
            <div class="relative group cursor-pointer flex flex-col items-center select-none" style="transform: translate3d(0,0,0);">
              <!-- Круглий білий диск зі стрілочкою в кольорі сайту (синій/блакитний) -->
              <div class="relative w-7 h-7 rounded-full bg-white/95 border-2 ${circleBorder} flex items-center justify-center shadow-md ${statusRing} transition-transform hover:scale-125">
                ${navigationArrowSvg}
              </div>

              <!-- 4-значний бортовий номер позаду стрілочки вагона -->
              <div class="mt-0.5 px-1.5 py-0.2 bg-slate-900/90 text-white text-[9px] font-mono font-black rounded-md shadow border border-slate-700 leading-tight whitespace-nowrap">
                ${full4DigitNumber}
              </div>
            </div>
          `;
        }

        const icon = L.divIcon({
          html: html,
          className: 'custom-transit-marker',
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: [0, -iconAnchor[1] - 4],
        });

        // Інформаційний спливаючий Popup картки вагона
        const popupContent = `
          <div class="p-3 font-sans min-w-[230px]">
            <div class="flex items-center justify-between border-b pb-2 mb-2">
              <div class="flex items-center space-x-2">
                <span class="p-1.5 rounded-lg ${typeBg} text-white">${typeIconSvg}</span>
                <div>
                  <span class="block font-black text-slate-900 text-sm">Борт №${full4DigitNumber}</span>
                  <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">${typeLabel} КП «ОМЕТ»</span>
                </div>
              </div>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${statusBadgeBg}">
                ${statusText}
              </span>
            </div>

            <div class="space-y-1.5 text-xs text-slate-600">
              <div class="flex justify-between">
                <span>Маршрут:</span>
                <strong class="text-slate-900">${vehicle.route_id ? `№${vehicle.route_id}` : 'Не призначено'}</strong>
              </div>
              <div class="flex justify-between">
                <span>Швидкість руху:</span>
                <strong class="${speed > 0 ? 'text-emerald-600' : 'text-slate-500'} font-mono">${speed} км/год</strong>
              </div>
              <div class="flex justify-between">
                <span>Курс / Напрямок:</span>
                <span class="font-mono text-slate-700">${heading}°</span>
              </div>
              <div class="flex justify-between">
                <span>Джерело GPS:</span>
                <span class="font-semibold text-indigo-600">${vehicle.source || 'Wialon Live'}</span>
              </div>
              <div class="flex justify-between">
                <span>Координати:</span>
                <span class="font-mono text-[10px] text-slate-500">${vehicle.lat.toFixed(5)}, ${vehicle.lng.toFixed(5)}</span>
              </div>
            </div>
          </div>
        `;

        if (markersRef.current[vehicle.vehicle_id]) {
          const marker = markersRef.current[vehicle.vehicle_id];
          marker.setLatLng(latLng);
          marker.setIcon(icon);
          marker.setPopupContent(popupContent);
        } else {
          const marker = L.marker(latLng, { icon }).addTo(map);
          marker.bindPopup(popupContent, { maxWidth: 300 });
          markersRef.current[vehicle.vehicle_id] = marker;
        }
      });
    };

    // Підписуємося на оновлення координат зі стору
    const unsubscribe = useTelemetryStore.subscribe(updateMarkers);
    
    // Також оновлюємо маркери при зміні зуму карти
    map.on('zoomend', updateMarkers);
    
    // Первинний рендер
    updateMarkers();

    return () => {
      unsubscribe();
      map.off('zoomend', updateMarkers);
      Object.values(markersRef.current).forEach((marker) => {
        if (marker) map.removeLayer(marker as L.Layer);
      });
      markersRef.current = {};
    };
  }, [activeRouteId, hideServiceVehicles, hideDepotVehicles, map]);

  return null;
};

export default TelemetryMarkers;
