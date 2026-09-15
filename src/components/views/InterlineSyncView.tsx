import React from 'react'
import { useInterlineSyncLogic } from '../../hooks/useInterlineSyncLogic'
import { InterlineSyncToolbar } from '../planning/InterlineSyncToolbar'
import { InterlineSyncRules } from '../planning/InterlineSyncRules'
import { InterlineCorridorCards } from '../planning/InterlineCorridorCards'
import { InterlineRoutePairPanel } from '../planning/InterlineRoutePairPanel'
import { InterlineTimelineModal } from '../planning/InterlineTimelineModal'

export const InterlineSyncView: React.FC = () => {
  const {
    routes,
    transportType,
    syncMode,
    minHeadway,
    selectedRouteA,
    selectedRouteB,
    corridors,
    isLoadingCorridors,
    pairCheckData,
    isLoadingCheck,
    isSyncing,
    totalConflicts,
    timelineModal,
    handleTransportTypeChange,
    handleSyncModeChange,
    handleMinHeadwayChange,
    handleSelectRouteA,
    handleSelectRouteB,
    handleApplySync,
    handleOpenPairTimeline,
    handleOpenCorridorTimeline,
    handleCloseTimeline,
    handleNavigateToBuilder
  } = useInterlineSyncLogic()

  return (
    <div
      className="space-y-4 font-sans max-w-7xl mx-auto"
      role="region"
      aria-label="Синхронізація суміщених ділянок «Зв'язок»"
    >
      {/* 1. Головна панель керування */}
      <InterlineSyncToolbar
        transportType={transportType}
        syncMode={syncMode}
        isPending={isSyncing}
        minHeadway={minHeadway}
        totalConflicts={totalConflicts}
        onTransportTypeChange={handleTransportTypeChange}
        onSyncModeChange={handleSyncModeChange}
        onMinHeadwayChange={handleMinHeadwayChange}
        onRunSync={() => handleApplySync()}
      />

      {/* 2. Контент відповідно до обраного режиму */}
      {syncMode === 'CORRIDORS' ? (
        <>
          <InterlineSyncRules
            minHeadway={minHeadway}
            onMinHeadwayChange={handleMinHeadwayChange}
          />

          <InterlineCorridorCards
            corridors={corridors}
            transportType={transportType}
            isLoading={isLoadingCorridors}
            onSyncCorridor={handleApplySync}
            onOpenTimeline={handleOpenCorridorTimeline}
            onNavigateToBuilder={handleNavigateToBuilder}
          />
        </>
      ) : (
        <InterlineRoutePairPanel
          routes={routes}
          transportType={transportType}
          routeAId={selectedRouteA}
          routeBId={selectedRouteB}
          pairCheckData={pairCheckData}
          isLoadingCheck={isLoadingCheck}
          isSyncing={isSyncing}
          minHeadway={minHeadway}
          onSelectRouteA={handleSelectRouteA}
          onSelectRouteB={handleSelectRouteB}
          onApplySync={handleApplySync}
          onOpenTimeline={handleOpenPairTimeline}
          onNavigateToBuilder={handleNavigateToBuilder}
        />
      )}

      {/* 3. Модальне вікно похвилинної стрічки руху вузла */}
      <InterlineTimelineModal
        isOpen={timelineModal.isOpen}
        title={timelineModal.title}
        hubStopName={timelineModal.hubStopName}
        minHeadway={timelineModal.minHeadway}
        conflictsCount={timelineModal.conflictsCount}
        passages={timelineModal.passages}
        isSyncing={isSyncing}
        onClose={handleCloseTimeline}
        onApplySync={() => handleApplySync(timelineModal.routeIds)}
      />
    </div>
  )
}

export default InterlineSyncView
