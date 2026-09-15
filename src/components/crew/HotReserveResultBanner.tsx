import React from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { HotReserveSwapResult } from '../../hooks/useHotReserveLogic'

interface HotReserveResultBannerProps {
  swapResult: HotReserveSwapResult | null
}

export const HotReserveResultBanner: React.FC<HotReserveResultBannerProps> = ({ swapResult }) => {
  if (!swapResult) return null

  return (
    <div
      className={`p-4 rounded-2xl border space-y-2 ${
        swapResult.success
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300'
      }`}
    >
      <div className="flex items-center space-x-2 font-bold text-xs">
        {swapResult.success ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
        )}
        <span>{swapResult.message}</span>
      </div>

      {swapResult.regeneratedBooklets && (
        <div className="text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1 pt-1 border-t border-emerald-200 dark:border-emerald-900/50">
          <span className="font-bold text-slate-900 dark:text-white">
            Перегенеровано персональні Книжки водіїв:
          </span>
          <div className="flex space-x-2">
            {swapResult.regeneratedBooklets.map((b) => (
              <span key={b} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 rounded font-bold">
                📄 Booklet_{b}.pdf
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
