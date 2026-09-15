import React, { useMemo } from 'react'
import { useDeadheadOptimizerLogic } from '../../hooks/useDeadheadOptimizerLogic'
import { DeadheadOptimizerHeader } from '../planning/DeadheadOptimizerHeader'
import { DeadheadOptimizerKpis } from '../planning/DeadheadOptimizerKpis'
import { DeadheadOptimizerTabs } from '../planning/DeadheadOptimizerTabs'
import { DeadheadRoutesTable } from '../planning/DeadheadRoutesTable'
import { DeadheadMatrixTable } from '../planning/DeadheadMatrixTable'
import { DeadheadCalculator } from '../planning/DeadheadCalculator'

export const DeadheadOptimizerView: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    suboptimalOnly,
    setSuboptimalOnly,
    expandedRouteId,
    handleToggleRoute,
    calcDepotId,
    setCalcDepotId,
    calcTerminal,
    setCalcTerminal,
    calcType,
    setCalcType,
    calcResult,
    isCalculating,
    handleCalculateSingle,
    matrixDepotFilter,
    setMatrixDepotFilter,
    matrixSearch,
    setMatrixSearch,
    isNetworkLoading,
    isNetworkFetching,
    refetchNetwork,
    matrixData,
    filteredRoutes,
    filteredMatrix,
    summary,
    isApplyPending,
    handleApplyOptimization
  } = useDeadheadOptimizerLogic()

  const terminalOptions = useMemo(() => {
    if (!matrixData?.matrix) {
      return [
        'Станція «Аркадія»',
        'вул. Паустовського',
        'Куликове поле',
        'пл. Старосінна',
        'Парк ім. Тараса Шевченка'
      ]
    }
    return Array.from(new Set(matrixData.matrix.map((m) => m.terminal_name)))
  }, [matrixData?.matrix])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans" role="region" aria-label="Оптимізатор нульових рейсів">
      <DeadheadOptimizerHeader
        isFetching={isNetworkFetching}
        isLoading={isNetworkLoading}
        isApplyPending={isApplyPending}
        onRefetch={refetchNetwork}
        onApplyOptimization={handleApplyOptimization}
      />

      <DeadheadOptimizerKpis summary={summary} />

      <DeadheadOptimizerTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        routesCount={filteredRoutes.length}
        suboptimalCount={summary?.suboptimal_routes_count || 0}
        matrixRecordsCount={matrixData?.records_count || 0}
      />

      {activeTab === 'routes' && (
        <DeadheadRoutesTable
          searchQuery={searchQuery}
          typeFilter={typeFilter}
          suboptimalOnly={suboptimalOnly}
          expandedRouteId={expandedRouteId}
          filteredRoutes={filteredRoutes}
          onSearchChange={setSearchQuery}
          onTypeFilterChange={setTypeFilter}
          onSuboptimalOnlyChange={setSuboptimalOnly}
          onToggleRoute={handleToggleRoute}
        />
      )}

      {activeTab === 'matrix' && (
        <DeadheadMatrixTable
          matrixSearch={matrixSearch}
          matrixDepotFilter={matrixDepotFilter}
          filteredMatrix={filteredMatrix}
          onSearchChange={setMatrixSearch}
          onDepotFilterChange={setMatrixDepotFilter}
        />
      )}

      {activeTab === 'calculator' && (
        <DeadheadCalculator
          calcDepotId={calcDepotId}
          calcTerminal={calcTerminal}
          calcType={calcType}
          calcResult={calcResult}
          isCalculating={isCalculating}
          terminalOptions={terminalOptions}
          onDepotChange={setCalcDepotId}
          onTerminalChange={setCalcTerminal}
          onTypeChange={setCalcType}
          onCalculate={handleCalculateSingle}
        />
      )}
    </div>
  )
}

export default DeadheadOptimizerView

