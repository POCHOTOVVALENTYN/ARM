import React from 'react'
import { Link, CheckCircle2 } from 'lucide-react'
import { AvailableDuty, AssignedWaybillInfo } from '../../hooks/useWaybillQueries'

interface CrewAssignmentDutyListProps {
  targetDate: string
  duties: AvailableDuty[]
  isLoading: boolean
  selectedDuty: number | null
  onSelectDuty: (id: number) => void
  isAssigned: (dutyId: number) => boolean
  getAssignedInfo: (dutyId: number) => AssignedWaybillInfo | undefined
}

export const CrewAssignmentDutyList: React.FC<CrewAssignmentDutyListProps> = ({
  targetDate,
  duties,
  isLoading,
  selectedDuty,
  onSelectDuty,
  isAssigned,
  getAssignedInfo
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col lg:col-span-2 overflow-hidden">
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 dark:text-white text-xs">
          Доступні наряди на {targetDate}
        </h3>
        <span className="text-[11px] font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md">
          Всього: {duties.length}
        </span>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-250px)] p-3 space-y-2">
        {isLoading ? (
          <div className="text-center py-10 text-slate-400 text-xs">Завантаження нарядів...</div>
        ) : duties.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">Немає сформованих нарядів на цю дату.</div>
        ) : (
          duties.map((duty) => {
            const assigned = isAssigned(duty.id)
            const assignedInfo = getAssignedInfo(duty.id)

            return (
              <div 
                key={duty.id} 
                tabIndex={assigned ? -1 : 0}
                role="button"
                aria-label={`Наряд №${duty.number}`}
                className={`border rounded-xl p-3 flex justify-between items-center transition-all ${
                  assigned 
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-2xs cursor-pointer'
                } ${selectedDuty === duty.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''}`}
                onClick={() => !assigned && onSelectDuty(duty.id)}
                onKeyDown={(e) => {
                  if (!assigned && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onSelectDuty(duty.id)
                  }
                }}
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-xl mr-3 ${assigned ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}>
                    <Link size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                      <span>Наряд №{duty.number}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md font-mono">
                        Маршрут {duty.route}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {duty.start} — {duty.end} {duty.trips_count ? `• ${duty.trips_count} рейсів` : ''}
                    </p>
                    {assigned && assignedInfo && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        Борт: #{assignedInfo.vehicle_id} • Водій: {assignedInfo.driver_id}
                      </p>
                    )}
                  </div>
                </div>
                
                {assigned ? (
                  <span className="flex items-center text-emerald-700 dark:text-emerald-300 font-bold text-[11px] bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} className="mr-1 text-emerald-600" /> В роботі
                  </span>
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-[11px] bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    Очікує
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
