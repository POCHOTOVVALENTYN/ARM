import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, ZoomControl, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useStationStore } from '../../store/useStationStore';
import { useRouteStore } from '../../store/useRouteStore';
import { TelemetryMarkers } from '../dispatcher/TelemetryMarkers';
import { IncidentDirectory } from '../dispatcher/IncidentDirectory';
import { MapPin, Bus, Zap, Clock, AlertCircle, Clock3, Filter, CheckCircle2, RefreshCw } from 'lucide-react';

// Fix for default Leaflet marker assets in React/Vite builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LiveMapViewProps {
  activeRouteId?: string;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({ activeRouteId: propActiveRouteId }) => {
  const { mapTileUrl, mapAttribution, enterpriseLogoUrl } = useSettingsStore();
  const { stops, liveSchedule, updateTripDeparture } = useScheduleStore();
  const routes = useRouteStore((state) => state.routes);

  const [routeFilter, setRouteFilter] = useState<string>(propActiveRouteId || 'ALL');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Центр Одеси (вузлова розв'язка Старосінна / Вокзал)
  const ODESSA_CENTER: [number, number] = [46.4750, 30.7350];

  const activeRouteObj = useMemo(() => {
    if (routeFilter === 'ALL') return null;
    return routes.find((r) => r.id.toLowerCase() === routeFilter.toLowerCase() || r.number === routeFilter);
  }, [routeFilter, routes]);

  // Маршрутні зупинки
  const displayedStops = useMemo(() => {
    if (routeFilter === 'ALL' || !activeRouteObj) {
      return [
        { id: '708889', name: 'Старосінна площа', lat: 46.4668, lng: 30.7382, isHub: true },
        { id: '708884', name: 'пл. Тираспольська', lat: 46.4786, lng: 30.7318, isHub: true },
        { id: '687088', name: 'станція Застава I', lat: 46.4691, lng: 30.6687, isHub: false },
        { id: '708879', name: 'Пересипський міст', lat: 46.4982, lng: 30.7233, isHub: true },
        { id: '708758', name: 'вул. Паустовського', lat: 46.5974, lng: 30.8041, isHub: true },
        { id: '708912', name: '11-а ст. Люстдорфської дороги', lat: 46.3824, lng: 30.7143, isHub: true },
        { id: '708921', name: 'селище Люстдорф', lat: 46.3503, lng: 30.7012, isHub: false },
      ];
    }

    const stationIdSet = new Set(activeRouteObj.stations || []);
    const stopsList = stops.filter((s) => stationIdSet.has(s.id));
    if (stopsList.length === 0) {
      return stops.slice(0, 15);
    }
    return stopsList.map((s) => ({
      ...s,
      lng: s.lng || 30.73,
      isHub: s.isTerminal || false,
    }));
  }, [routeFilter, activeRouteObj, stops]);

  // Координати для відображення лінії маршруту Polyline
  const polylinePositions: [number, number][] = useMemo(() => {
    return displayedStops.map((st) => [st.lat, st.lng]);
  }, [displayedStops]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] uppercase">
                Live GIS • Leaflet
              </span>
              <h2 className="text-base font-extrabold text-white">
                Оперативна ГІС-Карта Руху КП «ОМЕТ»
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Моніторинг Wialon GPS телеметрії в реальному часі (60 FPS, нативний Leaflet шар)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs font-bold">
          <span className="bg-emerald-950/80 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-800 flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Wialon Online</span>
          </span>
        </div>
      </div>

      {/* Filter Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-extrabold text-slate-900">Коридорний фільтр маршруту:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setRouteFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition-all ${
                routeFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              Всі маршрути (Мережа)
            </button>

            {['7', '18', '28', '5', '3'].map((r) => (
              <button
                key={r}
                onClick={() => setRouteFilter(r)}
                className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition-all ${
                  routeFilter === r
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200'
                }`}
              >
                Трамвай №{r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Leaflet Map & Info / Incident Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-3 bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden relative min-h-[600px] flex flex-col">
          {/* Top Map Status Overlay */}
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200 flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="text-xs font-bold text-slate-900">
              {routeFilter === 'ALL' ? 'Загальна схема ліній' : `Маршрут №${routeFilter}`}
            </span>
          </div>

          {/* Enterprise Logo Overlay if configured */}
          {enterpriseLogoUrl && (
            <div className="absolute bottom-6 left-4 z-[1000] bg-white/90 p-2 rounded-xl shadow border border-slate-200">
              <img src={enterpriseLogoUrl} alt="Логотип КП ОМЕТ" className="h-10 object-contain" />
            </div>
          )}

          {/* Telemetry Status Legend */}
          <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-slate-200 text-xs pointer-events-none">
            <h4 className="font-extrabold text-slate-900 mb-2 uppercase tracking-wider text-[10px]">
              Статус відхилення від графіка
            </h4>
            <div className="space-y-1.5 text-[11px] font-bold">
              <div className="flex items-center space-x-2 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                <span>У графіку (±2 хв)</span>
              </div>
              <div className="flex items-center space-x-2 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
                <span>Запізнення (&gt; 2 хв)</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200"></span>
                <span>Нагін (&lt; -2 хв)</span>
              </div>
              <div className="flex items-center space-x-2 text-amber-700 pt-1.5 border-t border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 animate-pulse"></span>
                <span className="font-bold">Об'їзд (НС / DETOUR)</span>
              </div>
            </div>
          </div>

          {/* Leaflet MapContainer */}
          <div className="flex-1 w-full h-[600px] z-0">
            <MapContainer
              center={ODESSA_CENTER}
              zoom={13}
              className="w-full h-full"
              zoomControl={false}
            >
              <ZoomControl position="bottomright" />
              
              <TileLayer
                attribution={mapAttribution}
                url={mapTileUrl}
              />

              {/* Маршрутна полілінія */}
              {polylinePositions.length > 1 && (
                <Polyline
                  positions={polylinePositions}
                  pathOptions={{
                    color: routeFilter === 'ALL' ? '#3b82f6' : '#2563eb',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: routeFilter === 'ALL' ? '4, 8' : undefined,
                  }}
                />
              )}

              {/* Зупинки та вузли */}
              {displayedStops.map((st, idx) => (
                <CircleMarker
                  key={st.id || idx}
                  center={[st.lat, st.lng]}
                  radius={st.isHub ? 6 : 4}
                  pathOptions={{
                    fillColor: st.isHub ? '#f59e0b' : '#3b82f6',
                    fillOpacity: 0.9,
                    color: '#ffffff',
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="p-1 font-sans text-xs">
                      <strong className="block text-slate-900 font-extrabold">{st.name}</strong>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {st.isHub ? 'Вузлова пересадочна станція' : 'Проміжна зупинка'}
                      </span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Шар високошвидкісних маркерів телеметрії (O(1) Leaflet imperative updates) */}
              <TelemetryMarkers activeRouteId={routeFilter === 'ALL' ? null : routeFilter} />
            </MapContainer>
          </div>
        </div>

        {/* Sidebar: Incident Directory & Vehicle Dispatch Status */}
        <div className="flex flex-col space-y-6 lg:col-span-1">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b pb-2 flex items-center space-x-2">
              <Bus className="w-4 h-4 text-blue-600" />
              <span>Параметри лінії КП «ОМЕТ»</span>
            </h3>

            <div className="space-y-2 text-xs font-medium text-slate-700">
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span>Вибраний коридор:</span>
                <strong className="text-slate-900 font-bold">{routeFilter === 'ALL' ? 'Вся мережа' : `Маршрут ${routeFilter}`}</strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span>Контрольних точок:</span>
                <strong className="text-slate-900 font-bold">{displayedStops.length}</strong>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                <span>Частота оновлення:</span>
                <strong className="text-emerald-700 font-bold">кожні 10 сек</strong>
              </div>
            </div>
          </div>

          {/* Directory of Active Incidents */}
          <IncidentDirectory />
        </div>
      </div>
    </div>
  );
};

export default LiveMapView;
