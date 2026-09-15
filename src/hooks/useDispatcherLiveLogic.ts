import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../utils/apiClient'
import { toast } from 'sonner'
import { useTelemetryStore } from '../store/useTelemetryStore'
import { VehicleActionItem } from '../components/dispatcher/VehicleActionDropdown'

export interface VehicleTelemetryRow {
  vehicle_id: string
  display_name?: string
  route_id: string
  route_number?: string
  duty_number?: number
  driver_name?: string
  service_department?: string
  service_task?: string
  depot_name?: string
  depot_status?: string
  vehicle_type?: string
  model?: string
  is_service?: boolean
  is_accessible?: boolean
  has_wifi?: boolean
  has_aircond?: boolean
  lat: number
  lng?: number
  lon?: number
  speed: number
  heading?: number
  current_station?: string
  next_station?: string
  deviation_min: number
  status: string
  has_active_detour?: boolean
  active_detour_loop?: string
  last_updated?: number
}

export interface RouteItem {
  id: string
  number?: string
  name?: string
  type?: string
  color?: string
  length_km?: number
  round_trip_min?: number
  standard_break_min?: number
  designated_break_hub?: string
  t_dir0_min?: number
  t_dir1_min?: number
  layover_min?: number
}

export interface StationItem {
  id?: string
  name: string
  lat?: number
  lng?: number
}

export interface ActiveDetourItem {
  id: number
  vehicle_id: string
  route_id: string
  reason: string
  target_loop?: string
  new_path_description: string
  started_at?: string
}

export type ModeFilterType = 'ALL_PASSENGER' | 'TRAM' | 'TROLLEYBUS' | 'SERVICE' | 'DEPOT'
export type StatusFilterType = 'ALL' | 'IN_SCHEDULE' | 'MINOR_DELAY' | 'CRITICAL_DELAY'

export interface DispatcherCounts {
  passenger: number
  trams: number
  trols: number
  service: number
  depot: number
  onTime: number
  minor: number
  critical: number
  compliance: number
}

export const useDispatcherLiveLogic = () => {
  const queryClient = useQueryClient()

  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL')
  const [modeFilter, setModeFilter] = useState<ModeFilterType>('ALL_PASSENGER')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL')
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true)
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('uk-UA'))

  // Модальні вікна
  const [isShortTurnOpen, setIsShortTurnOpen] = useState(false)
  const [isPacingOpen, setIsPacingOpen] = useState(false)
  const [isRouteEmergencyOpen, setIsRouteEmergencyOpen] = useState(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [inspectedVehicle, setInspectedVehicle] = useState<VehicleTelemetryRow | null>(null)
  const [selectedVehicleForAction, setSelectedVehicleForAction] = useState<VehicleActionItem | null>(null)

  // 1. Довідник маршрутів з бекенду
  const { data: routes = [] } = useQuery<RouteItem[]>({
    queryKey: ['routes-directory'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/routes')
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 60000
  })

  // 2. Координати зупинок
  const { data: stations = [] } = useQuery<StationItem[]>({
    queryKey: ['stations-directory'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/stations')
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 60000
  })

  // 3. Безшовне фонове отримання телеметрії (кожні 4 сек)
  const { data: telemetryList = [], refetch } = useQuery<VehicleTelemetryRow[]>({
    queryKey: ['telemetry-live-matrix'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/telemetry/live')
      const raw = Array.isArray(res.data) ? res.data : []
      setLastSyncTime(new Date().toLocaleTimeString('uk-UA'))

      if (raw.length > 0) {
        useTelemetryStore.getState().updateVehicles(raw as any)
      }
      return raw as VehicleTelemetryRow[]
    },
    refetchInterval: isAutoRefresh ? 4000 : false,
    placeholderData: (prev) => prev
  })

  // 4. Отримання активних оперативних розворотів
  const { data: activeDetours = [] } = useQuery<ActiveDetourItem[]>({
    queryKey: ['active-detours'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/emergencies/detours/active')
      return Array.isArray(res.data) ? res.data : []
    },
    refetchInterval: isAutoRefresh ? 4000 : false
  })

  // Деактивація розвороту
  const deactivateMutation = useMutation({
    mutationFn: async (detourId: number) => {
      const res = await apiClient.post(`/v1/emergencies/detours/${detourId}/deactivate`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Транспорт повернуто на плановий маршрут!')
      queryClient.invalidateQueries({ queryKey: ['active-detours'] })
      refetch()
    }
  })

  // Ручне оновлення
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true)
    await refetch()
    setTimeout(() => {
      setIsManualRefreshing(false)
      toast.success('Телеметрію оновлено')
    }, 250)
  }

  // Активний обраний маршрут
  const activeRouteObj = useMemo(() => {
    if (selectedRouteId === 'ALL') return null
    const cleanSel = selectedRouteId.replace(/^(t|tr)/i, '').toLowerCase()
    return routes.find((r) => {
      const rType = (r.type || 'TRAM').toUpperCase()
      const matchNum = String(r.number || r.id).toLowerCase() === cleanSel || r.id === selectedRouteId
      if (!matchNum) return false
      if (modeFilter === 'TRAM') return rType === 'TRAM'
      if (modeFilter === 'TROLLEYBUS') return rType === 'TROLLEYBUS'
      return true
    }) || null
  }, [routes, selectedRouteId, modeFilter])

  // Фільтрація списку маршрутів у швидкому виборі
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const rType = (r.type || 'TRAM').toUpperCase()
      if (modeFilter === 'TRAM' && rType !== 'TRAM') return false
      if (modeFilter === 'TROLLEYBUS' && rType !== 'TROLLEYBUS') return false
      return true
    }).sort((a, b) => {
      const numA = parseInt(String(a.number || a.id).replace(/\D/g, ''), 10) || 0
      const numB = parseInt(String(b.number || b.id).replace(/\D/g, ''), 10) || 0
      return numA - numB
    })
  }, [routes, modeFilter])

  // Повний випуск на лінії для вибраного маршруту
  const routeVehiclesTotal = useMemo(() => {
    if (!activeRouteObj) return []
    const targetNum = String(activeRouteObj.number || activeRouteObj.id).replace(/^(t|tr)/i, '').toLowerCase()
    const targetType = (activeRouteObj.type || 'TRAM').toUpperCase()
    return telemetryList.filter((v) => {
      const isMatch = String(v.route_number || v.route_id || '').replace(/^(t|tr)/i, '').toLowerCase() === targetNum
      const isTypeMatch = (v.vehicle_type || 'TRAM').toUpperCase() === targetType
      const notDepot = v.status !== 'IN_DEPOT' && v.route_id !== 'DEPOT'
      const notServ = !v.is_service && v.route_id !== 'SERVICE' && v.vehicle_type !== 'SERVICE'
      return isMatch && isTypeMatch && notDepot && notServ
    })
  }, [activeRouteObj, telemetryList])

  // Розрахунковий інтервал на основі випуску
  const calculatedIntervalMin = useMemo(() => {
    if (!activeRouteObj || routeVehiclesTotal.length === 0) return null
    const roundTrip = activeRouteObj.round_trip_min || 70
    return Math.max(2, Math.round((roundTrip / routeVehiclesTotal.length) * 10) / 10)
  }, [activeRouteObj, routeVehiclesTotal])

  // Підрахунок кількості ТЗ за кожною категорією
  const counts: DispatcherCounts = useMemo(() => {
    let passenger = 0
    let trams = 0
    let trols = 0
    let service = 0
    let depot = 0
    let onTime = 0
    let minor = 0
    let critical = 0

    telemetryList.forEach((v) => {
      const inDep = v.status === 'IN_DEPOT' || v.route_id === 'DEPOT'
      const isServ = v.is_service || v.route_id === 'SERVICE' || v.vehicle_type === 'SERVICE'
      const vType = (v.vehicle_type || 'TRAM').toUpperCase()

      if (inDep) {
        depot += 1
        return
      }
      if (isServ) {
        service += 1
        return
      }

      passenger += 1
      if (vType === 'TRAM') trams += 1
      if (vType === 'TROLLEYBUS') trols += 1

      const dev = Math.abs(v.deviation_min || 0)
      if (dev <= 2.0) onTime += 1
      else if (dev <= 5.0) minor += 1
      else critical += 1
    })

    const compliance = passenger > 0 ? Math.round((onTime / passenger) * 100) : 100

    return {
      passenger,
      trams,
      trols,
      service,
      depot,
      onTime,
      minor,
      critical,
      compliance
    }
  }, [telemetryList])

  // Фільтровані вагони для відображення у матриці
  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return telemetryList.filter((v) => {
      const inDepot = v.status === 'IN_DEPOT' || v.route_id === 'DEPOT'
      const isService = v.is_service || v.route_id === 'SERVICE' || v.vehicle_type === 'SERVICE'

      // 1. Фільтр за режимом перегляду
      if (modeFilter === 'SERVICE' && !isService) return false
      if (modeFilter === 'DEPOT' && !inDepot) return false
      if (modeFilter === 'ALL_PASSENGER' && (inDepot || isService)) return false
      if (modeFilter === 'TRAM' && ((v.vehicle_type || 'TRAM').toUpperCase() !== 'TRAM' || inDepot || isService)) return false
      if (modeFilter === 'TROLLEYBUS' && ((v.vehicle_type || 'TRAM').toUpperCase() !== 'TROLLEYBUS' || inDepot || isService)) return false

      // 2. Фільтр за маршрутом
      if (selectedRouteId !== 'ALL' && !inDepot && !isService) {
        const cleanSelected = selectedRouteId.replace(/^(t|tr)/i, '').toLowerCase()
        const vRoute = String(v.route_number || v.route_id || '').replace(/^(t|tr)/i, '').toLowerCase()
        if (vRoute !== cleanSelected && v.route_id !== selectedRouteId) return false
      }

      // 3. Фільтр за статусом графіка
      if (!inDepot && !isService && statusFilter !== 'ALL') {
        const dev = Math.abs(v.deviation_min || 0)
        if (statusFilter === 'IN_SCHEDULE' && dev > 2.0) return false
        if (statusFilter === 'MINOR_DELAY' && (dev <= 2.0 || dev > 5.0)) return false
        if (statusFilter === 'CRITICAL_DELAY' && dev <= 5.0) return false
      }

      // 4. Пошуковий запит
      if (!query) return true

      const vIdMatch = String(v.vehicle_id || '').toLowerCase().includes(query)
      const rMatch = String(v.route_number || v.route_id || '').toLowerCase().includes(query)
      const dMatch = String(v.driver_name || '').toLowerCase().includes(query)
      const stMatch = String(v.current_station || '').toLowerCase().includes(query)
      const nstMatch = String(v.next_station || '').toLowerCase().includes(query)
      const depMatch = String(v.depot_name || '').toLowerCase().includes(query)

      return vIdMatch || rMatch || dMatch || stMatch || nstMatch || depMatch
    })
  }, [telemetryList, modeFilter, selectedRouteId, statusFilter, searchQuery])

  // Спеціальні обробники
  const handleOpenInspector = (v: VehicleTelemetryRow) => {
    setInspectedVehicle(v)
    setIsInspectorOpen(true)
  }

  const handleCloseInspector = () => {
    setIsInspectorOpen(false)
    setInspectedVehicle(null)
  }

  const handleOpenShortTurn = (v: VehicleActionItem) => {
    setSelectedVehicleForAction(v)
    setIsShortTurnOpen(true)
  }

  const handleCloseShortTurn = () => {
    setIsShortTurnOpen(false)
    setSelectedVehicleForAction(null)
  }

  const handleOpenPacing = (v: VehicleActionItem) => {
    setSelectedVehicleForAction(v)
    setIsPacingOpen(true)
  }

  const handleClosePacing = () => {
    setIsPacingOpen(false)
    setSelectedVehicleForAction(null)
  }

  const handleOpenRouteEmergency = () => {
    setIsRouteEmergencyOpen(true)
  }

  const handleCloseRouteEmergency = () => {
    setIsRouteEmergencyOpen(false)
  }

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId)
  }

  const handleModeSelect = (mode: ModeFilterType) => {
    setModeFilter(mode)
    setSelectedRouteId('ALL')
  }

  const handleStatusSelect = (status: StatusFilterType) => {
    setStatusFilter(status)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleToggleAutoRefresh = () => {
    setIsAutoRefresh((prev) => !prev)
  }

  const handleDeactivateDetour = (detourId: number) => {
    deactivateMutation.mutate(detourId)
  }

  return {
    selectedRouteId,
    modeFilter,
    searchQuery,
    statusFilter,
    isAutoRefresh,
    isManualRefreshing,
    lastSyncTime,

    routes: filteredRoutes,
    activeRouteObj,
    calculatedIntervalMin,
    routeVehiclesTotalCount: routeVehiclesTotal.length,
    counts,
    filteredVehicles,
    activeDetours,
    stations,

    isShortTurnOpen,
    isPacingOpen,
    isRouteEmergencyOpen,
    isInspectorOpen,
    inspectedVehicle,
    selectedVehicleForAction,

    handleManualRefresh,
    handleRouteSelect,
    handleModeSelect,
    handleStatusSelect,
    handleSearchChange,
    handleToggleAutoRefresh,
    handleOpenInspector,
    handleCloseInspector,
    handleOpenShortTurn,
    handleCloseShortTurn,
    handleOpenPacing,
    handleClosePacing,
    handleOpenRouteEmergency,
    handleCloseRouteEmergency,
    handleDeactivateDetour,
    refetchTelemetry: refetch
  }
}
