import React from 'react'
import {
  Bus,
  Clock,
  CheckCircle2,
  Table as TableIcon,
  Scissors,
  BookmarkPlus,
  Archive,
  ChevronDown,
  ChevronUp,
  UserCheck,
  MapPin,
  Settings2
} from 'lucide-react'
import { ActiveScheduleRoute } from '../../hooks/useActiveDutiesLogic'

interface ActiveDutyRouteCardProps {
  item: ActiveScheduleRoute
  isExpanded: boolean
  onToggleExpand: (routeId: string) => void
  onOpenInMatrix: (routeId: string) => void
  onOpenShiftConstructor: (routeId: string) => void
  onEditInBuilder: (routeId: string) => void
  onOpenTemplateModal: (item: ActiveScheduleRoute) => void
  onArchiveSchedule: (item: ActiveScheduleRoute) => void
}

export const ActiveDutyRouteCard: React.FC<ActiveDutyRouteCardProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  onOpenInMatrix,
  onOpenShiftConstructor,
  onEditInBuilder,
  onOpenTemplateModal,
  onArchiveSchedule
}) => {
  const isTram = item.transport_type === 'tram'

  const handleKeyDownExpand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleExpand(item.route_id)
    }
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 font-sans transition-all hover:border-slate-300 dark:hover:border-slate-700"
      role="article"
      aria-label={`Активний наряд маршруту №${item.route_number}`}
    >
      {/* Route Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-start space-x-3">
          <span
            className={`px-3 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 shrink-0 ${
              isTram
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'bg-emerald-50 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>{isTram ? 'Трамвай' : 'Тролейбус'} №{item.route_number}</span>
          </span>

          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
              {item.route_name}
            </h3>
            <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{item.version_name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{item.depot_name}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Діє на лінії</span>
          </span>

          <button
            type="button"
            onClick={() => onToggleExpand(item.route_id)}
            onKeyDown={handleKeyDownExpand}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            tabIndex={0}
            aria-label={isExpanded ? 'Згорнути наряди' : 'Розгорнути наряди'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Випуск поїздів:</span>
          <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
            {item.duties_count} нарядів
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Інтервал:</span>
          <div className="font-mono font-black text-slate-900 dark:text-white text-sm flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>{item.headway_min} хв</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Рейсів на день:</span>
          <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
            {item.total_trips} рейсів
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Пробіг:</span>
          <div className="font-mono font-black text-slate-800 dark:text-slate-200 text-sm">
            {item.total_wagon_km} км
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-400">Бригади водіїв:</span>
          <div className={`font-mono font-black text-sm flex items-center gap-1 ${
            item.is_fully_assigned ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            <UserCheck className="w-3.5 h-3.5" />
            <span>{item.assigned_drivers_count}/{item.required_drivers_count}</span>
          </div>
        </div>
      </div>

      {/* Expanded Duties Table */}
      {isExpanded && (
        <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-700 dark:text-slate-300">
              Розпис активних нарядів та змін водіїв ({item.duties.length})
            </span>
            <button
              type="button"
              onClick={() => onOpenShiftConstructor(item.route_id)}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-[11px] font-bold cursor-pointer"
            >
              Перейти до КПЗ &rarr;
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2 px-3">Наряд №</th>
                  <th className="py-2 px-3">Тип наряду</th>
                  <th className="py-2 px-3">Зміна 1 (Водій / Вагон)</th>
                  <th className="py-2 px-3">Зміна 2 (Водій / Вагон)</th>
                  <th className="py-2 px-3">Обід</th>
                  <th className="py-2 px-3 text-right">Рейсів</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {item.duties.map((duty) => {
                  const shift1 = duty.shifts.find((s) => s.shift_sequence === 1)
                  const shift2 = duty.shifts.find((s) => s.shift_sequence === 2)

                  return (
                    <tr key={duty.duty_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                        #{duty.duty_number}
                      </td>

                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {duty.duty_type}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-sans">
                        {shift1 ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {shift1.driver_name || <span className="text-amber-600 font-normal">Не призначено</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Борт: {shift1.vehicle_id || '—'} • {shift1.start_time}-{shift1.end_time}
                            </div>
                          </div>
                        ) : '—'}
                      </td>

                      <td className="py-2 px-3 font-sans">
                        {shift2 ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {shift2.driver_name || <span className="text-amber-600 font-normal">Не призначено</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Борт: {shift2.vehicle_id || '—'} • {shift2.start_time}-{shift2.end_time}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-2 px-3 font-sans">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          {shift1?.break_duration_minutes || (isTram ? 15 : 20)} хв
                        </span>
                      </td>

                      <td className="py-2 px-3 text-right font-black text-slate-700 dark:text-slate-300">
                        {duty.shifts.reduce((sum, s) => sum + s.trips_count, 0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons Toolbar */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenInMatrix(item.route_id)}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
            aria-label={`Відкрити зведену таблицю для маршруту №${item.route_number}`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Зведена таблиця</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenShiftConstructor(item.route_id)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
            aria-label={`Відкрити зміни КПЗ для маршруту №${item.route_number}`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Зміни & КПЗ</span>
          </button>

          <button
            type="button"
            onClick={() => onEditInBuilder(item.route_id)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
            aria-label={`Редагувати параметри в Конструкторі для маршруту №${item.route_number}`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Параметри нарядів</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenTemplateModal(item)}
            className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-100 font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
            aria-label="Зберегти конфігурацію нарядів у шаблони"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Зберегти в шаблон</span>
          </button>

          <button
            type="button"
            onClick={() => onArchiveSchedule(item)}
            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
            aria-label={`Перенести розклад маршруту №${item.route_number} в архів`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>В архів</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActiveDutyRouteCard
