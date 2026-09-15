import React from 'react'
import { useControlPointsTripsLogic } from '../../hooks/useControlPointsTripsLogic'
import { ControlPointsToolbar } from '../planning/ControlPointsToolbar'
import { ControlPointsHourlyGrid } from '../planning/ControlPointsHourlyGrid'

export const ControlPointsTripsView: React.FC = () => {
  const {
    routes,
    selectedRouteId,
    setSelectedRouteId,
    selectedDirection,
    setSelectedDirection,
    passport,
    departuresStationA,
    departuresStationB,
    hours,
    getDeparturesForHour,
    handlePrint,
    handleNavigateToMatrix
  } = useControlPointsTripsLogic()

  return (
    <div className="space-y-6 font-sans">
      <ControlPointsToolbar
        routes={routes}
        selectedRouteId={selectedRouteId}
        selectedDirection={selectedDirection}
        onSelectRouteId={setSelectedRouteId}
        onSelectDirection={setSelectedDirection}
        onNavigateToMatrix={handleNavigateToMatrix}
        onPrint={handlePrint}
      />

      <ControlPointsHourlyGrid
        selectedDirection={selectedDirection}
        stationAName={passport?.station_a_name || 'Станція А'}
        stationBName={passport?.station_b_name || 'Станція Б'}
        departuresStationA={departuresStationA}
        departuresStationB={departuresStationB}
        hours={hours}
        getDeparturesForHour={getDeparturesForHour}
      />
    </div>
  )
}

export default ControlPointsTripsView
