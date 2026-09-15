import React, { useState, useEffect, useRef } from 'react'
import { Clock, X, Check, AlertCircle } from 'lucide-react'

interface TripGridEditModalProps {
  isOpen: boolean
  dutyNumber: string
  roundNumber: number
  stationName: string
  initialTime: string
  onSave: (newTime: string) => void
  onClose: () => void
}

const addMinutesToTime = (timeStr: string, deltaMins: number): string => {
  if (!timeStr || !timeStr.includes(':')) return timeStr
  const parts = timeStr.split(':')
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return timeStr

  let total = (h * 60 + m + deltaMins) % 1440
  if (total < 0) total += 1440

  const rh = Math.floor(total / 60)
  const rm = total % 60
  return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`
}

export const TripGridEditModal: React.FC<TripGridEditModalProps> = ({
  isOpen,
  dutyNumber,
  roundNumber,
  stationName,
  initialTime,
  onSave,
  onClose
}) => {
  const [timeValue, setTimeValue] = useState<string>(initialTime)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeValue(initialTime)
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen, initialTime])

  if (!isOpen) return null

  const handleAdjust = (delta: number) => {
    setTimeValue((prev) => addMinutesToTime(prev, delta))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!timeValue || !timeValue.includes(':')) return
    onSave(timeValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-trip-title"
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-w-md w-full text-slate-900 dark:text-white relative"
        tabIndex={-1}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Закрити вікно"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 id="edit-trip-title" className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Коригування часу рейсу
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Наряд №<strong className="text-indigo-600 dark:text-indigo-400">{dutyNumber}</strong> • Круг {roundNumber}
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 mb-5 text-xs">
          <div className="text-slate-500 dark:text-slate-400 mb-1 font-bold">Контрольна станція:</div>
          <div className="font-black text-slate-800 dark:text-slate-200 text-sm">{stationName}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Час відправлення (ГГ:ХХ):
            </label>
            <input
              ref={inputRef}
              type="text"
              pattern="[0-9]{2}:[0-9]{2}"
              placeholder="08:15"
              value={timeValue}
              onChange={(e) => setTimeValue(e.target.value)}
              className="w-full text-center font-mono text-2xl font-black py-3 px-4 bg-slate-100 dark:bg-slate-800 border-2 border-indigo-500 rounded-2xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-4 focus:ring-indigo-500/20"
              aria-label="Введіть новий час відправлення"
              required
            />
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 text-center">
              Швидке зміщення часу:
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleAdjust(-5)}
                className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-black font-mono transition-all cursor-pointer text-center"
              >
                -5 хв
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(-1)}
                className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-black font-mono transition-all cursor-pointer text-center"
              >
                -1 хв
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(1)}
                className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-black font-mono transition-all cursor-pointer text-center"
              >
                +1 хв
              </button>
              <button
                type="button"
                onClick={() => handleAdjust(5)}
                className="py-2 px-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-black font-mono transition-all cursor-pointer text-center"
              >
                +5 хв
              </button>
            </div>
          </div>

          <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Зміщення часу впливає на інтервал між попереднім та наступним випусками. Зміна автоматично фіксується в базі даних підприємства.
            </span>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-xs font-bold transition-all cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Зберегти час</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
