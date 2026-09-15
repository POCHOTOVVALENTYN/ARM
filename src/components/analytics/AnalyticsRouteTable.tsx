import React from 'react'
import {
  TramFront,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { SortField, formatRouteLabel } from '../../hooks/useAnalyticsReportLogic'
import { RoutePerformance } from '../../hooks/useAnalyticsQueries'

export interface AnalyticsRouteTableProps {
  data: RoutePerformance[]
  targetDate: string
  sortField: SortField
  sortAsc: boolean
  onSort: (field: SortField) => void
}

export const AnalyticsRouteTable: React.FC<AnalyticsRouteTableProps> = ({
  data,
  targetDate,
  sortField,
  sortAsc,
  onSort
}) => {
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline-block" />
    }
    return sortAsc 
      ? <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
      : <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
  }

  const handleHeaderKeyDown = (e: React.KeyboardEvent, field: SortField) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSort(field)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <TramFront className="w-4 h-4 text-blue-500" />
          <span>Зведена таблиця регулярності та запізнень по лініях</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          Дата: {targetDate} • Клікніть на заголовок для сортування
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th 
                onClick={() => onSort('route')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'route')}
                tabIndex={0}
                role="button"
                aria-label="Сортувати за номером маршруту"
                className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700"
              >
                Маршрут {renderSortIndicator('route')}
              </th>
              <th 
                onClick={() => onSort('records')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'records')}
                tabIndex={0}
                role="button"
                aria-label="Сортувати за кількістю перевірок"
                className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700"
              >
                Зафіксовано зупинок {renderSortIndicator('records')}
              </th>
              <th 
                onClick={() => onSort('avg_dev')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'avg_dev')}
                tabIndex={0}
                role="button"
                aria-label="Сортувати за середнім відхиленням"
                className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700"
              >
                Сер. відхилення {renderSortIndicator('avg_dev')}
              </th>
              <th 
                onClick={() => onSort('max_dev')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'max_dev')}
                tabIndex={0}
                role="button"
                aria-label="Сортувати за максимальним запізненням"
                className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700"
              >
                Макс. запізнення {renderSortIndicator('max_dev')}
              </th>
              <th 
                onClick={() => onSort('otp')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'otp')}
                tabIndex={0}
                role="button"
                aria-label="Сортувати за відсотком OTP"
                className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors select-none focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700"
              >
                Регулярність OTP (±2 хв) {renderSortIndicator('otp')}
              </th>
              <th className="py-3 px-4 border-b border-slate-200 dark:border-slate-700">Оцінка надійності</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Немає даних відхилень за вказану дату. Телеметрія фіксується автоматично під час проходження зупинок.
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isOptimal = row.on_time_percentage >= 80
                const isModerate = row.on_time_percentage >= 60 && row.on_time_percentage < 80
                const otpBadgeClass = isOptimal
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : isModerate
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'

                const avgDevFormatted = row.avg_deviation_min > 0 ? `+${row.avg_deviation_min}` : row.avg_deviation_min
                const maxDevFormatted = row.max_deviation_min > 0 ? `+${row.max_deviation_min} хв` : '0 хв'

                return (
                  <tr key={row.route_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded text-xs">
                        {formatRouteLabel(row.route_id)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.total_records}
                    </td>
                    <td className={`py-3 px-4 text-center font-mono font-bold ${row.avg_deviation_min > 2 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {avgDevFormatted} хв
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-rose-500 font-bold">
                      {maxDevFormatted}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black">
                      <span className={`px-2.5 py-0.5 rounded ${otpBadgeClass}`}>
                        {row.on_time_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isOptimal ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Відповідає нормативу
                        </span>
                      ) : isModerate ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Потребує коригування
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Критичні затримки
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AnalyticsRouteTable
