import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useTripGridLogic } from '../../hooks/useTripGridLogic'
import { useScheduleStore } from '../../store/useScheduleStore'
import { TripGridToolbar } from '../planning/TripGridToolbar'
import { TripGridEmptyState } from '../planning/TripGridEmptyState'
import { TripGridTable } from '../planning/TripGridTable'
import { TripGridEditModal } from '../planning/TripGridEditModal'

export const TripGridView: React.FC = () => {
  const {
    routes,
    selectedRouteId,
    setSelectedRouteId,
    filterType,
    setFilterType,
    searchDuty,
    setSearchDuty,
    viewMode,
    setViewMode,
    currentRoute,
    hasActiveSchedule,
    passport,
    currentDepotName,
    currentDepotJunctionStop,
    allRows,
    filteredRows,
    maxRounds,
    roundIndices,
    headwayMap,
    totalAnomaliesCount,
    editingCell,
    sharedCorridors,
    handleStartEditCell,
    handleCancelEditCell,
    handleSaveCellTime,
    handlePrint,
    handleExportCsv,
    handleNavigateToParameters,
    handleNavigateToInterline
  } = useTripGridLogic()

  const masterScheduleError = useScheduleStore((s) => s.masterScheduleError)
  const setMasterScheduleError = useScheduleStore((s) => s.setMasterScheduleError)

  return (
    <div className="space-y-6 font-sans">
      {masterScheduleError && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-2xl text-rose-900 dark:text-rose-200"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="flex-1 text-sm font-semibold">{masterScheduleError}</div>
          <button
            type="button"
            onClick={() => setMasterScheduleError(null)}
            aria-label="Закрити попередження"
            tabIndex={0}
            className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <TripGridToolbar
        routes={routes}
        selectedRouteId={selectedRouteId}
        hasActiveSchedule={hasActiveSchedule}
        passport={passport}
        maxRounds={maxRounds}
        totalRowsCount={allRows.length}
        filterType={filterType}
        searchDuty={searchDuty}
        viewMode={viewMode}
        totalAnomaliesCount={totalAnomaliesCount}
        sharedCorridors={sharedCorridors}
        onSelectRouteId={setSelectedRouteId}
        onFilterTypeChange={setFilterType}
        onSearchDutyChange={setSearchDuty}
        onViewModeChange={setViewMode}
        onNavigateToParameters={handleNavigateToParameters}
        onNavigateToInterline={handleNavigateToInterline}
        onExportCsv={handleExportCsv}
        onPrint={handlePrint}
      />

      {!hasActiveSchedule ? (
        <TripGridEmptyState
          currentRoute={currentRoute}
          onNavigateToParameters={handleNavigateToParameters}
        />
      ) : (
        <TripGridTable
          currentRoute={currentRoute}
          passport={passport}
          currentDepotName={currentDepotName}
          currentDepotJunctionStop={currentDepotJunctionStop}
          filteredRows={filteredRows}
          roundIndices={roundIndices}
          viewMode={viewMode}
          headwayMap={headwayMap}
          sharedCorridors={sharedCorridors}
          onNavigateToInterline={handleNavigateToInterline}
          onStartEditCell={handleStartEditCell}
        />
      )}

      {editingCell && (
        <TripGridEditModal
          isOpen={Boolean(editingCell)}
          dutyNumber={editingCell.dutyNumber}
          roundNumber={editingCell.roundNumber}
          stationName={editingCell.stationName}
          initialTime={editingCell.currentTime}
          onSave={handleSaveCellTime}
          onClose={handleCancelEditCell}
        />
      )}
    </div>
  )
}

export default TripGridView
