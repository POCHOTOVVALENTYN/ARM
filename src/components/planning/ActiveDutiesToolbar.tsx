import React from 'react'
import { Zap, Search, PlusCircle, Bus, CheckCircle2 } from 'lucide-react'

interface ActiveDutiesToolbarProps {
  metrics: {
    activeRoutesCount: number
    totalDuties: number
    totalTrips: number
    totalKm: number
    assignedDrivers: number
    requiredDrivers: number
    crewFulfillmentPct: number
  }
  transportFilter: 'ALL' | 'TRAM' | 'TROLLEYBUS'
  searchQuery: string
  onTransportFilterChange: (filter: 'ALL' | 'TRAM' | 'TROLLEYBUS') => void
  onSearchChange: (query: string) => void
  onNavigateToBuilder: () => void
}

export const ActiveDutiesToolbar: React.FC<ActiveDutiesToolbarProps> = ({
  metrics,
  transportFilter,
  searchQuery,
  onTransportFilterChange,
  onSearchChange,
  onNavigateToBuilder
}) => {
  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner with KPIs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-2xs">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Активні наряди маршрутів КП «Одесміськелектротранс»
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{metrics.activeRoutesCount} на лінії</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Діючий добовий випуск: оперативне закріплення поїздів, водіїв, контроль нарядів та шаблонів
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onNavigateToBuilder}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            tabIndex={0}
            aria-label="Скласти новий розклад у Конструкторі"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Скласти новий розклад</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Плановий випуск:</span>
          <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
            {metrics.totalDuties} <span className="text-xs font-medium text-slate-400">поїздів</span>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Добових рейсів:</span>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {metrics.totalTrips} <span className="text-xs font-medium text-slate-400">оборотів</span>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Добовий пробіг:</span>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {metrics.totalKm.toLocaleString()} <span className="text-xs font-medium text-slate-400">ваг-км</span>
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Укомплектованість бригадами:</span>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono flex items-center gap-1.5">
            <span>{metrics.crewFulfillmentPct}%</span>
            <span className="text-[11px] font-semibold text-slate-400">
              ({metrics.assignedDrivers}/{metrics.requiredDrivers})
            </span>
          </div>
        </div>
      </div>

      {/* Filter Row: Search & Transport Switcher */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Пошук за номером маршруту, назвою або версією..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Пошук у реєстрі активних нарядів"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-extrabold text-slate-500 uppercase text-[11px]">Тип:</span>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black border border-slate-200 dark:border-slate-700" role="group" aria-label="Фільтр виду транспорту">
            <button
              type="button"
              onClick={() => onTransportFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                transportFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Всі мережі
            </button>
            <button
              type="button"
              onClick={() => onTransportFilterChange('TRAM')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                transportFilter === 'TRAM'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bus className="w-3 h-3" />
              <span>Трамваї</span>
            </button>
            <button
              type="button"
              onClick={() => onTransportFilterChange('TROLLEYBUS')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                transportFilter === 'TROLLEYBUS'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bus className="w-3 h-3" />
              <span>Тролейбуси</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActiveDutiesToolbar
