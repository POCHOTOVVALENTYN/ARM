import React from 'react'
import { Archive } from 'lucide-react'

interface StaticDutiesArchiveEmptyStateProps {
  onNavigateToParameters: () => void
}

export const StaticDutiesArchiveEmptyState: React.FC<StaticDutiesArchiveEmptyStateProps> = ({
  onNavigateToParameters
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 space-y-4 font-sans">
      <Archive className="w-12 h-12 text-slate-300 dark:text-slate-700" />
      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Архівних розкладів не знайдено</h3>
      <p className="text-xs text-center max-w-md text-slate-500">
        Перейдіть у модуль «Конструктор параметрів нарядів», щоб розрахувати та зберегти новий еталонний розклад руху.
      </p>
      <button
        type="button"
        onClick={onNavigateToParameters}
        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
        aria-label="Перейти до конструктора параметрів нарядів"
      >
        Перейти до конструктора параметрів →
      </button>
    </div>
  )
}
