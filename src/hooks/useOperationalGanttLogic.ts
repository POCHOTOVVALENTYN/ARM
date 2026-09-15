import { useState, useMemo, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../utils/apiClient'
import { useRouteStore } from '../store/useRouteStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useTelemetryStore } from '../store/useTelemetryStore'
import { Route } from '../types'

export interface OperationalTask {
  id: string
  duty_number: string | number
  vehicle_id: string
  driver_name: string
  type: 'TRIP' | 'LUNCH' | 'SHORT_TURN' | 'PULL_OUT' | 'PULL_IN'
  label: string
  start_min: number // minutes from 05:00
  duration_min: number
  color: string
  is_active_detour?: boolean
  deviation_min?: number
  startTimeStr?: string
  endTimeStr?: string
}

export interface ActiveDetourItem {
  id: number
  vehicle_id: string
  route_id: string
  reason: string
  target_loop?: string
  new_path_description: string
}

export interface GanttDutyGroup {
  dutyNum: string
  vehicleId: string
  driverName: string
  tasks: OperationalTask[]
}

export interface GanttMetrics {
  totalDuties: number
  totalTrips: number
  totalBreaks: number
  totalAlerts: number
}

export type TaskFilterType = 'ALL' | 'TRIP' | 'LUNCH' | 'ALERT'

export const BASE_START_MIN = 5 * 60 // 05:00
export const TOTAL_SPAN_MIN = 18 * 60 // 05:00 to 23:00 (1080 min)

export const parseTimeToMinutes = (timeStr?: string | null): number => {
  if (!timeStr) return 0
  const clean = String(timeStr).split('.')[0]
  const parts = clean.split(':')
  const h = parseInt(parts[0], 10) || 0
  const m = parseInt(parts[1], 10) || 0
  return h * 60 + m
}

export const formatMinutesToTime = (minFromMidnight: number): string => {
  const h = Math.floor(minFromMidnight / 60) % 24
  const m = minFromMidnight % 60
  return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`
}

export const useOperationalGanttLogic = () => {
  const routesFromStore = useRouteStore(useShallow((s) => s.routes || []))
  const setPath = useScheduleStore((s) => s.setPath)
  const vehiclesTelemetry = useTelemetryStore(useShallow((s) => s.vehicles || {}))

  // Поточний системний час у хвилинах від півночі (для лінії Now)
  const [currentMinutesFromMidnight, setCurrentMinutesFromMidnight] = useState<number>(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentMinutesFromMidnight(now.getHours() * 60 + now.getMinutes())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // 1. Маршрути
  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['gantt-routes-list'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/routes')
      return Array.isArray(res.data) && res.data.length > 0 ? res.data : routesFromStore
    },
    staleTime: 60000
  })

  const [selectedRouteId, setSelectedRouteId] = useState<string>('7')
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>('ALL')
  const [searchDuty, setSearchDuty] = useState<string>('')
  const [inspectedTask, setInspectedTask] = useState<OperationalTask | null>(null)

  // 2. Активний добовий розклад
  const { 
    data: schedules = [], 
    isLoading: isScheduleLoading, 
    refetch: refetchSchedule 
  } = useQuery({
    queryKey: ['operational-gantt-schedule', selectedRouteId],
    queryFn: async () => {
      const res = await apiClient.get(`/schedules/active?route_id=${selectedRouteId}`)
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 30000
  })

  // 3. Оперативні розвороти
  const { data: activeDetours = [] } = useQuery<ActiveDetourItem[]>({
    queryKey: ['gantt-active-detours'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/emergencies/detours/active')
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 10000,
    refetchInterval: 10000
  })

  const activeSchedule = schedules.length > 0 ? schedules[0] : null
  const hoursMarks = useMemo(() => Array.from({ length: 19 }, (_, i) => i + 5), [])

  // Трансформація нарядів та завдань
  const ganttTasks: OperationalTask[] = useMemo(() => {
    if (!activeSchedule || !activeSchedule.duties || activeSchedule.duties.length === 0) {
      return []
    }

    const tasks: OperationalTask[] = []
    const detoursMap = new Map<string, ActiveDetourItem>()
    activeDetours.forEach((d) => detoursMap.set(String(d.vehicle_id), d))

    activeSchedule.duties.forEach((duty: any, dIdx: number) => {
      const dutyNum = duty.duty_number || `${dIdx + 1}`
      const fallbackVehId = String(4000 + dIdx + 1)
      let currentVehId = fallbackVehId

      const firstShift = duty.shifts?.[0]
      if (firstShift?.vehicle_id) {
        currentVehId = String(firstShift.vehicle_id)
      }

      const telData = vehiclesTelemetry[currentVehId]
      const liveDeviation = telData?.deviation_min ?? 0
      const activeDetour = detoursMap.get(currentVehId)

      ;(duty.shifts || []).forEach((shift: any, sIdx: number) => {
        // Обід / перерва
        if (shift.has_break && shift.break_start_time) {
          const breakMin = parseTimeToMinutes(shift.break_start_time)
          const startFromBase = Math.max(0, breakMin - BASE_START_MIN)
          const duration = shift.break_duration_minutes || 20

          tasks.push({
            id: `break-${dutyNum}-${sIdx}`,
            duty_number: dutyNum,
            vehicle_id: currentVehId,
            driver_name: shift.driver_name || `Водій наряду №${dutyNum}`,
            type: 'LUNCH',
            label: `☕ Технологічна перерва (${duration} хв)`,
            start_min: startFromBase,
            duration_min: duration,
            color: '#f59e0b',
            startTimeStr: formatMinutesToTime(breakMin),
            endTimeStr: formatMinutesToTime(breakMin + duration)
          })
        }

        // Рейси
        ;(shift.trips || []).forEach((trip: any, tIdx: number) => {
          const stopTimes = trip.stop_times || []
          if (stopTimes.length === 0) return

          const firstStop = stopTimes[0]
          const lastStop = stopTimes[stopTimes.length - 1]

          const tripStartMin = parseTimeToMinutes(firstStop.departure_time || firstStop.arrival_time)
          const tripEndMin = parseTimeToMinutes(lastStop.arrival_time || lastStop.departure_time)

          let startFromBase = tripStartMin - BASE_START_MIN
          const duration = Math.max(15, tripEndMin - tripStartMin)

          if (startFromBase < 0) {
            startFromBase = 0
          }

          const isZero = trip.is_zero_run || trip.trip_type === 'PULL_OUT' || trip.trip_type === 'PULL_IN'
          let taskType: OperationalTask['type'] = 'TRIP'
          let label = `Рейс №${trip.trip_sequence || tIdx + 1}`
          let color = '#10b981'

          if (trip.trip_type === 'PULL_OUT' || (isZero && tIdx === 0)) {
            taskType = 'PULL_OUT'
            label = '🚩 Нульовий виїзд'
            color = '#4f46e5'
          } else if (trip.trip_type === 'PULL_IN' || (isZero && tIdx > 0)) {
            taskType = 'PULL_IN'
            label = '🏁 Заїзд у депо'
            color = '#6366f1'
          } else if (activeDetour) {
            taskType = 'SHORT_TURN'
            label = `🌀 Розворот: ${activeDetour.target_loop || activeDetour.reason}`
            color = '#ef4444'
          } else if (liveDeviation > 3.0) {
            color = '#e11d48'
          }

          tasks.push({
            id: `trip-${dutyNum}-${sIdx}-${tIdx}`,
            duty_number: dutyNum,
            vehicle_id: currentVehId,
            driver_name: shift.driver_name || `Водій наряду №${dutyNum}`,
            type: taskType,
            label,
            start_min: startFromBase,
            duration_min: duration,
            color,
            is_active_detour: Boolean(activeDetour),
            deviation_min: liveDeviation,
            startTimeStr: formatMinutesToTime(tripStartMin),
            endTimeStr: formatMinutesToTime(tripEndMin)
          })
        })
      })
    })

    return tasks
  }, [activeSchedule, activeDetours, vehiclesTelemetry])

  // Позиція поточної лінії Now
  const currentTimelineOffsetPercent = useMemo(() => {
    const diff = currentMinutesFromMidnight - BASE_START_MIN
    if (diff < 0 || diff > TOTAL_SPAN_MIN) return null
    return (diff / TOTAL_SPAN_MIN) * 100
  }, [currentMinutesFromMidnight])

  const currentTimeDisplay = useMemo(() => {
    return formatMinutesToTime(currentMinutesFromMidnight)
  }, [currentMinutesFromMidnight])

  // Зведені показники HUD
  const metrics: GanttMetrics = useMemo(() => {
    const totalDuties = new Set(ganttTasks.map((t) => t.duty_number)).size
    const totalTrips = ganttTasks.filter((t) => t.type === 'TRIP' || t.type === 'PULL_OUT' || t.type === 'PULL_IN').length
    const totalBreaks = ganttTasks.filter((t) => t.type === 'LUNCH').length
    const totalAlerts = ganttTasks.filter((t) => t.is_active_detour || (t.deviation_min && t.deviation_min > 3.0)).length

    return { totalDuties, totalTrips, totalBreaks, totalAlerts }
  }, [ganttTasks])

  // Фільтрація та групування за нарядами
  const groupedDuties: GanttDutyGroup[] = useMemo(() => {
    const query = searchDuty.trim().toLowerCase()

    const filtered = ganttTasks.filter((t) => {
      if (taskFilter === 'TRIP' && t.type !== 'TRIP' && t.type !== 'PULL_OUT' && t.type !== 'PULL_IN') return false
      if (taskFilter === 'LUNCH' && t.type !== 'LUNCH') return false
      if (taskFilter === 'ALERT' && !t.is_active_detour && (!t.deviation_min || t.deviation_min <= 3.0)) return false

      if (!query) return true

      const dutyMatch = String(t.duty_number).toLowerCase().includes(query)
      const vehMatch = String(t.vehicle_id).toLowerCase().includes(query)
      const driverMatch = String(t.driver_name).toLowerCase().includes(query)
      return dutyMatch || vehMatch || driverMatch
    })

    const groupsMap = new Map<string, GanttDutyGroup>()

    filtered.forEach((task) => {
      const dKey = String(task.duty_number)
      if (!groupsMap.has(dKey)) {
        groupsMap.set(dKey, {
          dutyNum: dKey,
          vehicleId: task.vehicle_id,
          driverName: task.driver_name,
          tasks: []
        })
      }
      groupsMap.get(dKey)!.tasks.push(task)
    })

    return Array.from(groupsMap.values()).sort((a, b) => {
      const numA = parseInt(a.dutyNum, 10) || 0
      const numB = parseInt(b.dutyNum, 10) || 0
      return numA - numB
    })
  }, [ganttTasks, taskFilter, searchDuty])

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId)
  }

  const handleTaskFilterChange = (filter: TaskFilterType) => {
    setTaskFilter(filter)
  }

  const handleSearchChange = (query: string) => {
    setSearchDuty(query)
  }

  const handleTaskClick = (task: OperationalTask) => {
    setInspectedTask(task)
  }

  const handleCloseModal = () => {
    setInspectedTask(null)
  }

  const handleNavigate = (path: string) => {
    setPath(path)
  }

  return {
    routes,
    selectedRouteId,
    taskFilter,
    searchDuty,
    inspectedTask,
    isLoading: isScheduleLoading,
    currentTimelineOffsetPercent,
    currentTimeDisplay,
    metrics,
    groupedDuties,
    hoursMarks,

    handleRouteSelect,
    handleTaskFilterChange,
    handleSearchChange,
    handleTaskClick,
    handleCloseModal,
    handleNavigate,
    refetchSchedule
  }
}
