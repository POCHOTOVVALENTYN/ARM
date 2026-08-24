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

  // Фільтри та множинний вибір маршрутів
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>(
    propActiveRouteId && propActiveRouteId !== 'ALL' && propActiveRouteId !== 'all' 
      ? [propActiveRouteId.replace(/^(t|tr)/i, '').trim()] 
      : []
  );
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

  const singleSelectedRouteId = selectedRouteIds.length === 1 ? selectedRouteIds[0] : null;
  const isSpecificRoute = Boolean(singleSelectedRouteId);
  const hasMultipleSelected = selectedRouteIds.length > 1;
  const hasAnyRouteSelected = selectedRouteIds.length > 0;

  // 1. Завантажуємо всі геометрії маршрутів для відображення повної мережі міста в обох напрямках
  const { data: allShapes = [] } = useAllRouteShapes(true);

  // 2. Завантажуємо геометрії обох напрямків (0 і 1) для одиночного обраного маршруту
  const { data: bothShapesData } = useRouteBothShapes(isSpecificRoute ? singleSelectedRouteId : null);

  // 3. Завантажуємо точні зупинки для одиночного обраного маршруту з бекенду
  const dirParam = directionMode === 'both' ? undefined : directionMode;
  const { data: routeStopsFromApi = [] } = useRouteStops(isSpecificRoute ? singleSelectedRouteId : null, dirParam);

  const activeRouteObj = useMemo(() => {
    if (!singleSelectedRouteId) return null;
    return routes.find((r) => {
      const cleanId = String(r.id).toLowerCase().replace(/^(t|tr)/i, '');
      const cleanNum = String(r.number || '').toLowerCase().replace(/^(t|tr)/i, '');
      const target = String(singleSelectedRouteId).toLowerCase().replace(/^(t|tr)/i, '');
      return cleanId === target || cleanNum === target;
    });
  }, [singleSelectedRouteId, routes]);

  // Геометрії одиночного обраного маршруту для прямого (0) та зворотного (1) напрямків
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
    if (isSpecificRoute) {
      selectedRoutePolylines.forEach(p => pts.push(...p.positions));
      routeStopsFromApi.forEach(s => pts.push([s.lat, s.lng]));
    } else if (hasMultipleSelected) {
      allShapes.forEach(shape => {
        const rNum = String(shape.route_number || shape.route_id || '').toLowerCase().replace(/^(t|tr)/i, '');
        if (selectedRouteIds.includes(rNum)) {
          (shape.geometry || []).forEach(pt => pts.push([pt.lat, pt.lng]));
        }
      });
    }
    return pts;
  }, [isSpecificRoute, hasMultipleSelected, selectedRoutePolylines, routeStopsFromApi, allShapes, selectedRouteIds]);

  // Активний тайловий шар
  const activeTileStyle = MAP_STYLES.find(s => s.id === selectedTileStyleId) || MAP_STYLES[0];

  // Точний підрахунок кількості ТЗ (виключаючи депо та спецтехніку)
  const { vehicleCountByRoute, totalActivePassengerVehicles, tramActiveCount, trolleyActiveCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalActive = 0;
    let tramActive = 0;
    let trolleyActive = 0;

    Object.values(vehiclesMap).forEach(v => {
      const inDepot = v.status === 'IN_DEPOT' || v.route_id === 'DEPOT';
      const isService = v.is_service || v.route_number === 'SERVICE' || v.vehicle_type === 'SERVICE';
      if (inDepot || isService) return;

      const rNum = String(v.route_number || v.route_id || '').trim().toLowerCase().replace(/^(t|tr)/i, '');
      if (rNum && rNum !== 'service' && rNum !== 'depot') {
        const vType = v.vehicle_type === 'TROLLEYBUS' ? 'trolleybus' : 'tram';
        const typedKey = `${vType}_${rNum}`;
        counts[typedKey] = (counts[typedKey] || 0) + 1;
        counts[rNum] = (counts[rNum] || 0) + 1;
        totalActive += 1;
        if (v.vehicle_type === 'TROLLEYBUS') {
          trolleyActive += 1;
        } else {
          tramActive += 1;
        }
      }
    });

    return { 
      vehicleCountByRoute: counts, 
      totalActivePassengerVehicles: totalActive,
      tramActiveCount: tramActive,
      trolleyActiveCount: trolleyActive
    };
  }, [vehiclesMap]);

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

  // Підрахунок активних ТЗ для обраних маршрутів
  const selectedVehiclesCount = useMemo(() => {
    if (!hasAnyRouteSelected) return totalActivePassengerVehicles;
    return selectedRouteIds.reduce((sum, rId) => sum + (vehicleCountByRoute[rId] || 0), 0);
  }, [hasAnyRouteSelected, selectedRouteIds, vehicleCountByRoute, totalActivePassengerVehicles]);

  // Хендлери множинного вибору маршрутів
  const handleToggleRoute = (rNum: string) => {
    const clean = rNum.trim().toLowerCase().replace(/^(t|tr)/i, '');
    setSelectedRouteIds(prev => {
      const exists = prev.includes(clean);
      if (exists) {
        return prev.filter(id => id !== clean);
      } else {
        return [...prev, clean];
      }
    });
  };

  const handleSelectOnlyRoute = (rNum: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const clean = rNum.trim().toLowerCase().replace(/^(t|tr)/i, '');
    setSelectedRouteIds([clean]);
  };

  const handleSelectAllFiltered = () => {
    const allFilteredNums = filteredRoutesList.map(r => 
      String(r.number || r.id).trim().toLowerCase().replace(/^(t|tr)/i, '')
    );
    setSelectedRouteIds(allFilteredNums);
  };

  const handleClearSelection = () => {
    setSelectedRouteIds([]);
  };

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

          {/* Автоматичне фокусування на обраних маршрутах */}
          <MapBoundsController 
            selectedRouteId={selectedRouteIds.length === 1 ? selectedRouteIds[0] : (hasMultipleSelected ? selectedRouteIds.join(',') : 'ALL')} 
            allPoints={allFocusPoints} 
          />

          {/* 1.1 Відображення ліній усіх маршрутів мережі з підсвіткою обраних */}
          {showAllRoutesLines && allShapes.map((shape, idx) => {
            const isTram = shape.type === 'TRAM';
            const cleanShapeNum = String(shape.route_number || shape.route_id || '').trim().toLowerCase().replace(/^(t|tr)/i, '');
            const isSelected = selectedRouteIds.includes(cleanShapeNum);
            
            // Якщо є вибір маршрутів: вибрані підсвічуються яскраво, не вибрані делікатно приглушуються
            const opacity = hasAnyRouteSelected 
              ? (isSelected ? 0.95 : 0.14) 
              : (shape.direction_id === 0 ? 0.65 : 0.40);
            const weight = isSelected 
              ? (shape.direction_id === 0 ? 6 : 4.5) 
              : (hasAnyRouteSelected ? 2 : (shape.direction_id === 0 ? 3.5 : 2.5));
            const color = isSelected 
              ? (shape.direction_id === 0 ? '#2563eb' : '#0891b2') 
              : (shape.color || (isTram ? '#3b82f6' : '#10b981'));

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
                  dashArray: shape.direction_id === 1 && !isSelected ? '4, 6' : undefined,
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

          {/* 1.2 Підсвітка траси одиночного обраного маршруту в обох напрямках */}
          {showTrackShape && isSpecificRoute && selectedRoutePolylines.map((poly) => (
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
          {showStops && isSpecificRoute && routeStopsFromApi.map((stop, sIdx) => {
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
            selectedRouteIds={selectedRouteIds}
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
      <aside className={`absolute top-4 left-4 z-[1000] w-84 md:w-92 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[calc(100vh-160px)] transition-all duration-300 ${
        isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
      }`}>
        
        {/* Шапка бічної панелі */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Диспетчерський ГІС</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  LIVE
                </span>
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                КП «Одесміськелектротранс» • {totalActivePassengerVehicles} ТЗ на лінії
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Згорнути пульт"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Стрічка статусу GPS Wialon та EasyWay */}
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-medium shrink-0">
          <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold">GPS: {secondsSinceSync}с тому</span>
          </div>

          <button
            onClick={handleSyncEasyWay}
            disabled={isSyncingEasyWay}
            className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold hover:underline cursor-pointer disabled:opacity-50"
            title="Оновити актуальний реєстр рейсів та зупинок з EasyWay API"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingEasyWay ? 'animate-spin' : ''}`} />
            <span>{isSyncingEasyWay ? 'Синхронізація...' : 'Синхр. EasyWay'}</span>
          </button>
        </div>

        {syncResultMsg && (
          <div className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
            ✓ {syncResultMsg}
          </div>
        )}

        {/* Вкладки перемикання (Маршрути vs Шари) */}
        <div className="grid grid-cols-2 p-1.5 gap-1 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('routes')}
            className={`py-1.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'routes'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Маршрути ({hasAnyRouteSelected ? selectedRouteIds.length : 'Всі'})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('layers')}
            className={`py-1.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'layers'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Шари та Налаштування</span>
          </button>
        </div>

        {/* Вміст обраної вкладки */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          
          {/* ВКЛАДКА 1: МАРШРУТИ ТА МНОЖИННИЙ ВИБІР */}
          {activeTab === 'routes' && (
            <div className="space-y-3">
              
              {/* Фільтр типу транспорту з точними лічильниками */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-extrabold border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setRouteTypeFilter('all')}
                  className={`py-1 rounded-lg transition-all cursor-pointer ${
                    routeTypeFilter === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-black' : 'text-slate-500'
                  }`}
                >
                  Усі ({totalActivePassengerVehicles})
                </button>
                <button
                  onClick={() => setRouteTypeFilter('tram')}
                  className={`py-1 rounded-lg transition-all cursor-pointer ${
                    routeTypeFilter === 'tram' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs font-black' : 'text-slate-500'
                  }`}
                >
                  🚊 Трамваї ({tramActiveCount})
                </button>
                <button
                  onClick={() => setRouteTypeFilter('trolleybus')}
                  className={`py-1 rounded-lg transition-all cursor-pointer ${
                    routeTypeFilter === 'trolleybus' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs font-black' : 'text-slate-500'
                  }`}
                >
                  🚎 Тролейбуси ({trolleyActiveCount})
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

              {/* Панель швидкого вибору (Обрати всі / Скинути) */}
              <div className="flex items-center justify-between gap-1.5">
                <button
                  onClick={handleClearSelection}
                  className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-black flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                    !hasAnyRouteSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>🌐 Вся мережа ({totalActivePassengerVehicles} ТЗ)</span>
                </button>

                <button
                  onClick={handleSelectAllFiltered}
                  className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
                  title="Вибрати всі маршрути поточної вкладки"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Обрати всі</span>
                </button>
              </div>

              {/* Плашка активної вибірки маршрутів (якщо обрано > 0) */}
              {hasAnyRouteSelected && (
                <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-blue-950 dark:text-blue-200">
                    <span className="flex items-center space-x-1">
                      <Filter className="w-3.5 h-3.5 text-blue-600" />
                      <span>Обрано {selectedRouteIds.length} маршрут(ів):</span>
                    </span>
                    <span className="font-mono text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                      {selectedVehiclesCount} ТЗ на лінії
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                    {selectedRouteIds.map(id => (
                      <span 
                        key={id}
                        onClick={() => handleToggleRoute(id)}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 text-[10px] font-black cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                        title="Натисніть щоб зняти вибір"
                      >
                        <span>№{id}</span>
                        <span className="text-slate-400 hover:text-rose-600">✕</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Перемикач напрямків (коли обрано 1 конкретний маршрут) */}
              {isSpecificRoute && (
                <div className="p-2.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-900 dark:text-blue-300">
                    <span className="flex items-center space-x-1">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                      <span>Напрямок маршруту №{singleSelectedRouteId}:</span>
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

              {/* Список маршрутів із чекбоксами множинного вибору */}
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                {filteredRoutesList.map((route) => {
                  const rNum = String(route.number || route.id);
                  const cleanNum = rNum.trim().toLowerCase().replace(/^(t|tr)/i, '');
                  const isSelected = selectedRouteIds.includes(cleanNum);
                  const rType = normalizeRouteType(route.type);
                  const isTram = rType === 'tram';
                  const vCount = vehicleCountByRoute[`${rType}_${cleanNum}`] ?? (vehicleCountByRoute[cleanNum] || 0);

                  return (
                    <div
                      key={route.id}
                      onClick={() => handleToggleRoute(rNum)}
                      className={`w-full p-2 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                          : 'bg-white dark:bg-slate-800/80 hover:bg-blue-50/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        {/* Кастомний чекбокс */}
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-white border-white text-blue-600'
                            : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-900/50'
                        }`}>
                          {isSelected && <span className="text-[10px] font-black leading-none">✓</span>}
                        </div>

                        {/* Номер маршруту */}
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

                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        {/* Кнопка "Тільки цей" */}
                        <button
                          onClick={(e) => handleSelectOnlyRoute(rNum, e)}
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-white/20 text-white hover:bg-white/30'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-blue-100 hover:text-blue-700'
                          }`}
                          title="Показати тільки цей маршрут"
                        >
                          Тільки
                        </button>

                        {/* Лічильник активних бортів на лінії */}
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          isSelected 
                            ? 'bg-blue-500/80 text-white' 
                            : vCount > 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                        }`}>
                          {vCount} ТЗ
                        </span>
                      </div>
                    </div>
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
                  GPS Онлайн: <strong className="text-blue-600">{totalActivePassengerVehicles} ТЗ</strong>
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

    </div>
  );
};

export default LiveMapView;
