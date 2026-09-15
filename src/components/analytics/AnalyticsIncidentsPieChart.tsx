import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { PieChart as PieChartIcon, CheckCircle2 } from 'lucide-react'
import { IncidentPieItem } from '../../hooks/useAnalyticsReportLogic'
import { IncidentStats } from '../../hooks/useAnalyticsQueries'

export interface AnalyticsIncidentsPieChartProps {
  data: IncidentPieItem[]
  incidentStats?: IncidentStats
  targetDate: string
}

export const AnalyticsIncidentsPieChart: React.FC<AnalyticsIncidentsPieChartProps> = ({
  data,
  incidentStats,
  targetDate
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 min-w-0">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-amber-500" />
          <span>Оперативне реагування на збої</span>
        </h3>
        <p className="text-xs text-slate-400">Співвідношення опрацьованих інцидентів</p>
      </div>

      <div className="h-[200px] w-full flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-6">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            Інцидентів за {targetDate} не зафіксовано
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  color: '#f8fafc', 
                  borderRadius: '12px',
                  fontSize: 12
                }}
              />
              <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5 font-mono">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400 font-sans">Всього подій:</span>
          <span className="font-bold text-slate-900 dark:text-white">{incidentStats?.total_incidents || 0}</span>
        </div>
        <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
          <span className="font-sans">Усунуто диспетчером:</span>
          <span className="font-bold">{incidentStats?.resolved_incidents || 0}</span>
        </div>
        <div className="flex justify-between text-rose-600 dark:text-rose-400">
          <span className="font-sans">В процесі опрацювання:</span>
          <span className="font-bold">{incidentStats?.unresolved_incidents || 0}</span>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsIncidentsPieChart
