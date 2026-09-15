import React from 'react'
import {
  Bus,
  Settings2,
  FileSpreadsheet,
  Printer,
  Filter,
  Search,
  Clock,
  Activity,
  AlertTriangle,
  Radio
} from 'lucide-react'
import { Route, SummaryPassport } from '../../types'
import { TripGridFilterType, TripGridViewMode } from '../../hooks/useTripGridLogic'
import { DetailedRouteOverlap } from '../../constants/odessaCorridors'

interface TripGridToolbarProps {
  routes: Route[]
  selectedRouteId: string
  hasActiveSchedule: boolean
  passport: SummaryPassport
  maxRounds: number
  totalRowsCount: number
  filterType: TripGridFilterType
  searchDuty: string
  viewMode: TripGridViewMode
  totalAnomaliesCount: number
  sharedCorridors?: DetailedRouteOverlap[]
  onSelectRouteId: (id: string) => void
  onFilterTypeChange: (type: TripGridFilterType) => void
  onSearchDutyChange: (val: string) => void
  onViewModeChange: (mode: TripGridViewMode) => void
  onNavigateToParameters: () => void
  onNavigateToInterline?: () => void
  onExportCsv: () => void
  onPrint: () => void
}

export const TripGridToolbar: React.FC<TripGridToolbarProps> = ({
  routes,
  selectedRouteId,
  hasActiveSchedule,
  passport,
  maxRounds,
  totalRowsCount,
  filterType,
  searchDuty,
  viewMode,
  totalAnomaliesCount,
  sharedCorridors,
  onSelectRouteId,
  onFilterTypeChange,
  onSearchDutyChange,
  onViewModeChange,
  onNavigateToParameters,
  onNavigateToInterline,
  onExportCsv,
  onPrint
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden space-y-4 font-sans">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Вибір маршруту та зведені бейджі */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Bus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Маршрут:</span>
            </span>
            <select
              value={selectedRouteId}
              onChange={(e) => onSelectRouteId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              aria-label="Вибір маршруту для перегляду розкладу"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  №{r.number} — {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Перемикач режимів: Графік рейсів vs Контроль інтервалів */}
          {hasActiveSchedule && (
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onViewModeChange('SCHEDULE')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'SCHEDULE'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                tabIndex={0}
                aria-label="Режим графіка рейсів"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Час рейсів</span>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange('HEADWAYS')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'HEADWAYS'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                tabIndex={0}
                aria-label="Режим контролю інтервалів"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Контроль інтервалів</span>
                {totalAnomaliesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-white font-mono font-black ml-1">
                    {totalAnomaliesCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Зведені параметри активного графіка */}
          {hasActiveSchedule && (
            <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-300">Нарядів:</span>
              <strong className="font-black text-indigo-700 dark:text-indigo-400">{passport.duties_count}</strong>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-bold text-indigo-900 dark:text-indigo-300">Інтервал:</span>
              <strong className="font-black text-emerald-600 dark:text-emerald-400">{passport.headway_min} хв</strong>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-bold text-indigo-900 dark:text-indigo-300">Тоб:</span>
              <strong className="font-black text-slate-800 dark:text-slate-200">{passport.round_trip_min} хв</strong>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="font-bold text-indigo-900 dark:text-indigo-300">Кругів:</span>
              <strong className="font-black text-purple-700 dark:text-purple-400">{maxRounds}</strong>
            </div>
          )}
        </div>

        {/* Кнопки дій */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {sharedCorridors && sharedCorridors.length > 0 && onNavigateToInterline && (
            <button
              type="button"
              onClick={onNavigateToInterline}
              className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950/80 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
              tabIndex={0}
              aria-label="Перейти до вкладки «Зв'язок»"
              title="Перейти до похвилинної синхронізації суміщених ділянок"
            >
              <Radio className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Зв'язки ({sharedCorridors.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToParameters}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
            tabIndex={0}
            aria-label="Налаштувати параметри нарядів"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Конструктор нарядів ⚙️</span>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={!hasActiveSchedule}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            tabIndex={0}
            aria-label="Експорт зведеного графіка у Excel CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Експорт у Excel (.csv)</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            disabled={!hasActiveSchedule}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
            tabIndex={0}
            aria-label="Друк форми А4"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Друк форми А4</span>
          </button>
        </div>
      </div>

      {/* Швидкі фільтри для нарядів при наявності розкладу */}
      {hasActiveSchedule && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Фільтр нарядів:</span>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black">
              <button
                type="button"
                onClick={() => onFilterTypeChange('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'ALL' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-500'
                }`}
                tabIndex={0}
                aria-label="Всі типи нарядів"
              >
                Всі ({totalRowsCount})
              </button>
              <button
                type="button"
                onClick={() => onFilterTypeChange('DOUBLE')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'DOUBLE' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs' : 'text-slate-500'
                }`}
                tabIndex={0}
                aria-label="Фільтр двозмінних нарядів"
              >
                Двозмінні (ДВ)
              </button>
              <button
                type="button"
                onClick={() => onFilterTypeChange('SPLIT')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'SPLIT' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-2xs' : 'text-slate-500'
                }`}
                tabIndex={0}
                aria-label="Фільтр розривних нарядів"
              >
                Розривні (РОЗ)
              </button>
              <button
                type="button"
                onClick={() => onFilterTypeChange('PEAK')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'PEAK' ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-2xs' : 'text-slate-500'
                }`}
                tabIndex={0}
                aria-label="Фільтр пікових нарядів"
              >
                Пікові (ПІК)
              </button>
              <button
                type="button"
                onClick={() => onFilterTypeChange('SINGLE')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'SINGLE' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'
                }`}
                tabIndex={0}
                aria-label="Фільтр однозмінних нарядів"
              >
                Однозмінні (ОД)
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Пошук наряду (напр. 5-03)..."
              value={searchDuty}
              onChange={(e) => onSearchDutyChange(e.target.value)}
              className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              aria-label="Пошук наряду"
            />
          </div>
        </div>
      )}
    </div>
  )
}
