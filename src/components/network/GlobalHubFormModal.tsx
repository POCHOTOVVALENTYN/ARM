import React, { useState } from 'react';
import { ControlPointNode, HubTrackChannel } from '../../types';
import { useStationStore } from '../../store/useStationStore';
import { Plus, Trash2, X } from 'lucide-react';

interface GlobalHubFormModalProps {
  hub: ControlPointNode | null;
  onSave: (hub: ControlPointNode) => void;
  onClose: () => void;
  existingHubIds: string[];
}

export const GlobalHubFormModal: React.FC<GlobalHubFormModalProps> = ({
  hub,
  onSave,
  onClose,
  existingHubIds
}) => {
  const stations = useStationStore(state => state.stations);
  
  const [id, setId] = useState(hub?.id || '');
  const [locationDescription, setLocationDescription] = useState(hub?.locationDescription || '');
  const [minHeadwayMin, setMinHeadwayMin] = useState(hub?.minHeadwayMin || 2);
  const [channels, setChannels] = useState<HubTrackChannel[]>(hub?.channels || []);

  const isEdit = !!hub;

  // For new hubs, only show stations that aren't already hubs
  const availableStations = isEdit 
    ? stations.filter(s => s.id === id) 
    : stations.filter(s => !existingHubIds.includes(s.id));

  const handleAddChannel = () => {
    setChannels([
      ...channels,
      {
        trackId: `track_${Date.now()}`,
        name: `Колія ${channels.length + 1}`,
        maxCapacity: 1,
        directionVector: ''
      }
    ]);
  };

  const handleUpdateChannel = (trackId: string, updates: Partial<HubTrackChannel>) => {
    setChannels(channels.map(ch => ch.trackId === trackId ? { ...ch, ...updates } : ch));
  };

  const handleRemoveChannel = (trackId: string) => {
    setChannels(channels.filter(ch => ch.trackId !== trackId));
  };

  const handleSave = () => {
    if (!id) return;
    
    const station = stations.find(s => s.id === id);
    if (!station) return;

    const newHub: ControlPointNode = {
      id: station.id,
      name: station.name, // Name is taken from the station
      locationDescription,
      availableTracksCount: channels.length,
      channels,
      minHeadwayMin,
      routesConnecting: hub?.routesConnecting || [] // Keep existing routes if editing
    };

    onSave(newHub);
  };

  const isValid = id && channels.length > 0 && minHeadwayMin > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? 'Редагувати глобальний вузол' : 'Створити новий глобальний вузол'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Base Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Основна інформація</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Базова зупинка *</label>
                <select
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={isEdit}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">-- Оберіть зупинку --</option>
                  {availableStations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Мінімальний інтервал (min headway), хв *</label>
                <input
                  type="number"
                  min="1"
                  value={minHeadwayMin}
                  onChange={(e) => setMinHeadwayMin(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Опис локації (опціонально)</label>
                <input
                  type="text"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  placeholder="Наприклад: Кільце біля залізничного вокзалу"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Channels / Tracks */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Колії / Канали відстою *</h3>
              <button
                onClick={handleAddChannel}
                className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3 h-3" />
                <span>Додати колію</span>
              </button>
            </div>

            {channels.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-500 italic bg-gray-50 rounded-lg border border-gray-200">
                Додайте хоча б одну колію (канал) для цього вузла.
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((ch, idx) => (
                  <div key={ch.trackId} className="flex items-start gap-3 bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Назва колії</label>
                        <input
                          type="text"
                          value={ch.name}
                          onChange={(e) => handleUpdateChannel(ch.trackId, { name: e.target.value })}
                          className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Напрямок (опц.)</label>
                        <input
                          type="text"
                          value={ch.directionVector}
                          onChange={(e) => handleUpdateChannel(ch.trackId, { directionVector: e.target.value })}
                          placeholder="Наприклад: Південь"
                          className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Місткість (ТЗ)</label>
                        <input
                          type="number"
                          min="1"
                          value={ch.maxCapacity}
                          onChange={(e) => handleUpdateChannel(ch.trackId, { maxCapacity: parseInt(e.target.value) || 1 })}
                          className="w-full border border-gray-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveChannel(ch.trackId)}
                      className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                      title="Видалити колію"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Зберегти вузол
          </button>
        </div>
      </div>
    </div>
  );
};
