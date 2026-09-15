import { useMemo, useRef, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import * as d3 from 'd3'
import { api } from '../utils/apiClient'
import { useRouteStore } from '../store/useRouteStore'
import { useStationStore } from '../store/useStationStore'
import { Route, Station } from '../types'

export interface Stop {
  id: string
  name: string
  distance_from_start: number
}

export interface TripEvent {
  stop_id: string
  timestamp: number
  is_actual: boolean
}

export interface MareyTrip {
  id: string
  duty_number: string
  vehicle_id: string
  events: TripEvent[]
}

export interface ScheduleStopTime {
  stop_id: string | number
  arrival_time?: string | null
  departure_time?: string | null
}

export interface ScheduleTrip {
  id?: string | number
  trip_sequence?: number
  stop_times?: ScheduleStopTime[]
}

export interface ScheduleShift {
  id?: string | number
  shift_number?: number
  trips?: ScheduleTrip[]
}

export interface ScheduleDuty {
  duty_number: string
  shifts?: ScheduleShift[]
}

export interface ActiveScheduleData {
  id: number
  route_id: string
  active_date?: string
  duties?: ScheduleDuty[]
}

interface UseMareyDiagramLogicParams {
  width?: number
  height?: number
  routeId?: string
}

export const useMareyDiagramLogic = ({
  width = 1200,
  height = 700,
  routeId = '7'
}: UseMareyDiagramLogicParams = {}) => {
  const routesFromStore = useRouteStore((state) => state.routes)
  const stationsFromStore = useStationStore((state) => state.stations)

  const [selectedRoute, setSelectedRoute] = useState<string>(routeId)

  // 1. Отримуємо актуальні маршрути з БД
  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['marey-routes-list'],
    queryFn: async () => {
      const res = await api.get<Route[]>('/routes')
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
      return routesFromStore
    },
    staleTime: 60000
  })

  // 2. Отримуємо довідник зупинок для точних назв
  const { data: stations = [] } = useQuery<Station[]>({
    queryKey: ['marey-stations-map'],
    queryFn: async () => {
      const res = await api.get<Station[]>('/stations')
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data
      }
      return stationsFromStore
    },
    staleTime: 60000
  })

  const stationsMap = useMemo(() => {
    const map = new Map<string, string>()
    stations.forEach((s) => {
      map.set(String(s.id), s.name)
    })
    return map
  }, [stations])

  // 3. Завантажуємо активний розклад обраного маршруту з бекенду
  const { data: schedules = [], isLoading } = useQuery<ActiveScheduleData[]>({
    queryKey: ['active-schedules-marey', selectedRoute],
    queryFn: async () => {
      const { data } = await api.get<ActiveScheduleData[]>(`/schedules/active?route_id=${selectedRoute}`)
      if (Array.isArray(data)) {
        return data
      }
      return []
    },
    staleTime: 30000
  })

  const activeSchedule = useMemo(() => {
    if (schedules.length > 0) {
      return schedules[0]
    }
    return null
  }, [schedules])

  // Зупинки маршруту з реального розкладу
  const stops: Stop[] = useMemo(() => {
    if (!activeSchedule?.duties || activeSchedule.duties.length === 0) {
      return [
        { id: 'st_start', name: 'Початкова станція', distance_from_start: 0 },
        { id: 'st_end', name: 'Кінцева станція', distance_from_start: 12.0 }
      ]
    }

    const extractedStops: Stop[] = []
    const seenStopIds = new Set<string>()

    activeSchedule.duties.forEach((duty) => {
      ;(duty.shifts || []).forEach((shift) => {
        ;(shift.trips || []).forEach((trip) => {
          ;(trip.stop_times || []).forEach((st) => {
            const sid = String(st.stop_id)
            if (!seenStopIds.has(sid)) {
              seenStopIds.add(sid)
              const realName = stationsMap.get(sid) || sid.replace('st_', '').replace(/_/g, ' ')
              extractedStops.push({
                id: sid,
                name: realName,
                distance_from_start: extractedStops.length * 1.5
              })
            }
          })
        })
      })
    })

    if (extractedStops.length > 0) {
      return extractedStops
    }

    return [
      { id: 'st_start', name: 'Початкова станція', distance_from_start: 0 },
      { id: 'st_end', name: 'Кінцева станція', distance_from_start: 12.0 }
    ]
  }, [activeSchedule, stationsMap])

  // Парсимо рейси у графік Марея
  const trips: MareyTrip[] = useMemo(() => {
    if (!activeSchedule?.duties) {
      return []
    }

    const todayDate = new Date()
    const baseMidnight = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime() / 1000

    const result: MareyTrip[] = []

    activeSchedule.duties.forEach((duty) => {
      const shifts = duty.shifts || []
      shifts.forEach((shift) => {
        const shiftTrips = shift.trips || []
        shiftTrips.forEach((trip) => {
          const events: TripEvent[] = []
          const stopTimes = trip.stop_times || []
          stopTimes.forEach((st) => {
            if (st.arrival_time) {
              const parts = String(st.arrival_time).split('.')[0].split(':')
              const h = parseInt(parts[0], 10) || 0
              const m = parseInt(parts[1], 10) || 0
              const s = parseInt(parts[2], 10) || 0
              const timestamp = baseMidnight + (h * 3600 + m * 60 + s)

              events.push({
                stop_id: String(st.stop_id),
                timestamp,
                is_actual: false
              })
            }
          })

          if (events.length > 0) {
            result.push({
              id: `trip_${trip.id || trip.trip_sequence || result.length + 1}`,
              duty_number: duty.duty_number,
              vehicle_id: duty.duty_number,
              events
            })
          }
        })
      })
    })

    return result
  }, [activeSchedule])

  const xAxisRef = useRef<SVGGElement>(null)
  const yAxisRef = useRef<SVGGElement>(null)

  const margin = useMemo(() => ({ top: 40, right: 40, bottom: 60, left: 180 }), [])
  const innerWidth = Math.max(600, width - margin.left - margin.right)
  const innerHeight = Math.max(400, height - margin.top - margin.bottom)

  const { xScale, yScale, lineGenerator, nowSec } = useMemo(() => {
    const allTimes = trips.flatMap((t) => t.events.map((e) => e.timestamp))
    const currentNowSec = Date.now() / 1000
    const minTime = allTimes.length > 0 ? Math.min(...allTimes) : currentNowSec - 3600
    const maxTime = allTimes.length > 0 ? Math.max(...allTimes) : currentNowSec + 3600 * 5

    const scaleX = d3.scaleTime()
      .domain([new Date(minTime * 1000), new Date(maxTime * 1000)])
      .range([0, innerWidth])

    const maxDist = d3.max<Stop, number>(stops, (s) => s.distance_from_start) || 12
    const scaleY = d3.scaleLinear()
      .domain([0, maxDist])
      .range([0, innerHeight])

    const generator = d3.line<TripEvent>()
      .x((d) => scaleX(new Date(d.timestamp * 1000)))
      .y((d) => {
        const stop = stops.find((s) => s.id === d.stop_id)
        return scaleY(stop ? stop.distance_from_start : 0)
      })
      .curve(d3.curveLinear)

    return { xScale: scaleX, yScale: scaleY, lineGenerator: generator, nowSec: currentNowSec }
  }, [stops, trips, innerWidth, innerHeight])

  const isDarkTheme = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  useEffect(() => {
    const textColor = isDarkTheme ? '#94A3B8' : '#475569'
    const boldTextColor = isDarkTheme ? '#E2E8F0' : '#1E293B'

    if (xAxisRef.current) {
      const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeMinute.every(30))
        .tickFormat((d) => d3.timeFormat('%H:%M')(d as Date))
      
      const g = d3.select(xAxisRef.current)
      g.selectAll('*').remove()
      g.call(xAxis)
        .selectAll('text')
        .style('font-size', '11px')
        .style('font-family', 'monospace')
        .style('font-weight', 'bold')
        .style('fill', textColor)
    }

    if (yAxisRef.current) {
      const yAxis = d3.axisLeft(yScale)
        .tickValues(stops.map((s) => s.distance_from_start))
        .tickFormat((d) => {
          const stop = stops.find((s) => s.distance_from_start === d)
          if (stop) {
            return stop.name
          }
          return ''
        })

      const g = d3.select(yAxisRef.current)
      g.selectAll('*').remove()
      g.call(yAxis)
        .selectAll('text')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .style('fill', boldTextColor)
    }
  }, [xScale, yScale, stops, isDarkTheme])

  const nowX = xScale(new Date(nowSec * 1000))
  const isNowVisible = nowX >= 0 && nowX <= innerWidth

  const handleRouteChange = (newRouteId: string) => {
    setSelectedRoute(newRouteId)
  }

  return {
    routes,
    selectedRoute,
    handleRouteChange,
    isLoading,
    stops,
    trips,
    width,
    height,
    margin,
    innerWidth,
    innerHeight,
    xAxisRef,
    yAxisRef,
    xScale,
    yScale,
    lineGenerator,
    nowX,
    nowSec,
    isNowVisible,
    isDarkTheme
  }
}
