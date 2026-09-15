import React from 'react'
import { Bus, Clock, Activity, Users } from 'lucide-react'
import { ExecutiveKPIs } from '../../hooks/useExecutiveDashboardLogic'

export interface ExecutiveKpiCardsProps {
  kpis: ExecutiveKPIs
}

export const ExecutiveKpiCards: React.FC<ExecutiveKpiCardsProps> = ({ kpis }) => {
  const {
    activeVehiclesCount,
    targetFleetPlan,
    fleetTurnoutPercent,
    tramCount,
    trolleyCount,
    totalInventory,
    inventoryTrams,
    inventoryTrolleys,
    inventoryService,
    totalTrips,
    routesCount,
    onTimePercentage,
    totalDelaysCount,
    compliantDriversCount,
    totalDrivers,
    violatingDutiesCount
  } = kpis

  const turnoutBadgeStyle = fleetTurnoutPercent >= 90
    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800'
    : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800'

  const kzppBadgeStyle = totalDrivers === 0
    ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
    : violatingDutiesCount === 0
    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
    : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'

  const kzppBadgeText = totalDrivers === 0
    ? '0 водіїв'
    : violatingDutiesCount === 0
    ? '100% Норма'
    : `${violatingDutiesCount} порушень`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Metric 1: Фактичний випуск флоту проти плану */}
      <div 
        tabIndex={0}
        aria-label={`Фактичний випуск: ${activeVehiclesCount} з ${targetFleetPlan} одиниць (${fleetTurnoutPercent}%)`}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
          <span>Фактичний випуск</span>
          <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {activeVehiclesCount} <span className="text-sm font-bold text-slate-400 font-sans">/ {targetFleetPlan}</span>
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border font-mono ${turnoutBadgeStyle}`}>
            {fleetTurnoutPercent}% план
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Трамваї: <strong className="text-slate-700 dark:text-slate-300">{tramCount}</strong> • Тролейбуси: <strong className="text-slate-700 dark:text-slate-300">{trolleyCount}</strong>
          </span>
          <span 
            className="text-[10px] text-slate-400 dark:text-slate-500 font-mono"
            title={`Інвентарний парк депо ОМЕТ: ${inventoryTrams} трамваїв, ${inventoryTrolleys} тролейбусів, ${inventoryService} спецтехніки`}
          >
            Парк: {totalInventory}
          </span>
        </div>
      </div>

      {/* Metric 2: Добовий обсяг рейсів */}
      <div 
        tabIndex={0}
        aria-label={`Добовий обсяг рейсів: ${totalTrips} рейсів на ${routesCount} маршрутах`}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
          <span>Добовий обсяг рейсів</span>
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {totalTrips}
          </span>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 font-mono">
            {routesCount} маршрути
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Графіковий інтервал з 05:00 до 23:15</p>
      </div>

      {/* Metric 3: Регулярність (OTP) */}
      <div 
        tabIndex={0}
        aria-label={`Регулярність OTP: ${onTimePercentage} відсотків, відхилень ${totalDelaysCount}`}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
          <span>Регулярність (OTP)</span>
          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {onTimePercentage}%
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md border bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono">
            Норма ±2 хв
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Відхилення: {totalDelaysCount} од.</p>
      </div>

      {/* Metric 4: Дотримання КЗпП */}
      <div 
        tabIndex={0}
        aria-label={`Дотримання КЗпП: ${compliantDriversCount} з ${totalDrivers} водіїв у нормі`}
        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
          <span>Дотримання КЗпП</span>
          <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
            {compliantDriversCount} / {totalDrivers}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md border font-mono ${kzppBadgeStyle}`}>
            {kzppBadgeText}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">Ліміт 10 год зміни та обід на 4-5 год</p>
      </div>
    </div>
  )
}

export default ExecutiveKpiCards
