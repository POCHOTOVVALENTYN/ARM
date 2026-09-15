import React from 'react'
import { RefreshCw, TramFront } from 'lucide-react'

export const ViewLoadingFallback: React.FC = () => {
  return (
    <div 
      className="flex-1 w-full min-h-[420px] flex flex-col items-center justify-center p-8 space-y-4 font-sans select-none animate-fade-in"
      role="status"
      aria-label="Завантаження модуля системи"
    >
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm animate-pulse">
          <TramFront className="w-8 h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
          Завантаження робочого модуля
        </p>
        <p className="text-xs text-slate-400 font-medium font-mono">
          КП «Одесміськелектротранс» • АРМ Диспетчера
        </p>
      </div>

      {/* Швидкий скелетон-блок контенту */}
      <div className="w-full max-w-xl space-y-2.5 pt-4">
        <div className="h-4 bg-slate-200/70 dark:bg-slate-800/70 rounded-full w-3/4 mx-auto animate-pulse" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800/40 rounded-full w-1/2 mx-auto animate-pulse" />
      </div>
    </div>
  )
}

export default ViewLoadingFallback
