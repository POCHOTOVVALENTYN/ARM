import React from 'react'
import { DriverDuty } from '../../types'
import { useCrewRosterLogic } from '../../hooks/useCrewRosterLogic'
import { CrewRosterHeader } from '../crew/CrewRosterHeader'
import { CrewRosterStatsCards } from '../crew/CrewRosterStatsCards'
import { CrewRosterFilterBar } from '../crew/CrewRosterFilterBar'
import { CrewRosterTable } from '../crew/CrewRosterTable'

interface CrewRosterTabProps {
  duties?: DriverDuty[]
}

export const CrewRosterTab: React.FC<CrewRosterTabProps> = ({ duties = [] }) => {
  const {
    targetDate,
    setTargetDate,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    allDrivers,
    deployments,
    filteredItems,
    isDeploymentsLoading,
    isDriversLoading,
    handleRefresh,
    handleNavigateToAssignment
  } = useCrewRosterLogic({ duties })

  return (
    <div className="space-y-6 font-sans">
      <CrewRosterHeader 
        onRefresh={handleRefresh}
        onNavigateToAssignment={handleNavigateToAssignment}
      />

      <CrewRosterStatsCards 
        totalDriversCount={allDrivers.length}
        assignedCount={deployments.length}
        targetDate={targetDate}
      />

      <CrewRosterFilterBar 
        targetDate={targetDate}
        filterMode={filterMode}
        searchQuery={searchQuery}
        itemsCount={filteredItems.length}
        allDriversCount={allDrivers.length}
        onDateChange={setTargetDate}
        onFilterModeChange={setFilterMode}
        onSearchChange={setSearchQuery}
      />

      <CrewRosterTable 
        items={filteredItems}
        isLoading={isDeploymentsLoading || isDriversLoading}
      />
    </div>
  )
}

export default CrewRosterTab
