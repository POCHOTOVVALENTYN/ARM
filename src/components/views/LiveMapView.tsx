import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useLiveMapLogic, ODESSA_CENTER } from '../../hooks/useLiveMapLogic'
import { LiveMapHud } from '../dispatcher/LiveMapHud'
import { LiveMapSidebar } from '../dispatcher/LiveMapSidebar'
import { LiveMapOverlays } from '../dispatcher/LiveMapOverlays'
import { AirRaidBanner } from '../dispatcher/AirRaidBanner'
import { CreateDispatchOrderModal } from '../modals/CreateDispatchOrderModal'

// Фікс іконок Leaflet у Vite збірці
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// Контролер масштабування карти при виборі маршруту
const MapBoundsController: React.FC<{ 
  selectedRouteId: string 
  allPoints: [number, number][] 
}> = ({ selectedRouteId, allPoints }) => {
  const map = useMap()
  const prevRouteRef = useRef<string>(selectedRouteId)
  const isFirstMount = useRef<boolean>(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    if (prevRouteRef.current !== selectedRouteId) {
      prevRouteRef.current = selectedRouteId

      if (!selectedRouteId || selectedRouteId === 'ALL' || selectedRouteId === 'all') {
        map.setView(ODESSA_CENTER, 13, { animate: true })
        return
      }

      if (allPoints && allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints.map((p) => L.latLng(p[0], p[1])))
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true })
      }
    }
  }, [selectedRouteId, allPoints, map])

  return null
}

export interface LiveMapViewProps {
  activeRouteId?: string
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({ activeRouteId: propActiveRouteId }) => {
  const {
    routes,
    selectedRouteIds,
    primarySelectedRouteId,
    routeTypeFilter,
    searchQuery,
    selectedTileStyleId,
    currentTileStyle,
    directionMode,
    isSidebarOpen,
    activeTab,
    secondsSinceSync,
    isAntiRebActive,
    isSyncingEasyWay,
    syncResultMsg,
    isAirRaidActive,

    showAllRoutesLines,
    showTrackShape,
    showStops,
    showDispatchHubs,
    hideServiceVehicles,
    hideDepotVehicles,
    onlyCriticalDelays,
    allRoutesData,
    routeShapeForward,
    routeShapeBackward,
    stopsData,
    dispatchHubs,
    focusPoints,

    orderModalOpen,
    selectedVehicleForOrder,

    setShowAllRoutesLines,
    setShowTrackShape,
    setShowStops,
    setShowDispatchHubs,
    setHideServiceVehicles,
    setHideDepotVehicles,
    setOnlyCriticalDelays,

    handleToggleSidebar,
    handleTabChange,
    handleRouteSelect,
    handleClearRouteSelection,
    handleRouteTypeFilterChange,
    handleSearchChange,
    handleDirectionModeChange,
    handleTileStyleChange,
    handleToggleAntiReb,
    handleSyncEasyWay,
    handleOpenOrderModal,
    handleCloseOrderModal
  } = useLiveMapLogic(propActiveRouteId)

  return (
    <div className="relative w-full h-[calc(100vh-68px)] bg-slate-950 overflow-hidden font-sans select-none">
      {/* 1. Банер тривоги */}
      {isAirRaidActive && (
        <div className="absolute top-0 inset-x-0 z-[1100]">
          <AirRaidBanner />
        </div>
      )}

      {/* 2. Верхній плаваючий інформаційний HUD */}
      <LiveMapHud
        isSidebarOpen={isSidebarOpen}
        selectedRouteIdsCount={selectedRouteIds.length}
        secondsSinceSync={secondsSinceSync}
        isAntiRebActive={isAntiRebActive}
        isAirRaidActive={isAirRaidActive}
        onToggleSidebar={handleToggleSidebar}
        onToggleAntiReb={handleToggleAntiReb}
      />

      {/* 3. Бічна панель вибору маршрутів та шарів */}
      <LiveMapSidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        routes={routes}
        selectedRouteIds={selectedRouteIds}
        routeTypeFilter={routeTypeFilter}
        searchQuery={searchQuery}
        directionMode={directionMode}
        selectedTileStyleId={selectedTileStyleId}
        showAllRoutesLines={showAllRoutesLines}
        showTrackShape={showTrackShape}
        showStops={showStops}
        showDispatchHubs={showDispatchHubs}
        hideServiceVehicles={hideServiceVehicles}
        hideDepotVehicles={hideDepotVehicles}
        onlyCriticalDelays={onlyCriticalDelays}
        isSyncingEasyWay={isSyncingEasyWay}
        syncResultMsg={syncResultMsg}
        onTabChange={handleTabChange}
        onRouteSelect={handleRouteSelect}
        onClearRouteSelection={handleClearRouteSelection}
        onRouteTypeFilterChange={handleRouteTypeFilterChange}
        onSearchChange={handleSearchChange}
        onDirectionModeChange={handleDirectionModeChange}
        onTileStyleChange={handleTileStyleChange}
        setShowAllRoutesLines={setShowAllRoutesLines}
        setShowTrackShape={setShowTrackShape}
        setShowStops={setShowStops}
        setShowDispatchHubs={setShowDispatchHubs}
        setHideServiceVehicles={setHideServiceVehicles}
        setHideDepotVehicles={setHideDepotVehicles}
        setOnlyCriticalDelays={setOnlyCriticalDelays}
        onSyncEasyWay={handleSyncEasyWay}
        onClose={handleToggleSidebar}
      />

      {/* 4. Контейнер карти Leaflet */}
      <MapContainer
        center={ODESSA_CENTER}
        zoom={13}
        zoomControl={false}
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing"
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          key={currentTileStyle.id}
          url={currentTileStyle.url}
          attribution={currentTileStyle.attribution}
          maxZoom={19}
        />

        <MapBoundsController
          selectedRouteId={primarySelectedRouteId}
          allPoints={focusPoints}
        />

        <LiveMapOverlays
          showAllRoutesLines={showAllRoutesLines}
          showTrackShape={showTrackShape}
          showStops={showStops}
          showDispatchHubs={showDispatchHubs}
          hideServiceVehicles={hideServiceVehicles}
          hideDepotVehicles={hideDepotVehicles}
          onlyCriticalDelays={onlyCriticalDelays}
          isAntiRebActive={isAntiRebActive}
          selectedRouteIds={selectedRouteIds}
          primarySelectedRouteId={primarySelectedRouteId}
          directionMode={directionMode}
          allRoutesData={allRoutesData}
          routeShapeForward={routeShapeForward}
          routeShapeBackward={routeShapeBackward}
          stopsData={stopsData}
          dispatchHubs={dispatchHubs}
          onIssueDispatchOrder={handleOpenOrderModal}
        />
      </MapContainer>

      {/* 5. Модальне вікно оперативного наказу */}
      {orderModalOpen && selectedVehicleForOrder && (
        <CreateDispatchOrderModal
          isOpen={orderModalOpen}
          onClose={handleCloseOrderModal}
          initialVehicleId={selectedVehicleForOrder.vehicleId}
          initialRouteId={selectedVehicleForOrder.routeId}
        />
      )}
    </div>
  )
}

export default LiveMapView
