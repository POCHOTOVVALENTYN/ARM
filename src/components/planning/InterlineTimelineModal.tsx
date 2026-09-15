import React from 'react'
import {
  X,
  Clock,
  Radio,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react'

interface PassageItem {
  trip_id: number
  route_id: string
  route_number: string
  duty_number: string
  shift_index: number
  time_min: number
  time_str: string
  headway_from_prev_min: number | null
  interval_status: 'NORMAL' | 'CLUMPING' | 'ACCEPTABLE' | 'GOOD' | 'SAME_ROUTE'
}

interface InterlineTimelineModalProps {
  isOpen: boolean
  title: string
  hubStopName: string
  minHeadway: number
  conflictsCount: number
  passages: PassageItem[]
  isSyncing: boolean
  onClose: () => void
  onApplySync: () => void
}

export const InterlineTimelineModal: React.FC<InterlineTimelineModalProps> = ({
  isOpen,
  title,
  hubStopName,
  minHeadway,
  conflictsCount,
  passages,
  isSyncing,
  onClose,
  onApplySync
}) => {
  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Хронологічна стрічка суміщеного руху"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Стрічка суміщеного руху: {title}
              </h3>
              <p className="text-[11px] text-slate-500">
                Контрольна точка: <strong>«{hubStopName}»</strong> • Норматив безпеки: <strong>≥ {minHeadway} хв</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {conflictsCount > 0 && (
              <button
                type="button"
                onClick={onApplySync}
                disabled={isSyncing}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-colors"
                aria-label="Застосувати фазовий зсув для усунення скупчень"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Синхронізація...' : `Усунути скупчення (${conflictsCount})`}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors cursor-pointer"
              aria-label="Закрити модальне вікно"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend Banner */}
        <div className="px-6 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Безпечний інтервал (≥ 2.5 хв)</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Мінімальний (2.0–2.4 хв)</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Скупчення / Паровозик (&lt; 2.0 хв)</span>
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Виявлено конфліктів: <strong className={conflictsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}>{conflictsCount}</strong>
          </span>
        </div>

        {/* Table Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700/60 sticky top-0 z-10 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Час на вузлі</th>
                  <th className="py-2.5 px-3">Маршрут</th>
                  <th className="py-2.5 px-3">Наряд / Зміна</th>
                  <th className="py-2.5 px-3 text-right">Інтервал від попер.</th>
                  <th className="py-2.5 px-3 text-center">Оцінка безпеки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {passages.map((p, idx) => {
                  const isClumping = p.interval_status === 'CLUMPING'
                  const isGood = p.interval_status === 'GOOD'
                  const isAcceptable = p.interval_status === 'ACCEPTABLE'

                  return (
                    <tr
                      key={`${p.trip_id}-${idx}`}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isClumping ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-black text-slate-900 dark:text-white">
                        {p.time_str}
                      </td>

                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          №{p.route_number}
                        </span>
                      </td>

                      <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">
                        Наряд #{p.duty_number} (зм. {p.shift_index})
                      </td>

                      <td className="py-2 px-3 text-right font-black">
                        {p.headway_from_prev_min !== null ? (
                          <span className={
                            isClumping ? 'text-rose-600 font-black' : (
                              isGood ? 'text-emerald-600' : 'text-amber-600'
                            )
                          }>
                            +{p.headway_from_prev_min} хв
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center font-sans">
                        {isClumping && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Скупчення (&lt;{minHeadway}хв)</span>
                          </span>
                        )}
                        {isGood && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Оптимально</span>
                          </span>
                        )}
                        {isAcceptable && (
                          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                            Допустимо
                          </span>
                        )}
                        {p.interval_status === 'SAME_ROUTE' && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            Послідовний
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Фазовий мікро-зсув регулює рух у діапазоні [-2, +2] хв без виходу за межі наряду водія (макс. 9:59).</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  )
}

export default InterlineTimelineModal
