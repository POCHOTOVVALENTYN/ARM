import apiClient from '../utils/apiClient'
import { DetailedRouteOverlap } from '../constants/odessaCorridors'

export interface RouteVariantPreset {
  variant_key: string
  title: string
  terminals: string
  stops_count: number
  length_km: number
  round_trip_min: number
  default_speed_kmh: number
  is_active: boolean
}

export interface RouteVariantsResponse {
  route_id: string
  route_number: string
  name: string
  active_variant: string
  variant_notes?: string
  presets: RouteVariantPreset[]
}

export interface StopWithPassingRoutes {
  id: string
  stop_id: string
  stop_name: string
  transport_type: 'TRAM' | 'TROLLEYBUS'
  routes: string[]
  route_count: number
  is_shared: boolean
  is_dispatch_station: boolean
  break_capacity: number
  lat?: number
  lng?: number
}

export const getRouteSharedCorridors = async (
  routeId: string
): Promise<DetailedRouteOverlap[]> => {
  if (!routeId) return []
  try {
    const res = await apiClient.get<DetailedRouteOverlap[]>(`/routes/${routeId}/shared-corridors`)
    if (Array.isArray(res.data)) {
      return res.data
    }
    return []
  } catch (err) {
    console.warn(`[routesApi] Не вдалося завантажити суміщені ділянки для маршруту ${routeId}:`, err)
    return []
  }
}

export const getRouteVariants = async (
  routeId: string
): Promise<RouteVariantsResponse | null> => {
  if (!routeId) return null
  try {
    const res = await apiClient.get<RouteVariantsResponse>(`/routes/${routeId}/variants`)
    return res.data || null
  } catch (err) {
    console.warn(`[routesApi] Не вдалося отримати варіанти для маршруту ${routeId}:`, err)
    return null
  }
}

export const switchRouteVariant = async (
  routeId: string,
  variantKey: string
): Promise<{ status: string; active_variant: string; length_km: number; round_trip_min: number } | null> => {
  if (!routeId || !variantKey) return null
  try {
    const res = await apiClient.post(`/routes/${routeId}/switch-variant`, {
      variant_key: variantKey
    })
    return res.data || null
  } catch (err) {
    console.error(`[routesApi] Помилка зміни схеми маршруту ${routeId}:`, err)
    throw err
  }
}

export const recalculateAllCorridors = async (): Promise<boolean> => {
  try {
    await apiClient.post('/routes/recalculate-all-corridors')
    return true
  } catch (err) {
    console.error('[routesApi] Помилка перерахунку топології:', err)
    return false
  }
}

export const getStopsWithRoutes = async (
  transportType?: string,
  isSharedOnly: boolean = false
): Promise<StopWithPassingRoutes[]> => {
  try {
    const params = new URLSearchParams()
    if (transportType && transportType !== 'all') {
      params.append('transport_type', transportType.toUpperCase())
    }
    if (isSharedOnly) {
      params.append('is_shared_only', 'true')
    }
    const res = await apiClient.get<StopWithPassingRoutes[]>(`/stations/stops-with-routes?${params.toString()}`)
    return Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.warn('[routesApi] Не вдалося отримати зупинки з маршрутами:', err)
    return []
  }
}
