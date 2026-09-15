import React, { useState, useEffect } from 'react'
import { Route, RouteStatus, TransportType } from '../../types'
import { useStationStore } from '../../store/useStationStore'
import { X, Navigation, Bus, Save, AlertCircle } from 'lucide-react'

interface RouteFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (routeData: Omit<Route, 'id'> | Route) => void
  initialRoute?: Route | null
}

export const RouteFormModal: React.FC<RouteFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialRoute,
}) => {
  const stations = useStationStore(state => state.stations)
  const [number, setNumber] = useState('')
  const [type, setType] = useState<TransportType>('tram')
  const [status, setStatus] = useState<RouteStatus>('active')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [primaryTerminalId, setPrimaryTerminalId] = useState('st_starosinna')
  const [secondaryTerminalId, setSecondaryTerminalId] = useState('st_lustdorf_11th')
  const [lengthDir1Km, setLengthDir1Km] = useState(10.0)
  const [lengthDir2Km, setLengthDir2Km] = useState(10.0)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (initialRoute) {
      setNumber(initialRoute.number)
      setType(initialRoute.type)
      setStatus(initialRoute.status || 'active')
      setName(initialRoute.name)
      setDescription(initialRoute.description || '')
      setPrimaryTerminalId(initialRoute.primaryTerminalId)
      setSecondaryTerminalId(initialRoute.secondaryTerminalId)
      setLengthDir1Km(initialRoute.lengthDir1Km)
      setLengthDir2Km(initialRoute.lengthDir2Km)
    } else {
      setNumber('')
      setType('tram')
      setStatus('active')
      setName('')
      setDescription('')
      setPrimaryTerminalId('st_starosinna')
      setSecondaryTerminalId('st_lustdorf_11th')
      setLengthDir1Km(10.0)
      setLengthDir2Km(10.0)
    }
    setErrorMsg('')
  }, [initialRoute, isOpen])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!number.trim()) {
      setErrorMsg('Будь ласка, вкажіть номер маршруту!')
      return
    }
    if (!name.trim()) {
      setErrorMsg('Будь ласка, вкажіть назву маршруту!')
      return
    }
    if (lengthDir1Km <= 0 || lengthDir2Km <= 0) {
      setErrorMsg('Довжина маршруту повинна бути більшою за 0 км!')
      return
    }
    if (lengthDir1Km > 100 || lengthDir2Km > 100) {
      setErrorMsg('Довжина маршруту не може перевищувати 100 км!')
      return
    }

    // Initial default stations sequence and segments if adding new
    const stationsList = initialRoute
      ? initialRoute.stations
      : [primaryTerminalId, secondaryTerminalId]

    const defaultSegments = initialRoute
      ? initialRoute.segments
      : [
          {
            fromStationId: primaryTerminalId,
            toStationId: secondaryTerminalId,
            distanceKm: lengthDir1Km,
            baseTravelTimes: {
              morning_exit: Math.round(lengthDir1Km * 2.5),
              morning_peak: Math.round(lengthDir1Km * 3.5),
              off_peak: Math.round(lengthDir1Km * 3.0),
              evening_peak: Math.round(lengthDir1Km * 3.8),
              evening_decline: Math.round(lengthDir1Km * 2.5),
            },
            trafficLightCount: Math.round(lengthDir1Km * 0.5),
            avgTrafficLightDelayMin: 2.0,
            isSharedSegment: false,
            sharedWithRoutes: [],
          },
        ]

    const routeDataPayload = {
      ...(initialRoute ? { id: initialRoute.id } : {}),
      number: number.trim(),
      type,
      status,
      name: name.trim(),
      description: description.trim(),
      primaryTerminalId,
      secondaryTerminalId,
      lengthDir1Km: Number(lengthDir1Km),
      lengthDir2Km: Number(lengthDir2Km),
      stations: stationsList,
      segments: defaultSegments,
    }

    onSubmit(routeDataPayload as any)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            {type === 'tram' ? (
              <Navigation className="w-5 h-5 text-rose-400" />
            ) : (
              <Bus className="w-5 h-5 text-indigo-400" />
            )}
            <h3 id="route-modal-title" className="font-bold text-base">
              {initialRoute ? 'Редагувати маршрут' : 'Створити новий маршрут'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрити модальне вікно"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 p-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Number */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Номер маршруту *
              </label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="напр. 3, 7, 10"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Тип транспорту
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransportType)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="tram">Трамвай</option>
                <option value="trolleybus">Тролейбус</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Статус
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RouteStatus)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Активний</option>
                <option value="maintenance">Ремонт / Скорочено</option>
                <option value="suspended">Призупинено</option>
                <option value="reserve">В резерві</option>
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Назва маршруту (Кінцева A — Кінцева B) *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Старосінна площа — 11-та ст. Люстдорфської дороги"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Опис маршруту
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Короткий опис напрямку та сполучення"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Terminals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Головний ДП (Початкова)
              </label>
              <select
                value={primaryTerminalId}
                onChange={(e) => setPrimaryTerminalId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Другий ДП / Кінцева
              </label>
              <select
                value={secondaryTerminalId}
                onChange={(e) => setSecondaryTerminalId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lengths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Довжина прямого напрямку L1 (км) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={lengthDir1Km}
                onChange={(e) => setLengthDir1Km(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Довжина зворотного напрямку L2 (км) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                value={lengthDir2Km}
                onChange={(e) => setLengthDir2Km(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center space-x-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Зберегти маршрут</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RouteFormModal
