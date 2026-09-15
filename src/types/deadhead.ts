export interface DeadheadDepot {
  id: string
  code: string
  name: string
  type: string
  address: string
  lat: number
  lng: number
  prep_time_min: number
  default_junction: string
}

export interface DeadheadMatrixRecord {
  depot_id: string
  depot_name: string
  depot_code: string
  terminal_name: string
  terminal_type: string
  distance_km: number
  duration_min: number
  junction_stop: string
  path_description: string
}

export interface DeadheadMatrixResponse {
  depots: DeadheadDepot[]
  terminals_count: number
  records_count: number
  matrix: DeadheadMatrixRecord[]
  tariffs: {
    tram_kwh_per_km: number
    trolley_kwh_per_km: number
    electricity_tariff_uah: number
    driver_hourly_rate_uah: number
  }
}

export interface RouteVariant {
  depot_id: string
  depot_code: string
  depot_name: string
  pull_out_km: number
  pull_out_min: number
  pull_out_junction: string
  pull_out_path: string
  pull_in_km: number
  pull_in_min: number
  pull_in_junction: string
  pull_in_path: string
  total_per_duty_km: number
  total_per_duty_min: number
  daily_km: number
  daily_min: number
}

export interface RouteEvaluation {
  route_id: string
  route_number: string
  route_name: string
  transport_type: string
  duties_count: number
  terminals: {
    terminal_a: string
    terminal_b: string
  }
  current_depot: {
    id: string
    code: string
    name: string
    pull_out_min: number
    pull_in_min: number
    daily_km: number
    daily_min: number
  }
  optimal_depot: {
    id: string
    code: string
    name: string
    pull_out_km: number
    pull_out_min: number
    pull_out_junction: string
    pull_out_path: string
    pull_in_km: number
    pull_in_min: number
    pull_in_junction: string
    pull_in_path: string
    daily_km: number
    daily_min: number
  }
  is_already_optimal: boolean
  savings: {
    delta_km_daily: number
    delta_min_daily: number
    kwh_saved_daily: number
    cost_saved_uah_daily: number
  }
  variants: RouteVariant[]
}

export interface NetworkSummary {
  total_routes_analyzed: number
  suboptimal_routes_count: number
  current_total_daily_km: number
  optimal_total_daily_km: number
  daily_km_saved: number
  daily_hours_saved: number
  daily_kwh_saved: number
  daily_cost_saved_uah: number
  annual_cost_saved_uah: number
  annual_co2_tons_saved: number
}

export interface NetworkEvaluationResponse {
  summary: NetworkSummary
  routes: RouteEvaluation[]
}

export interface SingleCalculationResult {
  depot_id: string
  terminal_name: string
  distance_km: number
  duration_min: number
  junction_stop: string
  path_description: string
  is_exact_topological: boolean
}
