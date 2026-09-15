import React from 'react'
import { Archive, Search, PlusCircle, Bus } from 'lucide-react'
import { TransportArchiveFilter } from '../../hooks/useStaticDutiesArchiveLogic'

interface StaticDutiesArchiveToolbarProps {
  totalCount: number
  searchQuery: string
  selectedTransportFilter: TransportArchiveFilter
  onSearchChange: (query: string) => void
  onTransportFilterChange: (filter: TransportArchiveFilter) => void
  onNavigateToParameters: () => void
}

export const StaticDutiesArchiveToolbar: React.FC<StaticDutiesArchiveToolbarProps> = ({
  totalCount,
  searchQuery,
  selectedTransportFilter,
  onSearchChange,
  onTransportFilterChange,
  onNavigateToParameters
}) => {
  return (
    <div className="space-y-4 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 shadow-2xs">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Архів розкладів та нарядів КП «Одесміськелектротранс»
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {totalCount} у сховищі
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Історичний каталог розкладів, сезонні версії та планове введення розкладів у дію
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onNavigateToParameters}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            tabIndex={0}
            aria-label="Сформувати новий розклад"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Сформувати новий розклад</span>
          </button>
        </div>
      </div>

      {/* Фільтрація та Пошук */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Пошук за номером маршруту, назвою або версією..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
            aria-label="Пошук у реєстрі архівних розкладів"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-extrabold text-slate-500 uppercase text-[11px]">Мережа:</span>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black border border-slate-200 dark:border-slate-700" role="group" aria-label="Фільтр за видом транспорту">
            <button
              type="button"
              onClick={() => onTransportFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedTransportFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Всі
            </button>
            <button
              type="button"
              onClick={() => onTransportFilterChange('TRAM')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedTransportFilter === 'TRAM'
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
                selectedTransportFilter === 'TROLLEYBUS'
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

export default StaticDutiesArchiveToolbar
