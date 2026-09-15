import React, { useState } from 'react'
import {
  Layers,
  Bus,
  MapPin,
  Calendar,
  Clock,
  Radio,
  AlertCircle,
  ArrowRight,
  Compass,
  ChevronDown,
  ChevronUp,
  CheckCircle2
} from 'lucide-react'
import { Route } from '../../types'
import { DetailedRouteOverlap } from '../../constants/odessaCorridors'

interface DutyMacroStepProps {
  filteredRoutes: Route[]
  currentRoute: Route
  selectedRouteId: string
  transportTypeFilter: 'all' | 'tram' | 'trolleybus'
  scheduleType: string
  startDate: string
  endDate: string
  dutiesCount: number
  calculatedInterval: string
  routeLengthKm: number
  defaultSpeedKmh: number
  roundTripMin: number
  designatedDpName: string
  secondaryDpName?: string
  availableRouteStops: string[]
  detailedCorridorOverlaps?: DetailedRouteOverlap[]
  onTransportTypeFilterChange: (type: 'all' | 'tram' | 'trolleybus') => void
  onScheduleTypeChange: (type: string) => void
  onSelectRoute: (routeId: string) => void
  onChangeDutiesCount: (count: number) => void
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onChangeRouteLength: (length: number) => void
  onChangeSpeed: (speed: number) => void
  onChangeRoundTrip: (roundTrip: number) => void
  onChangeDesignatedDpName: (name: string) => void
  onChangeSecondaryDpName?: (name: string) => void
  onProceedToStep2: () => void
  onNavigateToIntersections: () => void
}

export const DutyMacroStep: React.FC<DutyMacroStepProps> = ({
  filteredRoutes,
  currentRoute,
  selectedRouteId,
  transportTypeFilter,
  scheduleType,
  startDate,
  endDate,
  dutiesCount,
  calculatedInterval,
  routeLengthKm,
  defaultSpeedKmh,
  roundTripMin,
  designatedDpName,
  secondaryDpName = '',
  availableRouteStops,
  detailedCorridorOverlaps = [],
  onTransportTypeFilterChange,
  onScheduleTypeChange,
  onSelectRoute,
  onChangeDutiesCount,
  onStartDateChange,
  onEndDateChange,
  onChangeRouteLength,
  onChangeSpeed,
  onChangeRoundTrip,
  onChangeDesignatedDpName,
  onChangeSecondaryDpName,
  onProceedToStep2,
  onNavigateToIntersections
}) => {
  const [expandedOverlaps, setExpandedOverlaps] = useState<Record<string, boolean>>({})

  const handleToggleOverlap = (targetRouteNum: string) => {
    setExpandedOverlaps((prev) => ({
      ...prev,
      [targetRouteNum]: !prev[targetRouteNum]
    }))
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Етап 1: Вибір сценарію та макро-параметрів</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Визначте тип графіка, вид транспорту, маршрут, кількість випускних нарядів та диспетчерські пункти
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Вид транспорту */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <Bus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Вид транспорту</span>
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black">
            <button
              type="button"
              onClick={() => onTransportTypeFilterChange('all')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                transportTypeFilter === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Всі
            </button>
            <button
              type="button"
              onClick={() => onTransportTypeFilterChange('tram')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                transportTypeFilter === 'tram' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Трамвай
            </button>
            <button
              type="button"
              onClick={() => onTransportTypeFilterChange('trolleybus')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                transportTypeFilter === 'trolleybus' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Тролейбус
            </button>
          </div>
        </div>

        {/* Тип графіка */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
            Тип графіка
          </label>
          <select
            value={scheduleType}
            onChange={(e) => onScheduleTypeChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Будній">Будній день (Повний випуск)</option>
            <option value="Вихідний">Вихідний / Субота / Неділя</option>
            <option value="Святковий">Святковий / Скорочений випуск</option>
          </select>
        </div>

        {/* Маршрут */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>Маршрут</span>
          </label>
          <select
            value={selectedRouteId}
            onChange={(e) => onSelectRoute(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500"
          >
            {filteredRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                №{r.number} — {r.name} ({r.type === 'trolleybus' ? 'Тролейбус' : 'Трамвай'})
              </option>
            ))}
          </select>
        </div>

        {/* Кількість нарядів (N) */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300 tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Кількість нарядів (N)</span>
          </label>
          <input
            type="number"
            min="1"
            max="45"
            value={dutiesCount}
            onChange={(e) => onChangeDutiesCount(parseInt(e.target.value, 10) || 1)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-sm font-black text-indigo-700 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Дата початку (з) */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Дата початку (з)</span>
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        {/* Дата закінчення (по) */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Дата закінчення (по)</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        {/* Розрахунковий плановий інтервал */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Розрахунковий інтервал (I)</span>
          </label>
          <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span>{roundTripMin} хв / {dutiesCount} нар =</span>
            <strong className="text-base font-black text-emerald-700 dark:text-emerald-400">{calculatedInterval} хв</strong>
          </div>
        </div>

        {/* Довжина оборотного рейсу (Lоб, км) */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
            <span>Довжина оборотного рейсу (Lоб, км)</span>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">1 бік: ~{(routeLengthKm / 2).toFixed(1)} км</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="120"
            value={routeLengthKm}
            onChange={(e) => onChangeRouteLength(parseFloat(e.target.value) || 12.0)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Оборотне коло. Напіврейс: {(routeLengthKm / 2).toFixed(1)} км
          </p>
        </div>

        {/* Експлуатаційна швидкість */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
            <span>Швидкість (Vсп, км/год)</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Змінна диспетчером</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="60"
            value={defaultSpeedKmh}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value) || 12.0)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Нормативна швидкість сполучення
          </p>
        </div>

        {/* Час обороту Тоб */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
            <span>Час обороту (Тоб, хв)</span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Рух + Відстій</span>
          </label>
          <input
            type="number"
            min="15"
            max="240"
            value={roundTripMin}
            onChange={(e) => onChangeRoundTrip(parseInt(e.target.value, 10) || 60)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Рух: {Math.max(10, roundTripMin - 10)} хв + Відстій: 10 хв
          </p>
        </div>

        {/* Головний ДП — випадаючий список із зупинок маршруту */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-indigo-900 dark:text-indigo-300 tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>Головний ДП</span>
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Обовʼязковий</span>
          </label>
          <select
            value={designatedDpName}
            onChange={(e) => onChangeDesignatedDpName(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            aria-label="Головний диспетчерський пункт"
          >
            {availableRouteStops.map((stop) => (
              <option key={stop} value={stop}>
                {stop}
              </option>
            ))}
            {/* Fallback якщо designatedDpName не знайдено серед зупинок */}
            {!availableRouteStops.includes(designatedDpName) && designatedDpName && (
              <option value={designatedDpName}>{designatedDpName}</option>
            )}
          </select>
        </div>

        {/* Додатковий ДП — випадаючий список (необов'язковий) */}
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-slate-500" />
              <span>Додатковий ДП</span>
            </span>
            <span className="text-[10px] text-slate-400">Необовʼязково</span>
          </label>
          <select
            value={secondaryDpName}
            onChange={(e) => onChangeSecondaryDpName && onChangeSecondaryDpName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500"
            aria-label="Додатковий диспетчерський пункт"
          >
            <option value="">— Не призначено —</option>
            {availableRouteStops
              .filter((s) => s !== designatedDpName)
              .map((stop) => (
                <option key={stop} value={stop}>
                  {stop}
                </option>
              ))}
            {!availableRouteStops.includes(secondaryDpName) && secondaryDpName && (
              <option value={secondaryDpName}>{secondaryDpName}</option>
            )}
          </select>
        </div>
      </div>

      {/* Динамічний блок суміщених ділянок та конкретних спільних зупинок */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-900 dark:text-purple-300 tracking-wider">
            <Radio className="w-4 h-4 text-purple-600" />
            <span>Суміщені ділянки та спільні зупинки ({detailedCorridorOverlaps.length > 0 ? `${detailedCorridorOverlaps.length} маршрути-конкуренти` : 'відокремлений рух'})</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToIntersections}
            className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white underline cursor-pointer flex items-center gap-1"
            title="Перейти до налаштування колійних вузлів та контрольних точок в адмінці"
          >
            <span>⚙️ Керувати вузлами в Довідниках Мережі</span>
          </button>
        </div>

        {detailedCorridorOverlaps.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {detailedCorridorOverlaps.map((overlap) => {
              const isExpanded = !!expandedOverlaps[overlap.targetRouteNumber]
              const visibleStops = isExpanded ? overlap.sharedStops : overlap.sharedStops.slice(0, 6)
              const hasMoreStops = overlap.sharedStops.length > 6

              return (
                <div
                  key={overlap.targetRouteId}
                  className="p-4 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-2xl space-y-3 text-xs text-purple-900 dark:text-purple-200 transition-all hover:border-purple-300 dark:hover:border-purple-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-xs"
                        style={{ backgroundColor: overlap.targetRouteColor }}
                      >
                        {overlap.transportType === 'trolleybus' ? 'Тр ' : 'Трам '}№{overlap.targetRouteNumber}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                        {overlap.targetRouteName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-200/80 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-mono">
                        h_min ≥ {overlap.minHeadwayMin} хв
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300">
                        {overlap.sharedStopsCount} зупинок
                      </span>
                    </div>
                  </div>

                  {/* Межі суміщеної ділянки */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-950 dark:text-purple-300 bg-purple-100/60 dark:bg-purple-900/40 px-3 py-1.5 rounded-xl border border-purple-200/60 dark:border-purple-800/50">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>
                      {overlap.sharedStopsCount === 1 ? (
                        <>Вузол примикання / пересадки: <strong>{overlap.startStop}</strong></>
                      ) : (
                        <>Ділянка: <strong>{overlap.startStop}</strong> ⟶ <strong>{overlap.endStop}</strong></>
                      )}
                    </span>
                  </div>

                  {/* Точний перелік спільних зупинок */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Спільні зупинки ({overlap.sharedStopsCount}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {visibleStops.map((stop, sIdx) => (
                        <span
                          key={`${overlap.targetRouteNumber}-${sIdx}-${stop}`}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white dark:bg-slate-800 border border-purple-200/80 dark:border-purple-800/80 text-slate-800 dark:text-slate-200 flex items-center gap-1"
                        >
                          <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">{sIdx + 1}.</span>
                          <span>{stop}</span>
                        </span>
                      ))}
                    </div>

                    {hasMoreStops && (
                      <button
                        type="button"
                        onClick={() => handleToggleOverlap(overlap.targetRouteNumber)}
                        aria-expanded={isExpanded}
                        className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white flex items-center gap-1 pt-1 cursor-pointer transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Згорнути список зупинок</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Показати всі {overlap.sharedStopsCount} спільних зупинок (+{overlap.sharedStopsCount - 6})</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Маршрут №{currentRoute.number} курсує відокремленою трасою (спільних зупинок з іншими діючими маршрутами не виявлено).</span>
            </div>
            <button
              type="button"
              onClick={onNavigateToIntersections}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all cursor-pointer shadow-xs"
            >
              + Додати спільну зупинку / вузол
            </button>
          </div>
        )}
      </div>

      {/* Кнопка переходу до Етапу 2 */}
      <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onProceedToStep2}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <span>Сформувати структуру нарядів</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
