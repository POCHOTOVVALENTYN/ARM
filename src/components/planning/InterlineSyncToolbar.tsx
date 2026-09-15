import React from 'react'
import { Radio, Sparkles, Layers, GitCompare, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface InterlineSyncToolbarProps {
  transportType: 'tram' | 'trolleybus'
  syncMode: 'CORRIDORS' | 'PAIR'
  isPending: boolean
  minHeadway: number
  totalConflicts: number
  onTransportTypeChange: (type: 'tram' | 'trolleybus') => void
  onSyncModeChange: (mode: 'CORRIDORS' | 'PAIR') => void
  onMinHeadwayChange: (headway: number) => void
  onRunSync: () => void
}

export const InterlineSyncToolbar: React.FC<InterlineSyncToolbarProps> = ({
  transportType,
  syncMode,
  isPending,
  minHeadway,
  totalConflicts,
  onTransportTypeChange,
  onSyncModeChange,
  onMinHeadwayChange,
  onRunSync
}) => {
  const handleKeyDownTram = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTransportTypeChange('tram')
    }
  }

  const handleKeyDownTrolley = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTransportTypeChange('trolleybus')
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 font-sans">
      {/* Upper row: Header & Sync Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-black text-[10px] uppercase tracking-wider">
              Алгоритм ОМЕТ
            </span>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-purple-600" />
              <span>Синхронізація суміщених ділянок «Зв'язок»</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Автоматичне усунення міжмаршрутних скупчень та накладок на спільних зупинках (інтервал не менше 2.0–3.0 хв)
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {totalConflicts > 0 ? (
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-extrabold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{totalConflicts} конфліктів скупчення</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Коридори узгоджені</span>
            </div>
          )}

          <button
            type="button"
            onClick={onRunSync}
            disabled={isPending}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all active:scale-95"
            aria-label="Запустити синхронізацію зв'язок"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isPending ? 'Розрахунок зсувів...' : "Запустити «Зв'язок»"}</span>
          </button>
        </div>
      </div>

      {/* Lower row: Controls (Transport Type, Sync Mode, Headway Input) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Transport Type Switcher */}
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-slate-500 uppercase text-[11px]">Транспорт:</span>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onTransportTypeChange('tram')}
              onKeyDown={handleKeyDownTram}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                transportType === 'tram'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              tabIndex={0}
              aria-label="Обрати трамвайну мережу"
            >
              Трамвайна мережа
            </button>
            <button
              type="button"
              onClick={() => onTransportTypeChange('trolleybus')}
              onKeyDown={handleKeyDownTrolley}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer ${
                transportType === 'trolleybus'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              tabIndex={0}
              aria-label="Обрати тролейбусну мережу"
            >
              Тролейбусна мережа
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-slate-500 uppercase text-[11px]">Режим:</span>
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => onSyncModeChange('CORRIDORS')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                syncMode === 'CORRIDORS'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              aria-label="Режим перегляду магістральних коридорів"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Магістральні коридори</span>
            </button>
            <button
              type="button"
              onClick={() => onSyncModeChange('PAIR')}
              className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                syncMode === 'PAIR'
                  ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              aria-label="Режим парної координації маршрутів"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Парна координація</span>
            </button>
          </div>
        </div>

        {/* Headway Parameter */}
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="font-extrabold text-slate-600 dark:text-slate-300 text-[11px]">Мін. інтервал:</span>
          <input
            id="min-headway-input"
            type="number"
            step="0.5"
            min="1.0"
            max="5.0"
            value={minHeadway}
            onChange={(e) => onMinHeadwayChange(parseFloat(e.target.value) || 2.0)}
            className="w-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 font-mono font-black text-slate-900 dark:text-white text-xs text-center outline-hidden"
            aria-label="Мінімальний безпечний інтервал між вагонами у хвилинах"
          />
          <span className="text-[11px] font-bold text-slate-400">хв</span>
        </div>
      </div>
    </div>
  )
}

export default InterlineSyncToolbar
