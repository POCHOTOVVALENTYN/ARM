import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTelemetryStore, VehicleTelemetry } from '../../store/useTelemetryStore';
import { useStationStore } from '../../store/useStationStore';

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

// 🗺️ Офіційний реєстр кінцевих зупинок та векторів руху КП «ОМЕТ» для точного визначення напрямку
interface RouteTerminalConfig {
  termA: string;
  termB: string;
  headingTowardsB: [number, number]; // [min, max] кут курсу, при якому вагон рухається до termB
}

const ODESSA_ROUTE_DEFINITIONS: Record<string, RouteTerminalConfig> = {
  '1': { termA: 'вул. Чорноморського козацтва (Пересип)', termB: 'Завод «Центроліт»', headingTowardsB: [300, 75] },
  '2': { termA: 'вул. Новосельського', termB: 'Парк ім. Т. Шевченка', headingTowardsB: [90, 240] },
  '3': { termA: 'станція Застава I', termB: 'Парк ім. Т. Шевченка', headingTowardsB: [330, 140] },
  '5': { termA: 'Центральний Автовокзал', termB: 'Аркадія', headingTowardsB: [90, 240] },
  '6': { termA: 'вул. Чорноморського козацтва', termB: 'Лузанівка', headingTowardsB: [300, 75] },
  '7': { termA: 'вул. Паустовського (Північ)', termB: '11-та ст. Люстдорфської дороги (Південь)', headingTowardsB: [85, 255] },
  '8': { termA: 'Суперфосфатний завод (Хімічна)', termB: 'Залізничний вокзал', headingTowardsB: [330, 150] },
  '9': { termA: 'вул. Інглезі (Черемушки)', termB: 'вул. Рішельєвська / Грецька', headingTowardsB: [300, 140] },
  '10': { termA: 'вул. Іцхака Рабіна (Черемушки)', termB: 'пл. Старосінна (Вокзал)', headingTowardsB: [330, 150] },
  '11': { termA: 'пл. Олексіївська', termB: 'Залізничний вокзал', headingTowardsB: [330, 150] },
  '12': { termA: 'Товарна станція', termB: 'Херсонський сквер', headingTowardsB: [300, 90] },
  '13': { termA: 'пл. Старосінна', termB: 'ж/м Шкільний', headingTowardsB: [90, 260] },
  '15': { termA: 'пл. Олексіївська', termB: 'Слобідський ринок', headingTowardsB: [290, 75] },
  '17': { termA: 'Куликове поле', termB: '11-та ст. Великого Фонтану', headingTowardsB: [90, 260] },
  '18': { termA: 'Куликове поле', termB: '16-та ст. Великого Фонтану', headingTowardsB: [90, 260] },
  '20': { termA: 'Херсонський сквер', termB: 'Хаджибейський лиман', headingTowardsB: [220, 340] },
  '21': { termA: 'станція Застава ІІ', termB: 'пл. Тираспільська', headingTowardsB: [330, 150] },
  '26': { termA: 'пл. Старосінна', termB: '11-та ст. Люстдорфської дороги', headingTowardsB: [90, 260] },
  '27': { termA: '16-та ст. Люстдорфської дороги', termB: 'Рибпорт (Переправа)', headingTowardsB: [90, 260] },
  '28': { termA: 'Парк ім. Т. Шевченка', termB: 'вул. Пастера', headingTowardsB: [270, 75] },
};

/**
 * Визначає цільову кінцеву зупинку (напрямок) за курсом або вектором руху.
 */
export const resolveDestination = (routeNum: string, heading: number, speed: number): string => {
  const clean = routeNum.replace(/^(t|tr)/i, '').trim();
  const def = ODESSA_ROUTE_DEFINITIONS[clean];
  if (!def) return '';

  if (speed === 0 && heading === 0) {
    return `${def.termA} ⇄ ${def.termB}`;
  }

  const [minH, maxH] = def.headingTowardsB;
  let isTowardsB = false;
  if (minH > maxH) {
    // Наприклад [300, 75]: кут >= 300 АБО кут <= 75
    isTowardsB = heading >= minH || heading <= maxH;
  } else {
    // Наприклад [90, 260]: кут >= 90 І кут <= 260
    isTowardsB = heading >= minH && heading <= maxH;
  }

  return isTowardsB ? `До кінцевої: ${def.termB}` : `До кінцевої: ${def.termA}`;
};

/**
 * Просторово знаходить пройдену та наступну зупинку вздовж траєкторії руху вагона.
 */
export const resolveVehicleStops = (
  lat: number,
  lng: number,
  heading: number,
  speed: number,
  stations: Array<{ name: string; lat?: number; lng?: number }>
): { passedStop: string; nextStop: string } => {
  if (!stations || stations.length === 0) {
    return { passedStop: 'На перегоні', nextStop: 'За розкладом' };
  }

  const candidates: Array<{ name: string; dist: number; proj: number }> = [];
  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    if (!st.lat || !st.lng) continue;
    const dLat = (st.lat - lat) * 111139;
    const dLng = (st.lng - lng) * 111139 * Math.cos(lat * Math.PI / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (dist < 1600) {
      const rad = heading * (Math.PI / 180);
      const vy = Math.cos(rad);
      const vx = Math.sin(rad);
      const proj = dLat * vy + dLng * vx;
      candidates.push({ name: st.name, dist, proj });
    }
  }

  if (candidates.length === 0) {
    return { passedStop: 'На перегоні', nextStop: 'За маршрутом' };
  }

  // Якщо вагон безпосередньо біля зупинки (< 45м)
  const exactStop = candidates.find(c => c.dist < 45);
  if (exactStop) {
    const ahead = candidates.filter(c => c.proj > 50).sort((a, b) => a.dist - b.dist);
    return {
      passedStop: `${exactStop.name} (Зараз на зупинці)`,
      nextStop: ahead.length > 0 ? ahead[0].name : 'Кінцева станція'
    };
  }

  const ahead = candidates.filter(c => c.proj > 0).sort((a, b) => a.dist - b.dist);
  const behind = candidates.filter(c => c.proj <= 0).sort((a, b) => a.dist - b.dist);

  const passedStop = behind.length > 0 ? behind[0].name : (candidates[0] ? candidates[0].name : 'На лінії');
  const nextStop = ahead.length > 0 ? ahead[0].name : (candidates.length > 1 ? candidates[1].name : 'Кінцева станція');

  return { passedStop, nextStop };
};

/**
 * Алгоритм перевірки належності точки полігону (Ray-Casting algorithm).
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
 */
export const resolveDisplayRouteNumber = (vehicle: VehicleTelemetry): string => {
  const raw = vehicle.route_number || vehicle.route_id;
  if (!raw) return '?';
  const str = String(raw).trim();
  if (str === '' || str.toLowerCase() === 'unknown' || str.toLowerCase() === 'none') {
    return '?';
  }
  const clean = str.replace(/^(t|tr)/i, '').trim();
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
  lastRawGpsLat: number;
  lastRawGpsLng: number;
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
  activeRouteId?: string | null
  selectedRouteIds?: string[] | string | null
  hideServiceVehicles?: boolean
  hideDepotVehicles?: boolean
  onlyCriticalDelays?: boolean
  isAntiEwActive?: boolean
  onIssueDispatchOrder?: (vehicleId: string, routeId: string) => void
}

export const TelemetryMarkers: React.FC<TelemetryMarkersProps> = ({ 
  activeRouteId,
  selectedRouteIds,
  hideServiceVehicles = true,
  hideDepotVehicles = false,
  onlyCriticalDelays = false,
  isAntiEwActive = true,
  onIssueDispatchOrder
}) => {
  const map = useMap()
  const animatedVehiclesRef = useRef<{ [vehicleId: string]: AnimatedVehicleItem }>({})
  const animFrameIdRef = useRef<number | null>(null)

  useEffect(() => {
    const handleOrderEvent = (e: Event) => {
      const custom = e as CustomEvent<{ vehicle_id: string; route_id: string }>
      if (custom.detail && onIssueDispatchOrder) {
        onIssueDispatchOrder(custom.detail.vehicle_id, custom.detail.route_id)
      }
    }
    window.addEventListener('omet:dispatch-order', handleOrderEvent)
    return () => {
      window.removeEventListener('omet:dispatch-order', handleOrderEvent)
    }
  }, [onIssueDispatchOrder])

  // Множина нормалізованих номерів обраних маршрутів
  const normalizedSelectedRoutes = React.useMemo(() => {
    const set = new Set<string>();
    const rawList = selectedRouteIds 
      ? (Array.isArray(selectedRouteIds) ? selectedRouteIds : [selectedRouteIds])
      : (activeRouteId ? [activeRouteId] : []);

    rawList.forEach(r => {
      const clean = String(r || '').trim().replace(/^(t|tr)/i, '').toLowerCase();
      if (clean && clean !== 'all') {
        set.add(clean);
      }
    });
    return set;
  }, [selectedRouteIds, activeRouteId]);

  const hasSpecificRouteFilter = normalizedSelectedRoutes.size > 0;

  // 1. Анімаційний 60 FPS цикл для плавного переміщення маркерів та обертання стрілок
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
          // Фаза 2: Неперервне кінематичне ковзання (Dead Reckoning) між оновленнями GPS (не більше 4.2 сек)
          const timeSinceGps = now - item.lastGpsTime;
          if (item.speedKmh > 2 && !item.isStanding && !item.isGpsLost && timeSinceGps < 4200) {
            const speedMs = Math.min(13.8, (item.speedKmh * 1000 / 3600) * 0.70); // макс 50 км/год
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
      const stations = useStationStore.getState().stations || [];

      // Фільтрація рухомого складу
      const filteredVehicles = rawVehicles.filter((v: VehicleTelemetry) => {
        if (!v.lat || !v.lng || v.lat < 46.30 || v.lat > 46.65 || v.lng < 30.60 || v.lng > 30.85) {
          return false;
        }

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

        const inDepot = isVehicleInAnyDepot(v.lat, v.lng, v.status) || v.status === 'IN_DEPOT' || v.route_id === 'DEPOT';

        // 🚫 Приховуємо ТЗ у депо, якщо увімкнено прапорець АБО якщо користувач переглядає конкретні пасажирські маршрути
        if (hideDepotVehicles || (hasSpecificRouteFilter && inDepot)) {
          if (inDepot) return false;
        }

        if (onlyCriticalDelays) {
          if ((v.deviation_min || 0) < 5.0) return false;
        }

        if (!hasSpecificRouteFilter) return true;

        const rIdClean = String(v.route_id || '').trim().replace(/^(t|tr)/i, '').toLowerCase();
        const rNumClean = String(v.route_number || '').trim().replace(/^(t|tr)/i, '').toLowerCase();
        const dispClean = resolveDisplayRouteNumber(v).toLowerCase();

        return normalizedSelectedRoutes.has(rIdClean) || 
               normalizedSelectedRoutes.has(rNumClean) || 
               normalizedSelectedRoutes.has(dispClean);
      });

      const currentIds = new Set(filteredVehicles.map((v) => v.vehicle_id));

      Object.keys(animatedVehiclesRef.current).forEach((id) => {
        if (!currentIds.has(id)) {
          map.removeLayer(animatedVehiclesRef.current[id].marker);
          delete animatedVehiclesRef.current[id];
        }
      });

      const now = Date.now();
      const perfNow = performance.now();

      filteredVehicles.forEach((vehicle: VehicleTelemetry) => {
        const rawTime = vehicle.last_updated || now;
        const lastUpdatedMs = rawTime < 1e11 ? rawTime * 1000 : rawTime;
        const ageSec = Math.max(0, Math.floor((now - lastUpdatedMs) / 1000));
        const isGpsLost = ageSec > 120; 
        const speedKmh = Math.round(vehicle.speed || 0);
        const isStanding = speedKmh === 0 && !isGpsLost;

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
        const destinationText = resolveDestination(cleanRouteNum, headingDeg, speedKmh);
        const { passedStop, nextStop } = resolveVehicleStops(vehicle.lat, vehicle.lng, headingDeg, speedKmh, stations);

        const html = `
          <div class="relative flex items-center justify-center cursor-pointer ${isGpsLost ? 'opacity-55' : 'opacity-100'}" style="width: 28px; height: 28px;">
            ${speedKmh > 0 && !isGpsLost ? `
              <div class="vehicle-arrow-container absolute -inset-3 flex items-center justify-center pointer-events-none transform" style="transform: rotate(${headingDeg}deg)">
                <svg class="w-4 h-4 text-slate-900 -translate-y-3.5 filter drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4 18l8-4 8 4L12 2z" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
                </svg>
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
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -18]
        });

        const motionStatusText = isStanding 
          ? `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">⏸️ Стоянка на лінії (0 км/год)</span>`
          : `<span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">🟢 У русі (${speedKmh} км/год)</span>`;

        const gpsSignalBadge = isGpsLost
          ? `<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">⚠️ Втрата сигналу (${Math.floor(ageSec / 60)} хв)</span>`
          : `<span class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px]">Оновлено ${ageSec}с тому</span>`;

        const popupContent = `
          <div class="font-sans text-xs p-1 space-y-2 min-w-[230px] max-w-[280px]">
            <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="font-black text-slate-900 text-sm font-mono tracking-tight">Борт №${vehicle.vehicle_id}</span>
                  ${(vehicle as any).model ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 font-mono">${(vehicle as any).model}</span>` : ''}
                  ${vehicle.vehicle_type === 'SERVICE' ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">СПЕЦ</span>' : ''}
                </div>
                <span class="text-[10px] text-slate-500 font-medium block">
                  ${vehicle.vehicle_type === 'TROLLEYBUS' ? 'Тролейбус' : vehicle.vehicle_type === 'SERVICE' ? 'Спецтехніка' : 'Трамвай'} • ${speedKmh > 0 ? `${speedKmh} км/год` : 'Стоянка'}
                </span>
              </div>
              <span class="px-2.5 py-1 rounded-full bg-blue-600 text-white font-black text-xs shadow-xs">
                Маршрут №${cleanRouteNum}
              </span>
            </div>
            
            <div class="space-y-1.5 text-slate-700 text-[11px]">
              ${destinationText ? `
                <div class="bg-blue-50/90 p-1.5 rounded-md border border-blue-100">
                  <div class="text-[9px] font-bold uppercase tracking-wider text-blue-600">Напрямок руху:</div>
                  <div class="font-bold text-blue-950 text-xs truncate mt-0.5">${destinationText}</div>
                </div>
              ` : ''}

              <div class="bg-slate-50 p-1.5 rounded-md border border-slate-100 space-y-1">
                <div class="flex justify-between items-baseline gap-2">
                  <span class="text-slate-400 text-[10px] shrink-0">Пройдена зупинка:</span>
                  <span class="font-medium text-slate-700 truncate text-right text-[11px]">${passedStop}</span>
                </div>
                <div class="flex justify-between items-baseline gap-2 border-t border-slate-200/60 pt-1">
                  <span class="text-slate-500 font-semibold text-[10px] shrink-0">Наступна зупинка:</span>
                  <span class="font-bold text-blue-700 truncate text-right text-[11px]">${nextStop}</span>
                </div>
              </div>

              ${isAntiEwActive && (vehicle as any).anti_ew_corrected ? `
                <div class="bg-purple-50 p-1.5 rounded-md border border-purple-200 flex items-center justify-between">
                  <div class="flex items-center gap-1 text-[10px] font-bold text-purple-900">
                    <span>🛡️</span> <span>Анти-РЕБ калібрування</span>
                  </div>
                  <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-200/70 text-purple-800 font-mono">КОЛІЯ OK</span>
                </div>
              ` : ''}

              <div class="space-y-1 pt-1">
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 font-medium">Стан:</span>
                  ${motionStatusText}
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 font-medium">Графік:</span>
                  <span class="font-bold ${textColorClass}">${devText}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 font-medium">GPS зв'язок:</span>
                  ${gpsSignalBadge}
                </div>
              </div>

              <button 
                type="button"
                class="w-full mt-2 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-md text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer select-none"
                onclick="window.dispatchEvent(new CustomEvent('omet:dispatch-order', { detail: { vehicle_id: '${vehicle.vehicle_id}', route_id: '${cleanRouteNum}' } }))"
              >
                <span>📋</span> <span>Видати наказ диспетчера</span>
              </button>
            </div>
          </div>
        `;

        if (animatedVehiclesRef.current[vehicle.vehicle_id]) {
          const item = animatedVehiclesRef.current[vehicle.vehicle_id];
          
          const dLatRaw = (vehicle.lat - (item.lastRawGpsLat || item.currentLat)) * 111139;
          const dLngRaw = (vehicle.lng - (item.lastRawGpsLng || item.currentLng)) * 111139 * Math.cos(vehicle.lat * Math.PI / 180);
          const rawDistM = Math.sqrt(dLatRaw * dLatRaw + dLngRaw * dLngRaw);

          const isTeleport = rawDistM > 180;
          const isPosChanged = rawDistM > 0.8;

          if (isTeleport) {
            item.startLat = vehicle.lat;
            item.startLng = vehicle.lng;
            item.targetLat = vehicle.lat;
            item.targetLng = vehicle.lng;
            item.currentLat = vehicle.lat;
            item.currentLng = vehicle.lng;
            item.lastRawGpsLat = vehicle.lat;
            item.lastRawGpsLng = vehicle.lng;
            item.marker.setLatLng([vehicle.lat, vehicle.lng]);
            item.lastGpsTime = perfNow;
          } else if (isPosChanged) {
            // 🧭 Розрахунок стабільного курсу без 180° артефактів від екстраполяції:
            let computedBearing = item.currentHeading;

            if (vehicle.heading && vehicle.heading > 0 && vehicle.heading <= 360) {
              computedBearing = vehicle.heading;
            } else if (item.lastRawGpsLat && item.lastRawGpsLng) {
              // Вектор вираховується ТІЛЬКИ між двома дійсними точками GPS від сервера!
              if (rawDistM >= 3.5 && speedKmh > 1) {
                const rawBearing = calculateBearing(item.lastRawGpsLat, item.lastRawGpsLng, vehicle.lat, vehicle.lng);
                const angleDelta = Math.abs(((rawBearing - item.currentHeading + 540) % 360) - 180);

                // Захист від розвороту на 180° при мікро-тремтінні GPS (< 20 метрів)
                if (angleDelta > 130 && rawDistM < 20.0 && speedKmh > 2) {
                  computedBearing = item.currentHeading;
                } else {
                  computedBearing = rawBearing;
                }
              }
            }

            if (speedKmh <= 1) {
              computedBearing = item.currentHeading;
            }

            item.startLat = item.currentLat;
            item.startLng = item.currentLng;
            item.targetLat = vehicle.lat;
            item.targetLng = vehicle.lng;
            item.lastRawGpsLat = vehicle.lat;
            item.lastRawGpsLng = vehicle.lng;
            item.startHeading = item.currentHeading;
            item.targetHeading = computedBearing;
            item.startTime = perfNow;
            item.duration = 3200;
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
            lastRawGpsLat: vehicle.lat,
            lastRawGpsLng: vehicle.lng,
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
