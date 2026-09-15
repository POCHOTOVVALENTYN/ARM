import React from 'react'
import {
  GitCompare,
  ArrowRight,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { Route } from '../../types'
import { InterlineMissingScheduleAlert } from './InterlineMissingScheduleAlert'

interface RoutePairCheckData {
  status: string
  can_sync: boolean
  route_a?: {
    route_id: string
    number: string
    name: string
    type: string
    has_active_schedule: boolean
  }
  route_b?: {
    route_id: string
    number: string
    name: string
    type: string
    has_active_schedule: boolean
  }
  shared_stops_count?: number
  shared_stops?: Array<{ id: string; name: string }>
  primary_hub_stop?: { id: string; name: string }
  conflicts_count?: number
  message?: string
}

interface InterlineRoutePairPanelProps {
  routes: Route[]
  transportType: 'tram' | 'trolleybus'
  routeAId: string
  routeBId: string
  pairCheckData?: RoutePairCheckData
  isLoadingCheck: boolean
  isSyncing: boolean
  minHeadway: number
  onSelectRouteA: (id: string) => void
  onSelectRouteB: (id: string) => void
  onApplySync: (routeIds: string[]) => void
  onOpenTimeline: () => void
  onNavigateToBuilder: (routeId: string) => void
}

export const InterlineRoutePairPanel: React.FC<InterlineRoutePairPanelProps> = ({
  routes,
  transportType,
  routeAId,
  routeBId,
  pairCheckData,
  isLoadingCheck,
  isSyncing,
  minHeadway,
  onSelectRouteA,
  onSelectRouteB,
  onApplySync,
  onOpenTimeline,
  onNavigateToBuilder
}) => {
  const filteredRoutes = routes.filter((r) => (r.type || 'tram') === transportType)

  const canSync = Boolean(pairCheckData && pairCheckData.can_sync)
  const conflictsCount = pairCheckData?.conflicts_count ?? 0
  const sharedStops = pairCheckData?.shared_stops || []

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Парна координація суміщених маршрутів
            </h3>
            <p className="text-xs text-slate-500">
              Вибір двох маршрутів із перевіркою наявності затверджених нарядів та усуненням скупчень
            </p>
          </div>
        </div>

        <div className="text-xs font-mono font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          Безпечний інтервал: <strong className="text-purple-600">{minHeadway} хв</strong>
        </div>
      </div>

      {/* Селектори пари маршрутів */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="route-a-select" className="block font-extrabold text-slate-700 dark:text-slate-300 text-xs">
            Опорний маршрут А:
          </label>
          <select
            id="route-a-select"
            value={routeAId}
            onChange={(e) => onSelectRouteA(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 font-bold text-xs text-slate-900 dark:text-white cursor-pointer outline-hidden"
          >
            {filteredRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                №{r.number || r.id} — {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="route-b-select" className="block font-extrabold text-slate-700 dark:text-slate-300 text-xs">
            Суміжний маршрут Б (для синхронізації):
          </label>
          <select
            id="route-b-select"
            value={routeBId}
            onChange={(e) => onSelectRouteB(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 font-bold text-xs text-slate-900 dark:text-white cursor-pointer outline-hidden"
          >
            {filteredRoutes.filter((r) => r.id !== routeAId).map((r) => (
              <option key={r.id} value={r.id}>
                №{r.number || r.id} — {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Результат перевірки готовності розкладів */}
      {isLoadingCheck ? (
        <div className="p-8 text-center text-slate-400 font-bold text-xs animate-pulse">
          Перевірка активних розкладів та топологічних перетинів у базі даних...
        </div>
      ) : (
        <>
          {!canSync && pairCheckData?.route_a && pairCheckData?.route_b ? (
            <InterlineMissingScheduleAlert
              routeA={pairCheckData.route_a}
              routeB={pairCheckData.route_b}
              sharedStopsCount={pairCheckData.shared_stops_count ?? 0}
              onNavigateToBuilder={onNavigateToBuilder}
            />
          ) : (
            <div className="space-y-4 p-5 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/60 rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Обидва розклади активні у БД (Готові до синхронізації)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Спільних зупинок на лінії: <strong>{pairCheckData?.shared_stops_count ?? 0}</strong> • Ключовий вузол: <strong>«{pairCheckData?.primary_hub_stop?.name || 'Вузлова зупинка'}»</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={onOpenTimeline}
                    className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                    aria-label="Переглянути детальну похвилинну рейс-стрічку спільної зупинки"
                  >
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Стрічка часу вузла</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplySync([routeAId, routeBId])}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
                    aria-label="Синхронізувати розклади обраної пари"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isSyncing ? 'Синхронізація...' : `Синхронізувати ${conflictsCount > 0 ? `(${conflictsCount} скупчень)` : ''}`}</span>
                  </button>
                </div>
              </div>

              {/* Показники скупчення */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Спільних зупинок:</span>
                  <div className="font-mono font-black text-slate-900 dark:text-white text-sm">
                    {pairCheckData?.shared_stops_count ?? 0} зупинок
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border space-y-0.5 ${
                  conflictsCount > 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold opacity-75">Конфліктів скупчення (&lt;{minHeadway} хв):</span>
                  <div className="font-mono font-black text-sm">
                    {conflictsCount > 0 ? `${conflictsCount} накладок (ризик затору)` : '0 накладок (Узгоджено)'}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Метод координації:</span>
                  <div className="font-bold text-purple-700 dark:text-purple-300 text-xs truncate">
                    Фазовий зсув Δt [-2, +2] хв
                  </div>
                </div>
              </div>

              {/* Теги спільних зупинок */}
              {sharedStops.length > 0 && (
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Спільна траса маршрутів:</span>
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {sharedStops.map((st) => (
                      <span
                        key={st.id}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        {st.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default InterlineRoutePairPanel
