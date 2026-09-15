import React from 'react'
import {
  Filter,
  Radio,
  ShieldCheck,
  Zap,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

export interface LiveMapHudProps {
  isSidebarOpen: boolean
  selectedRouteIdsCount: number
  secondsSinceSync: number
  isAntiRebActive: boolean
  isAirRaidActive: boolean
  onToggleSidebar: () => void
  onToggleAntiReb: () => void
}

export const LiveMapHud: React.FC<LiveMapHudProps> = ({
  isSidebarOpen,
  selectedRouteIdsCount,
  secondsSinceSync,
  isAntiRebActive,
  isAirRaidActive,
  onToggleSidebar,
  onToggleAntiReb
}) => {
  return (
    <div className="absolute top-4 left-4 z-[1000] flex flex-wrap items-center gap-2 pointer-events-auto">
      {/* Кнопка виклику панелі маршрутів */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? 'Сховати бічну панель фільтрів' : 'Відкрити бічну панель фільтрів'}
        className="px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md flex items-center space-x-2 text-xs font-black text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Маршрути та Шари</span>
        {selectedRouteIdsCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-black">
            {selectedRouteIdsCount}
          </span>
        )}
        {isSidebarOpen ? (
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Пульс телеметрії та відлік свіжості */}
      <div 
        tabIndex={0}
        aria-label={`Статус телеметрії Wialon: оновлено ${secondsSinceSync} секунд тому`}
        className="px-3 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md flex items-center space-x-2 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="relative flex items-center justify-center">
          <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </div>
        <span className="font-sans font-bold text-[11px]">Wialon GPS:</span>
        <span className={`font-bold ${secondsSinceSync > 10 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {secondsSinceSync}с
        </span>
      </div>

      {/* Тумблер Анти-РЕБ */}
      <button
        type="button"
        onClick={onToggleAntiReb}
        aria-label={isAntiRebActive ? 'Вимкнути фільтрацію Анти-РЕБ' : 'Увімкнути фільтрацію Анти-РЕБ'}
        className={`px-3 py-2 rounded-2xl backdrop-blur-md border shadow-md flex items-center space-x-1.5 text-xs font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isAntiRebActive
            ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
            : 'bg-white/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
        }`}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Анти-РЕБ v2.4</span>
      </button>

      {/* Індикатор повітряної тривоги, якщо активна */}
      {isAirRaidActive && (
        <div 
          tabIndex={0}
          aria-label="Увага! Активна повітряна тривога в м. Одеса"
          className="px-3 py-2 rounded-2xl bg-rose-600 text-white border border-rose-500 shadow-md flex items-center space-x-1.5 text-xs font-black animate-pulse focus:outline-none focus:ring-2 focus:ring-rose-400"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>ПОВІТРЯНА ТРИВОГА</span>
        </div>
      )}
    </div>
  )
}

export default LiveMapHud
