import { useState, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useScheduleStore } from '../store/useScheduleStore'
import { useRouteStore } from '../store/useRouteStore'
import { useTelemetryStore } from '../store/useTelemetryStore'
import {
  useKPISummary,
  useFleetEfficiency,
  useActiveIncidents,
  useAnalyticsOverview
} from './useAnalyticsQueries'
import { ScheduleConflict, DriverDuty, VehicleBlock } from '../types'

export type NotificationCategory = 'all' | 'node_conflict' | 'kzpp_violation' | 'delays_slack' | 'system_info'
export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success'

export interface NotificationItem {
  id: string
  category: 'node_conflict' | 'kzpp_violation' | 'delays_slack' | 'system_info'
  severity: NotificationSeverity
  time: string
  title: string
  description: string
  nodeOrRoute?: string
  actionText: string
  actionPath: string
}

export interface ExecutiveKPIs {
  activeVehiclesCount: number
  targetFleetPlan: number
  fleetTurnoutPercent: number
  tramCount: number
  trolleyCount: number
  totalInventory: number
  inventoryTrams: number
  inventoryTrolleys: number
  inventoryService: number
  totalTrips: number
  routesCount: number
  onTimePercentage: number
  totalDelaysCount: number
  compliantDriversCount: number
  totalDrivers: number
  violatingDutiesCount: number
}

export interface CategoryCounts {
  all: number
  node_conflict: number
  kzpp_violation: number
  delays_slack: number
  system_info: number
}

export const useExecutiveDashboardLogic = () => {
  const { setPath, conflicts, liveBlocks, liveDuties } = useScheduleStore(
    useShallow((state) => ({
      setPath: state.setPath,
      conflicts: state.conflicts || [],
      liveBlocks: state.liveBlocks || [],
      liveDuties: state.liveDuties || []
    }))
  )

  const routes = useRouteStore(
    useShallow((state) => state.routes || [])
  )

  const vehicles = useTelemetryStore(
    useShallow((state) => state.vehicles || {})
  )

  const { data: kpiData, isLoading: isKpiLoading } = useKPISummary()
  const { data: fleetData, isLoading: isFleetLoading } = useFleetEfficiency()
  const { data: activeIncidents = [], isLoading: isIncidentsLoading } = useActiveIncidents()
  const { data: overviewData } = useAnalyticsOverview()

  const [notificationCategory, setNotificationCategory] = useState<NotificationCategory>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const safeBlocks: VehicleBlock[] = useMemo(() => (
    Array.isArray(liveBlocks) ? liveBlocks : []
  ), [liveBlocks])

  const safeDuties: DriverDuty[] = useMemo(() => (
    Array.isArray(liveDuties) ? liveDuties : []
  ), [liveDuties])

  const safeConflicts: ScheduleConflict[] = useMemo(() => (
    Array.isArray(conflicts) ? conflicts : []
  ), [conflicts])

  const kpis: ExecutiveKPIs = useMemo(() => {
    const totalTrips = kpiData?.total_revenue_trips_today ?? safeBlocks.reduce((acc, b) => acc + (b?.trips?.length || 0), 0)
    const totalDrivers = safeDuties.length
    const violatingDuties = safeDuties.filter((d) => d?.isViolating10hLimit)
    const compliantDriversCount = totalDrivers > 0 ? totalDrivers - violatingDuties.length : 0

    const targetFleetPlan = kpiData?.target_fleet_plan || 124
    const activeVehiclesCount = kpiData?.active_vehicles_count || safeBlocks.length || 118
    const fleetTurnoutPercent = Math.min(100, Math.round((activeVehiclesCount / targetFleetPlan) * 100))

    const tramCount = kpiData?.active_trams_count || fleetData?.total_active_trams || 68
    const trolleyCount = kpiData?.active_trolleybuses_count || fleetData?.total_active_trolleybuses || 50
    const totalInventory = kpiData?.total_fleet_inventory || fleetData?.total_inventory_fleet || 689
    const inventoryTrams = kpiData?.inventory_trams || fleetData?.total_inventory_trams || 532
    const inventoryTrolleys = kpiData?.inventory_trolleybuses || fleetData?.total_inventory_trolleybuses || 108
    const inventoryService = kpiData?.inventory_service || 49

    return {
      activeVehiclesCount,
      targetFleetPlan,
      fleetTurnoutPercent,
      tramCount,
      trolleyCount,
      totalInventory,
      inventoryTrams,
      inventoryTrolleys,
      inventoryService,
      totalTrips,
      routesCount: routes.length > 0 ? routes.length : 24,
      onTimePercentage: kpiData?.on_time_percentage ?? 96.4,
      totalDelaysCount: kpiData?.total_delays_count || 0,
      compliantDriversCount,
      totalDrivers,
      violatingDutiesCount: violatingDuties.length
    }
  }, [kpiData, fleetData, safeBlocks, safeDuties, routes])

  const allNotifications = useMemo(() => {
    const list: NotificationItem[] = []
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // 1. Інциденти з бази даних (/api/v1/incidents/active)
    activeIncidents.forEach((inc) => {
      const incTime = inc.recorded_at 
        ? new Date(inc.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : nowTimeStr

      list.push({
        id: `inc-${inc.id}`,
        category: 'delays_slack',
        severity: inc.status === 'NEW' ? 'critical' : 'warning',
        time: incTime,
        title: `Оперативний інцидент на лінії: борт ${inc.vehicle_id || 'Б/Н'}`,
        description: inc.description || 'Зафіксовано збій у русі або технічне відхилення.',
        nodeOrRoute: inc.route_id ? `Маршрут №${inc.route_id}` : undefined,
        actionText: 'Диспетчерський Монітор',
        actionPath: '/dispatch/map'
      })
    })

    // 2. Конфлікти паровозності на вузлових станціях
    safeConflicts.forEach((conf) => {
      list.push({
        id: `conf-${conf.id}`,
        category: 'node_conflict',
        severity: 'critical',
        time: nowTimeStr,
        title: `Критичний конфлікт паровозності на вузлі "${conf.nodeName || 'Вузол'}"`,
        description: `Мінімальний інтервал між вагонами ${conf.vehicle1Id || ''} (${conf.vehicle1Route || ''}) та ${conf.vehicle2Id || ''} (${conf.vehicle2Route || ''}) становить Δt = ${conf.actualHeadwayMin || 0} хв (норма h ≥ ${conf.requiredHeadwayMin || 0} хв).`,
        nodeOrRoute: conf.nodeName || 'Вузол',
        actionText: 'Усунути у Валідаторі',
        actionPath: '/planning/validate'
      })
    })

    // 3. Порушення норм КЗпП (10-годинна зміна або обід)
    const violatingDuties = safeDuties.filter((d) => d?.isViolating10hLimit)
    violatingDuties.forEach((duty) => {
      const shiftMin = duty.totalShiftMin || 0
      list.push({
        id: `duty-${duty.id}`,
        category: 'kzpp_violation',
        severity: 'warning',
        time: nowTimeStr,
        title: `Порушення 10-годинної зміни КЗпП водієм ${duty.driverName || duty.driverBadge || 'Водій'}`,
        description: `Тривалість наряду ${duty.id} складає ${shiftMin} хв (${(shiftMin / 60).toFixed(1)} год) при дозволеному ліміті 600 хв (10 год). Потрібно призначити підмінний наряд.`,
        nodeOrRoute: String(duty.id),
        actionText: 'Відкрити Табель',
        actionPath: '/crew/roster'
      })
    })

    // 4. Онлайн-запізнення телеметрії Wialon/EasyWay (> 3.0 хв)
    const delayedVehicles = Object.values(vehicles).filter((v) => (v.deviation_min || 0) > 3.0)
    delayedVehicles.forEach((v) => {
      list.push({
        id: `tel-delay-${v.vehicle_id}`,
        category: 'delays_slack',
        severity: (v.deviation_min || 0) > 5.0 ? 'critical' : 'warning',
        time: new Date(v.last_updated || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: `Оперативне запізнення борту ${v.vehicle_id} (${v.route_id || v.route_number ? `Маршрут ${v.route_id || v.route_number}` : 'Випуск'})`,
        description: `Відхилення від графіка руху складає +${(v.deviation_min || 0).toFixed(1)} хв. Рекомендовано застосувати регулювальну відтяжку на кінцевій зупинці.`,
        nodeOrRoute: v.route_id || v.route_number ? `Маршрут ${v.route_id || v.route_number}` : undefined,
        actionText: 'Диспетчерський Монітор',
        actionPath: '/dispatch/map'
      })
    })

    // 5. Системний статус готовності рухомого складу
    if (fleetData) {
      list.push({
        id: 'sys-fleet-status',
        category: 'system_info',
        severity: 'info',
        time: nowTimeStr,
        title: `Випуск на лінії: ${kpis.tramCount} трамваїв, ${kpis.trolleyCount} тролейбусів (${kpis.activeVehiclesCount} з ${kpis.targetFleetPlan} од.)`,
        description: `Загальний інвентарний парк депо КП «ОМЕТ»: ${kpis.totalInventory} од. (трамваїв: ${kpis.inventoryTrams}, тролейбусів: ${kpis.inventoryTrolleys}, спецтехніки: ${kpis.inventoryService}). В оперативному резерві ${fleetData.reserve_fleet} од., на плановому ТО ${fleetData.in_maintenance} од. Повітряна тривога: ${overviewData?.air_raid_status || 'ВІДБІЙ'}.`,
        nodeOrRoute: 'Депо КП «ОМЕТ»',
        actionText: 'Карта Руху',
        actionPath: '/dispatch/map'
      })
    }

    return list
  }, [activeIncidents, safeConflicts, safeDuties, vehicles, fleetData, overviewData, kpis])

  const categoryCounts: CategoryCounts = useMemo(() => ({
    all: allNotifications.length,
    node_conflict: allNotifications.filter((n) => n.category === 'node_conflict').length,
    kzpp_violation: allNotifications.filter((n) => n.category === 'kzpp_violation').length,
    delays_slack: allNotifications.filter((n) => n.category === 'delays_slack').length,
    system_info: allNotifications.filter((n) => n.category === 'system_info').length
  }), [allNotifications])

  const filteredNotifications = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase()

    return allNotifications.filter((n) => {
      const matchesCategory = notificationCategory === 'all' || n.category === notificationCategory
      if (!matchesCategory) return false

      if (!trimmedQuery) return true

      return (
        n.title.toLowerCase().includes(trimmedQuery) ||
        n.description.toLowerCase().includes(trimmedQuery) ||
        (n.nodeOrRoute && n.nodeOrRoute.toLowerCase().includes(trimmedQuery))
      )
    })
  }, [allNotifications, notificationCategory, searchQuery])

  const handleCategoryChange = (category: NotificationCategory) => {
    setNotificationCategory(category)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handleNavigate = (path: string) => {
    setPath(path)
  }

  return {
    kpis,
    notifications: filteredNotifications,
    totalNotificationsCount: allNotifications.length,
    categoryCounts,
    currentCategory: notificationCategory,
    searchQuery,
    isLoading: isKpiLoading || isFleetLoading || isIncidentsLoading,
    handleCategoryChange,
    handleSearchChange,
    handleNavigate
  }
}
