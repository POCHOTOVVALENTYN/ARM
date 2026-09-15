import React from 'react'
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Building2 
} from 'lucide-react'
import { RouteEvaluation } from '../../types/deadhead'
import { DeadheadTypeFilter } from '../../hooks/useDeadheadOptimizerLogic'

interface DeadheadRoutesTableProps {
  searchQuery: string
  typeFilter: DeadheadTypeFilter
  suboptimalOnly: boolean
  expandedRouteId: string | null
  filteredRoutes: RouteEvaluation[]
  onSearchChange: (q: string) => void
  onTypeFilterChange: (t: DeadheadTypeFilter) => void
  onSuboptimalOnlyChange: (val: boolean) => void
  onToggleRoute: (routeId: string) => void
}

export const DeadheadRoutesTable: React.FC<DeadheadRoutesTableProps> = ({
  searchQuery,
  typeFilter,
  suboptimalOnly,
  expandedRouteId,
  filteredRoutes,
  onSearchChange,
  onTypeFilterChange,
  onSuboptimalOnlyChange,
  onToggleRoute
}) => {
  return (
    <div className="space-y-4 font-sans">
      {/* Панель фільтрів */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Пошук маршруту чи кінцевої..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              aria-label="Пошук маршруту"
            />
          </div>

          {/* Фільтр транспорту */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1" role="group" aria-label="Фільтр за видом транспорту">
            <button
              type="button"
              onClick={() => onTypeFilterChange('ALL')}
              aria-pressed={typeFilter === 'ALL'}
              aria-label="Показати всі маршрути"
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                typeFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Всі
            </button>
            <button
              type="button"
              onClick={() => onTypeFilterChange('TRAM')}
              aria-pressed={typeFilter === 'TRAM'}
              aria-label="Показати трамваї"
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                typeFilter === 'TRAM' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Трамваї
            </button>
            <button
              type="button"
              onClick={() => onTypeFilterChange('TROLLEYBUS')}
              aria-pressed={typeFilter === 'TROLLEYBUS'}
              aria-label="Показати тролейбуси"
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                typeFilter === 'TROLLEYBUS' ? 'bg-blue-500/20 text-blue-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Тролейбуси
            </button>
          </div>
        </div>

        {/* Чекбокс тільки субоптимальні */}
        <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={suboptimalOnly}
            onChange={(e) => onSuboptimalOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>Показати лише маршрути з резервом економії</span>
        </label>
      </div>

      {/* Таблиця маршрутів */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300" aria-label="Таблиця маршрутів та оцінки нульових рейсів">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Маршрут</th>
                <th className="py-3.5 px-3">Випуск</th>
                <th className="py-3.5 px-4">Поточне депо</th>
                <th className="py-3.5 px-4">Оптимальне депо</th>
                <th className="py-3.5 px-4">Виїзд / Заїзд (оптим.)</th>
                <th className="py-3.5 px-4">Вузол примикання</th>
                <th className="py-3.5 px-4 text-right">Резерв економії</th>
                <th className="py-3.5 px-3 text-center">Деталі</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRoutes.map((route) => {
                const isExpanded = expandedRouteId === route.route_id
                const isOptimal = route.is_already_optimal
                const isTrolley = route.transport_type === 'TROLLEYBUS'

                return (
                  <React.Fragment key={route.route_id}>
                    <tr 
                      onClick={() => onToggleRoute(route.route_id)}
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        !isOptimal ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Номер та назва маршруту */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm ${
                            isTrolley ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40' : 'bg-red-600/20 text-red-400 border border-red-500/40'
                          }`}>
                            {route.route_number}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                              {route.route_name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {route.terminals.terminal_a} ⇄ {route.terminals.terminal_b}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Випуск */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                          {route.duties_count} нар.
                        </span>
                      </td>

                      {/* Поточне депо */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                            isOptimal 
                              ? 'bg-slate-800 text-slate-300' 
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {route.current_depot.code}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({route.current_depot.daily_km} км/д)
                          </span>
                        </div>
                      </td>

                      {/* Оптимальне депо */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {route.optimal_depot.code}
                          </span>
                          {isOptimal ? (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Оптимально
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-semibold animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Потребує зміни
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Виїзд / Заїзд */}
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-mono text-[11px]">
                          Виїзд: <strong className="text-slate-100">{route.optimal_depot.pull_out_min} хв</strong> ({route.optimal_depot.pull_out_km} км)
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          Заїзд: <strong className="text-slate-300">{route.optimal_depot.pull_in_min} хв</strong> ({route.optimal_depot.pull_in_km} км)
                        </div>
                      </td>

                      {/* Вузол примикання */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-medium text-[11px]">{route.optimal_depot.pull_out_junction}</span>
                        </div>
                      </td>

                      {/* Резерв економії */}
                      <td className="py-3 px-4 text-right">
                        {!isOptimal ? (
                          <div>
                            <div className="font-bold text-emerald-400">
                              -{route.savings.delta_km_daily} км/добу
                            </div>
                            <div className="text-[10px] text-emerald-300/80">
                              +{route.savings.cost_saved_uah_daily} ₴/д ({route.savings.kwh_saved_daily} кВт)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">0.0 км</span>
                        )}
                      </td>

                      {/* Кнопка розгортання */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
                          aria-label={isExpanded ? 'Згорнути деталі' : 'Розгорнути деталі'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Розгорнуті деталі маршруту */}
                    {isExpanded && (
                      <tr className="bg-slate-950/70 border-y border-slate-800/80">
                        <td colSpan={8} className="p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Траса нульового виїзду */}
                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                                <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Коридор виїзду з депо ({route.optimal_depot.code} ➔ {route.terminals.terminal_a})</span>
                                </h4>
                                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                                  {route.optimal_depot.pull_out_path}
                                </p>
                                <div className="mt-2 text-[11px] text-slate-500">
                                  Нормативний час: <span className="text-emerald-400 font-bold">{route.optimal_depot.pull_out_min} хв</span> • Дистанція: <span className="text-emerald-400 font-bold">{route.optimal_depot.pull_out_km} км</span>
                                </div>
                              </div>

                              {/* Траса нульового заїзду */}
                              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                                <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                                  <ArrowRight className="w-3.5 h-3.5 text-blue-400 rotate-180" />
                                  <span>Коридор повернення в депо ({route.terminals.terminal_b} ➔ {route.optimal_depot.code})</span>
                                </h4>
                                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                                  {route.optimal_depot.pull_in_path}
                                </p>
                                <div className="mt-2 text-[11px] text-slate-500">
                                  Нормативний час: <span className="text-blue-400 font-bold">{route.optimal_depot.pull_in_min} хв</span> • Дистанція: <span className="text-blue-400 font-bold">{route.optimal_depot.pull_in_km} км</span>
                                </div>
                              </div>
                            </div>

                            {/* Порівняльна таблиця варіантів депо для маршруту */}
                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Порівняння варіантів закріплення депо для {route.route_number}:
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {route.variants.map((v) => {
                                  const isSelected = v.depot_id === route.optimal_depot.id
                                  return (
                                    <div
                                      key={v.depot_id}
                                      className={`p-3 rounded-xl border transition ${
                                        isSelected
                                          ? 'bg-emerald-950/20 border-emerald-500/50 text-slate-200'
                                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-bold text-xs flex items-center gap-1.5">
                                          <Building2 className="w-3.5 h-3.5" />
                                          {v.depot_name} ({v.depot_code})
                                        </span>
                                        {isSelected && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            Оптимальне рішення
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs space-y-0.5 font-mono">
                                        <div>Виїзд: {v.pull_out_min} хв ({v.pull_out_km} км)</div>
                                        <div>Заїзд: {v.pull_in_min} хв ({v.pull_in_km} км)</div>
                                        <div className="font-bold text-slate-100 pt-1 border-t border-slate-800/60 mt-1">
                                          Добовий пробіг ({route.duties_count} випусків): {v.daily_km} км / {v.daily_min} хв
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
