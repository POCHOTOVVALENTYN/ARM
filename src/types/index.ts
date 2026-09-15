export type TransportType = 'tram' | 'trolleybus' | 'electrobus';

export type ScheduleStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ScheduleResponse {
  id: number;
  route_id: string;
  active_date: string;
  status: ScheduleStatus;
  created_at: string;
  duties: any[]; // we'll use any[] for now, or define StaticDutyResponse if needed, wait, we use duties to extract trips
}
export interface Station {
  id: string;
  name: string;
  code: string;
  isTerminal: boolean;
  lat?: number;
  lng?: number;
}

export type DayType = 'workday' | 'weekend' | 'holiday';

export interface DutyTypeCount {
  singleShift: number;
  doubleShift: number;
  peak: number;
  split: number;
}

export interface DailyDeploymentPlan {
  id: string; // e.g. "2026-08-05_T5"
  date: string; // YYYY-MM-DD
  routeId: string;
  dutiesCount: DutyTypeCount;
}

export type TimePeriod = 
  | 'morning_exit'    // Ранковий виїзд (05:00 - 06:30)
  | 'morning_peak'    // Ранковий пік (06:30 - 09:30)
  | 'off_peak'         // Міжпіковий період (09:30 - 16:00)
  | 'evening_peak'     // Вечірній пік (16:00 - 19:30)
  | 'evening_decline'; // Спад перед комендантською годиною (19:30 - 22:30)

export type ShiftType = 'single' | 'double' | 'peak' | 'split';

export interface RouteSegment {
  fromStationId: string;
  toStationId: string;
  distanceKm: number;
  baseTravelTimes: Record<TimePeriod, number>; // travel time in minutes
  trafficLightCount: number;
  avgTrafficLightDelayMin: number;
  isSharedSegment: boolean;
  sharedWithRoutes: string[];
}

export type RouteStatus = 'active' | 'maintenance' | 'suspended' | 'reserve';

export interface Route {
  id: string;
  number: string;
  name: string;
  type: TransportType;
  status: RouteStatus;
  primaryTerminalId?: string;
  secondaryTerminalId?: string;
  lengthDir1Km?: number;
  lengthDir2Km?: number;
  length_km?: number;
  default_speed_kmh?: number;
  round_trip_min?: number;
  t_dir0_min?: number;
  t_dir1_min?: number;
  layover_min?: number;
  color?: string;
  stations?: string[];
  allStations?: string[]; // Includes unique stations from both directions
  segments: RouteSegment[];
  controlPoints?: RouteControlPoint[];
  description?: string;
  activeVehiclesCount?: {
    workday: number;
    weekend: number;
    holiday: number;
  };
}

export type TrackType = 'main_loop' | 'passing_loop' | 'terminal' | 'idle' | 'passenger_platform';
export type ControlPointType = 'terminal' | 'intermediate' | 'depot_access' | 'technical';

export interface RouteControlPoint {
  id: string; // unique mapping ID
  controlPointId: string; // ID of the HubNode / Control Point
  tracksCount: number; // e.g. 1 or 2
  trackType: TrackType; // e.g. 'main_loop'
  pointType: ControlPointType; // e.g. 'terminal'
}

export interface HubTrackChannel {
  trackId: string;
  name: string; // e.g. "Колія 1 (Північний напрямок)"
  maxCapacity: number;
  directionVector: string; // e.g. "North-Bound"
}

export interface HubNode {
  id: string;
  name: string;
  locationDescription: string;
  availableTracksCount: number;
  channels: HubTrackChannel[];
  minHeadwayMin: number; // h_min = 2..4 mins
  routesConnecting: string[];
}

export type ControlPointNode = HubNode;

export interface Depot {
  id: string;
  name: string;
  type: TransportType;
  address: string;
  lat: number;
  lng: number;
  prepTimeMin: number; // 10 min tram, 19 min trolleybus
}

export interface GtfsTerminal {
  firstStopId: string;
  firstStopName: string;
  lastStopId: string;
  lastStopName: string;
}

export interface GtfsLogicalRoute {
  id: string;
  short_name: string;
  long_name: string;
  type: 'tram' | 'trolleybus' | 'electrobus';
  directions: {
    '0'?: GtfsTerminal;
    '1'?: GtfsTerminal;
  };
}

export interface PullOutInDetails {
  targetStationId: string;
  distanceKm: number;
  durationMin: number;
  passengerPickupAllowed: boolean;
}

export interface RouteDepotConfig {
  id: string;
  routeId: string;
  depotId: string;
  pullOut: {
    dir0?: PullOutInDetails;
    dir1?: PullOutInDetails;
  };
  pullIn: {
    dir0?: PullOutInDetails;
    dir1?: PullOutInDetails;
  };
}

export interface BreakLocationConfig {
  id: string;
  routeId: string;
  locationId: string; // ID of the stop, terminal or dispatch point
  locationName: string;
  locationType: 'dispatch_point' | 'opposite_terminal' | 'global_hub';
  maxCapacityVehicles: number;
  durationMin: number; // Standard: 15/10 min for tram, 20 min for trolleybus
}

export type SmoothingState = 'normal' | 'delay' | 'catchup';

export interface StopTime {
  stop_id: string;
  stop_sequence: number;
  arrival_time: string;
  departure_time: string;
}

export interface Trip {
  id: string;
  blockId: string;
  dutyId: string;
  routeId: string;
  direction: 1 | 2 | 'FORWARD' | 'BACKWARD';
  departureTime: string; // HH:mm
  arrivalTime: string;   // HH:mm
  startStationId: string;
  endStationId: string;
  isZeroRun?: boolean;
  isLunchBreak?: boolean;
  isTruncated?: boolean;
  slackMin?: number; // Delay / slack added in minutes
  status: 'normal' | 'delayed' | 'truncated' | 'reserve';
  
  // Fields from StaticSchedule API response
  duty_id?: string;
  smoothing_state?: SmoothingState;
  smoothing_delta?: number;
  stop_times?: StopTime[];
}

export interface VehicleBlock {
  id: string;
  vehicleNumber: string;
  type: TransportType;
  depotId: string;
  routeId: string;
  date?: string;
  dayType?: DayType;
  scheduleType?: ShiftType;
  initialDestination?: 'dispatcher_point' | 'opposite_terminal';
  depotExitTime: string;
  depotReturnTime: string;
  trips: Trip[];
  // Electrobus specific battery parameters
  batteryCapacitykWh?: number; // e.g. 200 kWh
  currentSoC?: number;         // State of Charge in % (0 - 100)
  consumptionPerKm?: number;   // kWh per km (1.1 - 1.8)
  chargingPowerkW?: number;    // e.g. 150 kW pantograph / fast charger
}

export interface DriverDuty {
  id: string;
  driverName: string;
  driverBadge: string;
  shiftType: ShiftType;
  transportType?: TransportType; // 'tram' | 'trolleybus' | 'electrobus'
  depotId?: string;              // 'depot_1', 'depot_2', 'depot_3'
  routeId?: string | number;
  shiftStartTime: string;        // HH:mm
  shiftEndTime: string;          // HH:mm
  totalShiftMin: number;
  drivingTimeMin?: number;       // pure driving time
  prepTimeMin?: number;          // 10 min tram, 19 min trolleybus
  lunchStartTime?: string;       // HH:mm
  lunchDurationMin: number;      // Actual lunch/break duration
  standardLunchMin?: number;     // 15/10 min tram, 20 min trolleybus
  overtimeLunchMin?: number;     // Extra break time added to total work time
  lunchLocationName?: string;    // e.g. "Старосінна площа"
  assignedBlockIds: string[];
  isViolating10hLimit: boolean;
  isLunchCompliant: boolean;
  lunchWindowViolation?: boolean;// Violation if lunch is outside 4h-6h window
}

export interface ScheduleConflict {
  id: string;
  nodeId: string;
  nodeName: string;
  trackId: string;
  vehicle1Id: string;
  vehicle1Route: string;
  vehicle2Id: string;
  vehicle2Route: string;
  arrivalTime1: string;
  arrivalTime2: string;
  actualHeadwayMin: number;
  requiredHeadwayMin: number;
  timeGapMin: number;
}

export interface EmergencyDetourTemplate {
  id: string;
  title: string;
  cause: string;
  affectedRouteIds: string[];
  affectedStationIds: string[];
  detourDescription: string;
  alternativeStations: string[];
}

export interface EmergencyDetour {
  id: string;
  templateId: string;
  routeId: string;
  title: string;
  cause: string;
  activeStatus: boolean;
  affectedStationIds: string[];
  detourDescription: string;
  alternativeStations: string[];
  startTime: string;
  estimatedEndTime: string;
}

// --- ЕТАЛОННІ РОЗКЛАДИ ТА ЗВЕДЕНА ТАБЛИЦЯ РЕЙСІВ КП «ОМЕТ» ---

export interface ControlPointConfig {
  id: string;
  name: string;
  is_dp?: boolean;
  is_break?: boolean;
  is_junction?: boolean;
  is_terminus?: boolean;
  offset_fwd?: number;
  offset_bwd?: number;
}

export interface SummaryPassport {
  route_id: string;
  route_name: string;
  transport_type: string;
  designated_dp_name: string;
  depot_name?: string;
  total_wagon_hours: number;
  total_wagon_km: number;
  total_shifts: number;
  total_trips: number;
  round_trip_min: number;
  operating_speed_kmh: number;
  route_length_km: number;
  headway_min: number;
  duties_count: number;
  schedule_period: string;
  schedule_type: string;
  station_a_name: string;
  station_b_name: string;
  control_points: ControlPointConfig[];
}

export interface MasterGridLunchBreak {
  start: string;
  end: string;
  duration_min: number;
  standard_min: number;
  is_overtime: boolean;
  overtime_min: number;
  is_paid_break: boolean;
  location: string;
}

export interface MasterGridRound {
  round_number: number;
  departure_station_a: string;
  departure_station_b: string;
  arrival_station_a?: string;
  layover_station_a_min?: number;
  tag?: 'LUNCH' | 'SHIFT_CHANGE' | 'ROTATION' | 'PULL_OUT' | 'PULL_IN' | null;
  note?: string;
  lunch_break?: MasterGridLunchBreak | null;
}

export interface MasterGridRow {
  duty_number: string;
  duty_type: 'DOUBLE' | 'SINGLE' | 'SPLIT' | 'PEAK';
  start_location: string;
  vehicle_id: string;
  vehicle_id_2?: string | null;
  depot_name: string;
  zero_run_min?: number;
  zero_run_km?: number;
  junction_stop?: string;
  rotation_location?: string | null;
  driver_arrival_time: string;
  pullout_time: string;
  dp_arrival_time: string;
  first_departure_time: string;
  pullin_time: string;
  total_work_hours_str: string;
  shift1_hours_str: string;
  shift2_hours_str: string;
  rounds: MasterGridRound[];
}

export interface DutyBookCPTime {
  cp_id: string;
  cp_name: string;
  arrival_time: string;
  is_dp?: boolean;
  is_break?: boolean;
}

export interface DutyBookTrip {
  trip_number: number;
  round_number: number;
  direction: 'FORWARD' | 'BACKWARD' | 'PULL_OUT' | 'PULL_IN';
  direction_label: string;
  departure_time: string;
  arrival_time: string;
  layover_min: number;
  vehicle_id: string;
  event_tag: string;
  control_point_times: DutyBookCPTime[];
}

export interface DutyBookDriver {
  name: string;
  arrival_time?: string;
  pullout_time?: string;
  start_time: string;
  lunch_time: string;
  pullin_time?: string;
  shift_end_time: string;
}

export interface DutyBook {
  duty_number: string
  route_id: string
  route_name: string
  transport_type: string
  depot_name: string
  zero_run_min?: number
  zero_run_km?: number
  junction_stop?: string
  rotation_location?: string | null
  schedule_period: string
  schedule_type: string
  vehicle_id: string
  vehicle_id_2?: string | null
  duty_type: 'DOUBLE' | 'SINGLE' | 'SPLIT' | 'PEAK'
  driver1: DutyBookDriver
  driver2: DutyBookDriver
  trips: DutyBookTrip[]
}

export interface MasterScheduleData {
  summary_passport: SummaryPassport;
  master_grid_rows: MasterGridRow[];
  duty_books: Record<string, DutyBook>;
}

export interface MasterScheduleArchiveItem {
  id: string
  routeId: string
  routeName: string
  transportType: string
  scheduleType: string
  schedulePeriod: string
  dutiesCount: number
  totalTrips: number
  totalWagonKm: number
  totalWagonHours: number
  totalShifts: number
  savedAt: string
  data: MasterScheduleData
}

export interface GenerateMasterSchedulePayload {
  route_id: string
  route_name?: string
  transport_type?: string
  duties_count: number
  round_trip_min: number
  route_length_km: number
  default_speed_kmh: number
  start_time?: string
  end_time?: string
  designated_dp_name?: string
  control_points?: ControlPointConfig[]
  depot_name?: string
  depot_zero_run_min?: number
  depot_zero_run_km?: number
  depot_junction_stop_name?: string
  start_stations_per_duty?: Record<string, string>
  duty_types_per_duty?: Record<string, string>
  depots_per_duty?: Record<string, string>
  schedule_period?: string
  schedule_type?: string
}
