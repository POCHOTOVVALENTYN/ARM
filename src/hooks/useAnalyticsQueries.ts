import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/apiClient'

export interface RoutePerformance {
  route_id: string
  total_records: number
  avg_deviation_min: number
  max_deviation_min: number
  on_time_percentage: number
}

export interface IncidentStats {
  total_incidents: number
  resolved_incidents: number
  unresolved_incidents: number
}

export interface KPISummary {
  on_time_percentage: number
  active_routes_count: number
  active_vehicles_count: number
  target_fleet_plan?: number
  active_trams_count?: number
  active_trolleybuses_count?: number
  total_fleet_inventory?: number
  inventory_trams?: number
  inventory_trolleybuses?: number
  inventory_service?: number
  fleet_regularity_pct: number
  total_revenue_trips_today: number
  scheduled_trips_today: number
  total_delays_count: number
  avg_headway_min: number
}

export interface FleetEfficiency {
  tram_efficiency_pct: number
  trolley_efficiency_pct: number
  total_active_trams: number
  total_active_trolleybuses: number
  total_inventory_trams?: number
  total_inventory_trolleybuses?: number
  total_inventory_fleet?: number
  in_maintenance: number
  reserve_fleet: number
}

export interface AnalyticsOverview {
  status: string
  timestamp: string
  tram_network_status: string
  trolley_network_status: string
  weather_impact: string
  air_raid_status: string
}

export interface ActiveIncident {
  id: number
  vehicle_id?: string
  route_id?: string
  description?: string
  status?: string
  source?: string
  recorded_at?: string
  resolution_notes?: string
}

export const useDailyPerformance = (targetDate: string) => {
  return useQuery({
    queryKey: ['analytics-performance', targetDate],
    queryFn: async () => {
      const { data } = await api.get<RoutePerformance[]>(`/analytics/daily-performance?target_date=${targetDate}`)
      return data || []
    },
    enabled: Boolean(targetDate),
    staleTime: 1000 * 60 * 5,
  })
}

export const useIncidentsSummary = (targetDate: string) => {
  return useQuery({
    queryKey: ['analytics-incidents', targetDate],
    queryFn: async () => {
      const { data } = await api.get<IncidentStats>(`/analytics/incidents-summary?target_date=${targetDate}`)
      return data
    },
    enabled: Boolean(targetDate),
    staleTime: 1000 * 60 * 5,
  })
}

export const useKPISummary = () => {
  return useQuery({
    queryKey: ['analytics-kpi-summary'],
    queryFn: async () => {
      const { data } = await api.get<KPISummary>('/analytics/kpi')
      return data
    },
    staleTime: 1000 * 30,
    refetchInterval: 15000,
  })
}

export const useFleetEfficiency = () => {
  return useQuery({
    queryKey: ['analytics-fleet-efficiency'],
    queryFn: async () => {
      const { data } = await api.get<FleetEfficiency>('/analytics/fleet-efficiency')
      return data
    },
    staleTime: 1000 * 60,
    refetchInterval: 30000,
  })
}

export const useAnalyticsOverview = () => {
  return useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsOverview>('/analytics/overview')
      return data
    },
    staleTime: 1000 * 60,
  })
}

export const useActiveIncidents = () => {
  return useQuery({
    queryKey: ['incidents-active'],
    queryFn: async () => {
      const { data } = await api.get<ActiveIncident[]>('/incidents/active')
      return Array.isArray(data) ? data : []
    },
    staleTime: 1000 * 10,
    refetchInterval: 10000,
  })
}
