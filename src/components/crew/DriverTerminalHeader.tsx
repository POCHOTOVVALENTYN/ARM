import React from 'react'
import { Bus, Sun, Moon } from 'lucide-react'
import { ScheduleDeviation } from '../../hooks/useDriverTerminalLogic'
import { SmartWaybillData } from '../../hooks/useSmartWaybillLogic'

interface DriverTerminalHeaderProps {
  vehicleId: string
  waybill: SmartWaybillData | undefined
  scheduleDeviation: ScheduleDeviation
  currentTime: string
  isNightMode: boolean
  onToggleNightMode: () => void
}

export const DriverTerminalHeader: React.FC<DriverTerminalHeaderProps> = ({
  vehicleId,
  waybill,
  scheduleDeviation,
  currentTime,
  isNightMode,
  onToggleNightMode
}) => {
  return (
    <header className={`p-4 md:p-5 rounded-3xl border shadow-2xl flex flex-wrap items-center justify-between gap-4 transition-all ${
      isNightMode 
        ? 'bg-slate-900/95 border-slate-800 shadow-cyan-950/20' 
        : 'bg-white border-slate-200 shadow-slate-200'
    }`}>
      {/* Інформація про борт та режим */}
      <div className="flex items-center space-x-3.5">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/30">
          <Bus className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 tracking-wider">
              Борт #{vehicleId}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {waybill?.vehicle?.model || 'Tatra T3'} • Маршрут №{waybill?.route_id || '18'}
            </span>
          </div>
          <h1 className="text-xl font-black tracking-tight mt-0.5 flex items-center gap-2">
            <span>Термінал Кабіни Водія</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Зв'язок онлайн" />
          </h1>
        </div>
      </div>

      {/* Годинник та індикатор розкладу */}
      <div className="flex items-center space-x-3">
        {/* Індикатор відхилення від графіка */}
        <div className={`px-4 py-2 rounded-2xl border text-center font-mono ${
          scheduleDeviation.color === 'emerald'
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
            : scheduleDeviation.color === 'rose'
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-400 animate-pulse'
            : 'bg-sky-950/60 border-sky-500/40 text-sky-400'
        }`}>
          <div className="text-[10px] font-black uppercase tracking-wider">Графік руху</div>
          <div className="text-sm font-black tracking-wide">{scheduleDeviation.label}</div>
        </div>

        {/* Цифровий годинник */}
        <div className={`px-4 py-2 rounded-2xl border text-right font-mono ${
          isNightMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-2xl font-black tracking-widest text-blue-500 leading-none">
            {currentTime || '12:00:00'}
          </div>
          <div className="text-[10px] font-bold text-slate-400 mt-0.5">КП «ОМЕТ»</div>
        </div>

        {/* Нічний / денний режим */}
        <button
          onClick={onToggleNightMode}
          className={`p-3 rounded-2xl border cursor-pointer transition-all active:scale-95 ${
            isNightMode 
              ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
          title="Перемкнути нічний/денний режим кабіни"
          aria-label="Перемикач теми підсвічування"
        >
          {isNightMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
