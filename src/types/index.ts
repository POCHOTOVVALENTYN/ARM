export type TransportType = 'tram' | 'trolleybus';

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
  | 'morning_exit'      // Ранковий виїзд (05:00 - 06:30)
  | 'morning_peak'      // Ранковий пік (06:30 - 09:30)
  | 'off_peak'          // Міжпіковий період (09:30 - 16:00)
  | 'evening_peak'      // Вечірній пік (16:00 - 19:30)
  | 'evening_decline';  // Спад перед комендантською годиною (19:30 - 22:30)

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
  primaryTerminalId: string;
  secondaryTerminalId: string;
  lengthDir1Km: number;
  lengthDir2Km: number;
  stations: string[];
  allStations?: string[]; // Includes unique stations from both directions
  segments: RouteSegment[];
  controlPoints?: RouteControlPoint[]; // <-- added mapping
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

export type ControlPointNode = HubNode; // Alias for HubNode

export interface Depot {
  id: string;
  name: string; // e.g. "Трамвайне депо №1 (Водопровідна)"
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
  id: string; // e.g. "tram_3"
  short_name: string;
  long_name: string;
  type: 'tram' | 'trolleybus';
  directions: {
    '0'?: GtfsTerminal;
    '1'?: GtfsTerminal;
  };
}

export interface PullOutInDetails {
  targetStationId: string; // The GTFS stop_id it pulls out to / pulls in from
  distanceKm: number;
  durationMin: number;
  passengerPickupAllowed: boolean;
}

export interface RouteDepotConfig {
  id: string; // UUID
  routeId: string; // e.g. "tram_3"
  depotId: string; // e.g. "depot-1"
  pullOut: {
    dir0?: PullOutInDetails; // to dir0 firstStop
    dir1?: PullOutInDetails; // to dir1 firstStop
  };
  pullIn: {
    dir0?: PullOutInDetails; // from dir0 lastStop
    dir1?: PullOutInDetails; // from dir1 lastStop
  };
}

export interface BreakLocationConfig {
  id: string;
  routeId: string;
  locationId: string; // ID of the stop or dispatch point
  locationName: string;
  locationType: 'dispatch_point' | 'terminal' | 'stop';
  maxCapacityVehicles: number;
  durationMin: number;
}

export interface Trip {
  id: string;
  blockId: string;
  dutyId: string;
  routeId: string;
  direction: 1 | 2; // 1: Forward, 2: Reverse
  departureTime: string; // HH:mm
  arrivalTime: string;   // HH:mm
  startStationId: string;
  endStationId: string;
  isZeroRun?: boolean;
  isLunchBreak?: boolean;
  isTruncated?: boolean;
  slackMin?: number; // Delay / slack added in minutes
  status: 'normal' | 'delayed' | 'truncated' | 'reserve';
}

export interface VehicleBlock {
  id: string; // e.g. BlockID-301
  vehicleNumber: string;
  type: TransportType;
  depotId: string;
  routeId: string;
  date?: string; // YYYY-MM-DD
  dayType?: DayType;
  scheduleType?: ShiftType;
  initialDestination?: 'dispatcher_point' | 'opposite_terminal';
  depotExitTime: string;  // HH:mm
  depotReturnTime: string; // HH:mm
  trips: Trip[];
}

export interface DriverDuty {
  id: string; // e.g. DutyID-101
  driverName: string;
  driverBadge: string;
  shiftType: ShiftType;
  shiftStartTime: string; // HH:mm
  shiftEndTime: string;   // HH:mm
  totalShiftMin: number;
  lunchStartTime?: string; // HH:mm
  lunchDurationMin: number;
  assignedBlockIds: string[];
  isViolating10hLimit: boolean;
  isLunchCompliant: boolean;
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
  cause: string; // e.g. "ДТП / Обрив контактної мережі"
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

export interface DutyTypeCount {
  singleShift: number;
  doubleShift: number;
  peak: number;
  split: number;
}

export interface DailyDeploymentPlan {
  id: string; // e.g. "2026-08-05_T3"
  date: string; // YYYY-MM-DD
  routeId: string;
  dutiesCount: DutyTypeCount;
}
