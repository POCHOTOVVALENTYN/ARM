import React from 'react'
import { Zap } from 'lucide-react'

export const HotReserveHeader: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <span className="bg-purple-600 text-white font-black px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
            Майстер Аварій ОМЕТ
          </span>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Оперативний Майстер «Гарячого Резерву» (Hot Reserve Swap)
          </h2>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Атомарна транзакція: фіксація поломки вагона, перекидання рейсів на резервний борт депо та автооновлення Книжок водія
        </p>
      </div>

      <div className="flex items-center space-x-2 font-mono text-xs font-bold shrink-0">
        <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
          <span>Готовність Резерву: 100%</span>
        </span>
      </div>
    </div>
  )
}
