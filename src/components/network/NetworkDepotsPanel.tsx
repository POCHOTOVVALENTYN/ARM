import { Route, Station, RouteDepotConfig } from '../../types'
import { Depot } from '../../store/useConfigStore'
import { AdminDepotsManager } from '../admin/AdminDepotsManager'
import {
  Bus,
  Plus,
  Route as RouteIcon,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

export interface NetworkDepotsPanelProps {
  depots: Depot[]
  routes: Route[]
  stations: Station[]
  routeDepotConfigs: RouteDepotConfig[]
  expandedDepotRouteId: string | null
  setExpandedDepotRouteId: (id: string | null) => void
  onAddDepotConfig: (config: RouteDepotConfig) => void
  onUpdateDepotConfig: (config: RouteDepotConfig) => void
  onDeleteRouteDepotConfig: (id: string) => void
}

export const NetworkDepotsPanel: React.FC<NetworkDepotsPanelProps> = ({
  depots,
  routes,
  stations,
  routeDepotConfigs,
  expandedDepotRouteId,
  setExpandedDepotRouteId,
  onAddDepotConfig,
  onUpdateDepotConfig,
  onDeleteRouteDepotConfig
}) => {
  const handleToggleExpandDepotRoute = (routeId: string) => {
    setExpandedDepotRouteId(expandedDepotRouteId === routeId ? null : routeId)
  }

  const handleDeleteConfigClick = (cfgId: string, routeNumber: string, depotName: string) => {
    if (window.confirm(`Видалити зв'язок маршруту №${routeNumber} з депо "${depotName}"?`)) {
      onDeleteRouteDepotConfig(cfgId)
    }
  }

  const handleAssignDepot = (route: Route, type: 'tram' | 'trolleybus') => {
    const targetDepots = depots.filter((d) => d.type === type)
    const existingConfigs = routeDepotConfigs.filter((c) => c.routeId === route.id)
    const assignedDepotIds = existingConfigs.map((c) => c.depotId)
    const availableDepots = targetDepots.filter((d) => !assignedDepotIds.includes(d.id))

    if (availableDepots.length === 0) {
      alert(`Усі ${type === 'tram' ? 'трамвайні' : 'тролейбусні'} депо вже призначені для цього маршруту.`)
      return
    }

    const depot = availableDepots[0]
    onAddDepotConfig({
      id: `cfg_${Date.now()}`,
      routeId: route.id,
      depotId: depot.id,
      pullOut: {
        dir0: {
          targetStationId: route.primaryTerminalId,
          distanceKm: 0,
          durationMin: 0,
          passengerPickupAllowed: false
        },
        dir1: {
          targetStationId: route.secondaryTerminalId,
          distanceKm: 0,
          durationMin: 0,
          passengerPickupAllowed: false
        }
      },
      pullIn: {
        dir0: {
          targetStationId: route.secondaryTerminalId,
          distanceKm: 0,
          durationMin: 0,
          passengerPickupAllowed: false
        },
        dir1: {
          targetStationId: route.primaryTerminalId,
          distanceKm: 0,
          durationMin: 0,
          passengerPickupAllowed: false
        }
      }
    })
  }

  const renderRouteList = (type: 'tram' | 'trolleybus', typeLabel: string, typePrefix: string) => {
    const filteredRoutes = routes.filter((r) => r.type === type)

    return (
      <div className="space-y-1">
        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          {typeLabel}
        </h5>
        {filteredRoutes.map((route) => {
          const configs = routeDepotConfigs.filter((c) => c.routeId === route.id)
          const isExpanded = expandedDepotRouteId === route.id
          const hasConfig = configs.length > 0

          return (
            <div
              key={route.id}
              className={`border rounded-lg overflow-hidden ${
                hasConfig ? 'border-gray-300 bg-white' : 'border-dashed border-gray-300 bg-gray-50'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleExpandDepotRoute(route.id)}
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
                  <span className="text-xs text-gray-500 truncate max-w-[300px]">{route.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {hasConfig ? (
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                      ✓ Депо призначено ({configs.length})
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                      ⚠ Потрібно налаштувати
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-3 border-t border-gray-200 space-y-3 bg-white">
                  {configs.map((cfg) => {
                    const depot = depots.find((d) => d.id === cfg.depotId)
                    const depotTitle = depot?.name || cfg.depotId

                    return (
                      <div key={cfg.id} className="border border-indigo-100 rounded-lg bg-indigo-50/30 p-3 relative">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-sm text-indigo-900 flex items-center">
                            <Bus className="w-4 h-4 mr-2" />
                            {depotTitle}
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleDeleteConfigClick(cfg.id, route.number, depotTitle)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer"
                            title="Видалити зв'язок"
                            aria-label={`Видалити зв'язок маршруту ${route.number} з депо ${depotTitle}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {/* Pull-out */}
                          <div className="space-y-2">
                            <h6 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                              ▶ Виїзди з депо (Pull-out)
                            </h6>
                            {(['dir0', 'dir1'] as const).map((dir) => {
                              const dirData = cfg.pullOut?.[dir]
                              const terminalId = dir === 'dir0' ? route.primaryTerminalId : route.secondaryTerminalId
                              const terminalName = stations.find((s) => s.id === terminalId)?.name || `Зупинка ${terminalId}`
                              if (!terminalName) return null

                              return (
                                <div key={dir} className="bg-white p-2 rounded border border-gray-200 text-xs space-y-1.5">
                                  <span className="font-bold text-gray-700 block">
                                    Напр. {dir === 'dir0' ? '1' : '2'} → {terminalName}
                                  </span>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <label className="flex items-center gap-1 text-gray-500">
                                      Відст:
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={dirData?.distanceKm ?? 0}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0
                                          const updated: RouteDepotConfig = {
                                            ...cfg,
                                            pullOut: {
                                              ...cfg.pullOut,
                                              [dir]: {
                                                targetStationId: terminalId,
                                                durationMin: dirData?.durationMin ?? 0,
                                                passengerPickupAllowed: dirData?.passengerPickupAllowed ?? false,
                                                distanceKm: val
                                              }
                                            }
                                          }
                                          onUpdateDepotConfig(updated)
                                        }}
                                        className="w-16 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                      />
                                      <span className="text-gray-400">км</span>
                                    </label>
                                    <label className="flex items-center gap-1 text-gray-500">
                                      Час:
                                      <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={dirData?.durationMin ?? 0}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0
                                          const updated: RouteDepotConfig = {
                                            ...cfg,
                                            pullOut: {
                                              ...cfg.pullOut,
                                              [dir]: {
                                                targetStationId: terminalId,
                                                distanceKm: dirData?.distanceKm ?? 0,
                                                passengerPickupAllowed: dirData?.passengerPickupAllowed ?? false,
                                                durationMin: val
                                              }
                                            }
                                          }
                                          onUpdateDepotConfig(updated)
                                        }}
                                        className="w-14 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                      />
                                      <span className="text-gray-400">хв</span>
                                    </label>
                                    <label className="flex items-center gap-1 text-gray-500 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={dirData?.passengerPickupAllowed ?? false}
                                        onChange={(e) => {
                                          const updated: RouteDepotConfig = {
                                            ...cfg,
                                            pullOut: {
                                              ...cfg.pullOut,
                                              [dir]: {
                                                targetStationId: terminalId,
                                                distanceKm: dirData?.distanceKm ?? 0,
                                                durationMin: dirData?.durationMin ?? 0,
                                                passengerPickupAllowed: e.target.checked
                                              }
                                            }
                                          }
                                          onUpdateDepotConfig(updated)
                                        }}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      З пасажирами
                                    </label>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {/* Pull-in */}
                          <div className="space-y-2">
                            <h6 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                              ◀ Заїзди в депо (Pull-in)
                            </h6>
                            {(['dir0', 'dir1'] as const).map((dir) => {
                              const dirData = cfg.pullIn?.[dir]
                              const terminalId = dir === 'dir0' ? route.primaryTerminalId : route.secondaryTerminalId
                              const oppositeTerminalId = terminalId === route.primaryTerminalId ? route.secondaryTerminalId : route.primaryTerminalId
                              const oppositeTerminalName = stations.find((s) => s.id === oppositeTerminalId)?.name || 'Кінцева'

                              return (
                                <div key={dir} className="bg-white p-2 rounded border border-gray-200 text-xs space-y-1.5">
                                  <span className="font-bold text-gray-700 block">
                                    Напр. {dir === 'dir0' ? '1' : '2'} ← {oppositeTerminalName}
                                  </span>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <label className="flex items-center gap-1 text-gray-500">
                                      Відст:
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={dirData?.distanceKm ?? 0}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0
                                          const updated: RouteDepotConfig = {
                                            ...cfg,
                                            pullIn: {
                                              ...cfg.pullIn,
                                              [dir]: {
                                                targetStationId: oppositeTerminalId,
                                                durationMin: dirData?.durationMin ?? 0,
                                                passengerPickupAllowed: dirData?.passengerPickupAllowed ?? false,
                                                distanceKm: val
                                              }
                                            }
                                          }
                                          onUpdateDepotConfig(updated)
                                        }}
                                        className="w-16 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                      />
                                      <span className="text-gray-400">км</span>
                                    </label>
                                    <label className="flex items-center gap-1 text-gray-500">
                                      Час:
                                      <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={dirData?.durationMin ?? 0}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0
                                          const updated: RouteDepotConfig = {
                                            ...cfg,
                                            pullIn: {
                                              ...cfg.pullIn,
                                              [dir]: {
                                                targetStationId: oppositeTerminalId,
                                                distanceKm: dirData?.distanceKm ?? 0,
                                                passengerPickupAllowed: dirData?.passengerPickupAllowed ?? false,
                                                durationMin: val
                                              }
                                            }
                                          }
                                          onUpdateDepotConfig(updated)
                                        }}
                                        className="w-14 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                      />
                                      <span className="text-gray-400">хв</span>
                                    </label>
                                    <label className="flex items-center gap-1 text-gray-500 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={dirData?.passengerPickupAllowed ?? false}
                                        onChange={(e) => {
                                          const updated: RouteDepotConfig = {
                                            ...cfg,
                                            pullIn: {
                                              ...cfg.pullIn,
                                              [dir]: {
                                                targetStationId: oppositeTerminalId,
                                                distanceKm: dirData?.distanceKm ?? 0,
                                                durationMin: dirData?.durationMin ?? 0,
                                                passengerPickupAllowed: e.target.checked
                                              }
                                            }
                                          }
                                          onUpdateDepotConfig(updated)
                                        }}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      З пасажирами
                                    </label>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Assign depot button */}
                  <button
                    type="button"
                    onClick={() => handleAssignDepot(route, type)}
                    className="w-full flex items-center justify-center space-x-2 text-xs font-bold text-indigo-600 border-2 border-dashed border-indigo-300 rounded-lg p-2 hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Призначити депо</span>
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
    <div className="space-y-6">
      <AdminDepotsManager />

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <h3 className="text-gray-900 font-bold text-base">
          Довідник нульових пробігів та матриця виїздів (Pull-outs & Pull-ins)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {depots.map((dep) => (
          <div
            key={dep.id}
            className="bg-white border-2 border-gray-900 rounded-xl p-4 space-y-2 shadow-sm"
          >
            <div className="flex items-center space-x-2">
              <Bus className="w-5 h-5 text-indigo-600" />
              <h4 className="text-gray-900 font-bold text-sm">{dep.name}</h4>
            </div>
            <p className="text-xs text-gray-600">{dep.address}</p>
            <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs flex justify-between font-mono">
              <span className="text-gray-600">Підготовчо-заключний час:</span>
              <strong className="text-amber-800 font-bold">{dep.prepTimeMin} хвилин</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Depot/Route Pull-in/Pull-out Settings */}
      <div className="space-y-3">
        <h4 className="text-gray-900 font-bold text-sm uppercase tracking-wider border-b border-gray-900 pb-2">
          Матриця виїздів та заїздів (Pull-outs & Pull-ins):
        </h4>
        <p className="text-xs text-gray-500">
          Налаштування нульових пробігів для кожного маршруту: виїзди з депо (Pull-out) та заїзди в депо (Pull-in).
          Натисніть на маршрут, щоб розгорнути деталі або призначити депо.
        </p>

        {renderRouteList('tram', 'Трамвайні маршрути', 'Тр')}
        <div className="mt-4">
          {renderRouteList('trolleybus', 'Тролейбусні маршрути', 'Тб')}
        </div>
      </div>
    </div>
  )
}
