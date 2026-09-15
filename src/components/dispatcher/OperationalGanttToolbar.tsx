import React from 'react'
import {
  Clock,
  Search,
  RefreshCw,
  Bus,
  AlertTriangle
} from 'lucide-react'
import { Route } from '../../types'
import {
  TaskFilterType,
  GanttMetrics
} from '../../hooks/useOperationalGanttLogic'

export interface OperationalGanttToolbarProps {
  routes: Route[]
  selectedRouteId: string
  taskFilter: TaskFilterType
  searchDuty: string
  metrics: GanttMetrics
  currentTimeDisplay: string
  isLoading: boolean
  onRouteSelect: (routeId: string) => void
  onTaskFilterChange: (filter: TaskFilterType) => void
  onSearchChange: (query: string) => void
  onRefresh: () => void
}

export const OperationalGanttToolbar: React.FC<OperationalGanttToolbarProps> = ({
  routes,
  selectedRouteId,
  taskFilter,
  searchDuty,
  metrics,
  currentTimeDisplay,
  isLoading,
  onRouteSelect,
  onTaskFilterChange,
  onSearchChange,
  onRefresh
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 font-sans">
      {/* Верхній рядок: Селектор маршруту, статус часу, оновлення */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Маршрут:</span>
            <select
              value={selectedRouteId}
              onChange={(e) => onRouteSelect(e.target.value)}
              aria-label="Оберіть маршрут для діаграми Ґантта"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.number || r.id}>
                  {r.number ? `Маршрут №${r.number}` : `Маршрут ${r.id}`} ({r.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-xl text-xs font-mono text-blue-700 dark:text-blue-300">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-bold">Поточний час: {currentTimeDisplay}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Пошук наряду, борта..."
              value={searchDuty}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Пошук наряду"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Оновити графік Ґантта"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Нижній рядок: Фільтри завдань та лічильники */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-3">
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-bold" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={taskFilter === 'ALL'}
            tabIndex={0}
            onClick={() => onTaskFilterChange('ALL')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              taskFilter === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Всі завдання
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={taskFilter === 'TRIP'}
            tabIndex={0}
            onClick={() => onTaskFilterChange('TRIP')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              taskFilter === 'TRIP'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Тільки рейси
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={taskFilter === 'LUNCH'}
            tabIndex={0}
            onClick={() => onTaskFilterChange('LUNCH')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              taskFilter === 'LUNCH'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Обіди та перерви
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={taskFilter === 'ALERT'}
            tabIndex={0}
            onClick={() => onTaskFilterChange('ALERT')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              taskFilter === 'ALERT'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Відхилення &gt; 3хв
          </button>
        </div>

        {/* Швидкі лічильники HUD */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
            <Bus className="w-3.5 h-3.5 text-blue-500" />
            <span>Нарядів: <strong className="text-slate-900 dark:text-white">{metrics.totalDuties}</strong></span>
          </span>

          <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Рейсів: <strong className="text-slate-900 dark:text-white">{metrics.totalTrips}</strong></span>
          </span>

          <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Обідів: <strong className="text-slate-900 dark:text-white">{metrics.totalBreaks}</strong></span>
          </span>

          {metrics.totalAlerts > 0 && (
            <span className="flex items-center space-x-1 text-rose-600 dark:text-rose-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Збоїв: {metrics.totalAlerts}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default OperationalGanttToolbar
