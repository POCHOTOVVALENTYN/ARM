import React from 'react'
import {
  Scissors,
  Settings2,
  ArrowRight
} from 'lucide-react'
import { Route } from '../../types'

interface DriverShiftEmptyStateProps {
  currentRoute: Route
  onNavigateToParameters: () => void
}

export const DriverShiftEmptyState: React.FC<DriverShiftEmptyStateProps> = ({
  currentRoute,
  onNavigateToParameters
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onNavigateToParameters()
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs text-center flex flex-col items-center justify-center font-sans">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-2xs">
        <Scissors className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
        Для маршруту №{currentRoute.number || currentRoute.id} відсутній активний розклад
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mb-6 leading-relaxed">
        Конструктор змін та карток КПЗ формує нарізку робочих змін водіїв, ПЗЧ та обідніх вікон виключно на основі затвердженого розкладу Служби Руху. Для створення та затвердження графіка перейдіть до «Параметрів та конструктора нарядів».
      </p>
      <button
        type="button"
        onClick={onNavigateToParameters}
        onKeyDown={handleKeyDown}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black flex items-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        tabIndex={0}
        aria-label="Перейти до конструктора нарядів для створення графіка"
      >
        <Settings2 className="w-4 h-4" />
        <span>Скласти розклад у Конструкторі нарядів</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default DriverShiftEmptyState
