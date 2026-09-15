import React from 'react'
import { AlertTriangle, ArrowRight, Settings2, CheckCircle2, XCircle } from 'lucide-react'

interface RouteStatusInfo {
  route_id: string
  number: string
  name: string
  has_active_schedule: boolean
}

interface InterlineMissingScheduleAlertProps {
  routeA: RouteStatusInfo
  routeB: RouteStatusInfo
  sharedStopsCount: number
  onNavigateToBuilder: (routeId: string) => void
}

export const InterlineMissingScheduleAlert: React.FC<InterlineMissingScheduleAlertProps> = ({
  routeA,
  routeB,
  sharedStopsCount,
  onNavigateToBuilder
}) => {
  const missingRoute = !routeA.has_active_schedule ? routeA : (!routeB.has_active_schedule ? routeB : null)
  const bothMissing = !routeA.has_active_schedule && !routeB.has_active_schedule

  const handleKeyDown = (e: React.KeyboardEvent, routeId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onNavigateToBuilder(routeId)
    }
  }

  return (
    <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-3xl p-6 space-y-4 font-sans shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 dark:border-amber-800/50 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 shadow-2xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
              Синхронізація «Зв'язки» тимчасово заблокована
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              Маршрути мають {sharedStopsCount} спільних зупинок, але для розрахунку міжмаршрутних інтервалів необхідні затверджені наряди для обох маршрутів
            </p>
          </div>
        </div>
      </div>

      {/* Статуси готовності кожного маршруту */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className={`p-3 rounded-2xl border flex items-center justify-between ${
          routeA.has_active_schedule
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="space-y-0.5">
            <div className="font-extrabold text-xs flex items-center gap-1.5">
              <span>Маршрут №{routeA.number || routeA.route_id}</span>
              {routeA.has_active_schedule ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
            <p className="text-[11px] opacity-80 truncate max-w-[200px]">{routeA.name}</p>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
            {routeA.has_active_schedule ? 'Розклад є' : 'Немає нарядів'}
          </span>
        </div>

        <div className={`p-3 rounded-2xl border flex items-center justify-between ${
          routeB.has_active_schedule
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="space-y-0.5">
            <div className="font-extrabold text-xs flex items-center gap-1.5">
              <span>Маршрут №{routeB.number || routeB.route_id}</span>
              {routeB.has_active_schedule ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
            <p className="text-[11px] opacity-80 truncate max-w-[200px]">{routeB.name}</p>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
            {routeB.has_active_schedule ? 'Розклад є' : 'Немає нарядів'}
          </span>
        </div>
      </div>

      {/* Кнопки переходу для складання нарядів */}
      <div className="pt-2 flex flex-wrap items-center gap-2">
        {!routeA.has_active_schedule && (
          <button
            type="button"
            onClick={() => onNavigateToBuilder(routeA.route_id)}
            onKeyDown={(e) => handleKeyDown(e, routeA.route_id)}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            tabIndex={0}
            aria-label={`Скласти наряди для маршруту №${routeA.number}`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Скласти наряди для Маршруту №{routeA.number || routeA.route_id}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {!routeB.has_active_schedule && (
          <button
            type="button"
            onClick={() => onNavigateToBuilder(routeB.route_id)}
            onKeyDown={(e) => handleKeyDown(e, routeB.route_id)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            tabIndex={0}
            aria-label={`Скласти наряди для маршруту №${routeB.number}`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Скласти наряди для Маршруту №{routeB.number || routeB.route_id}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default InterlineMissingScheduleAlert
