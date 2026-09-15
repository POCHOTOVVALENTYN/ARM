import React from 'react'
import {
  GanttDutyGroup,
  OperationalTask,
  TOTAL_SPAN_MIN
} from '../../hooks/useOperationalGanttLogic'

export interface OperationalGanttTimelineProps {
  groupedDuties: GanttDutyGroup[]
  hoursMarks: number[]
  currentTimelineOffsetPercent: number | null
  currentTimeDisplay: string
  onTaskClick: (task: OperationalTask) => void
}

export const OperationalGanttTimeline: React.FC<OperationalGanttTimelineProps> = ({
  groupedDuties,
  hoursMarks,
  currentTimelineOffsetPercent,
  currentTimeDisplay,
  onTaskClick
}) => {
  if (groupedDuties.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 font-medium">
        Немає нарядів чи рейсів за обраними критеріями фільтрації.
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <div className="min-w-[1100px] relative">
          {/* Заголовок шкали годин (05:00 - 23:00) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 sticky top-0 z-10 text-[10px] font-mono font-bold text-slate-500 select-none">
            <div className="w-48 shrink-0 p-3 border-r border-slate-200 dark:border-slate-800 uppercase tracking-wider font-sans">
              Наряд / Борт / Водій
            </div>
            <div className="flex-1 relative flex">
              {hoursMarks.map((hour) => (
                <div
                  key={hour}
                  className="flex-1 py-3 text-center border-r border-slate-100 dark:border-slate-800/80 last:border-r-0"
                >
                  {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                </div>
              ))}
            </div>
          </div>

          {/* Рядки нарядів */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 relative">
            {/* Рухомий маркер поточного часу (Now Needle) */}
            {currentTimelineOffsetPercent !== null && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `calc(192px + (100% - 192px) * ${currentTimelineOffsetPercent / 100})` }}
              >
                <div className="w-0.5 h-full bg-rose-500 shadow-md relative">
                  <div className="absolute -top-2.5 -left-6 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-mono font-black shadow-xs whitespace-nowrap">
                    {currentTimeDisplay}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-rose-600 -left-[3.5px] top-0 absolute animate-ping" />
                </div>
              </div>
            )}

            {groupedDuties.map((duty) => (
              <div key={duty.dutyNum} className="flex hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                {/* Ліва колонка інфо про наряд */}
                <div className="w-48 shrink-0 p-2.5 border-r border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-mono font-black text-xs flex items-center justify-center shrink-0">
                    {duty.dutyNum}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono truncate">
                      Борт #{duty.vehicleId}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {duty.driverName}
                    </div>
                  </div>
                </div>

                {/* Права частина: часова шкала завдань */}
                <div className="flex-1 relative h-12 flex items-center px-1">
                  {duty.tasks.map((task) => {
                    const leftPct = (task.start_min / TOTAL_SPAN_MIN) * 100
                    const widthPct = Math.max(1.2, (task.duration_min / TOTAL_SPAN_MIN) * 100)

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onTaskClick(task)}
                        title={`${task.label} [${task.startTimeStr} - ${task.endTimeStr}]`}
                        className="absolute h-7 rounded-lg text-[10px] font-bold text-white px-1.5 flex items-center truncate shadow-2xs hover:brightness-110 hover:shadow-md transition-all cursor-pointer select-none"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          backgroundColor: task.color
                        }}
                      >
                        <span className="truncate">{task.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperationalGanttTimeline
