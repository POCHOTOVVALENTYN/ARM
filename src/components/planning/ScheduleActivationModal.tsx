import React, { useState } from 'react'
import { X, Calendar, ShieldCheck, Clock } from 'lucide-react'

interface ScheduleActivationModalProps {
  isOpen: boolean
  scheduleId: string | null
  routeNumber: string
  routeName: string
  versionName: string
  isPending: boolean
  onClose: () => void
  onConfirm: (scheduleId: string, effectiveDate: string) => void
}

export const ScheduleActivationModal: React.FC<ScheduleActivationModalProps> = ({
  isOpen,
  scheduleId,
  routeNumber,
  routeName,
  versionName,
  isPending,
  onClose,
  onConfirm
}) => {
  // Default to tomorrow's date
  const tomorrowDateStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const [effectiveDate, setEffectiveDate] = useState<string>(tomorrowDateStr)

  if (!isOpen || !scheduleId) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveDate) return
    onConfirm(scheduleId, effectiveDate)
  }

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
      aria-label="Планове введення розкладу в дію"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Планове введення розкладу в дію
              </h3>
              <p className="text-[11px] text-slate-500">
                Маршрут №{routeNumber} — {routeName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors cursor-pointer"
            aria-label="Закрити модальне вікно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Версія розкладу з архіву:</span>
            <div className="font-black text-slate-900 dark:text-white text-xs">{versionName}</div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="effective-date-input" className="block font-extrabold text-slate-700 dark:text-slate-300">
              Дата набуття чинності (початок дії на лінії):
            </label>
            <div className="relative">
              <input
                id="effective-date-input"
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              За галузевим регламентом введення розкладу здійснюється з початку робочої доби (04:30 ранку).
            </p>
          </div>

          {/* Safe operational badge banner */}
          <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5 text-emerald-950 dark:text-emerald-200">
            <div className="flex items-center space-x-1.5 font-black text-emerald-800 dark:text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Гарантія безперервності перевезень (Сценарій 1)</span>
            </div>
            <ul className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 space-y-1 pl-1 list-disc list-inside">
              <li>Поточні поїзди на лінії завершать роботу за діючим графіком без збоїв.</li>
              <li>Диспетчерські пульти перейдуть на новий графік опівночі під час технологічної перерви.</li>
              <li>Попередня версія буде збережена в архіві для порівняння.</li>
            </ul>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isPending || !effectiveDate}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black shadow-xs cursor-pointer transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isPending ? 'Призначення...' : 'Запланувати введення'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScheduleActivationModal
