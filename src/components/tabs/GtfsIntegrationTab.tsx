import React from 'react'
import { Route, VehicleBlock } from '../../types'
import { useGtfsIntegrationLogic } from '../../hooks/useGtfsIntegrationLogic'
import { GtfsHeaderBanner } from '../network/GtfsHeaderBanner'
import { GtfsOverviewPanel } from '../network/GtfsOverviewPanel'
import { GtfsRoutesPanel } from '../network/GtfsRoutesPanel'
import { GtfsStaticPanel } from '../network/GtfsStaticPanel'
import { GtfsRealtimePanel } from '../network/GtfsRealtimePanel'

interface GtfsIntegrationTabProps {
  routes: Route[]
  blocks: VehicleBlock[]
}

export const GtfsIntegrationTab: React.FC<GtfsIntegrationTabProps> = ({ routes, blocks }) => {
  const {
    isGtfsActive,
    activeSubTab,
    setActiveSubTab,
    copiedFile,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filteredRoutes,
    gtfsStatic,
    gtfsRealtime,
    copyToClipboard,
    handleLoadGtfsData,
    handleReloadDemo
  } = useGtfsIntegrationLogic({ routes, blocks })

  return (
    <div className="space-y-6">
      {/* Header Banner & Live GTFS Toggle */}
      <GtfsHeaderBanner 
        isGtfsActive={isGtfsActive}
        activeSubTab={activeSubTab}
        routesCount={routes.length}
        onTabChange={setActiveSubTab}
        onReloadDemo={handleReloadDemo}
        onLoadGtfsData={handleLoadGtfsData}
      />

      {/* Subtab 1: GTFS Overview & Metrics */}
      {activeSubTab === 'overview' && (
        <GtfsOverviewPanel 
          routesCount={routes.length}
          onLoadGtfsData={handleLoadGtfsData}
        />
      )}

      {/* Subtab 2: Routes Master Inspector */}
      {activeSubTab === 'routes' && (
        <GtfsRoutesPanel 
          routes={routes}
          filteredRoutes={filteredRoutes}
          searchQuery={searchQuery}
          filterType={filterType}
          onSearchChange={setSearchQuery}
          onFilterTypeChange={setFilterType}
        />
      )}

      {/* Subtab 3: GTFS Static Exporter Files */}
      {activeSubTab === 'static' && (
        <GtfsStaticPanel 
          gtfsStatic={gtfsStatic}
          copiedFile={copiedFile}
          onCopyToClipboard={copyToClipboard}
        />
      )}

      {/* Subtab 4: GTFS Realtime Stream */}
      {activeSubTab === 'realtime' && (
        <GtfsRealtimePanel 
          gtfsRealtime={gtfsRealtime}
          copiedFile={copiedFile}
          onCopyToClipboard={copyToClipboard}
        />
      )}
    </div>
  )
}

export default GtfsIntegrationTab
