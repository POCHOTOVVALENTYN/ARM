import React from 'react'
import { Route, BreakLocationConfig } from '../../types'
import {
  Coffee,
  Plus,
  Route as RouteIcon,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

export interface NetworkBreaksPanelProps {
  routes: Route[]
  breaks: BreakLocationConfig[]
  expandedBreakRouteId: string | null
  setExpandedBreakRouteId: (id: string | null) => void
  onOpenAddBreakModal: (routeId: string) => void
  onOpenEditBreakModal: (routeId: string, config: BreakLocationConfig) => void
  onDeleteBreak: (id: string) => void
}

export const NetworkBreaksPanel: React.FC<NetworkBreaksPanelProps> = ({
  routes,
  breaks,
  expandedBreakRouteId,
  setExpandedBreakRouteId,
  onOpenAddBreakModal,
  onOpenEditBreakModal,
  onDeleteBreak
}) => {
  const handleToggleExpandBreakRoute = (routeId: string) => {
    setExpandedBreakRouteId(expandedBreakRouteId === routeId ? null : routeId)
  }

  const handleDeleteBreakClick = (id: string, locationName: string) => {
    if (window.confirm(`Видалити точку обіду "${locationName}"?`)) {
      onDeleteBreak(id)
    }
  }

  const renderBreakRoutesList = (type: 'tram' | 'trolleybus', typeLabel: string, typePrefix: string) => {
    const filteredRoutes = routes.filter((r) => r.type === type)

    return (
      <div className="space-y-1">
        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
          {typeLabel}
        </h5>
        {filteredRoutes.map((route) => {
          const routeBreaks = breaks.filter((b) => b.routeId === route.id)
          const isExpanded = expandedBreakRouteId === route.id

          return (
            <div key={route.id} className="border rounded-lg overflow-hidden border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => handleToggleExpandBreakRoute(route.id)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between p-2.5 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <RouteIcon className={`w-4 h-4 ${type === 'tram' ? 'text-rose-600' : 'text-indigo-600'}`} />
                  <span className="font-bold text-gray-900 text-sm">
                    {typePrefix} {route.number}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[200px]">{route.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {routeBreaks.length} точок обіду
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-3">
                  {routeBreaks.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white">
                      Не призначено жодної точки обіду. Водії не зможуть робити перерви.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {routeBreaks.map((b) => (
                        <div
                          key={b.id}
                          className="bg-white border border-gray-200 rounded-lg p-3 relative hover:shadow-sm transition-shadow group"
                        >
                          <button
                            type="button"
                            onClick={() => handleDeleteBreakClick(b.id, b.locationName)}
                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                            title="Видалити точку обіду"
                            aria-label={`Видалити точку обіду ${b.locationName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditBreakModal(route.id, b)}
                            className="text-left w-full cursor-pointer"
                          >
                            <div className="flex items-center mb-1.5">
                              <Coffee className="w-4 h-4 text-amber-600 mr-1.5" />
                              <span className="font-bold text-gray-900 text-xs truncate max-w-[180px]">
                                {b.locationName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {b.locationType === 'dispatch_point'
                                  ? 'ДП'
                                  : b.locationType === 'opposite_terminal'
                                  ? 'Кінцева'
                                  : 'Зупинка'}
                              </span>
                              <span className="text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                                {b.maxCapacityVehicles} ваг. / {b.durationMin} хв.
                              </span>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenAddBreakModal(route.id)}
                    className="w-full py-2 flex items-center justify-center text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-colors mt-2 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Додати місце обіду
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-gray-900 font-bold text-base">База даних місць відпочинку та обіду водіїв</h3>
          <p className="text-xs text-gray-600">
            Призначення дозволених локацій для організації обідніх перерв за маршрутами.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {renderBreakRoutesList('tram', 'Трамвайні маршрути', 'Тр')}
        <div className="mt-4">
          {renderBreakRoutesList('trolleybus', 'Тролейбусні маршрути', 'Тб')}
        </div>
      </div>
    </div>
  )
}
