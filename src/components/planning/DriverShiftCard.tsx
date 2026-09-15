import React from 'react'
import {
  FileText,
  Wrench,
  Coffee,
  User,
  Clock,
  UserCheck,
  Moon
} from 'lucide-react'
import { DriverShift } from '../../hooks/useDriverShiftConstructorLogic'

interface DriverShiftCardProps {
  shift: DriverShift
  onOpenKpzModal: (shiftId: string) => void
  onOpenAssignmentModal: (shift: DriverShift) => void
}

export const DriverShiftCard: React.FC<DriverShiftCardProps> = ({
  shift,
  onOpenKpzModal,
  onOpenAssignmentModal
}) => {
  const isExtended = shift.compliance_status === 'EXTENDED'
  const isValid = shift.compliance_status === 'VALID'
  const isViolation = shift.compliance_status === 'VIOLATION' || shift.work_hours >= 10.0

  const handleKpzClick = () => {
    onOpenKpzModal(shift.id)
  }

  const handleAssignmentClick = () => {
    onOpenAssignmentModal(shift)
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 space-y-3 flex flex-col justify-between font-sans">
      {/* Заголовок картки */}
      <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center justify-between">
          <span className="font-black text-xs text-slate-900 dark:text-white">
            Наряд #{shift.duty_number} • Зміна {shift.shift_index}
          </span>

          {/* Статус тривалості зміни за КЗпП */}
          {isValid && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-700 text-white border border-emerald-800 shadow-2xs">
              Норма (≤ 8:00)
            </span>
          )}
          {isExtended && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
              Подовжена (8:01–9:59)
            </span>
          )}
          {isViolation && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300">
              Порушення (&gt; 9:59)
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
            {shift.shift_name}
          </h3>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            {shift.duty_type}
          </span>
        </div>
      </div>

      {/* Закріплений персонал та рухомий склад */}
      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 text-[11px] flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            <span>Водій:</span>
          </span>
          <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]" title={shift.driver_name}>
            {shift.driver_name}
          </span>
        </div>
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-400">Таб. №:</span>
          <span className="font-bold text-slate-700 dark:text-slate-300">{shift.driver_tab_num}</span>
        </div>
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-400">Вагон:</span>
          <span className="font-black text-indigo-600 dark:text-indigo-400">{shift.vehicle_num}</span>
        </div>
      </div>

      {/* Часові атрибути та ПЗЧ */}
      <div className="space-y-2 text-xs font-sans">
        {shift.prep_time_min > 0 ? (
          <div className="flex items-center justify-between p-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl font-mono">
            <span className="text-indigo-700 dark:text-indigo-300 font-sans text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" />
              <span>Явка в депо (ПЗЧ {shift.prep_time_min} хв):</span>
            </span>
            <span className="font-extrabold text-indigo-900 dark:text-indigo-200">{shift.depot_arrival_time}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono">
            <span className="text-slate-500 font-sans text-[11px]">Перезмінка на ДП:</span>
            <span className="font-extrabold text-slate-700 dark:text-slate-300">{shift.start_time}</span>
          </div>
        )}

        <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono">
          <span className="text-slate-500 font-sans text-[11px]">Робота на лінії:</span>
          <span className="font-extrabold text-slate-900 dark:text-white">{shift.start_time} — {shift.end_time}</span>
        </div>

        {/* Специфіка для розривного наряду */}
        {shift.duty_type === 'SPLIT' && (
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 font-extrabold text-purple-700 dark:text-purple-300 text-[11px]">
              <Wrench className="w-3.5 h-3.5" />
              <span>Розривний наряд (Заміна Вагона)</span>
            </div>
            <p className="text-[10px] text-purple-600/90 font-medium leading-tight">
              Вагон А: <strong>{shift.vehicle_num}</strong><br />
              Вагон Б: <strong>{shift.second_vehicle_num || 'Резерв ТО'}</strong>
            </p>
          </div>
        )}

        {/* Обідня перерва */}
        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-0.5">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
            <span className="flex items-center space-x-1">
              <Coffee className="w-3 h-3" />
              <span>Обід ({shift.lunch_location})</span>
            </span>
            <span className="font-mono">{shift.lunch_start_time} ({shift.lunch_duration_min} хв)</span>
          </div>
          {shift.paid_excess_break_min > 0 && (
            <p className="text-[10px] text-amber-700 font-bold">
              Понаднормово (оплачується): +{shift.paid_excess_break_min} хв
            </p>
          )}
        </div>

        {/* Години зміни */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-0.5 border-t border-slate-100 dark:border-slate-800">
          <span>Робочий час: <strong className="text-slate-900 dark:text-white">{shift.work_hours} год</strong></span>
          {shift.night_hours > 0 && (
            <span className="flex items-center gap-1 text-purple-600 font-bold">
              <Moon className="w-3 h-3" />
              <span>{shift.night_hours} год</span>
            </span>
          )}
        </div>
      </div>

      {/* Кнопки керування */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleAssignmentClick}
          onKeyDown={(e) => handleKeyDown(e, handleAssignmentClick)}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center space-x-1 transition-colors cursor-pointer"
          tabIndex={0}
          aria-label={`Призначити водія та вагон для наряду #${shift.duty_number} зміна ${shift.shift_index}`}
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Водій / Вагон</span>
        </button>

        <button
          type="button"
          onClick={handleKpzClick}
          onKeyDown={(e) => handleKeyDown(e, handleKpzClick)}
          className="bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 text-white font-extrabold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center space-x-1 transition-colors cursor-pointer shadow-2xs"
          tabIndex={0}
          aria-label={`Роздрукувати картку КПЗ для наряду #${shift.duty_number} зміна ${shift.shift_index}`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Бланк КПЗ</span>
        </button>
      </div>
    </div>
  )
}

export default DriverShiftCard
