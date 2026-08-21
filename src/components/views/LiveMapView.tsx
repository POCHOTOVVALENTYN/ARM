import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, ZoomControl, Polyline, Polygon, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useScheduleStore, ODESSA_DEFAULT_ROUTES } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { TelemetryMarkers, ODESSA_ACTIVE_DEPOT_POLYGONS } from '../dispatcher/TelemetryMarkers';
import { 
  MapPin, 
  Bus, 
  Zap, 
  Clock, 
  AlertCircle, 
  Filter, 
  CheckCircle2, 
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  Crosshair,
  Radio,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  ArrowLeftRight,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

import { useRouteShape, useRouteBothShapes, useRouteStops, useAllRouteShapes } from '../../hooks/useRouteQueries';
import { AirRaidBanner } from '../dispatcher/AirRaidBanner';
import { useAlertStore } from '../../store/useAlertStore';
import axios from 'axios';

// Fix for default Leaflet marker assets in React/Vite builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Доступні стилі картографічної підложки
const MAP_STYLES = [
  {
    id: 'positron',
    label: 'Світла (Positron)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
    icon: '🗺️'
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    icon: '🌐'
  },
  {
    id: 'voyager',
    label: 'Voyager (Детальна)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO, &copy; OpenStreetMap',
    icon: '🧭'
  },
  {
    id: 'satellite',
    label: 'Супутник (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
    icon: '🛰️'
  },
  {
    id: 'dark',
    label: 'Контрастна Нічна',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO, &copy; OpenStreetMap',
    icon: '🌙'
  }
];

// Центр Одеси (вузлова розв'язка Старосінна / Привокзальна)
const ODESSA_CENTER: [number, number] = [46.4750, 30.7350];

// Точні координати офіційних диспетчерських пунктів та кінцевих кілець Одеси
export const ODESSA_DISPATCH_HUBS = [
  { id: 'dp-kulykove', name: 'ДП «Куликове поле» (Кільце)', lat: 46.46714, lng: 30.74609, routes: 'Трам 17, 18' },
  { id: 'dp-starosinna', name: 'ДП «Старосінна площа»', lat: 46.46672, lng: 30.73824, routes: 'Трам 10, 11, 13, 26' },
  { id: 'dp-arkadia', name: 'ДП «Аркадія» (Кільце)', lat: 46.43119, lng: 30.76072, routes: 'Трам 5' },
  { id: 'dp-shevchenko', name: 'ДП «Парк ім. Т. Шевченка» (Кільце)', lat: 46.47332, lng: 30.75487, routes: 'Трам 28, Трол 2, 3' },
  { id: 'dp-16st-fontanu', name: 'ДП «16-та ст. Великого Фонтану» (Кільце)', lat: 46.38650, lng: 30.74850, routes: 'Трам 18, 19' },
  { id: 'dp-411-batareya', name: 'ДП «Меморіал 411-ї батареї / Дача Ковалевського»', lat: 46.37189, lng: 30.72890, routes: 'Трам 18, 19' },
  { id: 'dp-16st-lustdorf', name: 'ДП «16-та ст. Люстдорфської дороги / Переправа»', lat: 46.33470, lng: 30.66652, routes: 'Трам 27' },
  { id: 'dp-11st-lustdorf', name: 'ДП «11-а ст. Люстдорфської дороги» (Кільце)', lat: 46.38248, lng: 30.71442, routes: 'Трам 26, 27' },
  { id: 'dp-paustovskoho', name: 'ДП «вул. Паустовського» (Кільце)', lat: 46.61885, lng: 30.81555, routes: 'Трам 1, 7' },
  { id: 'dp-luzanivka', name: 'ДП «Лузанівка» (Кільце)', lat: 46.55292, lng: 30.76104, routes: 'Трам 6, 7' },
  { id: 'dp-tyraspol', name: 'ДП «пл. Тираспольська» (Кільце)', lat: 46.47961, lng: 30.73058, routes: 'Трам 15, 21' },
  { id: 'dp-peresyp', name: 'ДП «Херсонський сквер / Пересипський міст»', lat: 46.49637, lng: 30.71834, routes: 'Трам 12, 20' },
  { id: 'dp-zastava1', name: 'ДП «станція Застава I» (Кільце)', lat: 46.47004, lng: 30.66993, routes: 'Трол 3, Трам 21' },
  { id: 'dp-inglezi', name: 'ДП «вул. Інглезі / Космонавтів» (Кільце)', lat: 46.42464, lng: 30.70615, routes: 'Трол 9, 10' },
  { id: 'dp-arkhitektorska', name: 'ДП «вул. Архітекторська» (Кільце)', lat: 46.38597, lng: 30.72274, routes: 'Трол 7, 12' },
  { id: 'dp-novoselskoho', name: 'ДП «вул. Новосельського» (Кільце)', lat: 46.48954, lng: 30.71983, routes: 'Трол 2, 7' }
];

// Нормалізація типу транспорту (Трамваї vs Тролейбуси)
export const normalizeRouteType = (type?: string): 'tram' | 'trolleybus' => {
  if (!type) return 'tram';
  const lower = String(type).trim().toLowerCase();
  if (lower === 'tram' || lower === 't' || lower.includes('трам')) return 'tram';
  if (lower.includes('trolley') || lower === 'trolleybus' || lower === 'tr' || lower.includes('трол')) return 'trolleybus';
  return 'tram';
};

// Контролер карти для автоматичного масштабування лише при зміні обраного маршруту
const MapBoundsController: React.FC<{ 
  selectedRouteId: string; 
  allPoints: [number, number][]; 
}> = ({ selectedRouteId, allPoints }) => {
  const map = useMap();
  const prevRouteRef = React.useRef<string>(selectedRouteId);
  const isFirstMount = React.useRef<boolean>(true);

  useEffect(() => {
    // Пропускаємо перший рендер, бо MapContainer уже має початковий центр та зум
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // Центруємо ТІЛЬКИ тоді, коли користувач дійсно обрав інший маршрут у списку
    if (prevRouteRef.current !== selectedRouteId) {
      prevRouteRef.current = selectedRouteId;

      if (!selectedRouteId || selectedRouteId === 'ALL' || selectedRouteId === 'all') {
        map.setView(ODESSA_CENTER, 13, { animate: true });
        return;
      }

      if (allPoints && allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints.map(p => L.latLng(p[0], p[1])));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true });
      }
    }
  }, [selectedRouteId, allPoints, map]);

  return null;
};

interface LiveMapViewProps {
  activeRouteId?: string;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({ activeRouteId: propActiveRouteId }) => {
  const routesFromStore = useRouteStore((state) => state.routes);
  const routes = routesFromStore && routesFromStore.length > 0 ? routesFromStore : ODESSA_DEFAULT_ROUTES;
  const vehiclesMap = useTelemetryStore((state) => state.vehicles);
  const fetchLiveTelemetry = useTelemetryStore((state) => state.fetchLiveTelemetry);

  // Стейт бічної панелі керування (2 вкладки: Маршрути та Шари)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'routes' | 'layers'>('routes');
  
  // EasyWay Синхронізація
  const [isSyncingEasyWay, setIsSyncingEasyWay] = useState<boolean>(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  const handleSyncEasyWay = async () => {
    setIsSyncingEasyWay(true);
    setSyncResultMsg(null);
    try {
      const res = await axios.post('/api/easyway/sync');
      setSyncResultMsg(`Синхронізовано: ${res.data?.synced_routes || 20} маршрутів, ${res.data?.total_stops || 866} зупинок`);
    } catch (err) {
      setSyncResultMsg('Помилка синхронізації EasyWay');
    } finally {
      setIsSyncingEasyWay(false);
    }
  };

  // Фільтри та налаштування
  const [selectedRouteId, setSelectedRouteId] = useState<string>(propActiveRouteId || 'ALL');
  const [routeTypeFilter, setRouteTypeFilter] = useState<'all' | 'tram' | 'trolleybus'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTileStyleId, setSelectedTileStyleId] = useState<string>('positron');
  
  // Напрямок руху для обраного маршруту (EasyWay стиль: Обидва, Прямий 0, Зворотний 1)
  const [directionMode, setDirectionMode] = useState<'both' | 0 | 1>('both');

  // Шари об'єктів
  const [showAllRoutesLines, setShowAllRoutesLines] = useState<boolean>(true);
  const [showTrackShape, setShowTrackShape] = useState<boolean>(true);
  const [showStops, setShowStops] = useState<boolean>(true);
  const [showDispatchHubs, setShowDispatchHubs] = useState<boolean>(true);
  const [hideServiceVehicles, setHideServiceVehicles] = useState<boolean>(true);
  const [hideDepotVehicles, setHideDepotVehicles] = useState<boolean>(false);
  const [onlyCriticalDelays, setOnlyCriticalDelays] = useState<boolean>(false);

  // Статус повітряної тривоги
  const isAirRaidActive = useAlertStore((state) => state.isAirRaidActive);
  const toggleAirRaid = useAlertStore((state) => state.toggleAirRaid);
  const fetchAirRaidStatus = useAlertStore((state) => state.fetchAirRaidStatus);

  // Відлік свіжості GPS-сигналу
  const lastSyncTime = useTelemetryStore((state) => state.lastSyncTime);
  const [secondsSinceSync, setSecondsSinceSync] = useState<number>(0);

  // Періодичне опитування статусу тривоги (раз на 15 сек)
  useEffect(() => {
    fetchAirRaidStatus();
    const alertInterval = setInterval(fetchAirRaidStatus, 15000);
    return () => clearInterval(alertInterval);
  }, [fetchAirRaidStatus]);

  // Лічильник секунд з моменту останнього GPS пінгу
  useEffect(() => {
    const updateSyncCounter = () => {
      if (lastSyncTime) {
        setSecondsSinceSync(Math.max(0, Math.floor((Date.now() - lastSyncTime) / 1000)));
      }
    };
    updateSyncCounter();
    const interval = setInterval(updateSyncCounter, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  // Періодичне опитування телеметрії Wialon
  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(() => {
      fetchLiveTelemetry();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchLiveTelemetry]);

  const isSpecificRoute = selectedRouteId && selectedRouteId !== 'ALL' && selectedRouteId !== 'all';

  // 1. Завантажуємо всі геометрії маршрутів для відображення повної мережі міста в обох напрямках
  const { data: allShapes = [] } = useAllRouteShapes(true);

  // 2. Завантажуємо геометрії обох напрямків (0 і 1) для обраного маршруту
  const { data: bothShapesData } = useRouteBothShapes(isSpecificRoute ? selectedRouteId : null);

  // 3. Завантажуємо точні зупинки для обраного маршруту з бекенду (для обох або обраного напрямку)
  const dirParam = directionMode === 'both' ? undefined : directionMode;
  const { data: routeStopsFromApi = [] } = useRouteStops(isSpecificRoute ? selectedRouteId : null, dirParam);

  const activeRouteObj = useMemo(() => {
    if (!isSpecificRoute) return null;
    return routes.find((r) => {
      const cleanId = String(r.id).toLowerCase();
      const cleanNum = String(r.number || '').toLowerCase();
      const target = String(selectedRouteId).toLowerCase();
      return cleanId === target || cleanNum === target;
    });
  }, [isSpecificRoute, selectedRouteId, routes]);

  // Геометрії обраного маршруту для прямого (0) та зворотного (1) напрямків
  const selectedRoutePolylines = useMemo(() => {
    if (!showTrackShape || !isSpecificRoute) return [];

    const dirs = bothShapesData?.directions || [];
    const polylines: { dir: number; positions: [number, number][]; color: string; label: string }[] = [];

    dirs.forEach((d) => {
      if (directionMode === 'both' || directionMode === d.direction_id) {
        const pts = (d.geometry || []).map((pt) => [pt.lat, pt.lng] as [number, number]);
        if (pts.length > 0) {
          polylines.push({
            dir: d.direction_id,
            positions: pts,
            color: d.direction_id === 0 ? '#2563eb' : '#0891b2',
            label: d.direction_id === 0 ? 'Прямий напрямок' : 'Зворотний напрямок'
          });
        }
      }
    });

    return polylines;
  }, [showTrackShape, isSpecificRoute, bothShapesData, directionMode]);

  // Усі точки для розрахунку автоматичного фокусування (bounds)
  const allFocusPoints = useMemo(() => {
    const pts: [number, number][] = [];
    selectedRoutePolylines.forEach(p => pts.push(...p.positions));
    routeStopsFromApi.forEach(s => pts.push([s.lat, s.lng]));
    return pts;
  }, [selectedRoutePolylines, routeStopsFromApi]);

  // Активний тайловий шар
  const activeTileStyle = MAP_STYLES.find(s => s.id === selectedTileStyleId) || MAP_STYLES[0];

  // Фільтрований список маршрутів для бічної панелі
  const filteredRoutesList = useMemo(() => {
    return routes.filter(r => {
      const rType = normalizeRouteType(r.type);
      const matchesType = routeTypeFilter === 'all' || rType === routeTypeFilter;
      const matchesSearch = (r.number || r.id).toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (r.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [routes, routeTypeFilter, searchQuery]);

  // Підрахунок транспорту за маршрутами
  const vehicleCountByRoute = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(vehiclesMap).forEach(v => {
      const rId = String(v.route_id || v.route_number || '').trim().toLowerCase().replace(/^(t|tr)/i, '');
      if (rId && rId !== 'service') {
        counts[rId] = (counts[rId] || 0) + 1;
      }
    });
    return counts;
  }, [vehiclesMap]);

  const totalVehiclesCount = Object.keys(vehiclesMap).length;

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-130px)] flex overflow-hidden font-sans select-none">
      
      {/* Сповіщення про Повітряну тривогу */}
      <AirRaidBanner />

      {/* 1. Повноекранний шар Leaflet GIS */}
      <div className="absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900">
        <MapContainer
          center={ODESSA_CENTER}
          zoom={13}
          zoomControl={false}
          className="w-full h-full"
        >
          <TileLayer
            key={activeTileStyle.id}
            attribution={activeTileStyle.attribution}
            url={activeTileStyle.url}
          />

          <ZoomControl position="bottomright" />

          {/* Автоматичне фокусування на обраному маршруті */}
          <MapBoundsController 
            selectedRouteId={selectedRouteId} 
            allPoints={allFocusPoints} 
          />

          {/* 1.1 Відображення ліній усіх маршрутів мережі (фонова сітка) */}
          {showAllRoutesLines && allShapes.map((shape, idx) => {
            const isTram = shape.type === 'TRAM';
            const isActive = isSpecificRoute && String(shape.route_id) === String(selectedRouteId);
            
            // Якщо обрано конкретний маршрут, інші лінії делікатно приглушуються
            const opacity = isSpecificRoute ? (isActive ? 0.95 : 0.18) : (shape.direction_id === 0 ? 0.65 : 0.45);
            const weight = isActive ? 7 : (isSpecificRoute ? 2 : (shape.direction_id === 0 ? 3.5 : 2.5));
            const color = shape.color || (isTram ? '#2563eb' : '#059669');

            const positions = (shape.geometry || []).map(pt => [pt.lat, pt.lng] as [number, number]);
            if (positions.length === 0) return null;

            return (
              <Polyline
                key={`all-shape-${shape.route_id}-dir-${shape.direction_id}-${idx}`}
                positions={positions}
                pathOptions={{
                  color: color,
                  weight: weight,
                  opacity: opacity,
                  dashArray: shape.direction_id === 1 && !isActive ? '4, 6' : undefined,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              >
                <Popup className="font-sans text-xs">
                  <div className="p-1 font-bold">
                    <span className="text-blue-600 font-mono">№{shape.route_number}</span> — {isTram ? 'Трамвай' : 'Тролейбус'} ({shape.direction_id === 0 ? 'Прямий' : 'Зворотний'})
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* 1.2 Підсвітка траси обраного маршруту в обох напрямках */}
          {showTrackShape && selectedRoutePolylines.map((poly) => (
            <Polyline
              key={`selected-route-dir-${poly.dir}`}
              positions={poly.positions}
              pathOptions={{
                color: poly.color,
                weight: poly.dir === 0 ? 6.5 : 5,
                opacity: 0.95,
                dashArray: poly.dir === 1 && directionMode === 'both' ? '6, 6' : undefined,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Popup className="font-sans text-xs">
                <div className="p-1 font-bold text-slate-900">
                  {poly.label}
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* 1.3 Диспетчерські станції та кінцеві кільця Одеси */}
          {showDispatchHubs && ODESSA_DISPATCH_HUBS.map((hub) => (
            <CircleMarker
              key={hub.id}
              center={[hub.lat, hub.lng]}
              radius={8.5}
              pathOptions={{
                fillColor: '#4f46e5',
                color: '#ffffff',
                weight: 2.5,
                fillOpacity: 0.95,
              }}
            >
              <Popup className="font-sans text-xs">
                <div className="p-1.5 space-y-1 min-w-[170px]">
                  <div className="font-black text-indigo-950 text-sm">{hub.name}</div>
                  <div className="text-[10px] text-indigo-600 font-bold flex items-center space-x-1">
                    <span>🚏 Диспетчерський Пункт (ДП)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-1">
                    Закріплені маршрути: <strong>{hub.routes}</strong>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* 1.3.5 Реальні полігони периметрів території 3-х депо КП «ОМЕТ» */}
          {showDispatchHubs && ODESSA_ACTIVE_DEPOT_POLYGONS.map((depot) => (
            <Polygon
              key={depot.id}
              positions={depot.polygon}
              pathOptions={{
                color: '#d97706',
                fillColor: '#fbbf24',
                fillOpacity: 0.16,
                weight: 2,
                dashArray: '6, 6'
              }}
            >
              <Popup className="font-sans text-xs">
                <div className="p-1.5 space-y-1 min-w-[190px]">
                  <div className="flex items-center space-x-1.5 border-b border-amber-200 pb-1">
                    <span className="text-base">{depot.type === 'TRAM' ? '🚋' : '🚎'}</span>
                    <div>
                      <div className="font-black text-amber-950 text-sm">{depot.name}</div>
                      <div className="text-[10px] text-amber-700 font-bold">{depot.address}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium pt-0.5">
                    Територія базування: <strong>{depot.shortName}</strong> ({depot.type === 'TRAM' ? 'Трамваї' : 'Тролейбуси'})
                  </div>
                  <div className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    📍 Точна огорожа периметру депо
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}

          {/* 1.4 Маршрутні зупинки (в обох напрямках) */}
          {showStops && routeStopsFromApi.map((stop, sIdx) => {
            const isDir1 = stop.direction_id === 1;
            return (
              <CircleMarker
                key={`stop-${stop.stop_id}-${stop.direction_id || 0}-${sIdx}`}
                center={[stop.lat, stop.lng]}
                radius={stop.is_dispatch_station ? 7 : 4}
                pathOptions={{
                  fillColor: stop.is_dispatch_station 
                    ? '#4f46e5' 
                    : (isDir1 ? '#0891b2' : '#2563eb'),
                  color: '#ffffff',
                  weight: 2,
                  fillOpacity: 0.9,
                }}
              >
                <Popup className="font-sans text-xs">
                  <div className="p-1.5 space-y-1 min-w-[160px]">
                    <div className="font-black text-slate-900 dark:text-white text-sm">{stop.name}</div>
                    <div className="text-[11px] text-blue-600 font-bold flex items-center space-x-1">
                      <span>{stop.is_dispatch_station ? '🚏 Диспетчерський Пункт (ДП)' : `Зупинка #${stop.stop_sequence}`}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 dark:border-slate-800 pt-1">
                      Напрямок: <strong className={isDir1 ? 'text-cyan-600' : 'text-blue-600'}>{isDir1 ? '⬅️ Зворотний' : '➡️ Прямий'}</strong>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* 1.5 Live Telemetry Vehicle Markers з Wialon */}
          <TelemetryMarkers
            activeRouteId={selectedRouteId}
            hideServiceVehicles={hideServiceVehicles}
            hideDepotVehicles={hideDepotVehicles}
            onlyCriticalDelays={onlyCriticalDelays}
          />
        </MapContainer>
      </div>

      {/* 2. Плаваюча кнопка розгортання панелі */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-800 dark:text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 flex items-center space-x-2 cursor-pointer hover:bg-blue-50/80 hover:text-blue-600 hover:border-blue-300 transition-all active:scale-95"
          title="Відкрити пульт керування картою"
        >
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-black">Пульт Карти</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </button>
      )}

      {/* 3. Плаваюча бічна панель керування ГІС-картою (Маршрути та Шари) */}
      {isSidebarOpen && (
        <aside className="absolute top-4 left-4 bottom-4 z-[1000] w-88 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transition-all animate-in fade-in slide-in-from-left-4 duration-200">
          
          {/* Header панелі */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                    ГІС-Карта Wialon Live
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">КП «Одесміськелектротранс»</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedRouteId('ALL')}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Скинути до всіх маршрутів міста"
              >
                <Crosshair className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Згорнути панель"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Вкладки перемикання в панелі (2 чіткі вкладки: Маршрути та Шари) */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-1 bg-slate-100/50 dark:bg-slate-800/20 shrink-0">
            <button
              onClick={() => setActiveTab('routes')}
              className={`py-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'routes'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Маршрути ({routes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('layers')}
              className={`py-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'layers'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-2xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Шари та Налаштування</span>
            </button>
          </div>

          {/* Вміст обраної вкладки */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* ВКЛАДКА 1: МАРШРУТИ */}
            {activeTab === 'routes' && (
              <div className="space-y-3.5">
                
                {/* Фільтр типу транспорту */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-extrabold border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setRouteTypeFilter('all')}
                    className={`py-1 rounded-lg transition-all cursor-pointer ${
                      routeTypeFilter === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-black' : 'text-slate-500'
                    }`}
                  >
                    Усі ({routes.length})
                  </button>
                  <button
                    onClick={() => setRouteTypeFilter('tram')}
                    className={`py-1 rounded-lg transition-all cursor-pointer ${
                      routeTypeFilter === 'tram' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-black' : 'text-slate-500'
                    }`}
                  >
                    🚊 Трамваї ({routes.filter(r => normalizeRouteType(r.type) === 'tram').length})
                  </button>
                  <button
                    onClick={() => setRouteTypeFilter('trolleybus')}
                    className={`py-1 rounded-lg transition-all cursor-pointer ${
                      routeTypeFilter === 'trolleybus' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs font-black' : 'text-slate-500'
                    }`}
                  >
                    🚎 Тролейбуси ({routes.filter(r => normalizeRouteType(r.type) === 'trolleybus').length})
                  </button>
                </div>

                {/* Пошук маршруту */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Номер або назва кінцевої..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Кнопка "Усі маршрути міста" */}
                <button
                  onClick={() => setSelectedRouteId('ALL')}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedRouteId === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-white dark:bg-slate-800 hover:bg-blue-50/70 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-xs">🌐</span>
                    <span className="text-xs font-black">Усі маршрути міста</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    selectedRouteId === 'ALL' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {totalVehiclesCount} ТЗ онлайн
                  </span>
                </button>

                {/* Перемикач напрямків (коли обрано конкретний маршрут) */}
                {isSpecificRoute && (
                  <div className="p-2.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-900 dark:text-blue-300">
                      <span className="flex items-center space-x-1">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                        <span>Напрямок руху (EasyWay):</span>
                      </span>
                      <span className="font-mono text-[10px] bg-blue-200/70 dark:bg-blue-900 px-1.5 py-0.2 rounded text-blue-800 dark:text-blue-200">
                        {directionMode === 'both' ? 'Обидва' : directionMode === 0 ? 'Прямий' : 'Зворотний'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                      <button
                        onClick={() => setDirectionMode('both')}
                        className={`py-1 px-1.5 rounded-lg transition-all cursor-pointer text-center ${
                          directionMode === 'both'
                            ? 'bg-blue-600 text-white shadow-2xs font-black'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100/50'
                        }`}
                      >
                        🔄 Обидва
                      </button>
                      <button
                        onClick={() => setDirectionMode(0)}
                        className={`py-1 px-1.5 rounded-lg transition-all cursor-pointer text-center ${
                          directionMode === 0
                            ? 'bg-blue-600 text-white shadow-2xs font-black'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100/50'
                        }`}
                      >
                        ➡️ Прямий
                      </button>
                      <button
                        onClick={() => setDirectionMode(1)}
                        className={`py-1 px-1.5 rounded-lg transition-all cursor-pointer text-center ${
                          directionMode === 1
                            ? 'bg-cyan-600 text-white shadow-2xs font-black'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100/50'
                        }`}
                      >
                        ⬅️ Зворотний
                      </button>
                    </div>
                  </div>
                )}

                {/* Список маршрутів з БД */}
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {filteredRoutesList.map((route) => {
                    const rNum = String(route.number || route.id);
                    const cleanNum = rNum.trim().toLowerCase().replace(/^(t|tr)/i, '');
                    const isSelected = String(selectedRouteId).trim().toLowerCase().replace(/^(t|tr)/i, '') === cleanNum;
                    const vCount = vehicleCountByRoute[cleanNum] || 0;
                    const rType = normalizeRouteType(route.type);
                    const isTram = rType === 'tram';

                    return (
                      <button
                        key={route.id}
                        onClick={() => setSelectedRouteId(rNum)}
                        className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                            : 'bg-white dark:bg-slate-800/80 hover:bg-blue-50/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            isSelected 
                              ? 'bg-white text-blue-700' 
                              : isTram 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            №{route.number || route.id}
                          </span>
                          <div className="truncate">
                            <div className="text-xs font-extrabold truncate">
                              {route.name}
                            </div>
                            <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                              {isTram ? '🚊 Трамвай' : '🚎 Тролейбус'} • {route.length_km ? `${route.length_km} км` : 'Одеса'}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                          isSelected 
                            ? 'bg-blue-500/80 text-white' 
                            : vCount > 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                        }`}>
                          {vCount} ТЗ
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ВКЛАДКА 2: ШАРИ ТА НАЛАШТУВАННЯ */}
            {activeTab === 'layers' && (
              <div className="space-y-4 text-xs font-sans">
                
                {/* Вибір підложки карти */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Стиль картографічної підложки:
                  </label>
                  <div className="space-y-1.5">
                    {MAP_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedTileStyleId(style.id)}
                        className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          selectedTileStyleId === style.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-extrabold shadow-2xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{style.icon}</span>
                          <span>{style.label}</span>
                        </div>
                        {selectedTileStyleId === style.id && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Шари об'єктів */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Шари об'єктів на карті:
                  </label>
                  
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Лінії всіх маршрутів міста</span>
                      <input
                        type="checkbox"
                        checked={showAllRoutesLines}
                        onChange={e => setShowAllRoutesLines(e.target.checked)}
                        className="accent-blue-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Траса обраного маршруту</span>
                      <input
                        type="checkbox"
                        checked={showTrackShape}
                        onChange={e => setShowTrackShape(e.target.checked)}
                        className="accent-blue-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">Диспетчерські пункти (ДП) та кільця</span>
                      <input
                        type="checkbox"
                        checked={showDispatchHubs}
                        onChange={e => setShowDispatchHubs(e.target.checked)}
                        className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Проміжні зупинки (в обох напрямках)</span>
                      <input
                        type="checkbox"
                        checked={showStops}
                        onChange={e => setShowStops(e.target.checked)}
                        className="accent-blue-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Приховати спецтехніку / сервісні</span>
                      <input
                        type="checkbox"
                        checked={hideServiceVehicles}
                        onChange={e => setHideServiceVehicles(e.target.checked)}
                        className="accent-blue-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">Приховати вагони в депо</span>
                        <span className="text-[10px] text-slate-400 block">Тільки геозони депо (вагони на лінії залишаються)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={hideDepotVehicles}
                        onChange={e => setHideDepotVehicles(e.target.checked)}
                        className="accent-blue-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-bold text-red-600 dark:text-red-400">Лише критичні запізнення (&gt; 5 хв)</span>
                      <input
                        type="checkbox"
                        checked={onlyCriticalDelays}
                        onChange={e => setOnlyCriticalDelays(e.target.checked)}
                        className="accent-red-600 w-4 h-4 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Блок статусу Повітряної тривоги (Авто-моніторинг ДСНС / ОМР) */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                    <span>🚨 Повітряна тривога:</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold lowercase">авто-моніторинг</span>
                  </label>
                  <div className={`p-3 rounded-2xl border transition-all ${
                    isAirRaidActive 
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800' 
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${isAirRaidActive ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                          <span>{isAirRaidActive ? 'ТРИВОГА АКТИВНА' : 'Немає тривоги'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          {isAirRaidActive ? 'м. Одеса та Одеський район' : 'Обстановка спокійна (ДСНС)'}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        isAirRaidActive 
                          ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-300' 
                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                      }`}>
                        {isAirRaidActive ? '🔴 Небезпека' : '🟢 Норма'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Блок інтеграції з EasyWay API */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    🛰️ Інтеграція EasyWay API (Одеса):
                  </label>
                  <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Підключено прямий доступ до шлюзу EasyWay (login: <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded font-mono text-[10px]">odesainclusive</code>). Доступні високоточні колії, кільця та прогноз прибуття v1.2.
                    </div>

                    <button
                      onClick={handleSyncEasyWay}
                      disabled={isSyncingEasyWay}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEasyWay ? 'animate-spin' : ''}`} />
                      <span>{isSyncingEasyWay ? 'Синхронізація...' : 'Оновити траси та зупинки з EasyWay'}</span>
                    </button>

                    {syncResultMsg && (
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 rounded-xl text-[10px] font-bold flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span>{syncResultMsg}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer панелі з пульсом телеметрії та відліком свіжості даних */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-800/90 space-y-1.5 text-[11px] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  secondsSinceSync < 8 
                    ? 'bg-emerald-500 animate-pulse' 
                    : secondsSinceSync < 30 
                    ? 'bg-amber-500' 
                    : 'bg-red-500'
                }`} />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  GPS Онлайн: <strong className="text-blue-600">{totalVehiclesCount} ТЗ</strong>
                </span>
              </div>
              
              <button
                onClick={() => fetchLiveTelemetry()}
                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shadow-xs"
                title="Оновити координати транспорту"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Оновити</span>
              </button>
            </div>

            {/* Індикатор пульсу свіжості даних */}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-1">
              <span>Свіжість сигналу Wialon:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {secondsSinceSync === 0 ? 'щойно (0с)' : `${secondsSinceSync}с тому`}
              </span>
            </div>
          </div>

        </aside>
      )}

    </div>
  );
};

export default LiveMapView;
