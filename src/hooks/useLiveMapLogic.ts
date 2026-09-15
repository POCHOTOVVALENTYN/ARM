import { useState, useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useRouteStore } from '../store/useRouteStore'
import { useTelemetryStore } from '../store/useTelemetryStore'
import { useAlertStore } from '../store/useAlertStore'
import {
  useControlPoints,
  useAllRouteShapes,
  useRouteBothShapes,
  useRouteStops,
  AllRouteShapeItem,
  RouteStopItem
} from './useRouteQueries'

export interface MapStyleOption {
  id: string
  label: string
  url: string
  attribution: string
  icon: string
}

export const MAP_STYLES: MapStyleOption[] = [
  {
    id: 'positron',
    label: 'Світла (Positron)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
    icon: '🗺️'
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    icon: '🌐'
  },
  {
    id: 'voyager',
    label: 'Voyager (Детальна)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO, &copy; OpenStreetMap',
    icon: '🧭'
  },
  {
    id: 'satellite',
    label: 'Супутник (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
    icon: '🛰️'
  },
  {
    id: 'dark',
    label: 'Контрастна Нічна',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO, &copy; OpenStreetMap',
    icon: '🌙'
  }
]

export const ODESSA_CENTER: [number, number] = [46.4750, 30.7350]

export const normalizeRouteType = (type?: string): 'tram' | 'trolleybus' => {
  if (!type) return 'tram'
  const lower = String(type).trim().toLowerCase()
  if (lower === 'tram' || lower === 't' || lower.includes('трам')) return 'tram'
  if (lower.includes('trolley') || lower === 'trolleybus' || lower === 'tr' || lower.includes('трол')) return 'trolleybus'
  return 'tram'
}

export interface DispatchHubItem {
  id: string
  name: string
  lat: number
  lng: number
  routes: string
}

export interface SelectedOrderVehicle {
  vehicleId: string
  routeId: string
}

export const useLiveMapLogic = (propActiveRouteId?: string) => {
  const routes = useRouteStore(useShallow((s) => s.routes || []))
  const vehiclesMap = useTelemetryStore(useShallow((s) => s.vehicles || {}))
  const fetchLiveTelemetry = useTelemetryStore((s) => s.fetchLiveTelemetry)
  const lastSyncTime = useTelemetryStore((s) => s.lastSyncTime)

  const isAirRaidActive = useAlertStore((s) => s.isAirRaidActive)
  const toggleAirRaid = useAlertStore((s) => s.toggleAirRaid)
  const fetchAirRaidStatus = useAlertStore((s) => s.fetchAirRaidStatus)

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'routes' | 'layers'>('routes')

  const initialSelectedRouteIds = useMemo(() => {
    if (propActiveRouteId && propActiveRouteId !== 'ALL' && propActiveRouteId !== 'all') {
      return [propActiveRouteId.replace(/^(t|tr)/i, '').trim()]
    }
    return []
  }, [propActiveRouteId])

  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>(initialSelectedRouteIds)
  const [routeTypeFilter, setRouteTypeFilter] = useState<'all' | 'tram' | 'trolleybus'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedTileStyleId, setSelectedTileStyleId] = useState<string>('positron')
  const [directionMode, setDirectionMode] = useState<'both' | 0 | 1>('both')

  // Шари об'єктів
  const [showAllRoutesLines, setShowAllRoutesLines] = useState<boolean>(true)
  const [showTrackShape, setShowTrackShape] = useState<boolean>(true)
  const [showStops, setShowStops] = useState<boolean>(true)
  const [showDispatchHubs, setShowDispatchHubs] = useState<boolean>(true)
  const [hideServiceVehicles, setHideServiceVehicles] = useState<boolean>(true)
  const [hideDepotVehicles, setHideDepotVehicles] = useState<boolean>(false)
  const [onlyCriticalDelays, setOnlyCriticalDelays] = useState<boolean>(false)
  const [isAntiRebActive, setIsAntiRebActive] = useState<boolean>(true)

  // Відлік свіжості GPS-сигналу
  const [secondsSinceSync, setSecondsSinceSync] = useState<number>(0)

  // Синхронізація з EasyWay
  const [isSyncingEasyWay, setIsSyncingEasyWay] = useState<boolean>(false)
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null)

  // Модальне вікно оперативного наказу
  const [orderModalOpen, setOrderModalOpen] = useState<boolean>(false)
  const [selectedVehicleForOrder, setSelectedVehicleForOrder] = useState<SelectedOrderVehicle | null>(null)

  // Динамічні диспетчерські пункти та контрольні точки з бази даних
  const { data: dbControlPoints } = useControlPoints()
  const dispatchHubs: DispatchHubItem[] = useMemo(() => {
    if (dbControlPoints && dbControlPoints.length > 0) {
      return dbControlPoints.map((cp) => ({
        id: String(cp.id),
        name: cp.name,
        lat: Number(cp.lat),
        lng: Number(cp.lng),
        routes: cp.is_dp ? 'Диспетчерський пункт' : 'Контрольна точка'
      }))
    }
    return []
  }, [dbControlPoints])

  // Опитування статусу тривоги раз на 15 сек
  useEffect(() => {
    fetchAirRaidStatus()
    const alertInterval = setInterval(fetchAirRaidStatus, 15000)
    return () => clearInterval(alertInterval)
  }, [fetchAirRaidStatus])

  // Лічильник секунд свіжості GPS
  useEffect(() => {
    const updateSyncCounter = () => {
      if (lastSyncTime) {
        setSecondsSinceSync(Math.max(0, Math.floor((Date.now() - lastSyncTime) / 1000)))
      }
    }
    updateSyncCounter()
    const interval = setInterval(updateSyncCounter, 1000)
    return () => clearInterval(interval)
  }, [lastSyncTime])

  // Періодичне опитування телеметрії Wialon кожні 3 сек
  useEffect(() => {
    fetchLiveTelemetry()
    const interval = setInterval(() => {
      fetchLiveTelemetry()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchLiveTelemetry])

  // Поточний стиль карти
  const currentTileStyle = useMemo(() => {
    return MAP_STYLES.find((s) => s.id === selectedTileStyleId) || MAP_STYLES[0]
  }, [selectedTileStyleId])

  // Перший обраний маршрут для геометрії колії
  const primarySelectedRouteId = selectedRouteIds[0] || ''

  // Завантаження трас усіх маршрутів
  const { data: allRoutesData = [] } = useAllRouteShapes(showAllRoutesLines)

  // Завантаження прямого та зворотного напрямку для обраного маршруту
  const { data: routeShapes } = useRouteBothShapes(primarySelectedRouteId)

  const routeShapeForward: [number, number][] = useMemo(() => {
    const dir = routeShapes?.directions?.find((d) => d.direction_id === 0)
    if (!dir || !dir.geometry) return []
    return dir.geometry.map((p) => [p.lat, p.lng])
  }, [routeShapes])

  const routeShapeBackward: [number, number][] = useMemo(() => {
    const dir = routeShapes?.directions?.find((d) => d.direction_id === 1)
    if (!dir || !dir.geometry) return []
    return dir.geometry.map((p) => [p.lat, p.lng])
  }, [routeShapes])

  // Зупинки для обраного маршруту
  const { data: stopsData = [] } = useRouteStops(primarySelectedRouteId)

  // Список маршрутів із кількістю онлайн-транспорту
  const routesWithVehicleCounts = useMemo(() => {
    const vehiclesList = Object.values(vehiclesMap)

    return routes.map((r) => {
      const cleanId = String(r.id).replace(/^(t|tr)/i, '').trim()
      const count = vehiclesList.filter((v) => {
        const vRoute = String(v.route_id || v.route_number || '').replace(/^(t|tr)/i, '').trim()
        return vRoute === cleanId
      }).length

      return {
        ...r,
        cleanId,
        liveVehicleCount: count
      }
    })
  }, [routes, vehiclesMap])

  // Фільтрований список маршрутів для бічної панелі
  const filteredRoutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return routesWithVehicleCounts.filter((r) => {
      const matchesType = routeTypeFilter === 'all' || normalizeRouteType(r.type) === routeTypeFilter
      if (!matchesType) return false

      if (!query) return true

      const nameMatch = (r.name || '').toLowerCase().includes(query)
      const numMatch = String(r.number || r.id || '').toLowerCase().includes(query)
      return nameMatch || numMatch
    })
  }, [routesWithVehicleCounts, routeTypeFilter, searchQuery])

  // Точки маршруту для фокусування карти
  const focusPoints = useMemo<[number, number][]>(() => {
    if (primarySelectedRouteId && (routeShapeForward.length > 0 || routeShapeBackward.length > 0)) {
      return [...routeShapeForward, ...routeShapeBackward]
    }
    return []
  }, [primarySelectedRouteId, routeShapeForward, routeShapeBackward])

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const handleTabChange = (tab: 'routes' | 'layers') => {
    setActiveTab(tab)
  }

  const handleRouteSelect = (routeId: string) => {
    const clean = String(routeId).replace(/^(t|tr)/i, '').trim()
    setSelectedRouteIds((prev) => {
      if (prev.includes(clean)) {
        return prev.filter((id) => id !== clean)
      }
      return [...prev, clean]
    })
  }

  const handleClearRouteSelection = () => {
    setSelectedRouteIds([])
  }

  const handleRouteTypeFilterChange = (filter: 'all' | 'tram' | 'trolleybus') => {
    setRouteTypeFilter(filter)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleDirectionModeChange = (mode: 'both' | 0 | 1) => {
    setDirectionMode(mode)
  }

  const handleTileStyleChange = (styleId: string) => {
    setSelectedTileStyleId(styleId)
  }

  const handleToggleAntiReb = () => {
    setIsAntiRebActive((prev) => !prev)
  }

  const handleSyncEasyWay = async () => {
    setIsSyncingEasyWay(true)
    setSyncResultMsg(null)
    try {
      await fetchLiveTelemetry()
      setSyncResultMsg('Траси та зупинки успішно синхронізовано з EasyWay!')
      setTimeout(() => setSyncResultMsg(null), 4000)
    } catch {
      setSyncResultMsg('Помилка синхронізації з сервером EasyWay')
    } finally {
      setIsSyncingEasyWay(false)
    }
  }

  const handleOpenOrderModal = (vehicleId: string, routeId: string) => {
    setSelectedVehicleForOrder({ vehicleId, routeId })
    setOrderModalOpen(true)
  }

  const handleCloseOrderModal = () => {
    setOrderModalOpen(false)
    setSelectedVehicleForOrder(null)
  }

  return {
    routes: filteredRoutes,
    selectedRouteIds,
    primarySelectedRouteId,
    routeTypeFilter,
    searchQuery,
    selectedTileStyleId,
    currentTileStyle,
    directionMode,
    isSidebarOpen,
    activeTab,
    secondsSinceSync,
    isAntiRebActive,
    isSyncingEasyWay,
    syncResultMsg,
    isAirRaidActive,

    showAllRoutesLines,
    showTrackShape,
    showStops,
    showDispatchHubs,
    hideServiceVehicles,
    hideDepotVehicles,
    onlyCriticalDelays,
    allRoutesData: allRoutesData as AllRouteShapeItem[],
    routeShapeForward,
    routeShapeBackward,
    stopsData: stopsData as RouteStopItem[],
    dispatchHubs,
    focusPoints,

    orderModalOpen,
    selectedVehicleForOrder,

    setShowAllRoutesLines,
    setShowTrackShape,
    setShowStops,
    setShowDispatchHubs,
    setHideServiceVehicles,
    setHideDepotVehicles,
    setOnlyCriticalDelays,

    handleToggleSidebar,
    handleTabChange,
    handleRouteSelect,
    handleClearRouteSelection,
    handleRouteTypeFilterChange,
    handleSearchChange,
    handleDirectionModeChange,
    handleTileStyleChange,
    handleToggleAntiReb,
    handleSyncEasyWay,
    handleOpenOrderModal,
    handleCloseOrderModal,
    toggleAirRaid
  }
}
