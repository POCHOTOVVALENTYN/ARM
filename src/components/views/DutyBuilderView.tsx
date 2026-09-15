import React from 'react'
import { useDutyBuilderLogic } from '../../hooks/useDutyBuilderLogic'
import { DutyBuilderGanttToolbar } from '../planning/DutyBuilderGanttToolbar'
import { DutyBuilderGanttTimeline } from '../planning/DutyBuilderGanttTimeline'

export const DutyBuilderView: React.FC = () => {
  const {
    selectedRouteId,
    vehiclesCount,
    kpi,
    dutiesGrouped,
    dutyIds,
    hoursRuler,
    START_MIN,
    TOTAL_SPAN,
    getPositionStyle,
    handleRouteIdChange,
    handleVehiclesCountChange
  } = useDutyBuilderLogic()

  return (
    <div className="space-y-4 font-sans">
      <DutyBuilderGanttToolbar
        selectedRouteId={selectedRouteId}
        vehiclesCount={vehiclesCount}
        kpi={kpi}
        onRouteIdChange={handleRouteIdChange}
        onVehiclesCountChange={handleVehiclesCountChange}
      />

      <DutyBuilderGanttTimeline
        dutyIds={dutyIds}
        dutiesGrouped={dutiesGrouped}
        hoursRuler={hoursRuler}
        startMin={START_MIN}
        totalSpan={TOTAL_SPAN}
        getPositionStyle={getPositionStyle}
      />
    </div>
  )
}

export default DutyBuilderView
