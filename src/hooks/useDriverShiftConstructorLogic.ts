import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../utils/apiClient'
import { Route } from '../types'
import { useScheduleStore } from '../store/useScheduleStore'
import { toast } from 'sonner'
import { ShiftFilterType } from '../components/planning/DriverShiftConstructorToolbar'

export interface DriverShift {
  id: string
  duty_number: number
  duty_type: string
  shift_index: number
  shift_name: string
  driver_id: string
  driver_name: string
  driver_tab_num: string
  vehicle_num: string
  second_vehicle_num?: string | null
  prep_time_min: number
  depot_arrival_time: string
  pullout_time: string
  start_time: string
  end_time: string
  lunch_start_time: string
  lunch_end_time: string
  lunch_duration_min: number
  paid_excess_break_min: number
  lunch_location: string
  work_hours: number
  driving_hours: number
  night_hours: number
  compliance_status: string
  notes?: string | null
  timeline_events: Array<{ time: string; event: string }>
}

export interface RunCuttingResponse {
  status: string
  route_id: string
  route_name: string
  prep_time_min: number
  total_shifts_count: number
  shifts: DriverShift[]
  message?: string
}

export const useDriverShiftConstructorLogic = () => {
  const setPath = useScheduleStore((state) => state.setPath)
  const [selectedRouteId, setSelectedRouteId] = useState<string>('7')
  const [selectedKpzShiftId, setSelectedKpzShiftId] = useState<string | null>(null)
  const [selectedAssignmentShift, setSelectedAssignmentShift] = useState<DriverShift | null>(null)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState<boolean>(false)

  // Фільтри та пошук
  const [activeFilter, setActiveFilter] = useState<ShiftFilterType>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Завантаження маршрутів
  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['routes-all'],
    queryFn: async () => {
      const res = await apiClient.get<Route[]>('/api/v1/routes')
      return Array.isArray(res.data) ? res.data : []
    }
  })

  // Отримання сформованих змін на базі активного розкладу з БД
  const { data: runCuttingData, isLoading, refetch } = useQuery<RunCuttingResponse>({
    queryKey: ['run-cutting-shifts', selectedRouteId],
    queryFn: async () => {
      const res = await apiClient.get<RunCuttingResponse>(`/api/v1/shifts/by-route/${selectedRouteId}`)
      return res.data
    }
  })

  // Отримання даних для бланка КПЗ
  const { data: kpzData } = useQuery({
    queryKey: ['kpz-card', selectedKpzShiftId],
    queryFn: async () => {
      if (!selectedKpzShiftId) return null
      const res = await apiClient.get(`/api/v1/shifts/${selectedKpzShiftId}/kpz-card`)
      return res.data
    },
    enabled: !!selectedKpzShiftId
  })

  const selectedRoute: Route = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || {
      id: '7',
      number: '7',
      name: 'вул. Паустовського — вул. Пастера',
      type: 'tram' as const,
      status: 'active' as const,
      segments: []
    }
  }, [routes, selectedRouteId])

  const isTram = selectedRoute.type === 'tram'
  const prepTimeMin = runCuttingData?.prep_time_min || (isTram ? 10 : 19)

  const allShifts = useMemo(() => {
    return runCuttingData?.shifts || []
  }, [runCuttingData])

  const hasActiveSchedule = useMemo(() => {
    return Boolean(
      runCuttingData &&
      runCuttingData.status === 'SUCCESS' &&
      Array.isArray(runCuttingData.shifts) &&
      runCuttingData.shifts.length > 0
    )
  }, [runCuttingData])

  // Підрахунок балансу змін за КЗпП
  const validCount = useMemo(() => {
    return allShifts.filter((s) => s.compliance_status === 'VALID').length
  }, [allShifts])

  const extendedCount = useMemo(() => {
    return allShifts.filter((s) => s.compliance_status === 'EXTENDED').length
  }, [allShifts])

  const violationCount = useMemo(() => {
    return allShifts.filter((s) => s.compliance_status === 'VIOLATION' || s.work_hours >= 10.0).length
  }, [allShifts])

  // Фільтрація та пошук
  const filteredShifts = useMemo(() => {
    return allShifts.filter((shift) => {
      // Фільтр за зміною
      if (activeFilter === 'SHIFT_1' && shift.shift_index !== 1) return false
      if (activeFilter === 'SHIFT_2' && shift.shift_index !== 2) return false
      if (activeFilter === 'SPLIT' && shift.duty_type !== 'SPLIT') return false
      if (activeFilter === 'EXTENDED' && shift.compliance_status !== 'EXTENDED') return false
      if (activeFilter === 'VIOLATIONS' && shift.compliance_status !== 'VIOLATION' && shift.work_hours < 10.0) return false

      // Пошуковий запит
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesDriver = (shift.driver_name || '').toLowerCase().includes(q)
        const matchesTab = (shift.driver_tab_num || '').toLowerCase().includes(q)
        const matchesVehicle = (shift.vehicle_num || '').toLowerCase().includes(q)
        const matchesDuty = `наряд ${shift.duty_number}`.includes(q) || `${shift.duty_number}`.includes(q)
        return matchesDriver || matchesTab || matchesVehicle || matchesDuty
      }

      return true
    })
  }, [allShifts, activeFilter, searchQuery])

  const handleRefetch = () => {
    void refetch()
  }

  const handleSelectRouteId = (id: string) => {
    setSelectedRouteId(id)
  }

  const handleOpenKpzModal = (shiftId: string) => {
    setSelectedKpzShiftId(shiftId)
  }

  const handleCloseKpzModal = () => {
    setSelectedKpzShiftId(null)
  }

  const handleOpenAssignmentModal = (shift: DriverShift) => {
    setSelectedAssignmentShift(shift)
    setIsAssignmentModalOpen(true)
  }

  const handleCloseAssignmentModal = () => {
    setSelectedAssignmentShift(null)
    setIsAssignmentModalOpen(false)
  }

  const handleSaveAssignment = async (payload: {
    driver_name: string
    driver_tab_num: string
    vehicle_num: string
    second_vehicle_num?: string | null
    notes?: string
  }) => {
    if (!selectedAssignmentShift) return

    try {
      await apiClient.post('/api/v1/shifts/assign-driver', {
        shift_id: selectedAssignmentShift.id,
        route_id: selectedRouteId,
        duty_number: selectedAssignmentShift.duty_number,
        shift_index: selectedAssignmentShift.shift_index,
        driver_name: payload.driver_name,
        driver_tab_num: payload.driver_tab_num,
        vehicle_num: payload.vehicle_num,
        second_vehicle_num: payload.second_vehicle_num,
        notes: payload.notes
      })
      toast.success('Призначення водія та вагона успішно збережено в БД!')
      void refetch()
    } catch (err) {
      console.error('Помилка збереження призначення:', err)
      toast.error('Не вдалося зберегти призначення водія')
      throw err
    }
  }

  const handleNavigateToParameters = () => {
    setPath('/planning/parameters')
  }

  return {
    routes,
    selectedRouteId,
    selectedRoute,
    runCuttingData,
    shifts: filteredShifts,
    allShifts,
    hasActiveSchedule,
    isLoading,
    kpzData,
    selectedKpzShiftId,
    selectedAssignmentShift,
    isAssignmentModalOpen,
    isTram,
    prepTimeMin,
    validCount,
    extendedCount,
    violationCount,
    activeFilter,
    searchQuery,
    setActiveFilter,
    setSearchQuery,
    handleRefetch,
    handleSelectRouteId,
    handleOpenKpzModal,
    handleCloseKpzModal,
    handleOpenAssignmentModal,
    handleCloseAssignmentModal,
    handleSaveAssignment,
    handleNavigateToParameters
  }
}

export default useDriverShiftConstructorLogic
