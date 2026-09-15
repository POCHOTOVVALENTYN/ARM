import React from 'react'
import { Calendar, Search } from 'lucide-react'

interface CrewRosterFilterBarProps {
  targetDate: string
  filterMode: 'ALL' | 'ASSIGNED' | 'ROSTER'
  searchQuery: string
  itemsCount: number
  allDriversCount: number
  onDateChange: (date: string) => void
  onFilterModeChange: (mode: 'ALL' | 'ASSIGNED' | 'ROSTER') => void
  onSearchChange: (query: string) => void
}

export const CrewRosterFilterBar: React.FC<CrewRosterFilterBarProps> = ({
  targetDate,
  filterMode,
  searchQuery,
  itemsCount,
  allDriversCount,
  onDateChange,
  onFilterModeChange,
  onSearchChange
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none outline-hidden cursor-pointer"
            aria-label="Вибір дати для перегляду табеля"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-black">
          <button
            onClick={() => onFilterModeChange('ALL')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                : 'text-slate-500'
            }`}
            aria-label="Показати всі призначення"
            tabIndex={0}
          >
            Всі наряди ({itemsCount})
          </button>
          <button
            onClick={() => onFilterModeChange('ROSTER')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterMode === 'ROSTER'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                : 'text-slate-500'
            }`}
            aria-label="Показати штатний реєстр водіїв"
            tabIndex={0}
          >
            Штатний реєстр ({allDriversCount})
          </button>
        </div>
      </div>

      <div className="relative w-full md:w-64">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Пошук за ПІБ або табельним..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-hidden"
          aria-label="Пошук водія"
        />
      </div>
    </div>
  )
}
