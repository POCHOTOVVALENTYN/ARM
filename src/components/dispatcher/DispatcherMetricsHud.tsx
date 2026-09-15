import React from 'react'
import {
  Search,
  RefreshCw,
  Zap,
  Bus,
  Activity,
  Wrench,
  Building2,
  Clock,
  AlertTriangle
} from 'lucide-react'
import {
  ModeFilterType,
  StatusFilterType,
  DispatcherCounts,
  RouteItem
} from '../../hooks/useDispatcherLiveLogic'

export interface DispatcherMetricsHudProps {
  modeFilter: ModeFilterType
  selectedRouteId: string
  statusFilter: StatusFilterType
  searchQuery: string
  isAutoRefresh: boolean
  isManualRefreshing: boolean
  lastSyncTime: string
  counts: DispatcherCounts
  routes: RouteItem[]
  activeRouteObj: RouteItem | null
  calculatedIntervalMin: number | null
  routeVehiclesTotalCount: number
  onModeSelect: (mode: ModeFilterType) => void
  onRouteSelect: (routeId: string) => void
  onStatusSelect: (status: StatusFilterType) => void
  onSearchChange: (query: string) => void
  onToggleAutoRefresh: () => void
  onManualRefresh: () => void
  onOpenRouteEmergency: () => void
}

export const DispatcherMetricsHud: React.FC<DispatcherMetricsHudProps> = ({
  modeFilter,
  selectedRouteId,
  statusFilter,
  searchQuery,
  isAutoRefresh,
  isManualRefreshing,
  lastSyncTime,
  counts,
  routes,
  activeRouteObj,
  calculatedIntervalMin,
  routeVehiclesTotalCount,
  onModeSelect,
  onRouteSelect,
  onStatusSelect,
  onSearchChange,
  onToggleAutoRefresh,
  onManualRefresh,
  onOpenRouteEmergency
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-3.5 space-y-3 font-sans">
      {/* Верхній рядок: Режими флоту, пошук, статус синхронізації */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Селектор категорій флоту */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={modeFilter === 'ALL_PASSENGER'}
            tabIndex={0}
            onClick={() => onModeSelect('ALL_PASSENGER')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              modeFilter === 'ALL_PASSENGER'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Пасажирський</span>
            <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 rounded-md text-[10px] font-mono">
              {counts.passenger}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={modeFilter === 'TRAM'}
            tabIndex={0}
            onClick={() => onModeSelect('TRAM')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              modeFilter === 'TRAM'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Трамваї</span>
            <span className="px-1.5 py-0.2 bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 rounded-md text-[10px] font-mono">
              {counts.trams}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={modeFilter === 'TROLLEYBUS'}
            tabIndex={0}
            onClick={() => onModeSelect('TROLLEYBUS')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              modeFilter === 'TROLLEYBUS'
                ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Тролейбуси</span>
            <span className="px-1.5 py-0.2 bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 rounded-md text-[10px] font-mono">
              {counts.trols}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={modeFilter === 'SERVICE'}
            tabIndex={0}
            onClick={() => onModeSelect('SERVICE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              modeFilter === 'SERVICE'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            <span>Спецтехніка</span>
            <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-md text-[10px] font-mono">
              {counts.service}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={modeFilter === 'DEPOT'}
            tabIndex={0}
            onClick={() => onModeSelect('DEPOT')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              modeFilter === 'DEPOT'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>У депо</span>
            <span className="px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-md text-[10px] font-mono">
              {counts.depot}
            </span>
          </button>
        </div>

        {/* Пошук та сервісні кнопки */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Борт, маршрут, водій, зупинка..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Пошук транспортного засобу"
              className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{lastSyncTime}</span>
          </div>

          <button
            type="button"
            onClick={onManualRefresh}
            disabled={isManualRefreshing}
            aria-label="Оновити телеметрію"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isManualRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onOpenRouteEmergency}
            aria-label="Аварійна зупинка маршруту"
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Аварійний план</span>
          </button>
        </div>
      </div>

      {/* Рядок вибору маршруту та фільтрів графіка (лише для пасажирського транспорту) */}
      {modeFilter !== 'SERVICE' && modeFilter !== 'DEPOT' && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-3">
          {/* Чіпи номерів маршрутів */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => onRouteSelect('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                selectedRouteId === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Всі лінії
            </button>

            {routes.map((r) => {
              const isSelected = selectedRouteId === r.id || selectedRouteId === r.number
              const isTram = (r.type || 'TRAM').toUpperCase() === 'TRAM'

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onRouteSelect(r.number || r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isTram ? 'bg-rose-500' : 'bg-blue-500'}`} />
                  <span>№{r.number || r.id}</span>
                </button>
              )
            })}
          </div>

          {/* Чіпи фільтрації за запізненням */}
          <div className="flex items-center space-x-1 shrink-0 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => onStatusSelect('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-500'
              }`}
            >
              Всі ({counts.passenger})
            </button>

            <button
              type="button"
              onClick={() => onStatusSelect('IN_SCHEDULE')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                statusFilter === 'IN_SCHEDULE'
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <span>Графік (±2хв)</span>
              <span className="font-mono text-[10px]">({counts.onTime})</span>
            </button>

            <button
              type="button"
              onClick={() => onStatusSelect('MINOR_DELAY')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                statusFilter === 'MINOR_DELAY'
                  ? 'bg-amber-600 text-white shadow-2xs font-black'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              <span>2-5 хв</span>
              <span className="font-mono text-[10px]">({counts.minor})</span>
            </button>

            <button
              type="button"
              onClick={() => onStatusSelect('CRITICAL_DELAY')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                statusFilter === 'CRITICAL_DELAY'
                  ? 'bg-rose-600 text-white shadow-2xs font-black'
                  : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              <span>&gt; 5 хв</span>
              <span className="font-mono text-[10px]">({counts.critical})</span>
            </button>
          </div>
        </div>
      )}

      {/* Інформаційна смуга обраного маршруту */}
      {activeRouteObj && modeFilter !== 'SERVICE' && modeFilter !== 'DEPOT' && (
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-black text-blue-700 dark:text-blue-300">
              Лінія №{activeRouteObj.number || activeRouteObj.id}:
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{activeRouteObj.name}</span>
          </div>

          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>Випуск: <strong className="text-slate-900 dark:text-white font-bold">{routeVehiclesTotalCount}</strong> од.</span>
            {calculatedIntervalMin && (
              <span>Інтервал: <strong className="text-blue-600 dark:text-blue-400 font-bold">{calculatedIntervalMin}</strong> хв</span>
            )}
            {activeRouteObj.designated_break_hub && (
              <span className="text-slate-500 font-sans">Вузол обіду: {activeRouteObj.designated_break_hub}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DispatcherMetricsHud
