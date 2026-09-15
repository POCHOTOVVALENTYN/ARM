import React from 'react'
import { useCrewAssignmentLogic } from '../../hooks/useCrewAssignmentLogic'
import { CrewAssignmentHeader } from '../crew/CrewAssignmentHeader'
import { CrewAssignmentDutyList } from '../crew/CrewAssignmentDutyList'
import { CrewAssignmentForm } from '../crew/CrewAssignmentForm'

export const CrewAssignmentView: React.FC = () => {
  const {
    targetDate,
    setTargetDate,
    selectedDuty,
    setSelectedDuty,
    vehicleId,
    setVehicleId,
    driverName,
    setDriverName,
    dutiesToDisplay,
    isDutiesLoading,
    isPending,
    selectedDutyObject,
    isAssigned,
    getAssignedInfo,
    handleAssign
  } = useCrewAssignmentLogic()

  return (
    <div className="space-y-4 font-sans max-w-7xl mx-auto">
      <CrewAssignmentHeader 
        targetDate={targetDate} 
        onDateChange={setTargetDate} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CrewAssignmentDutyList 
          targetDate={targetDate}
          duties={dutiesToDisplay}
          isLoading={isDutiesLoading}
          selectedDuty={selectedDuty}
          onSelectDuty={setSelectedDuty}
          isAssigned={isAssigned}
          getAssignedInfo={getAssignedInfo}
        />

        <CrewAssignmentForm 
          selectedDutyObject={selectedDutyObject}
          selectedDuty={selectedDuty}
          vehicleId={vehicleId}
          driverName={driverName}
          isPending={isPending}
          onVehicleIdChange={setVehicleId}
          onDriverNameChange={setDriverName}
          onSubmit={handleAssign}
        />
      </div>
    </div>
  )
}

export default CrewAssignmentView
