import React, { useState } from 'react';
import { BreakLocationConfig } from '../../types';
import { useRouteStore } from '../../store/useRouteStore';
import { useStationStore } from '../../store/useStationStore';
import { useControlPointStore } from '../../store/useControlPointStore';
import { X, MapPin } from 'lucide-react';

interface BreakLocationFormModalProps {
  routeId: string;
  existingConfig: BreakLocationConfig | null;
  onSave: (config: Omit<BreakLocationConfig, 'id'> | BreakLocationConfig) => void;
  onClose: () => void;
}

export const BreakLocationFormModal: React.FC<BreakLocationFormModalProps> = ({
  routeId,
  existingConfig,
  onSave,
  onClose
}) => {
  const isEdit = !!existingConfig;
  
  // Stores
  const route = useRouteStore(state => state.routes.find(r => r.id === routeId));
  const stations = useStationStore(state => state.stations);
  const controlPoints = useControlPointStore(state => state.controlPoints);

  // Form state
  const [locationId, setLocationId] = useState(existingConfig?.locationId || '');
  const [maxCapacityVehicles, setMaxCapacityVehicles] = useState(existingConfig?.maxCapacityVehicles || 2);
  const [durationMin, setDurationMin] = useState(existingConfig?.durationMin || 45);

  // Prepare location options
  const dispatchPoints = controlPoints.map(cp => ({
    id: cp.id,
    name: cp.name,
    type: 'dispatch_point' as const
  }));

  const stopsSource = route?.allStations || route?.stations || [];
  
  const terminals: Array<{id: string, name: string, type: 'stop'}> = [];
  const intermediates: Array<{id: string, name: string, type: 'stop'}> = [];
  
  stopsSource.forEach(stationId => {
    const s = stations.find(st => st.id === stationId);
    const isTerminal = route?.primaryTerminalId === stationId || route?.secondaryTerminalId === stationId;
    const item = {
      id: stationId,
      name: s?.name || `Зупинка ${stationId}`,
      type: 'stop' as const
    };
    if (isTerminal) {
      terminals.push(item);
    } else {
      intermediates.push(item);
    }
  });

  const handleSave = () => {
    if (!locationId) return;

    // Determine location type and name
    let locName = '';
    let locType: 'dispatch_point' | 'opposite_terminal' | 'global_hub' = 'dispatch_point';

    const dp = dispatchPoints.find(dp => dp.id === locationId);
    if (dp) {
      locName = dp.name;
      locType = 'dispatch_point';
    } else {
      const isTerminal = terminals.find(t => t.id === locationId);
      const isIntermediate = intermediates.find(i => i.id === locationId);
      
      if (isTerminal) {
        locName = isTerminal.name;
        locType = 'opposite_terminal';
      } else if (isIntermediate) {
        locName = isIntermediate.name;
        locType = 'global_hub';
      }
    }

    if (isEdit && existingConfig) {
      onSave({
        ...existingConfig,
        locationId,
        locationName: locName,
        locationType: locType,
        maxCapacityVehicles,
        durationMin
      });
    } else {
      onSave({
        routeId,
        locationId,
        locationName: locName,
        locationType: locType,
        maxCapacityVehicles,
        durationMin
      });
    }
  };

  const isValid = locationId && maxCapacityVehicles > 0 && durationMin > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
            {isEdit ? 'Редагувати місце обіду' : 'Додати місце обіду'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Оберіть локацію (ДП або зупинку) *</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Оберіть локацію --</option>
              
              <optgroup label="Диспетчерські пункти (Глобальні)">
                {dispatchPoints.map(dp => (
                  <option key={dp.id} value={dp.id}>{dp.name}</option>
                ))}
              </optgroup>
              
              <optgroup label="Кінцеві зупинки">
                {terminals.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </optgroup>
              
              <optgroup label="Проміжні зупинки (ОБЕРЕЖНО)">
                {intermediates.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </optgroup>
            </select>

            {locationId && intermediates.find(i => i.id === locationId) && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start text-amber-800 text-xs">
                <span className="font-bold mr-1">Увага!</span>
                Призначення тривалої перерви на проміжній зупинці без об'їзної колії може заблокувати рух наступних вагонів.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Місткість (вагонів/машин) *</label>
              <input
                type="number"
                min="1"
                value={maxCapacityVehicles}
                onChange={(e) => setMaxCapacityVehicles(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Стандартний час (хв) *</label>
              <input
                type="number"
                min="1"
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
};
