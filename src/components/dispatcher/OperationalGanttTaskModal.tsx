import React, { useEffect } from 'react'
import { X, Clock, Bus, MapPin, AlertTriangle, ExternalLink } from 'lucide-react'
import { OperationalTask } from '../../hooks/useOperationalGanttLogic'

export interface OperationalGanttTaskModalProps {
  task: OperationalTask | null
  onClose: () => void
  onNavigate: (path: string) => void
}

export const OperationalGanttTaskModal: React.FC<OperationalGanttTaskModalProps> = ({
  task,
  onClose,
  onNavigate
}) => {
  useEffect(() => {
    if (!task) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [task, onClose])

  if (!task) return null

  const handleBackdropClick = () => {
    onClose()
  }

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleGoToMap = () => {
    onNavigate('/dispatch/map')
  }

  const handleGoToMatrix = () => {
    onNavigate('/dispatch/matrix')
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-gantt-task-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={handleModalClick}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: task.color }}
            />
            <h3 id="modal-gantt-task-title" className="text-sm font-black text-slate-900 dark:text-white">
              Деталі оперативного завдання
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити вікно деталей"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Назва завдання:</span>
              <span className="font-bold text-slate-900 dark:text-white">{task.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Наряд:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">№{task.duty_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Бортовий номер:</span>
              <span className="font-bold text-slate-900 dark:text-white">Борт #{task.vehicle_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans">Водій:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300 font-sans">{task.driver_name}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Час виконання</span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                {task.startTimeStr} - {task.endTimeStr}
              </div>
              <span className="text-[10px] text-slate-500 font-sans">{task.duration_min} хв тривалості</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Відхилення Wialon</span>
              <div className={`text-sm font-black mt-0.5 ${
                task.deviation_min && task.deviation_min > 3.0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {task.deviation_min ? `+${task.deviation_min.toFixed(1)} хв` : 'В графіку (0 хв)'}
              </div>
              <span className="text-[10px] text-slate-500 font-sans">GPS-телеметрія</span>
            </div>
          </div>

          {task.is_active_detour && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="text-[11px] font-bold">Для даного рейсу активовано оперативний розворот (Short-Turn)</span>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={handleGoToMap}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            >
              <span>Показати на карті</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleGoToMatrix}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Матриця CAD/AVL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperationalGanttTaskModal
