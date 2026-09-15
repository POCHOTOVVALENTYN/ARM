import React, { useState } from 'react'
import {
  X,
  UserCheck,
  Save,
  Bus,
  Hash,
  FileText
} from 'lucide-react'
import { DriverShift } from '../../hooks/useDriverShiftConstructorLogic'

interface DriverShiftAssignmentModalProps {
  shift: DriverShift | null
  isOpen: boolean
  onClose: () => void
  onSave: (payload: {
    driver_name: string
    driver_tab_num: string
    vehicle_num: string
    second_vehicle_num?: string | null
    notes?: string
  }) => Promise<void>
}

export const DriverShiftAssignmentModal: React.FC<DriverShiftAssignmentModalProps> = ({
  shift,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !shift) return null

  const [driverName, setDriverName] = useState<string>(shift.driver_name || '')
  const [driverTabNum, setDriverTabNum] = useState<string>(shift.driver_tab_num || '')
  const [vehicleNum, setVehicleNum] = useState<string>(shift.vehicle_num || '')
  const [secondVehicleNum, setSecondVehicleNum] = useState<string>(shift.second_vehicle_num || '')
  const [notes, setNotes] = useState<string>(shift.notes || '')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const isSplitDuty = shift.duty_type === 'SPLIT'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave({
        driver_name: driverName.trim(),
        driver_tab_num: driverTabNum.trim(),
        vehicle_num: vehicleNum.trim(),
        second_vehicle_num: isSplitDuty ? secondVehicleNum.trim() : null,
        notes: notes.trim()
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
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
      aria-label="Призначення водія та закріплення рухомого складу"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Призначення Водія та Рухомого Складу
              </h3>
              <p className="text-[11px] text-slate-500">
                Наряд #{shift.duty_number} • {shift.shift_name} ({shift.start_time} — {shift.end_time})
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
          <div className="space-y-1.5">
            <label htmlFor="driver-name" className="block font-bold text-slate-700 dark:text-slate-300">
              ПІБ Водія (Служба Руху):
            </label>
            <div className="relative">
              <input
                id="driver-name"
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="напр., Коваленко Петро Олексійович"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="driver-tab" className="block font-bold text-slate-700 dark:text-slate-300">
                Табельний номер:
              </label>
              <div className="relative">
                <input
                  id="driver-tab"
                  type="text"
                  required
                  value={driverTabNum}
                  onChange={(e) => setDriverTabNum(e.target.value)}
                  placeholder="Т-1042"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="vehicle-num" className="block font-bold text-slate-700 dark:text-slate-300">
                {isSplitDuty ? 'Вагон А (Ранок):' : 'Бортовий номер:'}
              </label>
              <div className="relative">
                <input
                  id="vehicle-num"
                  type="text"
                  required
                  value={vehicleNum}
                  onChange={(e) => setVehicleNum(e.target.value)}
                  placeholder="Вг-4015"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {isSplitDuty && (
            <div className="space-y-1.5 p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl">
              <label htmlFor="second-vehicle-num" className="block font-bold text-purple-900 dark:text-purple-200">
                Вагон Б (Вечірній вихід після ТО):
              </label>
              <input
                id="second-vehicle-num"
                type="text"
                value={secondVehicleNum}
                onChange={(e) => setSecondVehicleNum(e.target.value)}
                placeholder="Вг-4088 (Резерв ТО)"
                className="w-full bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                Для розривного наряду передбачено заміну вагона під час міжзмінної перерви.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block font-bold text-slate-700 dark:text-slate-300">
              Службові примітки диспетчера:
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Особливості наряду, закріплення стажера, відмітки техвідділу..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-normal focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Збереження...' : 'Зберегти в БД'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DriverShiftAssignmentModal
