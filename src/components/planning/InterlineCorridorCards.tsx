import React from 'react'
import { Layers, MapPin, CheckCircle2, AlertTriangle, Clock, Zap, ArrowRight, Settings2 } from 'lucide-react'
import { CorridorStatus } from '../../hooks/useInterlineSyncLogic'

interface InterlineCorridorCardsProps {
  corridors: CorridorStatus[]
  transportType: 'tram' | 'trolleybus'
  isLoading: boolean
  onSyncCorridor: (routeIds: string[]) => void
  onOpenTimeline: (corridor: CorridorStatus) => void
  onNavigateToBuilder: (routeId: string) => void
}

export const InterlineCorridorCards: React.FC<InterlineCorridorCardsProps> = ({
  corridors,
  transportType,
  isLoading,
  onSyncCorridor,
  onOpenTimeline,
  onNavigateToBuilder
}) => {
  const filteredCorridors = corridors.filter(
    (c) => c.type.toLowerCase() === transportType
  )

  const isTram = transportType === 'tram'

  const handleKeyDownBuilder = (e: React.KeyboardEvent, routeId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onNavigateToBuilder(routeId)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold text-xs animate-pulse font-sans">
        Завантаження топологічних коридорів та розрахунок інтервалів...
      </div>
    )
  }

  if (filteredCorridors.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 font-sans">
        Не знайдено коридорів для обраного типу транспорту
      </div>
    )
  }

  return (
    <div className="space-y-4 font-sans">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-purple-600" />
          <span>
            {isTram ? 'Трамвайні' : 'Тролейбусні'} магістральні коридори ОМЕТ ({filteredCorridors.length})
          </span>
        </h3>
        <span className="text-[11px] font-bold text-slate-400">
          Топологічна координація спільних ділянок
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCorridors.map((corridor) => {
          const isReady = corridor.can_sync
          const conflicts = corridor.conflicts_count || 0
          const hasMissing = corridor.missing_routes && corridor.missing_routes.length > 0

          return (
            <div
              key={corridor.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                {/* Header with Type & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        isTram
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {isTram ? 'Трамвай' : 'Тролейбус'}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1">
                      {corridor.name}
                    </h4>
                  </div>

                  {corridor.status === 'SYNCHRONIZED' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-200 dark:border-emerald-800 uppercase shrink-0">
                      Синхронізовано
                    </span>
                  )}

                  {corridor.status === 'NEEDS_SYNC' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-[10px] font-black border border-rose-200 dark:border-rose-800 uppercase shrink-0 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{conflicts} скупчень</span>
                    </span>
                  )}

                  {corridor.status === 'MISSING_SCHEDULES' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-black border border-amber-200 dark:border-amber-800 uppercase shrink-0">
                      Очікує наряди
                    </span>
                  )}
                </div>

                {/* Routes in corridor */}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Спільні маршрути:
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {corridor.ready_routes?.map((r) => (
                      <span
                        key={r.route_id}
                        className="px-2 py-0.5 rounded text-xs font-black bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                        title={`Маршрут №${r.number} має активний розклад`}
                      >
                        <span>{isTram ? 'Т-' : 'Тр-'}{r.number}</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </span>
                    ))}

                    {corridor.missing_routes?.map((r) => (
                      <button
                        key={r.route_id}
                        type="button"
                        onClick={() => onNavigateToBuilder(r.route_id)}
                        onKeyDown={(e) => handleKeyDownBuilder(e, r.route_id)}
                        className="px-2 py-0.5 rounded text-xs font-black bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
                        title={`Маршрут №${r.number} не має розкладу! Натисніть, щоб перейти у Конструктор`}
                        tabIndex={0}
                        aria-label={`Перейти до конструктора нарядів для маршруту №${r.number}`}
                      >
                        <span>{isTram ? 'Т-' : 'Тр-'}{r.number}</span>
                        <span className="text-[9px] font-extrabold uppercase bg-amber-200 dark:bg-amber-900 px-1 rounded">Немає</span>
                        <ArrowRight className="w-3 h-3 text-amber-600" />
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {corridor.description}
                </p>

                {/* Key stations */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Контрольні точки:</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {corridor.key_stations.slice(0, 3).map((st) => (
                      <span
                        key={st}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-[140px]"
                        title={st}
                      >
                        {st}
                      </span>
                    ))}
                    {corridor.key_stations.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                        +{corridor.key_stations.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom KPIs & Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>
                    Мін. інтервал:{' '}
                    <strong className="text-purple-600 font-mono">{corridor.min_headway_min} хв</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  {isReady ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenTimeline(corridor)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                        aria-label={`Переглянути стрічку руху коридору ${corridor.name}`}
                      >
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Стрічка</span>
                      </button>

                      {conflicts > 0 && (
                        <button
                          type="button"
                          onClick={() => onSyncCorridor(corridor.routes)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          aria-label={`Синхронізувати коридор ${corridor.name}`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>Усунути</span>
                        </button>
                      )}
                    </>
                  ) : (
                    hasMissing && corridor.missing_routes[0] && (
                      <button
                        type="button"
                        onClick={() => onNavigateToBuilder(corridor.missing_routes[0].route_id)}
                        className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                        aria-label="Скласти розклад у Вкладці 1"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Скласти наряди</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InterlineCorridorCards
