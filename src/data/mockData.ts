import {
  Station,
  HubNode,
  Depot,
  RouteDepotConfig,
  BreakLocationConfig,
  DriverDuty,
  EmergencyDetour,
  EmergencyDetourTemplate,
  Route,
  ScheduleConflict,
  Trip,
  VehicleBlock
} from '../types';

export const STATIONS = [
  { id: 'st_starosinna', name: 'Старосінна площа', code: 'СТП', isTerminal: true },
  { id: 'st_vokzal', name: 'Залізничний вокзал', code: 'ЗВК', isTerminal: true },
  { id: 'st_vodoprovidna', name: 'вул. Водопровідна', code: 'ВДП', isTerminal: false },
  { id: 'st_lustdorf_1st', name: '1-ша ст. Люстдорфської дороги', code: 'ЛС1', isTerminal: false },
  { id: 'st_lustdorf_3rd', name: '3-тя ст. Люстдорфської дороги', code: 'ЛС3', isTerminal: false },
  { id: 'st_lustdorf_5th', name: '5-та ст. Люстдорфської дороги', code: 'ЛС5', isTerminal: false },
  { id: 'st_lustdorf_11th', name: '11-та ст. Люстдорфської дороги', code: 'Л11', isTerminal: true },
  { id: 'st_paustovskoho', name: 'вул. Паустовського', code: 'ПСТ', isTerminal: true },
  { id: 'st_peresyp', name: 'Пересипський міст', code: 'ПРМ', isTerminal: false },
  { id: 'st_tiraspol', name: 'Тираспольська площа', code: 'ТРП', isTerminal: true },
  { id: 'st_rabina', name: 'вул. Іцхака Рабіна', code: 'РБН', isTerminal: true },
  { id: 'st_rishelievska', name: 'вул. Рішельєвська', code: 'РШЛ', isTerminal: true },
  { id: 'st_pivdenny', name: 'Ринок «Південний»', code: 'ПВД', isTerminal: true },
  { id: 'st_superfosfat', name: 'Суперфосфатний завод', code: 'СПФ', isTerminal: true },
];

export const MOCK_DEPOTS: Depot[] = [
  {
    id: 'depot_tram_1',
    name: 'Трамвайне депо №1',
    type: 'tram',
    address: 'вул. Водопровідна, 1',
    lat: 46.4678,
    lng: 30.7311,
    prepTimeMin: 10
  },
  {
    id: 'depot_tram_2',
    name: 'Трамвайне депо №2',
    type: 'tram',
    address: 'вул. Академіка Воробйова, 1',
    lat: 46.4952,
    lng: 30.7183,
    prepTimeMin: 10
  },
  {
    id: 'depot_trolley_1',
    name: 'Тролейбусне депо №1',
    type: 'trolleybus',
    address: 'вул. Інглезі, 2',
    lat: 46.4281,
    lng: 30.7042,
    prepTimeMin: 19
  }
];

export const MOCK_HUBS: HubNode[] = [
  {
    id: 'hub_starosinna',
    name: 'Старосінна площа',
    locationDescription: 'Головне трамвайне кільце біля Залізничного вокзалу (4 паралельні колії)',
    availableTracksCount: 4,
    minHeadwayMin: 2,
    routesConnecting: ['T3', 'T7', 'T10'],
    channels: [
      { trackId: 'tr_1', name: 'Колія №1 (Люстдорфський напрямок)', maxCapacity: 3, directionVector: 'South' },
      { trackId: 'tr_2', name: 'Колія №2 (Центральний напрямок)', maxCapacity: 3, directionVector: 'North' },
      { trackId: 'tr_3', name: 'Колія №3 (Відстій / Обіди водіїв)', maxCapacity: 2, directionVector: 'Idle' },
      { trackId: 'tr_4', name: 'Колія №4 (Обхідна колія)', maxCapacity: 2, directionVector: 'Pass' }
    ]
  },
  {
    id: 'hub_tiraspol',
    name: 'Тираспольська площа',
    locationDescription: 'Кільцевий вузол перетину вулиць Преображенська та Тираспольська',
    availableTracksCount: 3,
    minHeadwayMin: 3,
    routesConnecting: ['T3', 'T10'],
    channels: [
      { trackId: 'tr_t1', name: 'Колія №1 (Головне кільце)', maxCapacity: 2, directionVector: 'Loop' },
      { trackId: 'tr_t2', name: 'Колія №2 (Західний об\'їзд)', maxCapacity: 2, directionVector: 'West' }
    ]
  },
  {
    id: 'hub_lustdorf_11th',
    name: '11-та ст. Люстдорфської дороги',
    locationDescription: 'Кінцева станція та обгонова колія південного радіуса',
    availableTracksCount: 2,
    minHeadwayMin: 2,
    routesConnecting: ['T3', 'T7'],
    channels: [
      { trackId: 'tr_l1', name: 'Колія №1 (Висаджувально-посадкова)', maxCapacity: 2, directionVector: 'Terminal' },
      { trackId: 'tr_l2', name: 'Колія №2 (Запасна / Обіди)', maxCapacity: 2, directionVector: 'Idle' }
    ]
  }
];

export const MOCK_ROUTES: Route[] = [
  {
    id: 'T3',
    number: '3',
    name: 'Старосінна площа — 11-та ст. Люстдорфської дороги',
    type: 'tram',
    status: 'active',
    primaryTerminalId: 'st_starosinna',
    secondaryTerminalId: 'st_lustdorf_11th',
    lengthDir1Km: 12.4,
    lengthDir2Km: 12.4,
    description: 'Магістральний трамвайний маршрут південного напрямку м. Одеси',
    controlPoints: [
      { id: 'cp_t3_1', controlPointId: 'st_starosinna', tracksCount: 1, trackType: 'main_loop', pointType: 'terminal' },
      { id: 'cp_t3_2', controlPointId: 'st_lustdorf_1st', tracksCount: 1, trackType: 'passenger_platform', pointType: 'intermediate' },
      { id: 'cp_t3_3', controlPointId: 'st_lustdorf_11th', tracksCount: 1, trackType: 'terminal', pointType: 'terminal' },
    ],
    stations: [
      'st_starosinna',
      'st_vodoprovidna',
      'st_lustdorf_1st',
      'st_lustdorf_3rd',
      'st_lustdorf_5th',
      'st_lustdorf_11th'
    ],
    segments: [
      {
        fromStationId: 'st_starosinna',
        toStationId: 'st_vodoprovidna',
        distanceKm: 1.8,
        baseTravelTimes: { morning_exit: 5, morning_peak: 8, off_peak: 6, evening_peak: 9, evening_decline: 5 },
        trafficLightCount: 2,
        avgTrafficLightDelayMin: 1.2,
        isSharedSegment: true,
        sharedWithRoutes: ['T7', 'T10']
      },
      {
        fromStationId: 'st_vodoprovidna',
        toStationId: 'st_lustdorf_1st',
        distanceKm: 2.2,
        baseTravelTimes: { morning_exit: 6, morning_peak: 9, off_peak: 7, evening_peak: 10, evening_decline: 6 },
        trafficLightCount: 3,
        avgTrafficLightDelayMin: 1.5,
        isSharedSegment: true,
        sharedWithRoutes: ['T7']
      },
      {
        fromStationId: 'st_lustdorf_1st',
        toStationId: 'st_lustdorf_5th',
        distanceKm: 4.1,
        baseTravelTimes: { morning_exit: 10, morning_peak: 14, off_peak: 11, evening_peak: 15, evening_decline: 10 },
        trafficLightCount: 4,
        avgTrafficLightDelayMin: 2.0,
        isSharedSegment: true,
        sharedWithRoutes: ['T7']
      },
      {
        fromStationId: 'st_lustdorf_5th',
        toStationId: 'st_lustdorf_11th',
        distanceKm: 4.3,
        baseTravelTimes: { morning_exit: 11, morning_peak: 15, off_peak: 12, evening_peak: 16, evening_decline: 11 },
        trafficLightCount: 3,
        avgTrafficLightDelayMin: 1.5,
        isSharedSegment: false,
        sharedWithRoutes: []
      }
    ],
  },
  {
    id: 'T7',
    number: '7',
    name: 'вул. Паустовського — 11-та ст. Люстдорфської дороги (Север-Юг)',
    type: 'tram',
    status: 'active',
    primaryTerminalId: 'st_paustovskoho',
    secondaryTerminalId: 'st_lustdorf_11th',
    lengthDir1Km: 28.5,
    lengthDir2Km: 28.5,
    description: 'Швидкісний трамвайний маршрут Північ-Південь через Пересип',
    controlPoints: [
      { id: 'cp_t7_1', controlPointId: 'st_paustovskoho', tracksCount: 1, trackType: 'terminal', pointType: 'terminal' },
      { id: 'cp_t7_2', controlPointId: 'st_peresyp', tracksCount: 1, trackType: 'passing_loop', pointType: 'intermediate' },
    ],
    stations: [
      'st_paustovskoho',
      'st_peresyp',
      'st_starosinna',
      'st_lustdorf_1st',
      'st_lustdorf_11th'
    ],
    segments: [
      {
        fromStationId: 'st_paustovskoho',
        toStationId: 'st_peresyp',
        distanceKm: 14.2,
        baseTravelTimes: { morning_exit: 28, morning_peak: 38, off_peak: 32, evening_peak: 42, evening_decline: 28 },
        trafficLightCount: 8,
        avgTrafficLightDelayMin: 4.0,
        isSharedSegment: false,
        sharedWithRoutes: []
      },
      {
        fromStationId: 'st_peresyp',
        toStationId: 'st_starosinna',
        distanceKm: 4.8,
        baseTravelTimes: { morning_exit: 12, morning_peak: 18, off_peak: 14, evening_peak: 20, evening_decline: 12 },
        trafficLightCount: 5,
        avgTrafficLightDelayMin: 2.5,
        isSharedSegment: true,
        sharedWithRoutes: ['T3', 'T10']
      }
    ],
  },
  {
    id: 'Tr8',
    number: '8',
    name: 'Залізничний вокзал — Суперфосфатний завод',
    type: 'trolleybus',
    status: 'active',
    primaryTerminalId: 'st_vokzal',
    secondaryTerminalId: 'st_superfosfat',
    lengthDir1Km: 9.8,
    lengthDir2Km: 9.8,
    description: 'Тролейбусний маршрут промислово-залізничної зони',
    stations: ['st_vokzal', 'st_tiraspol', 'st_superfosfat'],
    segments: [
      {
        fromStationId: 'st_vokzal',
        toStationId: 'st_tiraspol',
        distanceKm: 3.5,
        baseTravelTimes: { morning_exit: 10, morning_peak: 16, off_peak: 12, evening_peak: 18, evening_decline: 10 },
        trafficLightCount: 6,
        avgTrafficLightDelayMin: 3.0,
        isSharedSegment: false,
        sharedWithRoutes: []
      }
    ],
  },
  {
    id: 'Tr10',
    number: '10',
    name: 'вул. Іцхака Рабіна — вул. Рішельєвська',
    type: 'trolleybus',
    status: 'maintenance',
    primaryTerminalId: 'st_rabina',
    secondaryTerminalId: 'st_rishelievska',
    lengthDir1Km: 11.2,
    lengthDir2Km: 11.2,
    description: 'Центральний тролейбусний зв\'язок спального району Черемушки',
    stations: ['st_rabina', 'st_pivdenny', 'st_rishelievska'],
    segments: [
      {
        fromStationId: 'st_rabina',
        toStationId: 'st_pivdenny',
        distanceKm: 4.2,
        baseTravelTimes: { morning_exit: 9, morning_peak: 15, off_peak: 11, evening_peak: 17, evening_decline: 9 },
        trafficLightCount: 4,
        avgTrafficLightDelayMin: 2.0,
        isSharedSegment: false,
        sharedWithRoutes: []
      },
      {
        fromStationId: 'st_pivdenny',
        toStationId: 'st_rishelievska',
        distanceKm: 7.0,
        baseTravelTimes: { morning_exit: 14, morning_peak: 22, off_peak: 16, evening_peak: 25, evening_decline: 14 },
        trafficLightCount: 7,
        avgTrafficLightDelayMin: 3.5,
        isSharedSegment: false,
        sharedWithRoutes: []
      }
    ],
  }
];

export const MOCK_ROUTE_DEPOT_CONFIGS: RouteDepotConfig[] = [
  {
    id: 'cfg_1',
    routeId: 'Tr3',
    depotId: 'depot_trolley_1',
    pullOut: {
      dir0: { targetStationId: '687088', distanceKm: 2.1, durationMin: 9, passengerPickupAllowed: false },
      dir1: { targetStationId: '687087', distanceKm: 1.5, durationMin: 6, passengerPickupAllowed: true }
    },
    pullIn: {
      dir0: { targetStationId: '687087', distanceKm: 1.6, durationMin: 6, passengerPickupAllowed: false },
      dir1: { targetStationId: '687088', distanceKm: 2.2, durationMin: 10, passengerPickupAllowed: false }
    }
  },
  {
    id: 'cfg_2',
    routeId: 'Tr7',
    depotId: 'depot_trolley_1',
    pullOut: {
      dir0: { targetStationId: '702349', distanceKm: 3.8, durationMin: 14, passengerPickupAllowed: true },
      dir1: { targetStationId: '702197', distanceKm: 5.2, durationMin: 18, passengerPickupAllowed: false }
    },
    pullIn: {
      dir0: { targetStationId: '702197', distanceKm: 5.3, durationMin: 19, passengerPickupAllowed: false },
      dir1: { targetStationId: '702349', distanceKm: 3.9, durationMin: 15, passengerPickupAllowed: false }
    }
  },
  {
    id: 'cfg_3',
    routeId: 'T5',
    depotId: 'depot_tram_1',
    pullOut: {
      dir0: { targetStationId: '798899', distanceKm: 6.2, durationMin: 18, passengerPickupAllowed: false },
      dir1: { targetStationId: '798878', distanceKm: 8.5, durationMin: 24, passengerPickupAllowed: true }
    },
    pullIn: {
      dir0: { targetStationId: '798878', distanceKm: 8.6, durationMin: 25, passengerPickupAllowed: false },
      dir1: { targetStationId: '798899', distanceKm: 6.3, durationMin: 19, passengerPickupAllowed: false }
    }
  }
];

export const MOCK_DRIVER_BREAK_LOCATIONS: BreakLocationConfig[] = [
  {
    id: 'brk_1',
    routeId: 'T3',
    locationId: 'st_starosinna',
    locationName: 'Диспетчерський пункт «Старосінна площа»',
    locationType: 'dispatch_point',
    maxCapacityVehicles: 4,
    durationMin: 45
  },
  {
    id: 'brk_2',
    routeId: 'T7',
    locationId: 'st_starosinna',
    locationName: 'Диспетчерський пункт «Старосінна площа»',
    locationType: 'dispatch_point',
    maxCapacityVehicles: 4,
    durationMin: 45
  },
  {
    id: 'brk_3',
    routeId: 'T3',
    locationId: 'st_lustdorf_11th',
    locationName: 'Кінцева станція «11-та ст. Люстдорфської дороги»',
    locationType: 'opposite_terminal',
    maxCapacityVehicles: 2,
    durationMin: 30
  }
];

export const MOCK_VEHICLE_BLOCKS: VehicleBlock[] = [
  {
    id: 'Block-301',
    vehicleNumber: 'Татра T3 №4012',
    type: 'tram',
    depotId: 'depot_tram_1',
    routeId: 'T3',
    depotExitTime: '05:23',
    depotReturnTime: '21:45',
    trips: [
      {
        id: 'trip_301_0',
        blockId: 'Block-301',
        dutyId: 'Duty-101',
        routeId: 'T3',
        direction: 1,
        departureTime: '05:30',
        arrivalTime: '06:16',
        startStationId: 'st_starosinna',
        endStationId: 'st_lustdorf_11th',
        isZeroRun: true,
        status: 'normal'
      },
      {
        id: 'trip_301_1',
        blockId: 'Block-301',
        dutyId: 'Duty-101',
        routeId: 'T3',
        direction: 2,
        departureTime: '06:20',
        arrivalTime: '07:12',
        startStationId: 'st_lustdorf_11th',
        endStationId: 'st_starosinna',
        status: 'normal'
      },
      {
        id: 'trip_301_2',
        blockId: 'Block-301',
        dutyId: 'Duty-101',
        routeId: 'T3',
        direction: 1,
        departureTime: '07:18',
        arrivalTime: '08:14',
        startStationId: 'st_starosinna',
        endStationId: 'st_lustdorf_11th',
        status: 'normal'
      },
      {
        id: 'trip_301_lunch',
        blockId: 'Block-301',
        dutyId: 'Duty-101',
        routeId: 'T3',
        direction: 1,
        departureTime: '09:40',
        arrivalTime: '09:55',
        startStationId: 'st_starosinna',
        endStationId: 'st_starosinna',
        isLunchBreak: true,
        status: 'normal'
      },
      {
        id: 'trip_301_3',
        blockId: 'Block-301',
        dutyId: 'Duty-102',
        routeId: 'T3',
        direction: 2,
        departureTime: '14:30',
        arrivalTime: '15:22',
        startStationId: 'st_starosinna',
        endStationId: 'st_lustdorf_11th',
        status: 'normal'
      }
    ]
  },
  {
    id: 'Block-302',
    vehicleNumber: 'К-1М8 №3088',
    type: 'tram',
    depotId: 'depot_tram_1',
    routeId: 'T3',
    depotExitTime: '05:31',
    depotReturnTime: '21:50',
    trips: [
      {
        id: 'trip_302_1',
        blockId: 'Block-302',
        dutyId: 'Duty-103',
        routeId: 'T3',
        direction: 1,
        departureTime: '05:40',
        arrivalTime: '06:26',
        startStationId: 'st_starosinna',
        endStationId: 'st_lustdorf_11th',
        status: 'normal'
      },
      {
        id: 'trip_302_2',
        blockId: 'Block-302',
        dutyId: 'Duty-103',
        routeId: 'T3',
        direction: 2,
        departureTime: '06:30',
        arrivalTime: '07:22',
        startStationId: 'st_lustdorf_11th',
        endStationId: 'st_starosinna',
        status: 'normal'
      }
    ]
  },
  {
    id: 'Block-701',
    vehicleNumber: 'Odesa-Tatra №5011',
    type: 'tram',
    depotId: 'depot_tram_2',
    routeId: 'T7',
    depotExitTime: '05:10',
    depotReturnTime: '22:15',
    trips: [
      {
        id: 'trip_701_1',
        blockId: 'Block-701',
        dutyId: 'Duty-104',
        routeId: 'T7',
        direction: 1,
        departureTime: '05:30',
        arrivalTime: '07:05',
        startStationId: 'st_paustovskoho',
        endStationId: 'st_lustdorf_11th',
        status: 'normal'
      }
    ]
  }
];

export const MOCK_DRIVER_DUTIES: DriverDuty[] = [
  {
    id: 'Duty-101',
    driverName: 'Петренко Олександр Миколайович',
    driverBadge: 'В-0421',
    shiftType: 'double',
    shiftStartTime: '05:13', // 10 min prep before 05:23 depot exit
    shiftEndTime: '13:45',
    totalShiftMin: 512, // 8h 32m
    lunchStartTime: '09:40',
    lunchDurationMin: 15,
    assignedBlockIds: ['Block-301'],
    isViolating10hLimit: false,
    isLunchCompliant: true
  },
  {
    id: 'Duty-102',
    driverName: 'Коваленко Сергій Вікторович',
    driverBadge: 'В-0883',
    shiftType: 'double',
    shiftStartTime: '14:20',
    shiftEndTime: '22:00',
    totalShiftMin: 460,
    lunchStartTime: '18:15',
    lunchDurationMin: 15,
    assignedBlockIds: ['Block-301'],
    isViolating10hLimit: false,
    isLunchCompliant: true
  },
  {
    id: 'Duty-103',
    driverName: 'Сидоренко Ганна Володимирівна',
    driverBadge: 'В-0112',
    shiftType: 'single',
    shiftStartTime: '05:21',
    shiftEndTime: '14:10',
    totalShiftMin: 529,
    lunchStartTime: '09:50',
    lunchDurationMin: 15,
    assignedBlockIds: ['Block-302'],
    isViolating10hLimit: false,
    isLunchCompliant: true
  },
  {
    id: 'Duty-104',
    driverName: 'Мороз Ігор Романович',
    driverBadge: 'В-0914',
    shiftType: 'peak',
    shiftStartTime: '05:00',
    shiftEndTime: '13:30',
    totalShiftMin: 510,
    lunchStartTime: '09:15',
    lunchDurationMin: 15,
    assignedBlockIds: ['Block-701'],
    isViolating10hLimit: false,
    isLunchCompliant: true
  }
];

export const MOCK_EMERGENCY_TEMPLATES: EmergencyDetourTemplate[] = [
  {
    id: 'em_1',
    title: 'Аварія на вул. Преображенській (блокування трамваїв)',
    cause: 'ДТП стороннього автотранспорту на коліях біля вул. Тираспольської',
    affectedRouteIds: ['T3', 'T10'],
    affectedStationIds: ['st_tiraspol'],
    detourDescription: 'Перенаправлення вагонів маршруту №3 через Старосінну площу та Прохоровську колію із заїздом у Трамвайне депо №1.',
    alternativeStations: ['st_starosinna', 'st_vodoprovidna']
  },
  {
    id: 'em_2',
    title: 'Обрив контактного дроту на Пересипському мості',
    cause: 'Пошкодження габаритною вантажівкою контактної мережі тролейбусів та трамваїв',
    affectedRouteIds: ['T7'],
    affectedStationIds: ['st_peresyp'],
    detourDescription: 'Переведення трамваїв маршруту №7 у скорочений режим "вул. Паустовського — Пересипський міст" та "Старосінна пл. — 11-та ст. Люстдорфської дороги".',
    alternativeStations: ['st_paustovskoho', 'st_peresyp', 'st_starosinna']
  },
  {
    id: 'em_3',
    title: 'Неналежне паркування на Старосінній площі (Колія №1)',
    cause: 'Приватне авто заблокувало виїзд з колії №1',
    affectedRouteIds: ['T3', 'T7'],
    affectedStationIds: ['st_starosinna'],
    detourDescription: 'Автоматичне перенаправлення траєкторії на резервну Колію №4 Старосінньої площі.',
    alternativeStations: ['st_starosinna']
  }
];

export const MOCK_SCHEDULE_CONFLICTS: ScheduleConflict[] = [
  {
    id: 'conf_1',
    nodeId: 'hub_starosinna',
    nodeName: 'Старосінна площа',
    trackId: '1',
    vehicle1Id: 'Block-301',
    vehicle1Route: '№3 (3014)',
    vehicle2Id: 'Block-701',
    vehicle2Route: '№7 (5011)',
    arrivalTime1: '07:15',
    arrivalTime2: '07:16',
    actualHeadwayMin: 1.0,
    requiredHeadwayMin: 2.0,
    timeGapMin: 1.0
  }
];

export const MOCK_DRIVERS = MOCK_DRIVER_DUTIES;

export const MOCK_DETOURS: EmergencyDetour[] = MOCK_EMERGENCY_TEMPLATES.map((t, idx) => ({
  id: `detour_${idx + 1}`,
  templateId: t.id,
  routeId: t.affectedRouteIds[0],
  title: t.title,
  cause: t.cause,
  activeStatus: idx === 0, // First one active by default
  affectedStationIds: t.affectedStationIds,
  detourDescription: t.detourDescription,
  alternativeStations: t.alternativeStations,
  startTime: '08:15',
  estimatedEndTime: '11:30'
}));

export const MOCK_EMERGENCY_DETOURS = MOCK_DETOURS;

