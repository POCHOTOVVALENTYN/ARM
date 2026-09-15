import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { ChartType } from '../../hooks/useAnalyticsReportLogic'
import { RoutePerformance } from '../../hooks/useAnalyticsQueries'

export interface AnalyticsPerformanceChartProps {
  data: RoutePerformance[]
  chartType: ChartType
  targetDate: string
  onChartTypeChange: (type: ChartType) => void
}

export const AnalyticsPerformanceChart: React.FC<AnalyticsPerformanceChartProps> = ({
  data,
  chartType,
  targetDate,
  onChartTypeChange
}) => {
  const handleOtpClick = () => {
    onChartTypeChange('otp')
  }

  const handleDelaysClick = () => {
    onChartTypeChange('delays')
  }

  return (
    <div className="lg:col-span-2 min-w-0 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>Порівняння ефективності за маршрутами</span>
          </h3>
          <p className="text-xs text-slate-400">Регулярність руху (OTP %) та середнє запізнення</p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={chartType === 'otp'}
            tabIndex={0}
            onClick={handleOtpClick}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              chartType === 'otp'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Регулярність (OTP %)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chartType === 'delays'}
            tabIndex={0}
            onClick={handleDelaysClick}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              chartType === 'delays'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Запізнення (хв)
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full pt-1">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Немає накопичених даних телеметрії за {targetDate}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'otp' ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="route_id" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={45}
                  tickFormatter={(val) => `№${val}`} 
                />
                <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    color: '#f8fafc', 
                    borderRadius: '12px',
                    fontSize: 12
                  }}
                  formatter={(val: unknown) => [`${val}%`, 'Регулярність']} 
                />
                <Bar dataKey="on_time_percentage" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} vertical={false} />
                <XAxis 
                  dataKey="route_id" 
                  tick={{ fill: '#94a3b8', fontSize: 10 }} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={45}
                  tickFormatter={(val) => `№${val}`} 
                />
                <YAxis unit=" хв" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    color: '#f8fafc', 
                    borderRadius: '12px',
                    fontSize: 12
                  }}
                  formatter={(val: unknown) => [`${val} хв`, 'Час']} 
                />
                <Legend wrapperStyle={{ paddingTop: '6px', fontSize: 11 }} />
                <Bar dataKey="avg_deviation_min" name="Сер. відхилення" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="max_deviation_min" name="Макс. запізнення" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default AnalyticsPerformanceChart
