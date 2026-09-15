import { useState, useMemo } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { MasterGridRow, Route } from '../types'

export interface DepartureItem {
  time: string
  dutyNumber: number | string
  roundNumber: number
  tag?: string
}

export type DirectionType = 'both' | 'direct' | 'reverse'

export const useControlPointsTripsLogic = () => {
  const { routes } = useRouteStore()
  const { masterScheduleData, setPath } = useScheduleStore()

  const [selectedRouteId, setSelectedRouteId] = useState<string>('7')
  const [selectedDirection, setSelectedDirection] = useState<DirectionType>('both')

  const currentRoute: Route = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0] || {
      id: '7',
      number: '7',
      name: 'вул. Паустовського — 16-та ст. Люстдорфської дороги',
      type: 'tram',
      length_km: 33.2,
      default_speed_kmh: 16.5,
      status: 'active',
      segments: []
    }
  }, [routes, selectedRouteId])

  const passport = masterScheduleData?.summary_passport
  const rows: MasterGridRow[] = useMemo(() => {
    return masterScheduleData?.master_grid_rows || []
  }, [masterScheduleData])

  const { departuresStationA, departuresStationB } = useMemo(() => {
    const listA: DepartureItem[] = []
    const listB: DepartureItem[] = []

    rows.forEach((r) => {
      r.rounds?.forEach((rd) => {
        if (rd.departure_station_a && rd.departure_station_a !== '—') {
          listA.push({
            time: rd.departure_station_a,
            dutyNumber: r.duty_number,
            roundNumber: rd.round_number,
            tag: rd.tag
          })
        }
        if (rd.departure_station_b && rd.departure_station_b !== '—') {
          listB.push({
            time: rd.departure_station_b,
            dutyNumber: r.duty_number,
            roundNumber: rd.round_number,
            tag: rd.tag
          })
        }
      })
    })

    listA.sort((a, b) => a.time.localeCompare(b.time))
    listB.sort((a, b) => a.time.localeCompare(b.time))

    return { departuresStationA: listA, departuresStationB: listB }
  }, [rows])

  const hours = useMemo(() => Array.from({ length: 19 }, (_, i) => i + 5), [])

  const getDeparturesForHour = (list: DepartureItem[], hour: number) => {
    const prefix = hour.toString().padStart(2, '0') + ':'
    return list.filter((item) => item.time.startsWith(prefix))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleNavigateToMatrix = () => {
    setPath('/planning/matrix')
  }

  return {
    routes,
    selectedRouteId,
    setSelectedRouteId,
    selectedDirection,
    setSelectedDirection,
    currentRoute,
    passport,
    departuresStationA,
    departuresStationB,
    hours,
    getDeparturesForHour,
    handlePrint,
    handleNavigateToMatrix
  }
}
