import React from 'react'
import { Users, RefreshCw, Plus } from 'lucide-react'

interface CrewRosterHeaderProps {
  onRefresh: () => void
  onNavigateToAssignment: () => void
}

export const CrewRosterHeader: React.FC<CrewRosterHeaderProps> = ({
  onRefresh,
  onNavigateToAssignment
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Реєстр табелювання та змін водіїв</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-200 dark:border-emerald-800">
              КП «ОМЕТ»
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Оперативний облік призначень водійського складу, статусів змін та виданих електронних путівок
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        <button
          onClick={onRefresh}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
          aria-label="Оновити дані табелювання"
          tabIndex={0}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Оновити</span>
        </button>

        <button
          onClick={onNavigateToAssignment}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          aria-label="Перейти до видачі електронних путівок"
          tabIndex={0}
        >
          <Plus className="w-4 h-4" />
          <span>Виписати путівку</span>
        </button>
      </div>
    </div>
  )
}
