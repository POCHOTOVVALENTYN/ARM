import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../utils/apiClient'

export interface GanttTask {
  duty_id: string
  duty_number: number
  type: 'PULL_OUT' | 'TRIP' | 'LUNCH' | 'SHIFT_CHANGE' | 'PULL_IN'
  label: string
  start_min: number
  end_min: number
  start_time: string
  end_time: string
  color: string
}

export interface StaticScheduleKPI {
  route_id: string
  route_name: string
  route_type: string
  vehicles_count: number
  round_trip_min: number
  headway_min: number
  standard_break_min: number
  designated_break_hub: string
  total_duties_count: number
  total_daily_trips: number
  total_daily_km: number
}

export interface StaticScheduleResponse {
  kpi: StaticScheduleKPI
  columns: unknown[]
  gantt_tasks: GanttTask[]
}

const START_MIN = 300
const END_MIN = 1440
const TOTAL_SPAN = END_MIN - START_MIN

export const useDutyBuilderLogic = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('7')
  const [vehiclesCount, setVehiclesCount] = useState<number>(14)

  const { data, isLoading } = useQuery<StaticScheduleResponse>({
    queryKey: ['gantt-schedule', selectedRouteId, vehiclesCount],
    queryFn: async () => {
      const res = await apiClient.post('/api/v1/schedules/calculate-static', {
        route_id: selectedRouteId,
        vehicles_count: vehiclesCount,
        day_type: 'WORKDAY',
        start_time: '05:30',
        end_time: '23:30'
      })
      return res.data
    }
  })

  const ganttTasks = useMemo(() => data?.gantt_tasks || [], [data])
  const kpi = data?.kpi

  const { dutiesGrouped, dutyIds } = useMemo(() => {
    const grouped: Record<string, GanttTask[]> = {}
    ganttTasks.forEach((t) => {
      if (!grouped[t.duty_id]) {
        grouped[t.duty_id] = []
      }
      grouped[t.duty_id].push(t)
    })
    return {
      dutiesGrouped: grouped,
      dutyIds: Object.keys(grouped)
    }
  }, [ganttTasks])

  const hoursRuler = useMemo(() => {
    const ruler: number[] = []
    for (let h = 5; h <= 24; h++) {
      ruler.push(h)
    }
    return ruler
  }, [])

  const getPositionStyle = (startMin: number, endMin: number) => {
    const leftPct = Math.max(0, ((startMin - START_MIN) / TOTAL_SPAN) * 100)
    const widthPct = Math.max(0.5, ((endMin - startMin) / TOTAL_SPAN) * 100)
    return {
      left: `${leftPct}%`,
      width: `${widthPct}%`
    }
  }

  const handleRouteIdChange = (id: string) => {
    setSelectedRouteId(id)
  }

  const handleVehiclesCountChange = (count: number) => {
    setVehiclesCount(Math.max(1, count))
  }

  return {
    selectedRouteId,
    vehiclesCount,
    isLoading,
    kpi,
    dutiesGrouped,
    dutyIds,
    hoursRuler,
    START_MIN,
    TOTAL_SPAN,
    getPositionStyle,
    handleRouteIdChange,
    handleVehiclesCountChange
  }
}
