import React from 'react'
import { Calendar, User, Search, Printer } from 'lucide-react'

interface DeploymentSummary {
  id: string | number
  driver_id: string | number
  vehicle_id: string | number
}

interface SmartWaybillHeaderProps {
  targetDate: string
  driverIdInput: string
  hasWaybill: boolean
  dailyDeployments: DeploymentSummary[] | undefined
  selectedDriverId: string | number | null
  onDateChange: (date: string) => void
  onDriverIdInputChange: (val: string) => void
  onSearch: (e: React.FormEvent) => void
  onPrint: () => void
  onSelectDeploymentDriver: (driverId: string | number) => void
}

export const SmartWaybillHeader: React.FC<SmartWaybillHeaderProps> = ({
  targetDate,
  driverIdInput,
  hasWaybill,
  dailyDeployments,
  selectedDriverId,
  onDateChange,
  onDriverIdInputChange,
  onSearch,
  onPrint,
  onSelectDeploymentDriver
}) => {
  return (
    <div className="p-4 max-w-7xl mx-auto w-full print:hidden space-y-3">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">
              АРМ Водія / Диспетчера
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Електронний Шляховий Лист та Книжка Водія
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Похвилинний розклад зупинок, рекомендації темпу руху та двосторонній зв'язок з диспетчерською
          </p>
        </div>

        <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={targetDate} 
              onChange={(e) => onDateChange(e.target.value)}
              aria-label="Дата для перегляду шляхового листа"
              className="bg-transparent border-0 font-mono font-bold text-slate-800 dark:text-slate-200 outline-none p-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <User size={14} className="text-slate-400" />
            <input 
              type="text" 
              value={driverIdInput} 
              onChange={(e) => onDriverIdInputChange(e.target.value)}
              placeholder="Табельний №"
              aria-label="Табельний номер водія"
              className="bg-transparent border-0 font-mono font-bold text-slate-800 dark:text-slate-200 outline-none p-0 w-24"
            />
          </div>

          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
            aria-label="Знайти путівку водія"
          >
            <Search size={14} />
            <span>Пошук</span>
          </button>

          {hasWaybill && (
            <button 
              type="button"
              onClick={onPrint}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-all cursor-pointer"
              aria-label="Друкувати шляховий лист"
            >
              <Printer size={14} />
              <span>Друк</span>
            </button>
          )}
        </form>
      </div>

      {dailyDeployments && dailyDeployments.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 overflow-x-auto">
          <span className="text-slate-400 font-bold shrink-0 text-[11px]">Випуск на {targetDate}:</span>
          {dailyDeployments.map((dep) => (
            <button
              key={dep.id}
              type="button"
              onClick={() => onSelectDeploymentDriver(dep.driver_id)}
              className={`px-2 py-0.5 rounded-lg font-mono font-bold border transition-all shrink-0 text-xs cursor-pointer ${
                String(selectedDriverId) === String(dep.driver_id)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              Водій #{dep.driver_id} (Борт {dep.vehicle_id})
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
