import React from 'react'
import { Route, TransportType, ControlPointNode } from '../../types'
import { RouteControlPointsView } from '../routes/RouteControlPointsView'
import { DirectoryPointItem } from '../../hooks/useNetworkSettingsLogic'
import {
  MapPin,
  Plus,
  Route as RouteIcon,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

export interface NetworkHubsPanelProps {
  allDirectoryPoints: DirectoryPointItem[]
  routeUsageMap: Map<string, Route[]>
  routes: Route[]
  controlPoints: ControlPointNode[]
  hubRouteTypeFilter: TransportType | 'all'
  setHubRouteTypeFilter: (filter: TransportType | 'all') => void
  expandedRouteId: string | null
  setExpandedRouteId: (id: string | null) => void
  onOpenAddHubModal: () => void
  onOpenEditHubModal: (hub: ControlPointNode) => void
  onDeleteHub: (id: string, name: string) => void
  onUpdateRoute: (route: Route) => void
}

interface ControlPointChannel {
  trackId: string
  name: string
  directionVector?: string
  maxCapacity?: number
}

export const NetworkHubsPanel: React.FC<NetworkHubsPanelProps> = ({
  allDirectoryPoints,
  routeUsageMap,
  routes,
  controlPoints,
  hubRouteTypeFilter,
  setHubRouteTypeFilter,
  expandedRouteId,
  setExpandedRouteId,
  onOpenAddHubModal,
  onOpenEditHubModal,
  onDeleteHub,
  onUpdateRoute
}) => {
  const handleDeleteHubClick = (id: string, name: string) => {
    if (window.confirm(`Видалити глобальний вузол "${name}"? Це не видалить саму зупинку, але вона перестане бути вузлом.`)) {
      onDeleteHub(id, name)
    }
  }

  const handleToggleExpandRoute = (routeId: string) => {
    setExpandedRouteId(expandedRouteId === routeId ? null : routeId)
  }

  const filteredRoutes = routes.filter(
    (r) => hubRouteTypeFilter === 'all' || r.type === hubRouteTypeFilter
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-gray-900 font-bold text-base">Довідник контрольних точок (Control Points)</h3>
          <p className="text-xs text-gray-600">
            Глобальні інфраструктурні вузли та контрольні точки за маршрутами
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h4 className="text-sm font-bold text-gray-900">1. Глобальні вузли та диспетчерські пункти</h4>
          <button
            type="button"
            onClick={onOpenAddHubModal}
            className="flex items-center space-x-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
            aria-label="Додати глобальний вузол"
          >
            <Plus className="w-4 h-4" />
            <span>Додати вузол</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allDirectoryPoints.map((cp) => {
            const isComplex = cp.isComplex
            const routesUsing = routeUsageMap.get(cp.id) || []
            const channels = (cp.channels || []) as unknown as ControlPointChannel[]

            return (
              <div
                key={cp.id}
                className={`bg-white border-2 ${
                  isComplex ? 'border-gray-900' : 'border-gray-300'
                } rounded-xl p-5 space-y-3 shadow-sm relative group`}
              >
                <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className={`w-5 h-5 ${isComplex ? 'text-amber-600' : 'text-gray-500'}`} />
                    <h4 className="text-gray-900 font-bold text-base">{cp.name}</h4>
                    {!isComplex && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 ml-2 uppercase font-bold">
                        Звичайна зупинка
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isComplex && cp.minHeadwayMin && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 font-mono">
                        h_min = {cp.minHeadwayMin}хв
                      </span>
                    )}
                    {isComplex && (
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          type="button"
                          onClick={() => onOpenEditHubModal(cp)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-blue-600 cursor-pointer"
                          title="Редагувати вузол"
                          aria-label={`Редагувати вузол ${cp.name}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHubClick(cp.id, cp.name)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          title="Видалити вузол"
                          aria-label={`Видалити вузол ${cp.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isComplex && cp.locationDescription && (
                  <p className="text-[11px] text-gray-500 italic border-l-2 border-gray-300 pl-2">
                    {cp.locationDescription}
                  </p>
                )}

                {routesUsing.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center mr-1">Маршрути:</span>
                    {routesUsing.map((r) => (
                      <span
                        key={r.id}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          r.type === 'tram'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {r.type === 'tram' ? 'Тр' : 'Т'} {r.number}
                      </span>
                    ))}
                  </div>
                )}

                {isComplex && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        Канали колій ({cp.availableTracksCount}):
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {channels.map((ch, idx) => (
                        <div
                          key={ch.trackId}
                          className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-2 py-1"
                        >
                          <div className="flex items-center space-x-1.5 overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-400">#{idx + 1}</span>
                            <span className="text-[11px] font-medium text-gray-700 truncate" title={ch.name}>
                              {ch.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 ml-2 shrink-0">
                            {ch.directionVector && (
                              <span
                                className="text-[9px] text-gray-500 bg-gray-200 px-1 rounded truncate max-w-[60px]"
                                title={ch.directionVector}
                              >
                                {ch.directionVector}
                              </span>
                            )}
                            <span
                              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 rounded"
                              title="Місткість (ТЗ)"
                            >
                              {ch.maxCapacity} тз
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">2. Контрольні точки за маршрутами</h4>

        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg w-max mb-3 text-xs font-bold" role="group" aria-label="Фільтр типів маршрутів">
          <button
            type="button"
            onClick={() => setHubRouteTypeFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              hubRouteTypeFilter === 'all'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Всі маршрути
          </button>
          <button
            type="button"
            onClick={() => setHubRouteTypeFilter('tram')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              hubRouteTypeFilter === 'tram'
                ? 'bg-white shadow-sm text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Трамваї
          </button>
          <button
            type="button"
            onClick={() => setHubRouteTypeFilter('trolleybus')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              hubRouteTypeFilter === 'trolleybus'
                ? 'bg-white shadow-sm text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Тролейбуси
          </button>
        </div>

        <div className="space-y-2">
          {filteredRoutes.map((r) => {
            const isExpanded = expandedRouteId === r.id
            return (
              <div key={r.id} className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleToggleExpandRoute(r.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <RouteIcon className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-sm text-gray-900">
                      {r.type === 'tram' ? 'Т' : 'Тр'} {r.number}: {r.name}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-mono font-bold">
                      {(r.controlPoints || []).length} точок
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <RouteControlPointsView
                      route={r}
                      controlPoints={controlPoints}
                      updateRoute={onUpdateRoute}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
