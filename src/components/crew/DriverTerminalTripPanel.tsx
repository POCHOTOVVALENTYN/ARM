import React from 'react'
import { 
  ArrowRight, 
  ArrowLeft, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react'
import { WaybillTrip, WaybillStop } from '../../hooks/useSmartWaybillLogic'

interface DriverTerminalTripPanelProps {
  currentTrip: WaybillTrip | null
  tripsCount: number
  currentTripIdx: number
  currentStop: WaybillStop | null
  nextStop: WaybillStop | null
  stops: WaybillStop[]
  currentStopIdx: number
  isNightMode: boolean
  isCheckInPending: boolean
  onPrevTrip: () => void
  onNextTrip: () => void
  onCheckIn: (action: 'ARRIVAL' | 'DEPARTURE') => void
  onSelectStopIdx: (idx: number) => void
}

export const DriverTerminalTripPanel: React.FC<DriverTerminalTripPanelProps> = ({
  currentTrip,
  tripsCount,
  currentTripIdx,
  currentStop,
  nextStop,
  stops,
  currentStopIdx,
  isNightMode,
  isCheckInPending,
  onPrevTrip,
  onNextTrip,
  onCheckIn,
  onSelectStopIdx
}) => {
  return (
    <div className="space-y-4">
      {/* Інформаційна плашка поточного рейсу */}
      <div className={`p-4 rounded-3xl border flex items-center justify-between ${
        isNightMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-0.5">
          <div className="text-[11px] font-extrabold uppercase text-blue-400 tracking-wider">
            Поточний рейс #{currentTrip?.trip_number || 1} з {tripsCount}
          </div>
          <div className="text-base font-black flex items-center space-x-2">
            <span>{currentTrip?.start_station || 'Початкова'}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span>{currentTrip?.end_station || 'Кінцева'}</span>
          </div>
        </div>

        {/* Кнопки перемикання рейсів */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrevTrip}
            disabled={currentTripIdx === 0}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 disabled:opacity-30 cursor-pointer"
            title="Попередній рейс"
            aria-label="Попередній рейс"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextTrip}
            disabled={currentTripIdx >= tripsCount - 1}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 disabled:opacity-30 cursor-pointer"
            title="Наступний рейс"
            aria-label="Наступний рейс"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ГОЛОВНА ТАКТИЛЬНА КАРТКА НАСТУПНОЇ ЗУПИНКИ */}
      <div className={`p-6 rounded-3xl border-2 shadow-2xl relative overflow-hidden ${
        isNightMode 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border-blue-600/60' 
          : 'bg-gradient-to-br from-white via-white to-blue-50 border-blue-500'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="px-3 py-1 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>Поточна / Наступна зупинка</span>
          </span>

          {currentStop?.is_control_point && (
            <span className="px-3 py-1 rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-black uppercase tracking-wider">
              🚏 Диспетчерський Пункт (ДП)
            </span>
          )}
        </div>

        <div className="space-y-1 my-3">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            {currentStop?.stop_name || 'Завантаження розкладу...'}
          </h2>
          {nextStop && (
            <p className="text-sm font-bold text-slate-400">
              Наступна після неї: <span className="text-slate-200">{nextStop.stop_name}</span>
            </p>
          )}
        </div>

        {/* Плановий час прибуття та відправлення */}
        <div className="grid grid-cols-2 gap-3 pt-2 pb-5 border-t border-slate-800/60 text-center font-mono">
          <div className="p-3 rounded-2xl bg-black/30 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">План прибуття</div>
            <div className="text-xl font-black text-white">{currentStop?.arrival_time || '--:--'}</div>
          </div>
          <div className="p-3 rounded-2xl bg-black/30 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">План відправлення</div>
            <div className="text-xl font-black text-emerald-400">{currentStop?.departure_time || '--:--'}</div>
          </div>
        </div>

        {/* ВЕЛИКІ ТАКТИЛЬНІ КНОПКИ ДІЙ ВОДІЯ (Touch Targets 64px+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onCheckIn('ARRIVAL')}
            disabled={isCheckInPending}
            className="py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-black text-base flex items-center justify-center space-x-2.5 transition-all shadow-xl cursor-pointer disabled:opacity-50"
          >
            <MapPin className="w-6 h-6" />
            <span>{isCheckInPending ? 'Фіксація...' : '🚏 ФІКСАЦІЯ ПРИБУТТЯ'}</span>
          </button>

          <button
            onClick={() => onCheckIn('DEPARTURE')}
            disabled={isCheckInPending}
            className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-base flex items-center justify-center space-x-2.5 transition-all shadow-xl cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>{isCheckInPending ? 'Фіксація...' : '🟢 ВІДПРАВЛЕННЯ ЗА РОЗКЛАДОМ'}</span>
          </button>
        </div>
      </div>

      {/* ПОВНИЙ РОЗКЛАД ЗУПИНОК РЕЙСУ (Timetable Roll) */}
      <div className={`p-4 md:p-5 rounded-3xl border space-y-3 ${
        isNightMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
            Похвилинний графік зупинок рейсу ({stops.length} зупинок)
          </h3>
          <span className="text-xs font-mono font-bold text-blue-400">
            Активна зупинка #{currentStopIdx + 1}
          </span>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {stops.map((st, idx) => {
            const isCurrent = idx === currentStopIdx
            const isPassed = idx < currentStopIdx

            return (
              <div
                key={st.stop_id || idx}
                tabIndex={0}
                role="button"
                aria-label={`Зупинка ${st.stop_name}`}
                onClick={() => onSelectStopIdx(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectStopIdx(idx)
                  }
                }}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600/30 border-blue-500 text-white font-black shadow-md'
                    : isPassed
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 line-through'
                    : isNightMode
                    ? 'bg-slate-950/60 border-slate-800/60 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-lg text-xs font-mono font-black flex items-center justify-center ${
                    isCurrent ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>{st.stop_name}</span>
                      {st.is_control_point && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold">
                          ДП
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs font-bold">
                  <span className="text-slate-400">{st.arrival_time}</span>
                  <span>➔</span>
                  <span className="text-emerald-400">{st.departure_time}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
