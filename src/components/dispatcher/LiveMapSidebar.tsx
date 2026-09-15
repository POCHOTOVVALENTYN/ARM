import React from 'react'
import {
  Search,
  CheckCircle2,
  RefreshCw,
  Layers,
  MapPin,
  Bus,
  Zap,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  ArrowLeftRight,
  ArrowUpRight,
  X
} from 'lucide-react'
import { Route } from '../../types'
import { MAP_STYLES, MapStyleOption, normalizeRouteType } from '../../hooks/useLiveMapLogic'

export interface RouteWithCounts extends Route {
  cleanId: string
  liveVehicleCount: number
}

export interface LiveMapSidebarProps {
  isOpen: boolean
  activeTab: 'routes' | 'layers'
  routes: RouteWithCounts[]
  selectedRouteIds: string[]
  routeTypeFilter: 'all' | 'tram' | 'trolleybus'
  searchQuery: string
  directionMode: 'both' | 0 | 1
  selectedTileStyleId: string
  showAllRoutesLines: boolean
  showTrackShape: boolean
  showStops: boolean
  showDispatchHubs: boolean
  hideServiceVehicles: boolean
  hideDepotVehicles: boolean
  onlyCriticalDelays: boolean
  isSyncingEasyWay: boolean
  syncResultMsg: string | null
  onTabChange: (tab: 'routes' | 'layers') => void
  onRouteSelect: (routeId: string) => void
  onClearRouteSelection: () => void
  onRouteTypeFilterChange: (filter: 'all' | 'tram' | 'trolleybus') => void
  onSearchChange: (query: string) => void
  onDirectionModeChange: (mode: 'both' | 0 | 1) => void
  onTileStyleChange: (styleId: string) => void
  setShowAllRoutesLines: (val: boolean | ((prev: boolean) => boolean)) => void
  setShowTrackShape: (val: boolean | ((prev: boolean) => boolean)) => void
  setShowStops: (val: boolean | ((prev: boolean) => boolean)) => void
  setShowDispatchHubs: (val: boolean | ((prev: boolean) => boolean)) => void
  setHideServiceVehicles: (val: boolean | ((prev: boolean) => boolean)) => void
  setHideDepotVehicles: (val: boolean | ((prev: boolean) => boolean)) => void
  setOnlyCriticalDelays: (val: boolean | ((prev: boolean) => boolean)) => void
  onSyncEasyWay: () => void
  onClose: () => void
}

export const LiveMapSidebar: React.FC<LiveMapSidebarProps> = ({
  isOpen,
  activeTab,
  routes,
  selectedRouteIds,
  routeTypeFilter,
  searchQuery,
  directionMode,
  selectedTileStyleId,
  showAllRoutesLines,
  showTrackShape,
  showStops,
  showDispatchHubs,
  hideServiceVehicles,
  hideDepotVehicles,
  onlyCriticalDelays,
  isSyncingEasyWay,
  syncResultMsg,
  onTabChange,
  onRouteSelect,
  onClearRouteSelection,
  onRouteTypeFilterChange,
  onSearchChange,
  onDirectionModeChange,
  onTileStyleChange,
  setShowAllRoutesLines,
  setShowTrackShape,
  setShowStops,
  setShowDispatchHubs,
  setHideServiceVehicles,
  setHideDepotVehicles,
  setOnlyCriticalDelays,
  onSyncEasyWay,
  onClose
}) => {
  if (!isOpen) return null

  return (
    <div className="absolute top-16 left-4 bottom-6 z-[1000] w-80 max-w-[calc(100vw-32px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left duration-200 pointer-events-auto font-sans">
      {/* Шапка панелі з табами */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold w-full" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'routes'}
            tabIndex={0}
            onClick={() => onTabChange('routes')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'routes'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Маршрути</span>
            {selectedRouteIds.length > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[9px] font-mono">
                {selectedRouteIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'layers'}
            tabIndex={0}
            onClick={() => onTabChange('layers')}
            className={`flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              activeTab === 'layers'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Шари</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити бічну панель"
          className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Вміст вкладки: Маршрути */}
      {activeTab === 'routes' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Фільтри типів та пошук */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/60 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onRouteTypeFilterChange('all')}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  routeTypeFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Всі
              </button>
              <button
                type="button"
                onClick={() => onRouteTypeFilterChange('tram')}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  routeTypeFilter === 'tram'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Трамваї
              </button>
              <button
                type="button"
                onClick={() => onRouteTypeFilterChange('trolleybus')}
                className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  routeTypeFilter === 'trolleybus'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Тролейбуси
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Пошук маршруту..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Пошук маршруту за номером або назвою"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedRouteIds.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-500">
                    Обрано: <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedRouteIds.length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={onClearRouteSelection}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[10px] cursor-pointer"
                  >
                    Скинути фільтр
                  </button>
                </div>

                {/* Перемикач напрямку для першого обраного маршруту */}
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => onDirectionModeChange('both')}
                    className={`flex-1 py-1 rounded transition-all cursor-pointer ${
                      directionMode === 'both' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs font-black' : 'text-slate-500'
                    }`}
                  >
                    Обидва напрямки
                  </button>
                  <button
                    type="button"
                    onClick={() => onDirectionModeChange(0)}
                    className={`flex-1 py-1 rounded transition-all cursor-pointer ${
                      directionMode === 0 ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs font-black' : 'text-slate-500'
                    }`}
                  >
                    Прямий (А→Б)
                  </button>
                  <button
                    type="button"
                    onClick={() => onDirectionModeChange(1)}
                    className={`flex-1 py-1 rounded transition-all cursor-pointer ${
                      directionMode === 1 ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs font-black' : 'text-slate-500'
                    }`}
                  >
                    Зворотний (Б→А)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Список маршрутів зі скролом */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {routes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Маршрутів за запитом не знайдено
              </div>
            ) : (
              routes.map((r) => {
                const isSelected = selectedRouteIds.includes(r.cleanId)
                const isTram = normalizeRouteType(r.type) === 'tram'

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onRouteSelect(r.cleanId)}
                    className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 shadow-2xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 text-white shadow-2xs"
                        style={{ backgroundColor: r.color || (isTram ? '#EF4444' : '#3B82F6') }}
                      >
                        {r.number || r.id}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {r.name || `Маршрут №${r.number || r.id}`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {isTram ? 'Трамвай' : 'Тролейбус'}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-1.5 ml-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          r.liveVehicleCount > 0
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.liveVehicleCount} бортів
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Вміст вкладки: Шари */}
      {activeTab === 'layers' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Стилі підложки */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Картографічна підложка:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {MAP_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => onTileStyleChange(style.id)}
                  className={`p-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center space-x-2 ${
                    selectedTileStyleId === style.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 shadow-2xs font-black'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">{style.icon}</span>
                  <span className="truncate">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Перемикачі шарів */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Векторні шари об'єктів:
            </label>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="font-bold text-slate-700 dark:text-slate-300">Вся мережа ліній ОМЕТ</span>
                <input
                  type="checkbox"
                  checked={showAllRoutesLines}
                  onChange={(e) => setShowAllRoutesLines(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="font-bold text-slate-700 dark:text-slate-300">Траса обраного маршруту</span>
                <input
                  type="checkbox"
                  checked={showTrackShape}
                  onChange={(e) => setShowTrackShape(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="font-bold text-slate-700 dark:text-slate-300">Зупинки пасажирські</span>
                <input
                  type="checkbox"
                  checked={showStops}
                  onChange={(e) => setShowStops(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="font-bold text-slate-700 dark:text-slate-300">Диспетчерські пункти та КТ</span>
                <input
                  type="checkbox"
                  checked={showDispatchHubs}
                  onChange={(e) => setShowDispatchHubs(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="font-bold text-slate-700 dark:text-slate-300">Приховати спецтехніку</span>
                <input
                  type="checkbox"
                  checked={hideServiceVehicles}
                  onChange={(e) => setHideServiceVehicles(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <span className="font-bold text-slate-700 dark:text-slate-300">Тільки критичні запізнення</span>
                <input
                  type="checkbox"
                  checked={onlyCriticalDelays}
                  onChange={(e) => setOnlyCriticalDelays(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Інтеграція EasyWay */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              🛰️ Інтеграція EasyWay API (Одеса):
            </label>
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Шлюз EasyWay API: прямий доступ до високоточних колій та кілець.
              </div>

              <button
                type="button"
                onClick={onSyncEasyWay}
                disabled={isSyncingEasyWay}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingEasyWay ? 'animate-spin' : ''}`} />
                <span>{isSyncingEasyWay ? 'Синхронізація...' : 'Оновити траси з EasyWay'}</span>
              </button>

              {syncResultMsg && (
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 rounded-xl text-[10px] font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{syncResultMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMapSidebar
