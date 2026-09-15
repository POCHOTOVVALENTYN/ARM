import { useState, useMemo } from 'react'
import { Route, RouteStatus, TransportType, ControlPointNode, RouteDepotConfig, BreakLocationConfig, Station, TimePeriod } from '../types'
import { Depot, useConfigStore } from '../store/useConfigStore'
import { useRouteStore } from '../store/useRouteStore'
import { useRouteDepotStore } from '../store/useRouteDepotStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { useStationStore } from '../store/useStationStore'
import { useControlPointStore } from '../store/useControlPointStore'

export interface DirectoryPointItem extends ControlPointNode {
  isComplex?: boolean
}

export interface UseNetworkSettingsLogicProps {
  initialSubTab?: string
}

export interface UseNetworkSettingsLogicReturn {
  activeSubTab: string
  routes: Route[]
  searchQuery: string
  typeFilter: TransportType | 'all'
  statusFilter: RouteStatus | 'all'
  selectedRouteId: string
  activeViewMode: 'overview' | 'passport' | 'matrix' | 'directory'
  validationErrors: Record<string, string>
  setSearchQuery: (query: string) => void
  setTypeFilter: (type: TransportType | 'all') => void
  setStatusFilter: (status: RouteStatus | 'all') => void
  setSelectedRouteId: (id: string) => void
  setActiveViewMode: (mode: 'overview' | 'passport' | 'matrix' | 'directory') => void
  addRoute: (route: Route) => void
  updateRoute: (route: Route) => void
  deleteRoute: (id: string) => void
  duplicateRoute: (id: string) => void
  updateSegmentTime: (routeId: string, segmentIndex: number, period: TimePeriod, timeMin: number) => { success: boolean; error?: string }
  clearValidationError: (key: string) => void
  exportRoutesJson: () => void
  importRoutesJson: (json: string) => { success: boolean; count?: number; error?: string }
  resetToDefaults: () => void
  controlPoints: ControlPointNode[]
  addControlPoint: (cp: ControlPointNode) => void
  updateControlPoint: (cp: ControlPointNode) => void
  deleteControlPoint: (id: string) => void
  breaks: BreakLocationConfig[]
  addBreak: (b: Omit<BreakLocationConfig, 'id'>) => void
  updateBreak: (b: BreakLocationConfig) => void
  deleteBreak: (id: string) => void
  isHubModalOpen: boolean
  setIsHubModalOpen: (open: boolean) => void
  hubRouteTypeFilter: TransportType | 'all'
  setHubRouteTypeFilter: (filter: TransportType | 'all') => void
  isFormModalOpen: boolean
  setIsFormModalOpen: (open: boolean) => void
  editingRoute: Route | null
  setEditingRoute: (route: Route | null) => void
  editingHub: ControlPointNode | null
  setEditingHub: (hub: ControlPointNode | null) => void
  activeBreakRouteId: string | null
  setActiveBreakRouteId: (id: string | null) => void
  editingBreakConfig: BreakLocationConfig | null
  setEditingBreakConfig: (config: BreakLocationConfig | null) => void
  expandedBreakRouteId: string | null
  setExpandedBreakRouteId: (id: string | null) => void
  isJsonModalOpen: boolean
  setIsJsonModalOpen: (open: boolean) => void
  selectedRouteForPoints: string
  setSelectedRouteForPoints: (id: string) => void
  expandedRouteId: string | null
  setExpandedRouteId: (id: string | null) => void
  expandedDepotRouteId: string | null
  setExpandedDepotRouteId: (id: string | null) => void
  routeDepotConfigs: RouteDepotConfig[]
  addDepotConfig: (config: RouteDepotConfig) => void
  updateDepotConfig: (config: RouteDepotConfig) => void
  deleteRouteDepotConfig: (id: string) => void
  stations: Station[]
  getStationById: (id: string) => Station | undefined
  depots: Depot[]
  breakLocations: BreakLocationConfig[]
  allDirectoryPoints: DirectoryPointItem[]
  routeUsageMap: Map<string, Route[]>
  filteredRoutes: Route[]
  selectedRoute: Route | null
  handleOpenCreateModal: () => void
  handleOpenEditModal: (routeToEdit: Route) => void
  handleFormSubmit: (routeDataPayload: Route) => void
  handleDeleteWithConfirm: (id: string) => void
  handleSelectRoute: (id: string, viewMode: 'passport' | 'matrix') => void
}

export const useNetworkSettingsLogic = ({ initialSubTab }: UseNetworkSettingsLogicProps = {}): UseNetworkSettingsLogicReturn => {
  const { depots, breakLocations, addBreakLocation, updateBreakLocation, deleteBreakLocation } = useConfigStore()
  const { currentPath } = useScheduleStore()

  let activeSubTab = initialSubTab || 'routes'
  if (activeSubTab === 'intersections') activeSubTab = 'hubs'
  if (!initialSubTab || initialSubTab === 'intersections') {
    if (currentPath.includes('/shared-stops')) activeSubTab = 'shared-stops'
    else if (currentPath.includes('/intersections')) activeSubTab = 'hubs'
    else if (currentPath.includes('/depots')) activeSubTab = 'depots'
    else if (currentPath.includes('/breaks')) activeSubTab = 'breaks'
    else if (currentPath.includes('/stops')) activeSubTab = 'stops'
  }

  // Route Store State & Actions
  const {
    routes,
    searchQuery,
    typeFilter,
    statusFilter,
    selectedRouteId,
    activeViewMode,
    validationErrors,
    setSearchQuery,
    setTypeFilter,
    setStatusFilter,
    setSelectedRouteId,
    setActiveViewMode,
    addRoute,
    updateRoute,
    deleteRoute,
    duplicateRoute,
    updateSegmentTime,
    clearValidationError,
    exportRoutesJson,
    importRoutesJson,
    resetToDefaults
  } = useRouteStore()

  const { controlPoints, addControlPoint, updateControlPoint, deleteControlPoint } = useControlPointStore()

  // «Пункти та Їдальні Обіду»: раніше ці CRUD-функції ходили в цілковито
  // відключений локальний useBreakStore (дані ніде не зберігались і
  // губились при перезавантаженні). Тепер — реальні дані з БД через
  // useConfigStore (той самий, яким уже наповнюється AdminBreakLocationsManager).
  const breaks = breakLocations
  const addBreak = (b: Omit<BreakLocationConfig, 'id'>) => {
    const id = `brk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    addBreakLocation({ ...b, id })
  }
  const updateBreak = (b: BreakLocationConfig) => {
    updateBreakLocation(b)
  }
  const deleteBreak = (id: string) => {
    deleteBreakLocation(id)
  }

  // Hub CRUD State
  const [isHubModalOpen, setIsHubModalOpen] = useState(false)
  const [hubRouteTypeFilter, setHubRouteTypeFilter] = useState<TransportType | 'all'>('all')

  // Modals local state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<Route | null>(null)
  const [editingHub, setEditingHub] = useState<ControlPointNode | null>(null)
  const [activeBreakRouteId, setActiveBreakRouteId] = useState<string | null>(null)
  const [editingBreakConfig, setEditingBreakConfig] = useState<BreakLocationConfig | null>(null)
  const [expandedBreakRouteId, setExpandedBreakRouteId] = useState<string | null>(null)
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false)
  const [selectedRouteForPoints, setSelectedRouteForPoints] = useState<string>('')
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null)
  const [expandedDepotRouteId, setExpandedDepotRouteId] = useState<string | null>(null)

  // Route-Depot Config Store
  const { configs: routeDepotConfigs, addConfig, updateConfig, deleteConfig: deleteRouteDepotConfig } = useRouteDepotStore()
  const stations = useStationStore(state => state.stations)
  const getStationById = useStationStore(state => state.getStationById)

  // Compute combined control points for the global directory
  const { allDirectoryPoints, routeUsageMap } = useMemo(() => {
    const routeUsage = new Map<string, Route[]>()
    
    // Track route usage based on stations and explicitly defined control points
    for (const r of routes) {
      for (const stationId of r.stations || []) {
        if (!routeUsage.has(stationId)) {
          routeUsage.set(stationId, [])
        }
        routeUsage.get(stationId)!.push(r)
      }

      for (const cp of r.controlPoints || []) {
        if (!routeUsage.has(cp.controlPointId)) {
          routeUsage.set(cp.controlPointId, [])
        }
        const arr = routeUsage.get(cp.controlPointId)!
        if (!arr.find(existingR => existingR.id === r.id)) {
          arr.push(r)
        }
      }
    }

    const complexHubs = controlPoints.map(hub => ({
      ...hub,
      isComplex: true
    }))

    return {
      allDirectoryPoints: complexHubs.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      routeUsageMap: routeUsage
    }
  }, [routes, controlPoints])

  // Filtered routes calculation
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const matchesSearch =
        r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = typeFilter === 'all' || r.type === typeFilter
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [routes, searchQuery, typeFilter, statusFilter])

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingRoute(null)
    setIsFormModalOpen(true)
  }

  const handleOpenEditModal = (routeToEdit: Route) => {
    setEditingRoute(routeToEdit)
    setIsFormModalOpen(true)
  }

  const handleFormSubmit = (routeDataPayload: Route) => {
    if (editingRoute) {
      updateRoute(routeDataPayload)
    } else {
      addRoute(routeDataPayload)
    }
  }

  const handleDeleteWithConfirm = (id: string) => {
    const routeToDelete = routes.find((r) => r.id === id)
    if (!routeToDelete) return

    if (window.confirm(`Ви дійсно бажаєте видалити маршрут №${routeToDelete.number} «${routeToDelete.name}»?`)) {
      deleteRoute(id)
    }
  }

  const handleSelectRoute = (id: string, viewMode: 'passport' | 'matrix') => {
    setSelectedRouteId(id)
    setActiveViewMode(viewMode)
  }

  return {
    activeSubTab,
    routes,
    searchQuery,
    typeFilter,
    statusFilter,
    selectedRouteId,
    activeViewMode,
    validationErrors,
    setSearchQuery,
    setTypeFilter,
    setStatusFilter,
    setSelectedRouteId,
    setActiveViewMode,
    addRoute,
    updateRoute,
    deleteRoute,
    duplicateRoute,
    updateSegmentTime,
    clearValidationError,
    exportRoutesJson,
    importRoutesJson,
    resetToDefaults,
    controlPoints,
    addControlPoint,
    updateControlPoint,
    deleteControlPoint,
    breaks,
    addBreak,
    updateBreak,
    deleteBreak,
    isHubModalOpen,
    setIsHubModalOpen,
    hubRouteTypeFilter,
    setHubRouteTypeFilter,
    isFormModalOpen,
    setIsFormModalOpen,
    editingRoute,
    setEditingRoute,
    editingHub,
    setEditingHub,
    activeBreakRouteId,
    setActiveBreakRouteId,
    editingBreakConfig,
    setEditingBreakConfig,
    expandedBreakRouteId,
    setExpandedBreakRouteId,
    isJsonModalOpen,
    setIsJsonModalOpen,
    selectedRouteForPoints,
    setSelectedRouteForPoints,
    expandedRouteId,
    setExpandedRouteId,
    expandedDepotRouteId,
    setExpandedDepotRouteId,
    routeDepotConfigs,
    addDepotConfig: addConfig,
    updateDepotConfig: updateConfig,
    deleteRouteDepotConfig,
    stations,
    getStationById,
    depots,
    breakLocations,
    allDirectoryPoints,
    routeUsageMap,
    filteredRoutes,
    selectedRoute,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleFormSubmit,
    handleDeleteWithConfirm,
    handleSelectRoute
  }
}
