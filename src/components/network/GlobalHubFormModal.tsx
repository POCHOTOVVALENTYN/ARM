import React, { useState, useEffect } from 'react'
import { ControlPointNode, HubTrackChannel } from '../../types'
import { useStationStore } from '../../store/useStationStore'
import { Plus, Trash2, X, AlertCircle } from 'lucide-react'

interface GlobalHubFormModalProps {
  hub: ControlPointNode | null
  onSave: (hub: ControlPointNode) => void
  onClose: () => void
  existingHubIds: string[]
}

export const GlobalHubFormModal: React.FC<GlobalHubFormModalProps> = ({
  hub,
  onSave,
  onClose,
  existingHubIds
}) => {
  const stations = useStationStore(state => state.stations)
  
  const [id, setId] = useState(hub?.id || '')
  const [locationDescription, setLocationDescription] = useState(hub?.locationDescription || '')
  const [minHeadwayMin, setMinHeadwayMin] = useState(hub?.minHeadwayMin || 2)
  const [channels, setChannels] = useState<HubTrackChannel[]>(hub?.channels || [])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isEdit = !!hub

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // For new hubs, only show stations that aren't already hubs
  const availableStations = isEdit 
    ? stations.filter(s => s.id === id) 
    : stations.filter(s => !existingHubIds.includes(s.id))

  const handleAddChannel = () => {
    setChannels([
      ...channels,
      {
        trackId: `track_${Date.now()}`,
        name: `Колія ${channels.length + 1}`,
        maxCapacity: 1,
        directionVector: ''
      }
    ])
  }

  const handleUpdateChannel = (trackId: string, updates: Partial<HubTrackChannel>) => {
    setChannels(channels.map(ch => ch.trackId === trackId ? { ...ch, ...updates } : ch))
  }

  const handleRemoveChannel = (trackId: string) => {
    setChannels(channels.filter(ch => ch.trackId !== trackId))
  }

  const handleSave = () => {
    setErrorMessage(null)

    if (!id) {
      setErrorMessage('Оберіть базову зупинку для вузла.')
      return
    }

    if (minHeadwayMin <= 0 || minHeadwayMin > 60) {
      setErrorMessage('Мінімальний інтервал повинен бути в межах від 1 до 60 хвилин.')
      return
    }

    if (channels.length === 0) {
      setErrorMessage('Додайте хоча б один колійний канал для відстою чи маневру.')
      return
    }

    for (const ch of channels) {
      if (!ch.name.trim()) {
        setErrorMessage('Усі колії повинні мати назву.')
        return
      }
      if (ch.maxCapacity <= 0 || ch.maxCapacity > 20) {
        setErrorMessage(`Місткість колії «${ch.name}» повинна бути від 1 до 20 ТЗ.`)
        return
      }
    }
    
    const station = stations.find(s => s.id === id)
    if (!station) return

    const newHub: ControlPointNode = {
      id: station.id,
      name: station.name,
      locationDescription: locationDescription.trim(),
      availableTracksCount: channels.length,
      channels,
      minHeadwayMin: Math.round(minHeadwayMin),
      routesConnecting: hub?.routesConnecting || []
    }

    onSave(newHub)
  }

  const isValid = id && channels.length > 0 && minHeadwayMin > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-hub-modal-title"
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
          <h2 id="global-hub-modal-title" className="text-base font-extrabold text-slate-900 dark:text-white">
            {isEdit ? 'Редагувати глобальний вузол' : 'Створити новий глобальний вузол'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Закрити модальне вікно"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3 rounded-xl flex items-center space-x-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Base Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Основна інформація
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Базова зупинка *
                </label>
                <select
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={isEdit}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">-- Оберіть зупинку --</option>
                  {availableStations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Мінімальний інтервал (h_min), хв *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={minHeadwayMin}
                  onChange={(e) => setMinHeadwayMin(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Опис локації (опціонально)
                </label>
                <input
                  type="text"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  placeholder="Наприклад: Кільце біля залізничного вокзалу"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Channels / Tracks */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                Колії / Канали відстою *
              </h3>
              <button
                onClick={handleAddChannel}
                className="flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати колію</span>
              </button>
            </div>

            {channels.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                Додайте хоча б одну колію (канал) для цього вузла.
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((ch, idx) => (
                  <div key={ch.trackId} className="flex items-start gap-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl shadow-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Назва колії</label>
                        <input
                          type="text"
                          value={ch.name}
                          onChange={(e) => handleUpdateChannel(ch.trackId, { name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Напрямок (опц.)</label>
                        <input
                          type="text"
                          value={ch.directionVector}
                          onChange={(e) => handleUpdateChannel(ch.trackId, { directionVector: e.target.value })}
                          placeholder="Наприклад: Південь"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Місткість (ТЗ)</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={ch.maxCapacity}
                          onChange={(e) => handleUpdateChannel(ch.trackId, { maxCapacity: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg p-2 text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveChannel(ch.trackId)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
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

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            Зберегти вузол
          </button>
        </div>
      </div>
    </div>
  )
}

export default GlobalHubFormModal
