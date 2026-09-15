import React from 'react'
import { ShieldAlert, Zap } from 'lucide-react'
import { VehicleBlock, Trip } from '../../types'

interface HotReserveFormProps {
  draftBlocks: VehicleBlock[]
  brokenBlockId: string
  targetTripId: string
  reserveBlockId: string
  incidentTime: string
  availableTrips: Trip[]
  isSubmitting: boolean
  onBrokenBlockIdChange: (id: string) => void
  onTargetTripIdChange: (id: string) => void
  onReserveBlockIdChange: (id: string) => void
  onIncidentTimeChange: (time: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export const HotReserveForm: React.FC<HotReserveFormProps> = ({
  draftBlocks,
  brokenBlockId,
  targetTripId,
  reserveBlockId,
  incidentTime,
  availableTrips,
  isSubmitting,
  onBrokenBlockIdChange,
  onTargetTripIdChange,
  onReserveBlockIdChange,
  onIncidentTimeChange,
  onSubmit
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 lg:col-span-2">
      <h3 className="font-black text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center space-x-2">
        <ShieldAlert className="w-4 h-4 text-purple-600" />
        <span>Параметри Аварійної Перекидки Рейсів:</span>
      </h3>

      <form onSubmit={onSubmit} className="space-y-3 font-sans text-xs">
        {/* 1. Аварійний вагон */}
        <div>
          <label 
            htmlFor="broken-block-select"
            className="font-bold text-slate-700 dark:text-slate-300 block mb-1"
          >
            1. Виберіть аварійний вагон (Поломка ТЗ / ДТП):
          </label>
          <select
            id="broken-block-select"
            value={brokenBlockId}
            onChange={(e) => onBrokenBlockIdChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500"
            disabled={draftBlocks.length === 0}
          >
            {draftBlocks.map((b) => (
              <option key={b.id} value={b.id}>
                Борт {b.vehicleNumber} (Блок: {b.id}) — {b.trips.length} рейсів
              </option>
            ))}
          </select>
        </div>
        
        {/* 2. Рейс початку заміни */}
        <div>
          <label 
            htmlFor="target-trip-select"
            className="font-bold text-slate-700 dark:text-slate-300 block mb-1"
          >
            Рейс, з якого почнеться заміна:
          </label>
          <select
            id="target-trip-select"
            value={targetTripId}
            onChange={(e) => onTargetTripIdChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500"
            disabled={availableTrips.length === 0}
          >
            {availableTrips.map((t) => (
              <option key={t.id} value={t.id}>
                Рейс {t.id} ({t.departureTime} - {t.arrivalTime})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Час інциденту */}
        <div>
          <label 
            htmlFor="incident-time-input"
            className="font-bold text-slate-700 dark:text-slate-300 block mb-1"
          >
            2. Час виникнення аварії (HH:mm):
          </label>
          <input
            id="incident-time-input"
            type="time"
            value={incidentTime}
            onChange={(e) => onIncidentTimeChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* 4. Резервний вагон */}
        <div>
          <label 
            htmlFor="reserve-block-select"
            className="font-bold text-slate-700 dark:text-slate-300 block mb-1"
          >
            3. Виберіть резервний вагон із депо (Hot Reserve):
          </label>
          <select
            id="reserve-block-select"
            value={reserveBlockId}
            onChange={(e) => onReserveBlockIdChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500"
            disabled={draftBlocks.length <= 1}
          >
            {draftBlocks
              .filter((b) => b.id !== brokenBlockId)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  Резервний Борт {b.vehicleNumber} (Блок: {b.id})
                </option>
              ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={draftBlocks.length <= 1 || !targetTripId || isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-3 rounded-xl shadow-xs flex items-center justify-center space-x-2 cursor-pointer transition-all mt-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <Zap className="w-4 h-4" />
          <span>{isSubmitting ? 'Виконання транзакції...' : 'Виконати транзакцію Гарячого Резерву'}</span>
        </button>
      </form>
    </div>
  )
}
