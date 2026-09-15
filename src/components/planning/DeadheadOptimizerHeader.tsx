import React from 'react'
import { Zap, RefreshCw, Sparkles } from 'lucide-react'

interface DeadheadOptimizerHeaderProps {
  isFetching: boolean
  isLoading: boolean
  isApplyPending: boolean
  onRefetch: () => void
  onApplyOptimization: () => void
}

export const DeadheadOptimizerHeader: React.FC<DeadheadOptimizerHeaderProps> = ({
  isFetching,
  isLoading,
  isApplyPending,
  onRefetch,
  onApplyOptimization
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur shadow-xl font-sans">
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 rounded-xl border border-amber-500/30 text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Оптимізатор нульових рейсів (Deadhead & Pull-Out)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                Енергозбереження
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Матрична оптимізація виїздів та заїздів між депо (ТД-1, ТД-2, ТрД) та розворотними кільцями КП «ОМЕТ»
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRefetch}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer disabled:opacity-50 active:scale-95"
          aria-label="Оновити розрахунки мережі"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Перерахувати</span>
        </button>

        <button
          type="button"
          onClick={onApplyOptimization}
          disabled={isApplyPending || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/40 border border-emerald-500/40 transition cursor-pointer disabled:opacity-50 active:scale-95"
          aria-label="Застосувати оптимальні депо до бази даних"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isApplyPending ? 'Запис у БД...' : 'Застосувати оптимальну мережу до БД'}</span>
        </button>
      </div>
    </div>
  )
}
