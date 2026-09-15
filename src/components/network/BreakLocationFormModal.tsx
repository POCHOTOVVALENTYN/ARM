import React, { useState, useEffect } from 'react'
import { BreakLocationConfig } from '../../types'
import { api as apiClient } from '../../utils/apiClient'
import { X, MapPin, AlertCircle } from 'lucide-react'

interface BreakLocationFormModalProps {
  routeId: string
  existingConfig: BreakLocationConfig | null
  onSave: (config: Omit<BreakLocationConfig, 'id'> | BreakLocationConfig) => void
  onClose: () => void
}

interface RouteStopOption {
  id: string
  name: string
  type: 'stop'
}

export const BreakLocationFormModal: React.FC<BreakLocationFormModalProps> = ({
  routeId,
  existingConfig,
  onSave,
  onClose
}) => {
  const isEdit = !!existingConfig

  // Form state
  const [locationId, setLocationId] = useState(existingConfig?.locationId || '')
  const [maxCapacityVehicles, setMaxCapacityVehicles] = useState(existingConfig?.maxCapacityVehicles || 2)
  const [durationMin, setDurationMin] = useState(existingConfig?.durationMin || 45)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Реальні, авторитетні зупинки маршруту (напрямок 0) з БД
  // (route_stations/stations у omet.db) — той самий ендпоінт, що вже
  // використовується в Конструкторі нарядів для «Станції старту». ДП
  // визначається прапорцем is_dispatch_station з бекенду, а не окремим
  // (раніше відключеним) useControlPointStore.
  const [dispatchPoints, setDispatchPoints] = useState<RouteStopOption[]>([])
  const [terminals, setTerminals] = useState<RouteStopOption[]>([])
  const [intermediates, setIntermediates] = useState<RouteStopOption[]>([])
  const [isLoadingStops, setIsLoadingStops] = useState(true)

  useEffect(() => {
    let isMounted = true
    setIsLoadingStops(true)
    const cleanId = String(routeId).trim().replace(/^(T|Tr)/i, '')
    apiClient
      .get<{ stops: { stop_id: string; name: string; is_dispatch_station?: boolean }[] }>(`/routes/${cleanId}/stops`, {
        params: { direction_id: 0 }
      })
      .then(({ data }) => {
        if (!isMounted) return
        const stops = data?.stops || []
        const dp: RouteStopOption[] = []
        const term: RouteStopOption[] = []
        const mid: RouteStopOption[] = []
        stops.forEach((s, idx) => {
          const item: RouteStopOption = { id: s.stop_id, name: s.name, type: 'stop' }
          if (s.is_dispatch_station) {
            dp.push(item)
          } else if (idx === 0 || idx === stops.length - 1) {
            term.push(item)
          } else {
            mid.push(item)
          }
        })
        setDispatchPoints(dp)
        setTerminals(term)
        setIntermediates(mid)
      })
      .catch((err) => {
        console.warn(`[BreakLocationFormModal] Не вдалося отримати зупинки маршруту ${routeId} з БД:`, err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingStops(false)
      })
    return () => {
      isMounted = false
    }
  }, [routeId])

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

  const handleSave = () => {
    setErrorMessage(null)

    if (!locationId) {
      setErrorMessage('Оберіть локацію для організації обідньої перерви.')
      return
    }

    if (maxCapacityVehicles <= 0 || maxCapacityVehicles > 20) {
      setErrorMessage('Місткість відстою повинна бути в межах від 1 до 20 ТЗ.')
      return
    }

    if (durationMin < 15 || durationMin > 120) {
      setErrorMessage('Тривалість обіду за нормативами КЗпП повинна бути від 15 до 120 хвилин.')
      return
    }

    // Determine location type and name
    let locName = ''
    let locType: 'dispatch_point' | 'opposite_terminal' | 'global_hub' = 'dispatch_point'

    const dp = dispatchPoints.find(dp => dp.id === locationId)
    if (dp) {
      locName = dp.name
      locType = 'dispatch_point'
    } else {
      const isTerminal = terminals.find(t => t.id === locationId)
      const isIntermediate = intermediates.find(i => i.id === locationId)
      
      if (isTerminal) {
        locName = isTerminal.name
        locType = 'opposite_terminal'
      } else if (isIntermediate) {
        locName = isIntermediate.name
        locType = 'global_hub'
      }
    }

    if (isEdit && existingConfig) {
      onSave({
        ...existingConfig,
        locationId,
        locationName: locName,
        locationType: locType,
        maxCapacityVehicles: Math.round(maxCapacityVehicles),
        durationMin: Math.round(durationMin)
      })
    } else {
      onSave({
        routeId,
        locationId,
        locationName: locName,
        locationType: locType,
        maxCapacityVehicles: Math.round(maxCapacityVehicles),
        durationMin: Math.round(durationMin)
      })
    }
  }

  const isValid = locationId && maxCapacityVehicles > 0 && durationMin > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="break-modal-title"
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
          <h2 id="break-modal-title" className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            {isEdit ? 'Редагувати місце обіду' : 'Додати місце обіду'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Закрити модальне вікно"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3 rounded-xl flex items-center space-x-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Оберіть локацію (ДП або кінцеву) *
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={isLoadingStops}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              <option value="">{isLoadingStops ? 'Завантаження зупинок з БД…' : '-- Оберіть локацію --'}</option>

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
              <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start text-amber-900 dark:text-amber-200 text-xs">
                <span className="font-bold mr-1">Увага!</span>
                Призначення тривалої перерви на проміжній зупинці без об'їзної колії може заблокувати рух наступних вагонів.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Місткість (вагонів/машин) *
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxCapacityVehicles}
                onChange={(e) => setMaxCapacityVehicles(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Стандартний час (хв) *
              </label>
              <input
                type="number"
                min="15"
                max="120"
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value) || 15)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
            className="px-5 py-2.5 text-xs font-extrabold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  )
}

export default BreakLocationFormModal
