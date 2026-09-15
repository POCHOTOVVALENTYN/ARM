import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../utils/apiClient'
import { toast } from 'sonner'
import { useRouteStore } from '../store/useRouteStore'
import { useScheduleStore } from '../store/useScheduleStore'

export interface ActiveDutyShift {
  shift_id: number
  shift_sequence: number
  vehicle_id?: string | null
  second_vehicle_id?: string | null
  driver_name?: string | null
  driver_tab_num?: string | null
  start_time: string
  end_time: string
  has_break: boolean
  break_duration_minutes: number
  trips_count: number
}

export interface ActiveDutyItem {
  duty_id: number
  duty_number: string
  duty_type: string
  depot_id: string
  shifts: ActiveDutyShift[]
}

export interface ActiveScheduleRoute {
  schedule_id: number
  route_id: string
  route_number: string
  route_name: string
  transport_type: 'tram' | 'trolleybus'
  version_name: string
  status: string
  active_date: string
  created_at: string
  duties_count: number
  total_trips: number
  total_wagon_km: number
  headway_min: number
  depot_name: string
  assigned_drivers_count: number
  required_drivers_count: number
  is_fully_assigned: boolean
  duties: ActiveDutyItem[]
}

export const useActiveDutiesLogic = () => {
  const queryClient = useQueryClient()
  const setSelectedRouteId = useRouteStore((s) => s.setSelectedRouteId)
  const setPath = useScheduleStore((s) => s.setPath)

  const [transportFilter, setTransportFilter] = useState<'ALL' | 'TRAM' | 'TROLLEYBUS'>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedDepot, setSelectedDepot] = useState<string>('ALL')
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null)
  const [templateModalTarget, setTemplateModalTarget] = useState<ActiveScheduleRoute | null>(null)

  // 1. Fetch active schedules registry from backend
  const activeSchedulesQuery = useQuery({
    queryKey: ['active-duties-registry'],
    queryFn: async () => {
      const res = await apiClient.get<ActiveScheduleRoute[]>('/api/v1/schedules/active-duties-registry')
      return res.data
    },
    staleTime: 10000
  })

  // 2. Filter schedules based on user criteria
  const filteredSchedules = useMemo(() => {
    if (!activeSchedulesQuery.data) return []

    return activeSchedulesQuery.data.filter((item) => {
      // Transport filter
      if (transportFilter === 'TRAM' && item.transport_type !== 'tram') return false
      if (transportFilter === 'TROLLEYBUS' && item.transport_type !== 'trolleybus') return false

      // Depot filter
      if (selectedDepot !== 'ALL' && !item.depot_name?.toLowerCase().includes(selectedDepot.toLowerCase())) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesNum = item.route_number.toLowerCase().includes(q)
        const matchesName = item.route_name.toLowerCase().includes(q)
        const matchesVersion = item.version_name.toLowerCase().includes(q)
        if (!matchesNum && !matchesName && !matchesVersion) return false
      }

      return true
    })
  }, [activeSchedulesQuery.data, transportFilter, selectedDepot, searchQuery])

  // Summary Metrics across all active routes
  const metrics = useMemo(() => {
    const list = activeSchedulesQuery.data || []
    const totalDuties = list.reduce((sum, item) => sum + item.duties_count, 0)
    const totalTrips = list.reduce((sum, item) => sum + item.total_trips, 0)
    const totalKm = Math.round(list.reduce((sum, item) => sum + item.total_wagon_km, 0))
    const assignedDrivers = list.reduce((sum, item) => sum + item.assigned_drivers_count, 0)
    const requiredDrivers = list.reduce((sum, item) => sum + item.required_drivers_count, 0)

    return {
      activeRoutesCount: list.length,
      totalDuties,
      totalTrips,
      totalKm,
      assignedDrivers,
      requiredDrivers,
      crewFulfillmentPct: requiredDrivers > 0 ? Math.round((assignedDrivers / requiredDrivers) * 100) : 100
    }
  }, [activeSchedulesQuery.data])

  // 3. Move active schedule to archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      const res = await apiClient.post(`/api/v1/schedules/${scheduleId}/archive`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Розклад успішно перенесено в архів')
      void queryClient.invalidateQueries({ queryKey: ['active-duties-registry'] })
      void queryClient.invalidateQueries({ queryKey: ['archive-registry'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Помилка архівації розкладу'
      toast.error(msg)
    }
  })

  // 4. Save schedule as template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async ({ scheduleId, name, description }: { scheduleId: number; name: string; description?: string }) => {
      const res = await apiClient.post(`/api/v1/schedules/${scheduleId}/save-as-template`, {
        name,
        description
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Шаблон успішно збережено!')
      setTemplateModalTarget(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Помилка збереження шаблону'
      toast.error(msg)
    }
  })

  // Handlers
  const handleToggleExpand = (routeId: string) => {
    setExpandedRouteId((prev) => (prev === routeId ? null : routeId))
  }

  const handleOpenInMatrix = (routeId: string) => {
    setSelectedRouteId(routeId)
    setPath('/planning/matrix')
  }

  const handleEditInBuilder = (routeId: string) => {
    setSelectedRouteId(routeId)
    setPath('/planning/parameters')
  }

  const handleOpenShiftConstructor = (routeId: string) => {
    setSelectedRouteId(routeId)
    setPath('/planning/shifts')
  }

  const handleArchiveSchedule = (item: ActiveScheduleRoute) => {
    if (window.confirm(`Ви дійсно бажаєте вивести розклад маршруту №${item.route_number} з експлуатації та перенести в архів?`)) {
      archiveMutation.mutate(item.schedule_id)
    }
  }

  const handleOpenTemplateModal = (item: ActiveScheduleRoute) => {
    setTemplateModalTarget(item)
  }

  const handleCloseTemplateModal = () => {
    setTemplateModalTarget(null)
  }

  const handleSaveTemplateSubmit = (name: string, description: string) => {
    if (!templateModalTarget) return
    saveTemplateMutation.mutate({
      scheduleId: templateModalTarget.schedule_id,
      name,
      description
    })
  }

  const handleNavigateToBuilder = () => {
    setPath('/planning/parameters')
  }

  return {
    schedules: filteredSchedules,
    allSchedules: activeSchedulesQuery.data || [],
    isLoading: activeSchedulesQuery.isLoading,
    isArchiving: archiveMutation.isPending,
    isSavingTemplate: saveTemplateMutation.isPending,
    metrics,
    transportFilter,
    searchQuery,
    selectedDepot,
    expandedRouteId,
    templateModalTarget,
    setTransportFilter,
    setSearchQuery,
    setSelectedDepot,
    handleToggleExpand,
    handleOpenInMatrix,
    handleEditInBuilder,
    handleOpenShiftConstructor,
    handleArchiveSchedule,
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    handleSaveTemplateSubmit,
    handleNavigateToBuilder
  }
}

export default useActiveDutiesLogic
