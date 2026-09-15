import React from 'react'
import { 
  BookOpen, 
  Printer, 
  FileSpreadsheet
} from 'lucide-react'
import { Route } from '../../types'

interface DriverScheduleBookToolbarProps {
  routes: Route[]
  selectedRouteId: string
  dutyNumbers: string[]
  activeDutyId: string
  onSelectRoute: (routeId: string) => void
  onSelectDuty: (dutyNum: string) => void
  onPrintSingle: () => void
  onPrintBatch: () => void
}

export const DriverScheduleBookToolbar: React.FC<DriverScheduleBookToolbarProps> = ({
  routes,
  selectedRouteId,
  dutyNumbers,
  activeDutyId,
  onSelectRoute,
  onSelectDuty,
  onPrintSingle,
  onPrintBatch
}) => {
  const handleKeyDownSelect = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      callback()
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden font-sans">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Маршрутна Книжка Водія за Контрольними Точками</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-800">
                КП «ОМЕТ»
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Поїзний розклад окремих випусків з фіксацією часу явки, виходу з депо, обідів, перезмінок та ротацій вагонів
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPrintSingle}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            aria-label="Друк картки обраного наряду А4"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Друк картки наряду (А4)</span>
          </button>

          <button
            type="button"
            onClick={onPrintBatch}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            aria-label="Пакетний друк всіх нарядів"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Пакетний друк ВСІХ нарядів</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <label htmlFor="driver-book-route-select" className="text-[10px] uppercase font-black text-slate-400">Маршрут:</label>
          <select
            id="driver-book-route-select"
            value={selectedRouteId}
            onChange={(e) => onSelectRoute(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-white cursor-pointer"
            aria-label="Вибір маршруту"
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                №{r.number} — {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-black text-slate-400">Обрати наряд:</span>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Список номерів нарядів">
            {dutyNumbers.map((dNum) => (
              <button
                key={dNum}
                type="button"
                onClick={() => onSelectDuty(dNum)}
                onKeyDown={(e) => handleKeyDownSelect(e, () => onSelectDuty(dNum))}
                tabIndex={0}
                aria-pressed={activeDutyId === dNum}
                aria-label={`Обрати наряд номер ${dNum}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeDutyId === dNum
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {dNum}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
