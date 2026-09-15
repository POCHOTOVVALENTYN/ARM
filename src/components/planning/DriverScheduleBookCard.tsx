import React from 'react'
import { 
  Bus, 
  Coffee, 
  ArrowRight
} from 'lucide-react'
import { DutyBook, DutyBookTrip } from '../../types'

interface DriverScheduleBookCardProps {
  book: DutyBook
  routeNumber: string
}

export const DriverScheduleBookCard: React.FC<DriverScheduleBookCardProps> = ({
  book,
  routeNumber
}) => {
  const isSplit = book.duty_type === 'SPLIT'
  const isSingle = book.duty_type === 'SINGLE'
  const isPeak = book.duty_type === 'PEAK'

  const dutyTypeLabel = isSplit 
    ? 'Розривний (Ротація 2-х вагонів на лінії)' 
    : isPeak 
    ? 'Піковий (Ранок / Вечір)' 
    : isSingle 
    ? 'Однозмінний' 
    : 'Двозмінний (1 вагон, 2 зміни)'

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:break-after-page mb-8 font-sans"
      role="article"
      aria-label={`Маршрутна книжка водія наряд №${book.duty_number}`}
    >
      {/* Official Header */}
      <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-3 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase font-black tracking-widest text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
            КП «Одесміськелектротранс» • Служба Руху
          </span>
          <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white mt-1">
            Маршрутна книжка водія — Наряд №{book.duty_number}
          </h2>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Маршрут №{routeNumber} ({book.route_name}) | Тип наряду: <strong>{dutyTypeLabel}</strong>
          </p>
        </div>

        <div className="text-right text-xs font-mono text-slate-600 dark:text-slate-400">
          <div>Депо: <strong>{book.depot_name}</strong></div>
          <div>
            Вагон: <strong className="text-indigo-600 dark:text-indigo-400">№{book.vehicle_id}</strong>
            {book.vehicle_id_2 && <span> / <strong className="text-purple-600 dark:text-purple-400">№{book.vehicle_id_2}</strong></span>}
          </div>
        </div>
      </div>

      {/* Drivers & Shifts Brief Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 text-xs">
        {/* Shift 1 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Зміна І (Ранкова)</span>
            </span>
            <span className="text-[10px] text-slate-500">{book.driver1.name}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">Явка в депо:</span>
              <strong>{book.driver1.arrival_time}</strong>
            </div>
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">Вихід з депо:</span>
              <strong className="text-emerald-600 dark:text-emerald-400">{book.driver1.pullout_time}</strong>
            </div>
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">1-й відхід:</span>
              <strong className="text-indigo-600 dark:text-indigo-400">{book.driver1.start_time}</strong>
            </div>
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">Обід на ДП:</span>
              <strong className="text-amber-600 dark:text-amber-400">{book.driver1.lunch_time}</strong>
            </div>
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">Кінець зміни:</span>
              <strong>{book.driver1.shift_end_time}</strong>
            </div>
          </div>
        </div>

        {/* Shift 2 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center justify-between font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Зміна ІІ (Вечірня)</span>
            </span>
            <span className="text-[10px] text-slate-500">{book.driver2.name}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">Початок зміни:</span>
              <strong className="text-blue-600 dark:text-blue-400">{book.driver2.start_time}</strong>
            </div>
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">Обід на ДП:</span>
              <strong className="text-amber-600 dark:text-amber-400">{book.driver2.lunch_time}</strong>
            </div>
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">Захід у депо:</span>
              <strong className="text-slate-700 dark:text-slate-300">{book.driver2.pullin_time}</strong>
            </div>
            <div>
              <span className="text-[10px] font-sans text-slate-400 block">Кінець зміни:</span>
              <strong>{book.driver2.shift_end_time}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Turn-by-Turn Timetable by Control Points */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
        <table className="w-full text-xs text-left border-collapse font-mono" aria-label={`Порейсовий розклад наряду ${book.duty_number}`}>
          <thead>
            <tr className="bg-slate-900 text-white font-sans font-bold text-center border-b border-slate-700">
              <th className="px-2 py-1.5 w-10 border-r border-slate-700">№</th>
              <th className="px-2 py-1.5 w-12 border-r border-slate-700">Круг</th>
              <th className="px-3 py-1.5 text-left border-r border-slate-700 w-44">Напрямок рейсу</th>
              <th className="px-2 py-1.5 w-14 border-r border-slate-700">Відхід</th>
              <th className="px-2 py-1.5 border-r border-slate-700 font-sans text-[10px]">Контрольні Точки (КТ) прибуття</th>
              <th className="px-2 py-1.5 w-14 border-r border-slate-700">Прибуття</th>
              <th className="px-2 py-1.5 w-12 border-r border-slate-700">Відстій</th>
              <th className="px-3 py-1.5 text-left">Особливі відмітки / Події</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-[11px]">
            {book.trips.map((trip: DutyBookTrip, tIdx: number) => {
              const isZeroPullOut = trip.direction === 'PULL_OUT'
              const isZeroPullIn = trip.direction === 'PULL_IN'
              const isLunch = trip.event_tag.includes('ОБІД')
              const isRotation = trip.event_tag.includes('РОТАЦІЯ')
              const isShiftChange = trip.event_tag.includes('ПЕРЕЗМІНКА')

              let rowBg = tIdx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'
              if (isZeroPullOut || isZeroPullIn) rowBg = 'bg-slate-100/80 dark:bg-slate-800/60 font-semibold'
              if (isLunch) rowBg = 'bg-amber-50/80 dark:bg-amber-950/30'
              if (isRotation) rowBg = 'bg-purple-50/80 dark:bg-purple-950/30'
              if (isShiftChange) rowBg = 'bg-blue-50/80 dark:bg-blue-950/30'

              return (
                <tr key={trip.trip_number || tIdx} className={`${rowBg} hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors`}>
                  <td className="px-2 py-1.5 text-center font-sans font-bold border-r border-slate-200 dark:border-slate-800">
                    {trip.trip_number}
                  </td>
                  <td className="px-2 py-1.5 text-center border-r border-slate-200 dark:border-slate-800">
                    {trip.round_number > 0 ? trip.round_number : '—'}
                  </td>
                  <td className="px-3 py-1.5 font-sans font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 truncate">
                    {trip.direction_label}
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                    {trip.departure_time}
                  </td>
                  <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800 font-sans text-[10px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {trip.control_point_times.map((cp, cpIdx) => (
                        <span 
                          key={cp.cp_name || cpIdx}
                          className={`px-1.5 py-0.5 rounded border ${
                            cp.is_dp 
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 font-bold' 
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cp.cp_name}: <strong className="font-mono">{cp.arrival_time}</strong>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                    {trip.arrival_time}
                  </td>
                  <td className="px-2 py-1.5 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                    {trip.layover_min > 0 ? `${trip.layover_min} хв` : '—'}
                  </td>
                  <td className="px-3 py-1.5 font-sans font-bold text-[10px]">
                    {isLunch && (
                      <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Coffee className="w-3.5 h-3.5 text-amber-600" />
                        <span>{trip.event_tag}</span>
                      </span>
                    )}
                    {isRotation && (
                      <span className="text-purple-800 dark:text-purple-300 flex items-center gap-1">
                        <Bus className="w-3.5 h-3.5 text-purple-600" />
                        <span>{trip.event_tag}</span>
                      </span>
                    )}
                    {isShiftChange && (
                      <span className="text-blue-800 dark:text-blue-300 flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                        <span>{trip.event_tag}</span>
                      </span>
                    )}
                    {!isLunch && !isRotation && !isShiftChange && (
                      <span className="text-slate-600 dark:text-slate-400 font-normal">
                        {trip.event_tag}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Print Signatures */}
      <div className="hidden print:flex justify-between items-center mt-8 pt-4 border-t border-slate-400 text-[11px] font-serif">
        <div>
          <p>Диспетчер лінії: _____________________</p>
        </div>
        <div>
          <p>Підпис водія І зміни: _____________________</p>
        </div>
        <div>
          <p>Підпис водія ІІ зміни: _____________________</p>
        </div>
      </div>
    </div>
  )
}
