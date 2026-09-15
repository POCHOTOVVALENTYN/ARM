import React from 'react'
import { TrendingUp, Clock, Activity, AlertTriangle } from 'lucide-react'
import { NetworkKPI } from '../../hooks/useAnalyticsReportLogic'
import { IncidentStats } from '../../hooks/useAnalyticsQueries'

export interface AnalyticsReportKpiGridProps {
  networkKPI: NetworkKPI
  incidentStats?: IncidentStats
}

export const AnalyticsReportKpiGrid: React.FC<AnalyticsReportKpiGridProps> = ({
  networkKPI,
  incidentStats
}) => {
  const avgDevPrefix = networkKPI.avgDeviation > 0 ? `+${networkKPI.avgDeviation}` : networkKPI.avgDeviation

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Регулярність OTP */}
      <div 
        tabIndex={0}
        aria-label={`Регулярність OTP: ${networkKPI.avgOTP}%`}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Регулярність (OTP)</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {networkKPI.avgOTP}%
          </h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
            Норматив (±2 хв від графіка)
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Сер. відхилення */}
      <div 
        tabIndex={0}
        aria-label={`Середнє відхилення: ${avgDevPrefix} хв, максимум ${networkKPI.maxDeviation} хв`}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Сер. відхилення</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {avgDevPrefix} хв
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Макс: {networkKPI.maxDeviation} хв
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Фіксацій зупинок */}
      <div 
        tabIndex={0}
        aria-label={`Перевірок зупинок: ${networkKPI.totalRecords} на ${networkKPI.routesCount} активних лініях`}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Перевірок зупинок</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {networkKPI.totalRecords}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            На {networkKPI.routesCount} активних лініях
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500 shrink-0">
          <Activity className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Інциденти на лінії */}
      <div 
        tabIndex={0}
        aria-label={`Інциденти на лінії: ${incidentStats?.total_incidents || 0}`}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Інциденти на лінії</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {incidentStats?.total_incidents || 0}
          </h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
            Вирішено: {incidentStats?.resolved_incidents || 0} • Відкрито: {incidentStats?.unresolved_incidents || 0}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default AnalyticsReportKpiGrid
