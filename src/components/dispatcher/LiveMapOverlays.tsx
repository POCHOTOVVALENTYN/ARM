import React from 'react'
import { Polyline, Polygon, CircleMarker, Popup } from 'react-leaflet'
import { TelemetryMarkers, ODESSA_ACTIVE_DEPOT_POLYGONS } from './TelemetryMarkers'
import { DispatchHubItem } from '../../hooks/useLiveMapLogic'
import { RouteStopItem, AllRouteShapeItem } from '../../hooks/useRouteQueries'

export interface LiveMapOverlaysProps {
  showAllRoutesLines: boolean
  showTrackShape: boolean
  showStops: boolean
  showDispatchHubs: boolean
  hideServiceVehicles: boolean
  hideDepotVehicles: boolean
  onlyCriticalDelays: boolean
  isAntiRebActive: boolean
  selectedRouteIds: string[]
  primarySelectedRouteId: string
  directionMode: 'both' | 0 | 1
  allRoutesData: AllRouteShapeItem[]
  routeShapeForward: [number, number][]
  routeShapeBackward: [number, number][]
  stopsData: RouteStopItem[]
  dispatchHubs: DispatchHubItem[]
  onIssueDispatchOrder: (vehicleId: string, routeId: string) => void
}

export const LiveMapOverlays: React.FC<LiveMapOverlaysProps> = ({
  showAllRoutesLines,
  showTrackShape,
  showStops,
  showDispatchHubs,
  hideServiceVehicles,
  hideDepotVehicles,
  onlyCriticalDelays,
  isAntiRebActive,
  selectedRouteIds,
  primarySelectedRouteId,
  directionMode,
  allRoutesData,
  routeShapeForward,
  routeShapeBackward,
  stopsData,
  dispatchHubs,
  onIssueDispatchOrder
}) => {
  const isSpecificRoute = Boolean(primarySelectedRouteId)

  return (
    <>
      {/* 1. Вся мережа маршрутних ліній */}
      {showAllRoutesLines && !isSpecificRoute && allRoutesData.map((route, idx) => (
        <Polyline
          key={`all-route-${route.route_id || idx}-${route.direction_id || 0}`}
          positions={route.geometry?.map((p) => [p.lat, p.lng]) || []}
          pathOptions={{
            color: route.color || '#3b82f6',
            weight: 3,
            opacity: 0.55
          }}
        />
      ))}

      {/* 2. Траса обраного маршруту (прямий напрямок) */}
      {showTrackShape && isSpecificRoute && (directionMode === 'both' || directionMode === 0) && routeShapeForward.length > 0 && (
        <Polyline
          positions={routeShapeForward}
          pathOptions={{
            color: '#2563eb',
            weight: 5,
            opacity: 0.85
          }}
        />
      )}

      {/* 3. Траса обраного маршруту (зворотний напрямок) */}
      {showTrackShape && isSpecificRoute && (directionMode === 'both' || directionMode === 1) && routeShapeBackward.length > 0 && (
        <Polyline
          positions={routeShapeBackward}
          pathOptions={{
            color: '#0891b2',
            weight: 5,
            opacity: 0.85,
            dashArray: '8, 8'
          }}
        />
      )}

      {/* 4. Диспетчерські пункти (ДП) та контрольні точки */}
      {showDispatchHubs && dispatchHubs.map((hub) => (
        <CircleMarker
          key={`hub-${hub.id}`}
          center={[hub.lat, hub.lng]}
          radius={8.5}
          pathOptions={{
            fillColor: '#4f46e5',
            color: '#ffffff',
            weight: 2.5,
            fillOpacity: 0.95
          }}
        >
          <Popup className="font-sans text-xs">
            <div className="p-1.5 space-y-1 min-w-[170px]">
              <div className="font-black text-indigo-950 text-sm">{hub.name}</div>
              <div className="text-[10px] text-indigo-600 font-bold flex items-center space-x-1">
                <span>🚏 Диспетчерський Пункт (ДП)</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-1">
                Закріплені маршрути: <strong>{hub.routes}</strong>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* 5. Реальні полігони депо КП «ОМЕТ» */}
      {showDispatchHubs && ODESSA_ACTIVE_DEPOT_POLYGONS.map((depot) => (
        <Polygon
          key={depot.id}
          positions={depot.polygon}
          pathOptions={{
            color: '#d97706',
            fillColor: '#fbbf24',
            fillOpacity: 0.16,
            weight: 2,
            dashArray: '6, 6'
          }}
        >
          <Popup className="font-sans text-xs">
            <div className="p-1.5 space-y-1 min-w-[190px]">
              <div className="flex items-center space-x-1.5 border-b border-amber-200 pb-1">
                <span className="text-base">{depot.type === 'TRAM' ? '🚋' : '🚎'}</span>
                <div>
                  <div className="font-black text-amber-950 text-sm">{depot.name}</div>
                  <div className="text-[10px] text-amber-700 font-bold">{depot.address}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-600 font-medium pt-0.5">
                Територія базування: <strong>{depot.shortName}</strong> ({depot.type === 'TRAM' ? 'Трамваї' : 'Тролейбуси'})
              </div>
              <div className="text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                📍 Точна огорожа периметру депо
              </div>
            </div>
          </Popup>
        </Polygon>
      ))}

      {/* 6. Маршрутні зупинки */}
      {showStops && isSpecificRoute && stopsData.map((stop, sIdx) => {
        const isDir1 = stop.direction_id === 1
        return (
          <CircleMarker
            key={`stop-${stop.stop_id}-${stop.direction_id || 0}-${sIdx}`}
            center={[stop.lat, stop.lng]}
            radius={stop.is_dispatch_station ? 7 : 4}
            pathOptions={{
              fillColor: stop.is_dispatch_station 
                ? '#4f46e5' 
                : (isDir1 ? '#0891b2' : '#2563eb'),
              color: '#ffffff',
              weight: 2,
              fillOpacity: 0.9
            }}
          >
            <Popup className="font-sans text-xs">
              <div className="p-1.5 space-y-1 min-w-[160px]">
                <div className="font-black text-slate-900 dark:text-white text-sm">{stop.name}</div>
                <div className="text-[11px] text-blue-600 font-bold flex items-center space-x-1">
                  <span>{stop.is_dispatch_station ? '🚏 Диспетчерський Пункт (ДП)' : `Зупинка #${stop.stop_sequence}`}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 dark:border-slate-800 pt-1">
                  Напрямок: <strong className={isDir1 ? 'text-cyan-600' : 'text-blue-600'}>{isDir1 ? '⬅️ Зворотний' : '➡️ Прямий'}</strong>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      {/* 7. Онлайн-маркери рухомого складу Wialon / EasyWay */}
      <TelemetryMarkers
        selectedRouteIds={selectedRouteIds}
        hideServiceVehicles={hideServiceVehicles}
        hideDepotVehicles={hideDepotVehicles}
        onlyCriticalDelays={onlyCriticalDelays}
        isAntiEwActive={isAntiRebActive}
        onIssueDispatchOrder={onIssueDispatchOrder}
      />
    </>
  )
}

export default LiveMapOverlays
