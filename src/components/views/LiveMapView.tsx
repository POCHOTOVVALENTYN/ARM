import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, ZoomControl, Polyline, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useStationStore } from '../../store/useStationStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { TelemetryMarkers } from '../dispatcher/TelemetryMarkers';
import { IncidentDirectory } from '../dispatcher/IncidentDirectory';
import { DispatcherLiveView } from './DispatcherLiveView';
import { 
  MapPin, 
  Bus, 
  Zap, 
  Clock, 
  AlertCircle, 
  Clock3, 
  Filter, 
  CheckCircle2, 
  RefreshCw,
  Table as TableIcon,
  Layers
} from 'lucide-react';

import { useRouteShape } from '../../hooks/useRouteQueries';

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
  const { mapTileUrl, mapAttribution } = useSettingsStore();
  const { stops } = useScheduleStore();
  const routes = useRouteStore((state) => state.routes);
  const fetchLiveTelemetry = useTelemetryStore((state) => state.fetchLiveTelemetry);

  const [viewMode, setViewMode] = useState<'map' | 'matrix'>('map');
  const [routeFilter, setRouteFilter] = useState<string>(propActiveRouteId || 'ALL');
  const [hideServiceVehicles, setHideServiceVehicles] = useState<boolean>(true);
  const [hideDepotVehicles, setHideDepotVehicles] = useState<boolean>(false);

  // Periodically fetch live telemetry to keep store and Leaflet map updated
  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(() => {
      fetchLiveTelemetry();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveTelemetry]);

  const isSpecificRoute = routeFilter && routeFilter !== 'ALL' && routeFilter !== 'all';

  // Завантажуємо реальну GTFS геометрію тільки для конкретно обраного маршруту
  const { data: routeShape } = useRouteShape(isSpecificRoute ? routeFilter : null, 0);

  // Центр Одеси (вузлова розв'язка Старосінна / Вокзал)
  const ODESSA_CENTER: [number, number] = [46.4750, 30.7350];

  const activeRouteObj = useMemo(() => {
    if (!isSpecificRoute) return null;
    return routes.find((r) => r.id.toLowerCase() === routeFilter.toLowerCase() || r.number === routeFilter);
  }, [isSpecificRoute, routeFilter, routes]);

  // Маршрутні зупинки
  const displayedStops = useMemo(() => {
    if (!isSpecificRoute || !activeRouteObj) {
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
  }, [isSpecificRoute, activeRouteObj, stops]);

  // Координати для відображення лінії маршруту GTFS
  const polylinePositions: [number, number][] = useMemo(() => {
    if (isSpecificRoute && routeShape && routeShape.length > 0) {
      return routeShape.map((pt) => [pt.lat, pt.lng] as [number, number]);
    }
    return [];
  }, [isSpecificRoute, routeShape]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Controls & View Mode Toggle Header */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500 text-slate-950 font-black px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                Wialon GPS • GTFS-RT Live
              </span>
              <h2 className="text-base font-black text-white tracking-tight">
                Оперативна Карта та Пульт Руху КП «ОМЕТ»
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Моніторинг Wialon GPS телеметрії в реальному часі, інфраструктурні хаби та матриця відхилень ($\Delta t$)
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-blue-200" />
            <span>🗺️ ГІС-Карта Wialon</span>
          </button>

          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-2 transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4 text-indigo-200" />
            <span>📋 CAD/AVL Матриця & Відхилення</span>
          </button>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        <DispatcherLiveView />
      ) : (
        <div className="space-y-6">
          {/* Filter Selector Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">Маршрутний фільтр ГІС-карти:</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                <button
                  onClick={() => setRouteFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl border font-bold cursor-pointer transition-all ${
                    routeFilter === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-black'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Усі маршрути
                </button>

                {['7', '18', '28', '5', '8', '3'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRouteFilter(r)}
                    className={`px-3 py-1.5 rounded-xl border font-bold cursor-pointer transition-all ${
                      routeFilter === r
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-black'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    №{r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Leaflet Live GIS Map Canvas */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 h-[650px] z-0">
            <MapContainer
              center={ODESSA_CENTER}
              zoom={12}
              zoomControl={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution={mapAttribution}
                url={mapTileUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
              />

              <ZoomControl position="topright" />

              {/* GTFS Polyline geometry for specific route */}
              {polylinePositions.length > 0 && (
                <Polyline
                  positions={polylinePositions}
                  pathOptions={{
                    color: '#2563eb',
                    weight: 5,
                    opacity: 0.85,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              )}

              {/* Station Circle Markers */}
              {displayedStops.map((stop) => (
                <CircleMarker
                  key={stop.id}
                  center={[stop.lat, stop.lng]}
                  radius={stop.isHub ? 7 : 4}
                  pathOptions={{
                    fillColor: stop.isHub ? '#4f46e5' : '#38bdf8',
                    color: '#ffffff',
                    weight: 2,
                    fillOpacity: 0.9,
                  }}
                >
                  <Popup className="font-sans text-xs">
                    <div className="p-1 space-y-1">
                      <div className="font-extrabold text-slate-900">{stop.name}</div>
                      <div className="text-[10px] text-indigo-600 font-bold">
                        {stop.isHub ? '🚏 Диспетчерський Вузол / ДП' : 'Зупинка'}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Live Telemetry Vehicle Markers */}
              <TelemetryMarkers
                activeRouteId={routeFilter}
                hideServiceVehicles={hideServiceVehicles}
                hideDepotVehicles={hideDepotVehicles}
              />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMapView;
