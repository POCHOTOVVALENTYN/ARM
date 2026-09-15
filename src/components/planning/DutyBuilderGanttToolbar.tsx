import React from 'react'
import { Layers } from 'lucide-react'
import { StaticScheduleKPI } from '../../hooks/useDutyBuilderLogic'

interface DutyBuilderGanttToolbarProps {
  selectedRouteId: string
  vehiclesCount: number
  kpi?: StaticScheduleKPI
  onRouteIdChange: (id: string) => void
  onVehiclesCountChange: (count: number) => void
}

export const DutyBuilderGanttToolbar: React.FC<DutyBuilderGanttToolbarProps> = ({
  selectedRouteId,
  vehiclesCount,
  kpi,
  onRouteIdChange,
  onVehiclesCountChange
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Діаграма Ґантта випусків та змін водіїв (Gantt Shift Chart)</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Візуалізація робочого часу нарядів, 1-ї та 2-ї змін, обідів (15 хв трамвай / 20 хв тролейбус) та перезмінок
          </p>
        </div>

        <div className="flex items-center space-x-2.5 text-xs">
          <div>
            <label htmlFor="gantt-route-select" className="block text-[10px] font-bold text-slate-500 mb-0.5">
              Маршрут:
            </label>
            <select
              id="gantt-route-select"
              value={selectedRouteId}
              onChange={(e) => onRouteIdChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-bold text-slate-900 dark:text-white cursor-pointer outline-hidden"
            >
              <option value="7">Трамвай №7 (Паустовського ⇄ Херсонський сквер)</option>
              <option value="18">Трамвай №18 (Куликове поле ⇄ 16-та ст. Фонтану)</option>
              <option value="28">Трамвай №28 (Парк Шевченка ⇄ вул. Пастера)</option>
              <option value="5">Трамвай №5 (Аркадія ⇄ Автовокзал)</option>
              <option value="8">Тролейбус №8 (Вокзал ⇄ вул. Інглезі)</option>
            </select>
          </div>

          <div>
            <label htmlFor="gantt-vehicles-count" className="block text-[10px] font-bold text-slate-500 mb-0.5">
              Наряди (N):
            </label>
            <input
              id="gantt-vehicles-count"
              type="number"
              min="1"
              max="30"
              value={vehiclesCount}
              onChange={(e) => onVehiclesCountChange(parseInt(e.target.value, 10) || 1)}
              className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1.5 font-mono font-bold text-slate-900 dark:text-white outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-300">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 shrink-0 inline-block" />
          <span>Нульовий виїзд (15 хв)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0 inline-block" />
          <span>Рейс на лінії</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 shrink-0 inline-block" />
          <span>Обід водія ({kpi?.standard_break_min || 15} хв)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-purple-600 shrink-0 inline-block" />
          <span>Перезмінка водіїв</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 shrink-0 inline-block" />
          <span>Заїзд у депо</span>
        </div>
      </div>
    </div>
  )
}
