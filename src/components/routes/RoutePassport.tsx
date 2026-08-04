import React, { useState } from 'react';
import { Route, RouteStatus } from '../../types';
import { useStationStore } from '../../store/useStationStore';
import { 
  FileText, 
  MapPin, 
  Navigation, 
  Bus, 
  Plus, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Layers,
  ListOrdered,
  Edit3
} from 'lucide-react';

interface RoutePassportProps {
  route: Route;
  onUpdateRoute: (updatedRoute: Route) => void;
}

export const RoutePassport: React.FC<RoutePassportProps> = ({
  route,
  onUpdateRoute,
}) => {
  const stations = useStationStore(state => state.stations);
  const [selectedNewStationId, setSelectedNewStationId] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const primaryTerminal = stations.find((s) => s.id === route.primaryTerminalId)?.name || route.primaryTerminalId;
  const secondaryTerminal = stations.find((s) => s.id === route.secondaryTerminalId)?.name || route.secondaryTerminalId;

  // Add a new station to route stations sequence
  const handleAddStation = () => {
    if (!selectedNewStationId) return;
    if (route.stations.includes(selectedNewStationId)) {
      alert('Ця зупинка вже додана до даного маршруту!');
      return;
    }

    const updatedStations = [...route.stations, selectedNewStationId];
    
    // Automatically generate a new default segment if needed
    const lastStationId = route.stations[route.stations.length - 1];
    let updatedSegments = [...route.segments];

    if (lastStationId) {
      updatedSegments.push({
        fromStationId: lastStationId,
        toStationId: selectedNewStationId,
        distanceKm: 2.0,
        baseTravelTimes: {
          morning_exit: 5,
          morning_peak: 8,
          off_peak: 6,
          evening_peak: 9,
          evening_decline: 5,
        },
        trafficLightCount: 2,
        avgTrafficLightDelayMin: 1.0,
        isSharedSegment: false,
        sharedWithRoutes: [],
      });
    }

    onUpdateRoute({
      ...route,
      stations: updatedStations,
      segments: updatedSegments,
    });

    setSelectedNewStationId('');
  };

  // Remove a station from route
  const handleRemoveStation = (stationId: string) => {
    if (route.stations.length <= 2) {
      alert('Маршрут повинен мати принаймні 2 зупинки (початкову та кінцеву)!');
      return;
    }

    const updatedStations = route.stations.filter((id) => id !== stationId);
    // Filter segments that feature this station
    const updatedSegments = route.segments.filter(
      (s) => s.fromStationId !== stationId && s.toStationId !== stationId
    );

    onUpdateRoute({
      ...route,
      stations: updatedStations,
      segments: updatedSegments,
    });
  };

  return (
    <div className="space-y-6">
      {/* Passport Header Banner */}
      <div className="bg-white border-2 border-gray-900 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-3 py-1 rounded-md font-mono font-bold text-sm border ${
                route.type === 'tram'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-300'
              }`}
            >
              {route.type === 'tram' ? 'Трамвай №' : 'Тролейбус №'}{route.number}
            </span>
            {isEditMode ? (
              <input
                type="text"
                value={route.name}
                onChange={(e) => onUpdateRoute({ ...route, name: e.target.value })}
                className="text-xl font-bold text-gray-900 border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-700 bg-gray-50 px-2 py-1 rounded-sm w-64"
                placeholder="Назва маршруту"
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900">{route.name}</h2>
            )}
          </div>
          <p className="text-xs text-gray-600 font-sans">{route.description || 'Паспорт технічно-експлуатаційних показників маршруту міського електротранспорту.'}</p>
        </div>
        
        {/* Actions */}
        <div className="shrink-0 flex items-center space-x-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-2 transition-colors border-2 ${
              isEditMode 
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            {isEditMode ? <CheckCircle2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{isEditMode ? 'Зберегти зміни' : 'Редагувати Паспорт'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Technical Specifications & Vehicles Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Main Specifications */}
        <div className="bg-white border-2 border-gray-900 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b-2 border-gray-200 pb-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Паспортні дані</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium">Тип рухомого складу:</span>
              <strong className="text-gray-900 uppercase font-mono">{route.type === 'tram' ? 'Трамвайний вагон' : 'Тролейбус'}</strong>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium">Довжина прямого напрямку (L1):</span>
              {isEditMode ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={route.lengthDir1Km}
                    onChange={(e) => onUpdateRoute({ ...route, lengthDir1Km: parseFloat(e.target.value) || 0 })}
                    className="w-20 text-right font-mono font-bold border border-gray-300 rounded px-2 py-1 text-xs"
                  />
                  <span className="font-mono text-gray-500">км</span>
                </div>
              ) : (
                <strong className="text-gray-900 font-mono font-bold">{route.lengthDir1Km} км</strong>
              )}
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium">Довжина зворотного напрямку (L2):</span>
              {isEditMode ? (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    step="0.1"
                    value={route.lengthDir2Km}
                    onChange={(e) => onUpdateRoute({ ...route, lengthDir2Km: parseFloat(e.target.value) || 0 })}
                    className="w-20 text-right font-mono font-bold border border-gray-300 rounded px-2 py-1 text-xs"
                  />
                  <span className="font-mono text-gray-500">км</span>
                </div>
              ) : (
                <strong className="text-gray-900 font-mono font-bold">{route.lengthDir2Km} км</strong>
              )}
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium">Кількість зупинок:</span>
              <strong className="text-indigo-600 font-mono font-bold text-sm">{route.stations.length}</strong>
            </div>

            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-gray-600 font-medium">Кількість перегонів:</span>
              <strong className="text-indigo-600 font-mono font-bold text-sm">{route.segments.length}</strong>
            </div>
          </div>
        </div>

        {/* Card 2: Terminal Stations & Hubs */}
        <div className="bg-white border-2 border-gray-900 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b-2 border-gray-200 pb-3">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Диспетчерські пункти та ДП</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg space-y-2">
              <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">Головний Диспетчерський Пункт (ДП1):</span>
              {isEditMode ? (
                <select
                  value={route.primaryTerminalId}
                  onChange={(e) => onUpdateRoute({ ...route, primaryTerminalId: e.target.value })}
                  className="w-full text-sm font-bold border border-emerald-300 rounded px-2 py-1 text-gray-900 bg-white"
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <div className="font-bold text-gray-900 text-sm flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                  <span>{primaryTerminal}</span>
                </div>
              )}
            </div>

            <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg space-y-2">
              <span className="text-[11px] text-sky-800 font-bold uppercase tracking-wider block">Протилежна Кінцева Станція (ДП2):</span>
              {isEditMode ? (
                <select
                  value={route.secondaryTerminalId}
                  onChange={(e) => onUpdateRoute({ ...route, secondaryTerminalId: e.target.value })}
                  className="w-full text-sm font-bold border border-sky-300 rounded px-2 py-1 text-gray-900 bg-white"
                >
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <div className="font-bold text-gray-900 text-sm flex items-center space-x-1">
                  <Navigation className="w-4 h-4 text-sky-600 inline" />
                  <span>{secondaryTerminal}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stations Sequence & Editor */}
      <div className="bg-white border-2 border-gray-900 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-gray-200 pb-4">
          <div className="flex items-center space-x-2">
            <ListOrdered className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-gray-900 text-base">
              Послідовність зупинок маршруту ({route.stations.length})
            </h3>
          </div>

          {/* Add Stop Dropdown Form */}
          {isEditMode && (
            <div className="flex items-center space-x-2">
              <select
                value={selectedNewStationId}
                onChange={(e) => setSelectedNewStationId(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-lg p-2 text-xs font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Оберіть зупинку для додавання --</option>
                {stations.filter((st) => !route.stations.includes(st.id)).map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code}) {st.isTerminal ? '[Кінцева/ДП]' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddStation}
                disabled={!selectedNewStationId}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold border border-emerald-700 shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Додати зупинку</span>
              </button>
            </div>
          )}
        </div>

        {/* Stations Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {route.stations.map((stId, index) => {
            const stationObj = stations.find((s) => s.id === stId);
            const stationName = stationObj?.name || stId;
            const isFirst = index === 0;
            const isLast = index === route.stations.length - 1;

            return (
              <div
                key={`${stId}_${index}`}
                className={`border-2 p-3.5 rounded-xl flex items-center justify-between transition-all ${
                  isFirst || isLast
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      isFirst || isLast
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">{stationName}</div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {isFirst ? '★ ДП Початкова' : isLast ? '★ ДП Кінцева' : stationObj?.code || 'Проміжна'}
                    </div>
                  </div>
                </div>

                {isEditMode && !isFirst && !isLast && (
                  <button
                    onClick={() => handleRemoveStation(stId)}
                    title="Видалити зупинку з маршруту"
                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
