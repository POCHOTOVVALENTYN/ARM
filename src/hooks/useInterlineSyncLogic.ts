import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../utils/apiClient'
import { toast } from 'sonner'
import { useRouteStore } from '../store/useRouteStore'
import { useScheduleStore } from '../store/useScheduleStore'

export interface CorridorStatus {
  id: string
  name: string
  type: string
  routes: string[]
  key_stations: string[]
  min_headway_min: number
  description: string
  can_sync: boolean
  ready_routes: Array<{
    route_id: string
    number: string
    name: string
    type: string
    has_active_schedule: boolean
  }>
  missing_routes: Array<{
    route_id: string
    number: string
    name: string
    type: string
    has_active_schedule: boolean
  }>
  status: 'SYNCHRONIZED' | 'NEEDS_SYNC' | 'MISSING_SCHEDULES'
  conflicts_count: number
}

export interface RoutePairCheckResponse {
  status: string
  can_sync: boolean
  route_a?: {
    route_id: string
    number: string
    name: string
    type: string
    has_active_schedule: boolean
    schedule_id?: number | null
  }
  route_b?: {
    route_id: string
    number: string
    name: string
    type: string
    has_active_schedule: boolean
    schedule_id?: number | null
  }
  shared_stops_count?: number
  shared_stops?: Array<{ id: string; name: string }>
  primary_hub_stop?: { id: string; name: string }
  conflicts_count?: number
  min_headway_min?: number
  passages?: any[]
  message?: string
}

export interface TimelineModalState {
  isOpen: boolean
  title: string
  hubStopName: string
  minHeadway: number
  conflictsCount: number
  passages: any[]
  routeIds: string[]
}

export const useInterlineSyncLogic = () => {
  const queryClient = useQueryClient()
  const routes = useRouteStore((s) => s.routes)
  const setSelectedRouteId = useRouteStore((s) => s.setSelectedRouteId)
  const setPath = useScheduleStore((s) => s.setPath)

  const [transportType, setTransportType] = useState<'tram' | 'trolleybus'>('tram')
  const [syncMode, setSyncMode] = useState<'CORRIDORS' | 'PAIR'>('CORRIDORS')
  const [minHeadway, setMinHeadway] = useState<number>(2.0)

  // Default routes based on transport type
  const [selectedRouteA, setSelectedRouteA] = useState<string>('5')
  const [selectedRouteB, setSelectedRouteB] = useState<string>('28')

  // Timeline modal state
  const [timelineModal, setTimelineModal] = useState<TimelineModalState>({
    isOpen: false,
    title: '',
    hubStopName: '',
    minHeadway: 2.0,
    conflictsCount: 0,
    passages: [],
    routeIds: []
  })

  // 1. Fetch Corridors status
  const corridorsQuery = useQuery({
    queryKey: ['interline-corridors', minHeadway],
    queryFn: async () => {
      const res = await apiClient.get<CorridorStatus[]>('/api/v1/shifts/interline/corridors-status', {
        params: { min_headway_min: minHeadway }
      })
      return res.data
    },
    staleTime: 30000
  })

  // 2. Fetch Route Pair check
  const pairCheckQuery = useQuery({
    queryKey: ['interline-pair-check', selectedRouteA, selectedRouteB, minHeadway],
    queryFn: async () => {
      if (!selectedRouteA || !selectedRouteB || selectedRouteA === selectedRouteB) {
        return null
      }
      const res = await apiClient.get<RoutePairCheckResponse>('/api/v1/shifts/interline/check-pair', {
        params: {
          route_a: selectedRouteA,
          route_b: selectedRouteB,
          min_headway_min: minHeadway
        }
      })
      return res.data
    },
    enabled: Boolean(selectedRouteA && selectedRouteB && selectedRouteA !== selectedRouteB),
    staleTime: 15000
  })

  // 3. Sync mutation
  const syncMutation = useMutation({
    mutationFn: async (routeIds: string[]) => {
      const res = await apiClient.post('/api/v1/shifts/interline/apply-sync', {
        route_ids: routeIds,
        min_headway_min: minHeadway
      })
      return res.data
    },
    onSuccess: async (data) => {
      toast.success(
        `Синхронізацію успішно застосовано! Усунуто ${data.conflicts_resolved || 0} скупчень. Графіки оновлено в БД.`
      )
      await queryClient.refetchQueries({ queryKey: ['interline-corridors'] })
      await queryClient.refetchQueries({ queryKey: ['interline-pair-check'] })
      await queryClient.invalidateQueries({ queryKey: ['shift-cutting-data'] })
      await queryClient.invalidateQueries({ queryKey: ['static-duties-archive'] })

      // Автоматичне оновлення клієнтського розкладу у сховищі
      const currentMaster = useScheduleStore.getState().masterScheduleData
      if (currentMaster && data.adjusted_trips && data.adjusted_trips.length > 0) {
        const adjustedMap = new Map<string, number>()
        data.adjusted_trips.forEach((adj: any) => {
          adjustedMap.set(String(adj.duty_number), adj.shift_delta_min || 1)
        })

        const updatedRows = currentMaster.master_grid_rows.map((row) => {
          const shiftDelta = adjustedMap.get(String(row.duty_number))
          if (!shiftDelta) return row

          const updatedRounds = (row.rounds || []).map((rnd) => {
            const shiftTime = (tStr: string) => {
              if (!tStr || !tStr.includes(':')) return tStr
              const [h, m] = tStr.split(':').map(Number)
              const totalM = (h * 60 + m + shiftDelta) % 1440
              const nh = Math.floor(totalM / 60)
              const nm = totalM % 60
              return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
            }
            return {
              ...rnd,
              departure_station_a: shiftTime(rnd.departure_station_a),
              departure_station_b: shiftTime(rnd.departure_station_b),
              arrival_station_a: rnd.arrival_station_a ? shiftTime(rnd.arrival_station_a) : rnd.arrival_station_a
            }
          })

          return {
            ...row,
            rounds: updatedRounds
          }
        })

        useScheduleStore.getState().setMasterScheduleData({
          ...currentMaster,
          master_grid_rows: updatedRows
        })
      }

      // Close modal if open
      setTimelineModal((prev) => ({ ...prev, isOpen: false }))
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || 'Помилка виконання алгоритму синхронізації'
      toast.error(errMsg)
    }
  })

  // Total conflicts count across corridors of selected transport type
  const totalConflicts = useMemo(() => {
    if (!corridorsQuery.data) return 0
    return corridorsQuery.data
      .filter((c) => c.type.toLowerCase() === transportType)
      .reduce((sum, c) => sum + (c.conflicts_count || 0), 0)
  }, [corridorsQuery.data, transportType])

  // Handlers
  const handleTransportTypeChange = (type: 'tram' | 'trolleybus') => {
    setTransportType(type)
    if (type === 'tram') {
      setSelectedRouteA('5')
      setSelectedRouteB('28')
    } else {
      setSelectedRouteA('Tr7')
      setSelectedRouteB('Tr9')
    }
  }

  const handleSyncModeChange = (mode: 'CORRIDORS' | 'PAIR') => {
    setSyncMode(mode)
  }

  const handleMinHeadwayChange = (val: number) => {
    setMinHeadway(val)
  }

  const handleSelectRouteA = (id: string) => {
    setSelectedRouteA(id)
  }

  const handleSelectRouteB = (id: string) => {
    setSelectedRouteB(id)
  }

  const handleApplySync = (routeIds?: string[]) => {
    if (routeIds && routeIds.length > 0) {
      syncMutation.mutate(routeIds)
      return
    }

    if (syncMode === 'CORRIDORS' && corridorsQuery.data) {
      const needyCorridor = corridorsQuery.data.find(
        (c) => c.status === 'NEEDS_SYNC' && c.can_sync && c.type.toLowerCase() === transportType
      )
      if (needyCorridor && needyCorridor.routes.length >= 2) {
        syncMutation.mutate(needyCorridor.routes)
        return
      }
    }

    syncMutation.mutate([selectedRouteA, selectedRouteB])
  }

  const handleOpenPairTimeline = () => {
    const data = pairCheckQuery.data
    if (!data || !data.passages) return

    setTimelineModal({
      isOpen: true,
      title: `Маршрут №${data.route_a?.number || selectedRouteA} та №${data.route_b?.number || selectedRouteB}`,
      hubStopName: data.primary_hub_stop?.name || 'Вузлова зупинка',
      minHeadway: data.min_headway_min || minHeadway,
      conflictsCount: data.conflicts_count || 0,
      passages: data.passages,
      routeIds: [selectedRouteA, selectedRouteB]
    })
  }

  const handleOpenCorridorTimeline = async (corridor: CorridorStatus) => {
    if (corridor.routes.length < 2) return

    try {
      // Check first pair of the corridor
      const res = await apiClient.get<RoutePairCheckResponse>('/api/v1/shifts/interline/check-pair', {
        params: {
          route_a: corridor.routes[0],
          route_b: corridor.routes[1],
          min_headway_min: corridor.min_headway_min || minHeadway
        }
      })

      setTimelineModal({
        isOpen: true,
        title: corridor.name,
        hubStopName: corridor.key_stations[0] || 'Вузлова зупинка',
        minHeadway: corridor.min_headway_min || minHeadway,
        conflictsCount: res.data.conflicts_count || 0,
        passages: res.data.passages || [],
        routeIds: corridor.routes
      })
    } catch {
      toast.error('Не вдалося завантажити похвилинну стрічку для коридору')
    }
  }

  const handleCloseTimeline = () => {
    setTimelineModal((prev) => ({ ...prev, isOpen: false }))
  }

  const handleNavigateToBuilder = (routeId: string) => {
    setSelectedRouteId(routeId)
    setPath('/planning/parameters')
  }

  return {
    routes,
    transportType,
    syncMode,
    minHeadway,
    selectedRouteA,
    selectedRouteB,
    corridors: corridorsQuery.data || [],
    isLoadingCorridors: corridorsQuery.isLoading,
    pairCheckData: pairCheckQuery.data || undefined,
    isLoadingCheck: pairCheckQuery.isLoading,
    isSyncing: syncMutation.isPending,
    totalConflicts,
    timelineModal,
    handleTransportTypeChange,
    handleSyncModeChange,
    handleMinHeadwayChange,
    handleSelectRouteA,
    handleSelectRouteB,
    handleApplySync,
    handleOpenPairTimeline,
    handleOpenCorridorTimeline,
    handleCloseTimeline,
    handleNavigateToBuilder
  }
}

export default useInterlineSyncLogic
