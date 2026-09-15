import React from 'react'
import { Coffee } from 'lucide-react'
import { GanttTask } from '../../hooks/useDutyBuilderLogic'

interface DutyBuilderGanttTimelineProps {
  dutyIds: string[]
  dutiesGrouped: Record<string, GanttTask[]>
  hoursRuler: number[]
  startMin: number
  totalSpan: number
  getPositionStyle: (startMin: number, endMin: number) => { left: string; width: string }
}

export const DutyBuilderGanttTimeline: React.FC<DutyBuilderGanttTimelineProps> = ({
  dutyIds,
  dutiesGrouped,
  hoursRuler,
  startMin,
  totalSpan,
  getPositionStyle
}) => {
  return (
    <div 
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 overflow-x-auto font-sans"
      role="region"
      aria-label="Шкала діаграми Ґантта"
    >
      <div className="min-w-[1000px] space-y-2">
        {/* Часова лінійка */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-700 pb-2 text-[10px] font-mono font-bold text-slate-500">
          <div className="w-24 shrink-0">Наряд</div>
          <div className="flex-1 relative h-5">
            {hoursRuler.map((h) => {
              const pct = ((h * 60 - startMin) / totalSpan) * 100
              return (
                <div
                  key={h}
                  className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${pct}%` }}
                >
                  <span>{String(h).padStart(2, '0')}:00</span>
                  <span className="w-[1px] h-1.5 bg-slate-300 dark:bg-slate-700 mt-0.5" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Доріжки нарядів */}
        {dutyIds.map((dutyId) => {
          const tasks = dutiesGrouped[dutyId] || []
          return (
            <div
              key={dutyId}
              className="flex items-center py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors border-b border-slate-100 dark:border-slate-800/60"
            >
              <div className="w-24 shrink-0 space-y-0.5">
                <div className="font-black text-xs text-slate-900 dark:text-white">
                  Наряд {dutyId}
                </div>
                <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {tasks.length > 0 ? `${tasks[0].start_time} - ${tasks[tasks.length - 1].end_time}` : ''}
                </div>
              </div>

              <div className="flex-1 relative h-7 bg-slate-100 dark:bg-slate-800/60 rounded-lg overflow-hidden">
                {tasks.map((t, idx) => {
                  const style = getPositionStyle(t.start_min, t.end_min)
                  return (
                    <div
                      key={idx}
                      className="absolute top-0.5 bottom-0.5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-2xs transition-all hover:scale-y-105 cursor-pointer"
                      style={{ ...style, backgroundColor: t.color }}
                      title={`${t.label} (${t.start_time} - ${t.end_time})`}
                    >
                      {t.type === 'LUNCH' && (
                        <Coffee className="w-2.5 h-2.5 text-white shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
