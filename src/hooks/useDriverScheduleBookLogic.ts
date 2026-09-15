import { useState, useEffect, useMemo } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { useScheduleStore, ODESSA_DEFAULT_ROUTES } from '../store/useScheduleStore'
import { DutyBook, Route } from '../types'

export const useDriverScheduleBookLogic = () => {
  const routesFromStore = useRouteStore((state) => state.routes)
  const routes: Route[] = routesFromStore && routesFromStore.length > 0 ? routesFromStore : ODESSA_DEFAULT_ROUTES
  const { 
    masterScheduleData, 
    generateMasterSchedule, 
    activeDutyNumber, 
    setActiveDutyNumber,
    isProcessingTransaction 
  } = useScheduleStore()

  const [selectedRouteId, setSelectedRouteId] = useState<string>('7')
  const [printMode, setPrintMode] = useState<'single' | 'batch'>('single')

  const currentRoute: Route = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0] || {
      id: '7',
      number: '7',
      name: 'вул. Паустовського — 16-та ст. Люстдорфської дороги',
      type: 'tram',
      status: 'active',
      length_km: 33.2,
      default_speed_kmh: 16.5,
      segments: []
    }
  }, [routes, selectedRouteId])

  useEffect(() => {
    if (!masterScheduleData || masterScheduleData.summary_passport?.route_id !== selectedRouteId) {
      const isTrolley = currentRoute.type === 'trolleybus'
      const t0 = (currentRoute as unknown as { t_dir0_min?: number }).t_dir0_min || 40
      const t1 = (currentRoute as unknown as { t_dir1_min?: number }).t_dir1_min || 40
      const roundTrip = t0 + t1 + 10
      const payload = {
        route_id: selectedRouteId,
        route_name: currentRoute.name,
        transport_type: isTrolley ? 'TROLLEYBUS' : 'TRAM',
        duties_count: (currentRoute as unknown as { duties_count?: number }).duties_count || (selectedRouteId === '7' ? 16 : selectedRouteId === '18' ? 8 : 10),
        round_trip_min: roundTrip,
        route_length_km: currentRoute.length_km || 17.9,
        default_speed_kmh: currentRoute.default_speed_kmh || 14.5,
        depot_name: isTrolley ? 'ТрД-3' : (selectedRouteId === '7' ? 'ТД-2' : 'ТД-1'),
        depot_junction_stop_name: (currentRoute as unknown as { station_a_name?: string }).station_a_name || 'Станція А'
      }
      generateMasterSchedule(payload)
    }
  }, [selectedRouteId, currentRoute, masterScheduleData, generateMasterSchedule])

  const dutyBooksDict = masterScheduleData?.duty_books || {}
  const dutyNumbers = Object.keys(dutyBooksDict)

  const activeDutyId = activeDutyNumber && dutyBooksDict[activeDutyNumber] 
    ? activeDutyNumber 
    : dutyNumbers[0] || `${selectedRouteId}-01`

  const currentDutyBook: DutyBook | undefined = dutyBooksDict[activeDutyId]

  const handlePrintSingle = () => {
    setPrintMode('single')
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handlePrintBatch = () => {
    setPrintMode('batch')
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId)
  }

  const handleSelectDuty = (dutyNum: string) => {
    setActiveDutyNumber(dutyNum)
  }

  return {
    routes,
    selectedRouteId,
    currentRoute,
    printMode,
    dutyNumbers,
    activeDutyId,
    currentDutyBook,
    dutyBooksDict,
    isProcessingTransaction,
    handlePrintSingle,
    handlePrintBatch,
    handleSelectRoute,
    handleSelectDuty
  }
}
