import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTelemetryStore, VehicleTelemetry } from '../../store/useTelemetryStore';

export interface DepotZone {
  id: string;
  name: string;
  shortName: string;
  address: string;
  type: 'TRAM' | 'TROLLEYBUS';
  polygon: [number, number][];
}

// 🏢 Реальні полігони периметрів території 3-х діючих депо КП «Одесміськелектротранс»
export const ODESSA_ACTIVE_DEPOT_POLYGONS: DepotZone[] = [
  {
    id: 'tram-depot-1',
    name: 'Трамвайне депо № 1',
    shortName: 'ТД-1',
    address: 'вул. Водопровідна, 1',
    type: 'TRAM',
    polygon: [
      [46.467172, 30.736911],
      [46.467037, 30.736597],
      [46.467202, 30.733894],
      [46.467372, 30.733572],
      [46.467900, 30.733588],
      [46.467952, 30.732654],
      [46.464874, 30.732343],
      [46.464830, 30.732805],
      [46.466075, 30.733132],
      [46.465931, 30.735481]
    ]
  },
  {
    id: 'tram-depot-2',
    name: 'Трамвайне депо № 2 (Слобідка)',
    shortName: 'ТД-2',
    address: '1-й Польовий провулок, 1 / вул. Ак. Воробйова',
    type: 'TRAM',
    polygon: [
      [46.49620, 30.70250],
      [46.49570, 30.70650],
      [46.49280, 30.70560],
      [46.49320, 30.70160],
      [46.49510, 30.70110]
    ]
  },
  {
    id: 'trolleybus-depot',
    name: 'Тролейбусне депо',
    shortName: 'ТрД',
    address: 'вул. Інглезі, 5 (вул. 25-ї Чапаєвської дивізії)',
    type: 'TROLLEYBUS',
    polygon: [
      [46.41880, 30.70780],
      [46.41820, 30.71230],
      [46.41480, 30.71130],
      [46.41520, 30.70680],
      [46.41740, 30.70620]
    ]
  }
];

/**
 * Алгоритм перевірки належності точки полігону (Ray-Casting algorithm).
 * Визначає, чи знаходиться ТЗ фізично всередині огорожі депо.
 */
export const isPointInPolygon = (lat: number, lng: number, polygon: [number, number][]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > lng) !== (yj > lng))
      && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Перевірка: чи знаходиться вагон на території будь-якого з 3-х депо
 */
export const isVehicleInAnyDepot = (lat: number, lng: number, status?: string): boolean => {
  if (status === 'IN_DEPOT' || status === 'depot') return true;
  if (!lat || !lng || lat === 0 || lng === 0) return false;

  for (const depot of ODESSA_ACTIVE_DEPOT_POLYGONS) {
    if (isPointInPolygon(lat, lng, depot.polygon)) {
      return true;
    }
  }
  return false;
};

/**
 * Канонічне отримання точного номера маршруту для вагона.
 * Бере безпосередньо дані з EasyWay або GTFS-RT без випадкових змін.
 */
export const resolveDisplayRouteNumber = (vehicle: VehicleTelemetry): string => {
  const raw = vehicle.route_number || vehicle.route_id;
  if (!raw) return '?';
  const str = String(raw).trim();
  if (str === '' || str.toLowerCase() === 'unknown' || str.toLowerCase() === 'none') {
    return '?';
  }
  const clean = str.replace(/^(t|tr)/i, '').trim();
  // Якщо рядок містить крапку (координата), дефіси (UUID) або задовгий — фільтруємо
  if (clean.length > 5 || clean.includes('-') || clean.includes('.')) {
    const digitsOnly = clean.replace(/[^0-9]/g, '');
    if (digitsOnly.length > 0 && digitsOnly.length <= 3) {
      return digitsOnly;
    }
    return '?';
  }
  return clean;
};

/**
 * Розрахунок геодезичного азимуту (bearing) між двома координатами для точного спрямування стрілки.
 */
export const calculateBearing = (startLat: number, startLng: number, endLat: number, endLng: number): number => {
  const dLng = (endLng - startLng) * (Math.PI / 180);
  const lat1 = startLat * (Math.PI / 180);
  const lat2 = endLat * (Math.PI / 180);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
  return Math.round(brng);
};

/**
 * Функція плавного згладжування руху (Ease Out Cubic).
 */
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

interface AnimatedVehicleItem {
  marker: L.Marker;
  startLat: number;
  startLng: number;
  targetLat: number;
  targetLng: number;
  currentLat: number;
  currentLng: number;
  startHeading: number;
  targetHeading: number;
  currentHeading: number;
  startTime: number;
  duration: number;
  lastGpsTime: number;
  speedKmh: number;
  isGpsLost: boolean;
  isStanding: boolean;
  cleanRouteNum: string;
  colorClass: string;
  textColorClass: string;
  devText: string;
}

interface TelemetryMarkersProps {
  activeRouteId?: string | null;
  hideServiceVehicles?: boolean;
  hideDepotVehicles?: boolean;
  onlyCriticalDelays?: boolean;
}

export const TelemetryMarkers: React.FC<TelemetryMarkersProps> = ({ 
  activeRouteId,
  hideServiceVehicles = true,
  hideDepotVehicles = false,
  onlyCriticalDelays = false
}) => {
  const map = useMap();
  const animatedVehiclesRef = useRef<{ [vehicleId: string]: AnimatedVehicleItem }>({});
  const animFrameIdRef = useRef<number | null>(null);

  // 1. Анімаційний 60 FPS цикл для плавного переміщення маркерів між GPS-точками
  useEffect(() => {
    let lastFrameTime = performance.now();

    const animateFrame = () => {
      const now = performance.now();
      const deltaSec = Math.min(0.1, Math.max(0.001, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      const animated = animatedVehiclesRef.current;

      for (const id in animated) {
        const item = animated[id];
        const hasPosDelta = item.startLat !== item.targetLat || item.startLng !== item.targetLng;
        const hasHeadingDelta = item.startHeading !== item.targetHeading;

        if (hasPosDelta || hasHeadingDelta) {
          const elapsed = now - item.startTime;
          const progress = Math.min(1.0, Math.max(0.0, elapsed / item.duration));
          const eased = easeOutCubic(progress);

          // Плавна інтерполяція координат (Фаза 1: рух до відомої GPS точки)
          if (hasPosDelta) {
            item.currentLat = item.startLat + (item.targetLat - item.startLat) * eased;
            item.currentLng = item.startLng + (item.targetLng - item.startLng) * eased;
            item.marker.setLatLng([item.currentLat, item.currentLng]);
          }

          // Плавна інтерполяція повороту стрілки (найкоротший кутовий шлях)
          if (hasHeadingDelta) {
            const diffHeading = ((item.targetHeading - item.startHeading + 540) % 360) - 180;
            item.currentHeading = (item.startHeading + diffHeading * eased + 360) % 360;

            const el = item.marker.getElement();
            if (el) {
              const arrow = el.querySelector('.vehicle-arrow-container') as HTMLElement | null;
              if (arrow) {
                arrow.style.transform = `rotate(${Math.round(item.currentHeading)}deg)`;
              }
            }
          }

          // Завершення фази переходу до точки
          if (progress >= 1.0) {
            item.startLat = item.targetLat;
            item.startLng = item.targetLng;
            item.startHeading = item.targetHeading;
            item.currentLat = item.targetLat;
            item.currentLng = item.targetLng;
            item.currentHeading = item.targetHeading;
          }
        } else {
          // Фаза 2: Неперервне кінематичне ковзання (Dead Reckoning) між оновленнями GPS
          // Якщо вагон у русі (> 2 км/год), не на стоянці та не втратив GPS — продовжуємо плавний рух вздовж курсу
          const timeSinceGps = now - item.lastGpsTime;
          if (item.speedKmh > 2 && !item.isStanding && !item.isGpsLost && timeSinceGps < 35000) {
            // Швидкість у м/с із коефіцієнтом плавності 0.70
            const speedMs = (item.speedKmh * 1000 / 3600) * 0.70;
            const distMeters = speedMs * deltaSec;
            const headingRad = (item.currentHeading * Math.PI) / 180;

            // 1м в Одесі ≈ 0.00000899° lat, 0.00001306° lng
            const dLat = distMeters * Math.cos(headingRad) * 0.00000899;
            const dLng = distMeters * Math.sin(headingRad) * 0.00001306;

            item.currentLat += dLat;
            item.currentLng += dLng;
            item.startLat = item.currentLat;
            item.targetLat = item.currentLat;
            item.startLng = item.currentLng;
            item.targetLng = item.currentLng;
            item.marker.setLatLng([item.currentLat, item.currentLng]);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(animateFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(animateFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // 2. Обробка надходження телеметрії та синхронізація з картою
  useEffect(() => {
    const updateMarkers = () => {
      const state = useTelemetryStore.getState();
      const rawVehicles = Object.values(state.vehicles);

      // Фільтрація рухомого складу
      const filteredVehicles = rawVehicles.filter((v: VehicleTelemetry) => {
        // 0. Фільтр валідності координат Одеси (відсікаємо сміттєві/тестові/закордонні точки)
        if (
          !v.lat || !v.lng ||
          v.lat < 46.30 || v.lat > 46.65 ||
          v.lng < 30.60 || v.lng > 30.85
        ) {
          return false;
        }

        // 1. Фільтр спецтехніки
        if (hideServiceVehicles) {
          const isService = Boolean(
            v.is_service || 
            v.vehicle_type === 'SERVICE' || 
            String(v.vehicle_id).startsWith('9') ||
            String(v.vehicle_id).startsWith('С') ||
            String(v.vehicle_id).startsWith('S') ||
            String(v.driver_name || '').toLowerCase().includes('служба')
          );
          if (isService) return false;
        }

        // 2. Фільтр вагонів у депо: перевірка точного полігону території 3-х депо
        if (hideDepotVehicles) {
          const inDepot = isVehicleInAnyDepot(v.lat, v.lng, v.status);
          if (inDepot) return false;
        }

        // 3. Фільтр критичних запізнень (> 5 хв)
        if (onlyCriticalDelays) {
          if (Math.abs(v.deviation_min || 0) <= 5.0) return false;
        }

        // 4. Фільтр за обраним маршрутом
        if (!activeRouteId || activeRouteId.toUpperCase() === 'ALL' || activeRouteId === '') {
          return true;
        }

        const targetClean = String(activeRouteId).trim().toLowerCase().replace(/^(t|tr)/i, '');
        const rIdClean = String(v.route_id || '').trim().toLowerCase().replace(/^(t|tr)/i, '');
        const rNumClean = String(v.route_number || '').trim().toLowerCase().replace(/^(t|tr)/i, '');
        const dispClean = resolveDisplayRouteNumber(v).toLowerCase();

        return rIdClean === targetClean || rNumClean === targetClean || dispClean === targetClean;
      });

      const currentIds = new Set(filteredVehicles.map((v) => v.vehicle_id));

      // Видаляємо маркери з карти, які більше не проходять фільтри
      Object.keys(animatedVehiclesRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          map.removeLayer(animatedVehiclesRef.current[id].marker);
          delete animatedVehiclesRef.current[id];
        }
      });

      // Оновлюємо координати для плавного ковзання або створюємо нові маркери
      const now = Date.now();
      const perfNow = performance.now();

      filteredVehicles.forEach((vehicle: VehicleTelemetry) => {
        // Розрахунок свіжості сигналу
        const rawTime = vehicle.last_updated || now;
        const lastUpdatedMs = rawTime < 1e11 ? rawTime * 1000 : rawTime;
        const ageSec = Math.max(0, Math.floor((now - lastUpdatedMs) / 1000));
        const isGpsLost = ageSec > 120; // > 2 хв
        const speedKmh = Math.round(vehicle.speed || 0);
        const isStanding = speedKmh === 0 && !isGpsLost;

        // Кольорове оформлення кружечка
        let colorClass = 'bg-emerald-500 ring-emerald-300';
        let textColorClass = 'text-emerald-600';
        let devText = (vehicle.deviation_min || 0) > 0 
          ? `+${(vehicle.deviation_min || 0).toFixed(1)} хв (запізнення)` 
          : (vehicle.deviation_min || 0) < 0
          ? `${(vehicle.deviation_min || 0).toFixed(1)} хв (випередження)`
          : 'В графіку (0.0 хв)';
        
        if (isGpsLost) {
          colorClass = 'bg-slate-400 ring-slate-300';
          textColorClass = 'text-slate-500';
          devText = `GPS втрачено (${Math.floor(ageSec / 60)} хв тому)`;
        } else if (vehicle.status === 'DETOUR' || vehicle.has_active_detour) {
          colorClass = 'bg-amber-500 ring-amber-300 animate-pulse';
          textColorClass = 'text-amber-700';
          devText = "Оперативний об'їзд (Detour)";
        } else if (isStanding) {
          colorClass = 'bg-slate-600 ring-slate-400';
          textColorClass = 'text-slate-600';
        } else if ((vehicle.deviation_min || 0) > 2.0) {
          colorClass = 'bg-rose-500 ring-rose-300';
          textColorClass = 'text-rose-600';
        } else if ((vehicle.deviation_min || 0) < -2.0) {
          colorClass = 'bg-blue-500 ring-blue-300';
          textColorClass = 'text-blue-600';
        }

        const headingDeg = vehicle.heading || 0;
        const cleanRouteNum = resolveDisplayRouteNumber(vehicle);

        // Чистий маркер: виключно кольоровий кружечок із номером маршруту та стрілкою
        const html = `
          <div class="relative flex items-center justify-center cursor-pointer ${isGpsLost ? 'opacity-55' : 'opacity-100'}" style="width: 26px; height: 26px;">
            ${speedKmh > 0 && !isGpsLost ? `
              <div class="vehicle-arrow-container absolute -inset-2 flex items-center justify-center pointer-events-none transform" style="transform: rotate(${headingDeg}deg)">
                <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-slate-900 -translate-y-4 filter drop-shadow-xs"></div>
              </div>
            ` : ''}
            <div class="w-6 h-6 rounded-full border-2 border-white shadow-md ${colorClass} ring-2 flex items-center justify-center z-10 overflow-hidden" style="width: 24px; height: 24px; min-width: 24px; min-height: 24px;">
              <span class="font-mono font-black text-[11px] text-white tracking-tighter leading-none select-none drop-shadow-xs text-center truncate max-w-[20px]">
                ${cleanRouteNum}
              </span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html,
          className: 'custom-vehicle-marker',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
          popupAnchor: [0, -16]
        });

        // Інформація для попапа
        const motionStatusText = isStanding 
          ? `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">⏸️ Стоянка на лінії (0 км/год)</span>`
          : `<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">🟢 У русі (${speedKmh} км/год)</span>`;

        const gpsSignalBadge = isGpsLost
          ? `<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">⚠️ Втрата сигналу (${Math.floor(ageSec / 60)} хв)</span>`
          : `<span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">Оновлено ${ageSec}с тому</span>`;

        const popupContent = `
          <div class="font-sans text-xs p-1.5 space-y-2 min-w-[210px]">
            <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div>
                <span class="font-black text-slate-900 text-sm font-mono">Борт №${vehicle.vehicle_id}</span>
                <span class="text-[10px] text-slate-400 block">${vehicle.vehicle_type === 'TROLLEYBUS' ? 'Тролейбус' : 'Трамвай'}</span>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-blue-600 text-white font-black text-xs shadow-xs">
                Маршрут №${cleanRouteNum}
              </span>
            </div>
            
            <div class="space-y-1.5 text-slate-700">
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Стан:</span>
                ${motionStatusText}
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">GPS зв'язок:</span>
                ${gpsSignalBadge}
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Джерело:</span>
                <span class="font-mono text-[10px] font-bold text-blue-600">${vehicle.source || 'EasyWay'}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Зупинка / лінія:</span>
                <span class="font-semibold text-slate-800 truncate max-w-[120px]">${vehicle.current_station || 'На лінії'}</span>
              </div>
              <div class="flex justify-between items-center pt-1.5 border-t border-slate-100 font-bold">
                <span class="text-slate-500 font-medium">Графік:</span>
                <span class="${textColorClass}">${devText}</span>
              </div>
            </div>
          </div>
        `;

        if (animatedVehiclesRef.current[vehicle.vehicle_id]) {
          const item = animatedVehiclesRef.current[vehicle.vehicle_id];
          
          // Перевірка відстані для захисту від телепортації (Anti-Jitter)
          const latDiff = Math.abs(item.currentLat - vehicle.lat);
          const lngDiff = Math.abs(item.currentLng - vehicle.lng);
          const isTeleport = latDiff > 0.005 || lngDiff > 0.007; // > 500-600 м
          const isPosChanged = Math.abs(item.targetLat - vehicle.lat) > 0.00001 || Math.abs(item.targetLng - vehicle.lng) > 0.00001;

          if (isTeleport) {
            item.startLat = vehicle.lat;
            item.startLng = vehicle.lng;
            item.targetLat = vehicle.lat;
            item.targetLng = vehicle.lng;
            item.currentLat = vehicle.lat;
            item.currentLng = vehicle.lng;
            item.marker.setLatLng([vehicle.lat, vehicle.lng]);
            item.lastGpsTime = perfNow;
          } else if (isPosChanged) {
            // Нова GPS-точка: розраховуємо точний азимут руху вздовж колій
            const computedBearing = (speedKmh > 1 && (latDiff > 0.00005 || lngDiff > 0.00005))
              ? calculateBearing(item.currentLat, item.currentLng, vehicle.lat, vehicle.lng)
              : (headingDeg || item.currentHeading);

            // Плавний плавний рух до нової точки
            item.startLat = item.currentLat;
            item.startLng = item.currentLng;
            item.targetLat = vehicle.lat;
            item.targetLng = vehicle.lng;
            item.startHeading = item.currentHeading;
            item.targetHeading = computedBearing;
            item.startTime = perfNow;
            item.duration = 4500; // 4.5 секунди для ідеальної безшовності між пінгами
            item.lastGpsTime = perfNow;
          }

          item.speedKmh = speedKmh;
          item.isGpsLost = isGpsLost;
          item.isStanding = isStanding;
          item.cleanRouteNum = cleanRouteNum;
          item.colorClass = colorClass;
          item.textColorClass = textColorClass;
          item.devText = devText;
          item.marker.setIcon(customIcon);
          item.marker.setPopupContent(popupContent);
        } else {
          // Створення нового маркера
          const marker = L.marker([vehicle.lat, vehicle.lng], { icon: customIcon }).addTo(map);
          marker.bindPopup(popupContent);

          animatedVehiclesRef.current[vehicle.vehicle_id] = {
            marker,
            startLat: vehicle.lat,
            startLng: vehicle.lng,
            targetLat: vehicle.lat,
            targetLng: vehicle.lng,
            currentLat: vehicle.lat,
            currentLng: vehicle.lng,
            startHeading: headingDeg,
            targetHeading: headingDeg,
            currentHeading: headingDeg,
            startTime: perfNow,
            duration: 4500,
            lastGpsTime: perfNow,
            speedKmh,
            isGpsLost,
            isStanding,
            cleanRouteNum,
            colorClass,
            textColorClass,
            devText
          };
        }
      });
    };

    updateMarkers();

    // ⚡ Реактивна підписка на будь-які зміни в сторі (WS або HTTP) з 0ms затримкою
    const unsubscribe = useTelemetryStore.subscribe(() => {
      updateMarkers();
    });

    // Фолбек-таймер для оновлення віку сигналу / годинника
    const interval = setInterval(updateMarkers, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      // Очищення маркерів при розмонтуванні
      Object.values(animatedVehiclesRef.current).forEach((item) => {
        map.removeLayer(item.marker);
      });
      animatedVehiclesRef.current = {};
    };
  }, [map, activeRouteId, hideServiceVehicles, hideDepotVehicles, onlyCriticalDelays]);

  return null;
};

export default TelemetryMarkers;
