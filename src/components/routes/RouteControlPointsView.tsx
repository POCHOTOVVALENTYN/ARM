import React, { useState } from 'react';
import { Route, ControlPointNode, RouteControlPoint, TrackType, ControlPointType } from '../../types';
import { MapPin, Plus, Trash2, Zap } from 'lucide-react';
import { useStationStore } from '../../store/useStationStore';

interface RouteControlPointsViewProps {
  route: Route;
  controlPoints: ControlPointNode[];
  updateRoute: (route: Route) => void;
}

const TRACK_TYPES: { value: TrackType; label: string }[] = [
  { value: 'main_loop', label: 'Головне кільце' },
  { value: 'passing_loop', label: 'Обхідна / Обгінна колія' },
  { value: 'terminal', label: 'Кінцева (Висаджувально-посадкова)' },
  { value: 'idle', label: 'Відстій / Обіди' },
  { value: 'passenger_platform', label: 'Пасажирська платформа' }
];

const POINT_TYPES: { value: ControlPointType; label: string }[] = [
  { value: 'terminal', label: 'Кінцева' },
  { value: 'intermediate', label: 'Проміжна (Вузлова)' },
  { value: 'depot_access', label: 'Заїзд/Виїзд Депо' },
  { value: 'technical', label: 'Технічна' }
];

export const RouteControlPointsView: React.FC<RouteControlPointsViewProps> = ({ route, controlPoints, updateRoute }) => {
  const [selectedPointToAdd, setSelectedPointToAdd] = useState<string>('');

  const routePoints = route.controlPoints || [];

  const handleAddPoint = () => {
    if (!selectedPointToAdd) return;
    
    const newPoint: RouteControlPoint = {
      id: `rcp_${Date.now()}`,
      controlPointId: selectedPointToAdd,
      tracksCount: 1,
      trackType: 'main_loop',
      pointType: 'intermediate'
    };

    updateRoute({
      ...route,
      controlPoints: [...routePoints, newPoint]
    });
    
    setSelectedPointToAdd('');
  };

  const handleUpdatePoint = (id: string, updates: Partial<RouteControlPoint>) => {
    updateRoute({
      ...route,
      controlPoints: routePoints.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const handleRemovePoint = (id: string) => {
    updateRoute({
      ...route,
      controlPoints: routePoints.filter(p => p.id !== id)
    });
  };

  const getStationById = useStationStore(state => state.getStationById);

  // Available points are now the actual stations on this route
  const availablePointsToAdd = (route.allStations || route.stations || [])
    .map(stationId => getStationById(stationId))
    .filter(s => s !== undefined)
    .filter(station => !routePoints.some(rp => rp.controlPointId === station!.id));

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b-2 border-blue-200 pb-3">
        <h4 className="font-bold text-gray-900 text-base">Контрольні точки на маршруті: {route.type === 'tram' ? 'Тр' : 'Тб'} {route.number}</h4>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedPointToAdd}
            onChange={(e) => setSelectedPointToAdd(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg p-1.5 text-xs font-bold text-gray-700"
          >
            <option value="">-- Оберіть точку для додавання --</option>
            {availablePointsToAdd.map(cp => (
              <option key={cp.id} value={cp.id}>{cp.name}</option>
            ))}
          </select>
          <button
            onClick={handleAddPoint}
            disabled={!selectedPointToAdd}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Додати</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {routePoints.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm font-medium border-2 border-dashed border-blue-200 rounded-xl">
            До цього маршруту ще не додано жодної контрольної точки
          </div>
        ) : (
          routePoints.map(rp => {
            const stationInfo = getStationById(rp.controlPointId);
            const globalHubInfo = controlPoints.find(c => c.id === rp.controlPointId);
            const isComplexHub = !!globalHubInfo;
            const displayName = stationInfo?.name || globalHubInfo?.name || 'Невідома точка';
            const displayDesc = globalHubInfo?.locationDescription || `Зупинка: ${stationInfo?.name || ''}`;
            const maxTracks = globalHubInfo?.availableTracksCount || 1;

            return (
              <div key={rp.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-2 lg:col-span-1">
                    <div className="font-bold text-sm text-gray-900">{displayName}</div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-2" title={displayDesc}>
                      {displayDesc}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Тип контрольної точки</label>
                    <select
                      value={rp.pointType}
                      onChange={(e) => handleUpdatePoint(rp.id, { pointType: e.target.value as ControlPointType })}
                      className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {POINT_TYPES.map(pt => (
                        <option key={pt.value} value={pt.value}>{pt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Виділені колії (шт)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={maxTracks}
                        value={rp.tracksCount}
                        onChange={(e) => handleUpdatePoint(rp.id, { tracksCount: parseInt(e.target.value) || 1 })}
                        disabled={!isComplexHub}
                        className={`w-16 border rounded p-1.5 text-xs font-bold text-center focus:ring-1 focus:ring-blue-500 ${
                          !isComplexHub 
                            ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-gray-50 border-gray-300 text-gray-800'
                        }`}
                      />
                      <span className="text-[10px] text-gray-400">
                        {isComplexHub ? `з ${maxTracks}` : '(звичайна зупинка)'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Тип колії</label>
                    <select
                      value={rp.trackType}
                      onChange={(e) => handleUpdatePoint(rp.id, { trackType: e.target.value as TrackType })}
                      className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {TRACK_TYPES.map(tt => (
                        <option key={tt.value} value={tt.value}>{tt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => handleRemovePoint(rp.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors shrink-0 self-center cursor-pointer"
                  title="Видалити контрольну точку з маршруту"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
