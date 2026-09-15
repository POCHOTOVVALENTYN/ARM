import React from 'react'
import {
  Scissors,
  Sparkles,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react'
import { Route } from '../../types'

export type ShiftFilterType = 'ALL' | 'SHIFT_1' | 'SHIFT_2' | 'SPLIT' | 'EXTENDED' | 'VIOLATIONS'

interface DriverShiftConstructorToolbarProps {
  routes: Route[]
  selectedRouteId: string
  prepTimeMin: number
  isTram: boolean
  totalShiftsCount: number
  validCount: number
  extendedCount: number
  violationCount: number
  activeFilter: ShiftFilterType
  searchQuery: string
  isLoading: boolean
  onSelectRouteId: (id: string) => void
  onFilterChange: (filter: ShiftFilterType) => void
  onSearchChange: (q: string) => void
  onRefetch: () => void
}

export const DriverShiftConstructorToolbar: React.FC<DriverShiftConstructorToolbarProps> = ({
  routes,
  selectedRouteId,
  prepTimeMin,
  isTram,
  totalShiftsCount,
  validCount,
  extendedCount,
  violationCount,
  activeFilter,
  searchQuery,
  isLoading,
  onSelectRouteId,
  onFilterChange,
  onSearchChange,
  onRefetch
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 space-y-3.5 font-sans">
      {/* Верхній ряд: заголовок та вибір маршруту */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Конструктор Змін Водіїв та Комплектування КПЗ</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Нормування змін водіїв (макс. 9:59), ПЗЧ ({prepTimeMin} хв {isTram ? 'трамвай' : 'тролейбус'}), обідні вікна та закріплення рухомого складу
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-56">
            <select
              id="shift-route-select"
              value={selectedRouteId}
              onChange={(e) => onSelectRouteId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-xs text-slate-900 dark:text-white cursor-pointer outline-hidden"
              aria-label="Оберіть маршрут"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.type === 'trolleybus' ? '🚎' : '🚊'} №{r.number || r.id} — {r.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRefetch}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95"
            aria-label="Оновити дані змін"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Оновлення...' : 'Оновити'}</span>
          </button>
        </div>
      </div>

      {/* Зведені показники балансу робочого часу */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 text-xs">
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Всього змін:</span>
          <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{totalShiftsCount}</span>
        </div>

        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Норма (≤ 8:00):</span>
          <span className="text-sm font-black text-emerald-800 dark:text-emerald-200 font-mono">{validCount}</span>
        </div>

        <div className="p-2 bg-lime-50 dark:bg-lime-950/40 rounded-xl border border-lime-200 dark:border-lime-800/60">
          <span className="text-[10px] font-bold text-lime-700 dark:text-lime-300 uppercase block">Подовжені (8:01–9:59):</span>
          <span className="text-sm font-black text-lime-800 dark:text-lime-200 font-mono">{extendedCount}</span>
        </div>

        {violationCount > 0 ? (
          <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800 animate-pulse">
            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase block">Порушення (&gt; 9:59):</span>
            <span className="text-sm font-black text-rose-700 dark:text-rose-300 font-mono">{violationCount}</span>
          </div>
        ) : (
          <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">ПЗЧ норми:</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">{prepTimeMin} хв</span>
          </div>
        )}

        <div className="p-2 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/60 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase block">Обідній такт:</span>
          <span className="text-sm font-black text-indigo-800 dark:text-indigo-200 font-mono">
            {isTram ? '15 хв' : '20 хв'} (4–6 год)
          </span>
        </div>
      </div>

      {/* Рядок фільтрів та швидкого пошуку */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => onFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Всі ({totalShiftsCount})
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('SHIFT_1')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeFilter === 'SHIFT_1'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            І зміна (Ранок)
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('SHIFT_2')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeFilter === 'SHIFT_2'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ІІ зміна (Вечір)
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('SPLIT')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeFilter === 'SPLIT'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Розривні (SPLIT)
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('EXTENDED')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeFilter === 'EXTENDED'
                ? 'bg-lime-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Подовжені ({extendedCount})
          </button>

          {violationCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('VIOLATIONS')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeFilter === 'VIOLATIONS'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
              }`}
            >
              Порушення ({violationCount})
            </button>
          )}
        </div>

        {/* Швидкий пошук за водієм або вагоном */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Пошук (водій, таб. №, вагон)..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            aria-label="Пошук змін за прізвищем водія, табельним або бортовим номером"
          />
        </div>
      </div>
    </div>
  )
}

export default DriverShiftConstructorToolbar
