import { DriverDuty, TransportType, VehicleBlock, Trip } from '../types';
import {
  MIN_WORK_MINS_BEFORE_LUNCH,
  MAX_WORK_MINS_BEFORE_LUNCH,
  MAX_LUNCH_DURATION_MIN,
  standardLunchMin,
  prepTimeMin as prepTimeMinFor,
} from '../constants/transitRules';

const API_URL = 'http://localhost:8000/api/v1/solver';

export interface DelayRequestData {
  block_id: string;
  start_time: number;
  delay_minutes: number;
}

/**
 * Конвертує стрічку "HH:mm" у хвилини від початку доби (00:00).
 */
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

/**
 * Конвертує хвилини від початку доби у формат "HH:mm".
 */
export const minutesToTime = (mins: number): string => {
  const normalizedMins = (mins % 1440 + 1440) % 1440;
  const h = Math.floor(normalizedMins / 60);
  const m = Math.floor(normalizedMins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Валідує зміну водія відповідно до норм КЗпП та внутрішніх регламентів КП «ОМЕТ»:
 * - Підготовчо-заключний час (10 хв - трамвай, 19 хв - тролейбус)
 * - Нормативний обід (15/10 хв - трамвай, 20 хв - тролейбус)
 * - Нараховує понаднормовий обід (перевищення норми) у загальний робочий час
 * - Граничний ліміт робочого часу за зміну: 10 годин (600 хв)
 * - Вікно обіду: від 4 до 6 годин від початку зміни
 */
export const validateDriverDuty = (
  duty: DriverDuty,
  transportType: TransportType = 'tram'
): DriverDuty => {
  const shiftStartMin = timeToMinutes(duty.shiftStartTime);
  const shiftEndMin = timeToMinutes(duty.shiftEndTime);
  let rawShiftDuration = shiftEndMin >= shiftStartMin 
    ? shiftEndMin - shiftStartMin 
    : (shiftEndMin + 1440) - shiftStartMin;

  // Визначення підготовчо-заключного часу
  const prepTimeMin = duty.prepTimeMin ?? (
    transportType === 'trolleybus' ? 19 : 10
  );

  // Нормативна тривалість обіду
  const standardLunchMin = duty.standardLunchMin ?? (
    transportType === 'trolleybus' ? 20 : 15
  );

  const actualLunchMin = duty.lunchDurationMin || 0;
  
  // Обчислення понаднормового часу обіду
  const overtimeLunchMin = Math.max(0, actualLunchMin - standardLunchMin);

  // Час керування на лінії
  const pureDrivingMin = Math.max(0, rawShiftDuration - actualLunchMin);

  // Загальний робочий час водія
  const totalShiftMin = pureDrivingMin + prepTimeMin + overtimeLunchMin

  // Перевірка обмеження КЗпП (максимум 9:59 = 599 хвилин; 600 хвилин і більше — заборонено)
  const isViolating10hLimit = totalShiftMin >= 600

  // Перевірка часового вікна обіду (4 - 6 годин від початку зміни)
  let lunchWindowViolation = false;
  let isLunchCompliant = true;

  if (duty.lunchStartTime) {
    const lunchStartMin = timeToMinutes(duty.lunchStartTime);
    const minAllowedLunchStart = shiftStartMin + 240; // 4 години (240 хв)
    const maxAllowedLunchStart = shiftStartMin + 360; // 6 годин (360 хв)

    if (lunchStartMin < minAllowedLunchStart || lunchStartMin > maxAllowedLunchStart) {
      lunchWindowViolation = true;
      isLunchCompliant = false;
    }
  } else if (rawShiftDuration > 360) {
    // Якщо зміна більше 6 годин, але обід не призначено
    isLunchCompliant = false;
    lunchWindowViolation = true;
  }

  return {
    ...duty,
    transportType,
    prepTimeMin,
    standardLunchMin,
    overtimeLunchMin,
    drivingTimeMin: pureDrivingMin,
    totalShiftMin,
    isViolating10hLimit,
    isLunchCompliant,
    lunchWindowViolation
  };
};

/**
 * Модуль розрахунку енергобалансу та зарядки для Електробусів (Battery & Charging Validator)
 */
export interface ElectrobusCalculationResult {
  batteryCapacitykWh: number;
  startSoC: number;
  endSoC: number;
  consumedkWh: number;
  chargedkWh: number;
  isBatteryLow: boolean; // True якщо SoC розрядився нижче 20%
  requiredChargingMin: number;
  ambientTempC: number;
  consumptionMultiplier: number;
}

export const calculateElectrobusBattery = (
  block: VehicleBlock,
  routeLengthKm: number,
  idleMinutesAtTerminal: number,
  ambientTempC: number = 20
): ElectrobusCalculationResult => {
  const batteryCapacity = block.batteryCapacitykWh || 200; // 200 кВт·год
  const currentSoC = block.currentSoC ?? 95;              // Початковий заряд 95%
  const chargingPower = block.chargingPowerkW || 150;     // Потужність зарядного пристрою 150 кВт

  // Базова витрата енергії: 1.3 кВт·год/км
  let baseConsumption = block.consumptionPerKm || 1.3;

  // Коригування залежно від температури навколишнього середовища
  let consumptionMultiplier = 1.0;
  if (ambientTempC < 0) {
    consumptionMultiplier = 1.40; // Зима (опалення салону: +40%)
  } else if (ambientTempC > 28) {
    consumptionMultiplier = 1.25; // Літо (кондиціонер: +25%)
  }

  const effectiveConsumptionPerKm = baseConsumption * consumptionMultiplier;
  const consumedkWh = routeLengthKm * effectiveConsumptionPerKm;

  // Енергія, отримана під час зарядки на кінцевій зупинці
  // Ефективність зарядки 90%
  const chargedkWh = (chargingPower * (idleMinutesAtTerminal / 60)) * 0.90;

  const netkWhChange = chargedkWh - consumedkWh;
  const netSoCChangePct = (netkWhChange / batteryCapacity) * 100;

  const endSoC = Math.min(100, Math.max(0, currentSoC + netSoCChangePct));
  const isBatteryLow = endSoC < 20; // Попередження при залишку < 20%

  // Обчислення необхідного часу зарядки до 90% SoC
  const targetkWh = batteryCapacity * 0.90;
  const currentkWh = (currentSoC / 100) * batteryCapacity;
  const neededkWh = Math.max(0, targetkWh - currentkWh + consumedkWh);
  const requiredChargingMin = Math.ceil((neededkWh / (chargingPower * 0.90)) * 60);

  return {
    batteryCapacitykWh: batteryCapacity,
    startSoC: currentSoC,
    endSoC: Math.round(endSoC * 10) / 10,
    consumedkWh: Math.round(consumedkWh * 10) / 10,
    chargedkWh: Math.round(chargedkWh * 10) / 10,
    isBatteryLow,
    requiredChargingMin,
    ambientTempC,
    consumptionMultiplier
  };
};

/**
 * Відправляє запит на бекенд для каскадного застосування затримки.
 */
export const applyDelayCascade = async (requestData: DelayRequestData) => {
  try {
    const response = await fetch(`${API_URL}/apply-delay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error('Помилка розрахунку на сервері Transit Solver');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Помилка Transit Solver:", error);
    throw error;
  }
};

export const calculateDepotExitTime = (routeTimeMin: number, prepTimeMin: number) => {
  return minutesToTime(routeTimeMin - prepTimeMin);
};

export type SlackPropagationResult = any;
export const calculateHeadway = (time1Str: string, time2Str: string): number => {
  return Math.abs(timeToMinutes(time1Str) - timeToMinutes(time2Str));
};

export const calculateTurnaroundTime = (distKm: number, speedKmh: number = 18): number => {
  return Math.ceil((distKm / speedKmh) * 60);
};

export const checkNodeCapacityAndHeadway = (time1Str: string, time2Str: string, minHeadway: number = 2) => {
  const gap = calculateHeadway(time1Str, time2Str);
  return {
    hasConflict: gap < minHeadway,
    gap
  };
};

export const validateDriverDutyLegacy = validateDriverDuty;
export const calculateSlackEffect = (currentSlackMin: number, newSlackMin: number) => {
  return newSlackMin - currentSlackMin;
};

// --- ТОПОЛОГІЧНИЙ ДОВІДНИК ДЕПО ТА НУЛЬОВИХ РЕЙСІВ КП «ОМЕТ» ---
// В Одесі діють виключно ТД-1 (Водопровідна), ТД-2 (Слобідка) та ТрД-1 (вул. Інглезі)

export interface DepotZeroRunInfo {
  min: number
  km: number
  junctionStop: string
}

export const ODESSA_DEPOT_ZERO_RUN_MATRIX: Record<string, Record<string, DepotZeroRunInfo>> = {
  'ТД-1': {
    'Куликове поле': { min: 8, km: 1.8, junctionStop: 'Куликове поле' },
    'Станція «Аркадія»': { min: 20, km: 5.2, junctionStop: 'Музкомедія' },
    '16-та ст. Великого Фонтану': { min: 32, km: 9.8, junctionStop: '1-ша ст. Люстдорфської дороги' },
    '11-та ст. Люстдорфської дороги': { min: 28, km: 8.5, junctionStop: '1-ша ст. Люстдорфської дороги' },
    'Автовокзал': { min: 18, km: 4.5, junctionStop: 'пл. Старосінна' },
    'вул. Пастера': { min: 16, km: 4.0, junctionStop: 'Тираспольська площа' },
    'Парк Шевченка': { min: 14, km: 3.5, junctionStop: 'Музкомедія' },
    'default': { min: 18, km: 4.8, junctionStop: 'Музкомедія' }
  },
  'ТД-2': {
    'ДП «вул. Паустовського»': { min: 36, km: 12.4, junctionStop: 'Пересипський міст' },
    'вул. Паустовського': { min: 36, km: 12.4, junctionStop: 'Пересипський міст' },
    'Херсонський сквер': { min: 14, km: 3.8, junctionStop: 'Пересипський міст' },
    'Пересипський міст': { min: 16, km: 4.2, junctionStop: 'Пересипський міст' },
    'пл. Тираспільська': { min: 20, km: 5.5, junctionStop: 'вул. Пастера' },
    'Станція «Аркадія»': { min: 29, km: 8.4, junctionStop: 'Музкомедія' },
    'Автовокзал': { min: 15, km: 4.0, junctionStop: 'вул. Балківська' },
    'вул. Пастера': { min: 15, km: 4.2, junctionStop: 'вул. Пастера' },
    'default': { min: 24, km: 6.8, junctionStop: 'Пересипський міст' }
  },
  'ТРД-1': {
    'вул. Інглезі': { min: 6, km: 1.2, junctionStop: 'вул. Космонавтів' },
    'Залізничний вокзал': { min: 22, km: 6.5, junctionStop: 'пл. Серединська' },
    'вул. Архітекторська': { min: 16, km: 4.8, junctionStop: 'пл. Незалежності' },
    'вул. Новосельського': { min: 26, km: 8.2, junctionStop: 'Тираспольська площа' },
    'Пересипський міст': { min: 30, km: 9.5, junctionStop: 'вул. Пастера' },
    'вул. Рішельєвська / Грецька': { min: 24, km: 7.1, junctionStop: 'вул. Пушкінська' },
    'default': { min: 20, km: 5.5, junctionStop: 'вул. Космонавтів' }
  }
}

export const getDepotZeroRunInfo = (depotName: string, stationName: string, isTrolley: boolean): DepotZeroRunInfo => {
  const normDepot = isTrolley ? 'ТРД-1' : depotName.includes('1') ? 'ТД-1' : 'ТД-2'
  const depotMap = ODESSA_DEPOT_ZERO_RUN_MATRIX[normDepot] || ODESSA_DEPOT_ZERO_RUN_MATRIX['ТД-1']
  
  if (depotMap[stationName]) {
    return depotMap[stationName]
  }
  
  const matchedKey = Object.keys(depotMap).find(k => stationName.includes(k) || k.includes(stationName))
  if (matchedKey) {
    return depotMap[matchedKey]
  }

  return depotMap['default']
}

import { MasterScheduleData, SummaryPassport, MasterGridRow, DutyBook, ControlPointConfig } from '../types'

export const generateLocalMasterSchedule = (payload: any): MasterScheduleData => {
  const routeId = String(payload.route_id || '5')
  const routeName = payload.route_name || (routeId === '5' ? 'Станція «Аркадія» — Автовокзал' : routeId === '7' ? 'вул. Паустовського — Херсонський сквер' : `Маршрут №${routeId}`)
  const transportType = payload.transport_type === 'TROLLEYBUS' || payload.transport_type === 'trolleybus' ? 'TROLLEYBUS' : 'TRAM'
  const isTrolley = transportType === 'TROLLEYBUS'
  const dutiesCount = Math.max(1, Number(payload.duties_count) || 14)
  const roundTripMin = Math.max(20, Number(payload.round_trip_min) || 85)
  const routeLengthKm = Number(payload.route_length_km) || 17.9
  const defaultSpeedKmh = Number(payload.default_speed_kmh) || 12.3
  const designatedDpName = payload.designated_dp_name || (routeId === '7' ? 'ДП «вул. Паустовського»' : routeId === '18' ? 'Куликове поле' : 'Станція «Аркадія»')
  
  // В Одесі діють ТД-1, ТД-2 для трамвая та ТРД-1 для тролейбуса
  const depotName = isTrolley ? 'ТРД-1' : (payload.depot_name || (routeId === '7' ? 'ТД-2' : 'ТД-1'))

  const schedulePeriod = payload.schedule_period || 'з 22 вересня по 11 жовтня 2026 року'
  const scheduleType = payload.schedule_type || 'Будній'

  // Базовий норматив обіду та підготовчо-заключний час — з єдиного джерела
  // істини transitRules.ts (ідентично backend/app/core/transit_rules.py).
  const standardBreakMin = standardLunchMin(isTrolley)
  const prepTimeMin = prepTimeMinFor(isTrolley)
  
  const exactHeadway = roundTripMin / dutiesCount
  const headwayMin = Math.round(exactHeadway * 10) / 10

  const oneWayTime = Math.max(15, Math.floor((roundTripMin - 12) / 2))
  const baseLayover = Math.max(4, Math.floor((roundTripMin - (oneWayTime * 2)) / 2))

  let controlPoints: ControlPointConfig[] = payload.control_points || []
  if (!controlPoints || controlPoints.length < 2) {
    if (routeId === '5') {
      controlPoints = [
        { id: 'cp_5_1', name: 'Станція «Аркадія»', is_dp: true, is_break: true, offset_fwd: 0, offset_bwd: oneWayTime },
        { id: 'cp_5_2', name: 'Театр Музкомедії', is_dp: false, is_break: false, is_junction: true, offset_fwd: Math.round(oneWayTime * 0.42), offset_bwd: Math.round(oneWayTime * 0.58) },
        { id: 'cp_5_3', name: 'пл. Старосінна (Вокзал)', is_dp: false, is_break: false, offset_fwd: Math.round(oneWayTime * 0.60), offset_bwd: Math.round(oneWayTime * 0.40) },
        { id: 'cp_5_4', name: 'пл. Тираспільська', is_dp: false, is_break: false, offset_fwd: Math.round(oneWayTime * 0.78), offset_bwd: Math.round(oneWayTime * 0.22) },
        { id: 'cp_5_5', name: 'Автовокзал', is_dp: false, is_break: false, is_terminus: true, offset_fwd: oneWayTime, offset_bwd: 0 }
      ]
    } else if (routeId === '7') {
      controlPoints = [
        { id: 'cp_7_1', name: 'ДП «вул. Паустовського»', is_dp: true, is_break: true, offset_fwd: 0, offset_bwd: oneWayTime },
        { id: 'cp_7_2', name: 'вул. Заболотного', is_dp: false, is_break: false, offset_fwd: Math.round(oneWayTime * 0.15), offset_bwd: Math.round(oneWayTime * 0.85) },
        { id: 'cp_7_3', name: 'Лузанівка', is_dp: false, is_break: false, offset_fwd: Math.round(oneWayTime * 0.40), offset_bwd: Math.round(oneWayTime * 0.60) },
        { id: 'cp_7_4', name: 'Пересипський міст', is_dp: false, is_break: false, is_junction: true, offset_fwd: Math.round(oneWayTime * 0.75), offset_bwd: Math.round(oneWayTime * 0.25) },
        { id: 'cp_7_5', name: 'пл. Тираспільська', is_dp: false, is_break: false, is_terminus: true, offset_fwd: oneWayTime, offset_bwd: 0 }
      ]
    } else {
      controlPoints = [
        { id: `cp_${routeId}_1`, name: designatedDpName, is_dp: true, is_break: true, offset_fwd: 0, offset_bwd: oneWayTime },
        { id: `cp_${routeId}_2`, name: 'Проміжний вузол', is_dp: false, is_break: false, is_junction: true, offset_fwd: Math.round(oneWayTime * 0.5), offset_bwd: Math.round(oneWayTime * 0.5) },
        { id: `cp_${routeId}_3`, name: 'Кінцева станція Б', is_dp: false, is_break: false, is_terminus: true, offset_fwd: oneWayTime, offset_bwd: 0 }
      ]
    }
  }

  const stationAName = controlPoints[0].name
  const stationBName = controlPoints[controlPoints.length - 1].name

  const toTimeStr = (minutes: number): string => {
    const norm = (Math.round(minutes) % 1440 + 1440) % 1440
    const h = Math.floor(norm / 60)
    const m = norm % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const startMinsGlobal = 5 * 60 + 20 // 05:20
  const closingMinsGlobal = 23 * 60 + 45 // 23:45

  const masterGridRows: MasterGridRow[] = []
  const dutyBooks: Record<string, DutyBook> = {}
  let totalWagonWorkingMins = 0
  let totalRevenueTrips = 0
  let totalZeroRuns = 0
  let totalZeroKmSum = 0
  let totalShiftsCount = 0

  const startStationsMap = payload.start_stations_per_duty || {}
  const dutyTypesMap = payload.duty_types_per_duty || {}
  const depotsMap = payload.depots_per_duty || {}
  const vehiclesMap = payload.vehicles_per_duty || {}
  const vehicles2Map = payload.vehicles2_per_duty || {}
  // payload.rotation_junctions_per_duty навмисно ігнорується: ротація SPLIT
  // завжди відбувається на ДП (stationAName), а не на обраному вузлі.

  const resolveDutyParam = (dict: Record<string, any> | undefined, vIdx: number, dutyNum: string): any => {
    if (!dict) return undefined
    const candidates = [
      (vIdx + 1).toString(),
      dutyNum,
      String(vIdx + 1).padStart(2, '0'),
      `${routeId}-${vIdx + 1}`,
      `#${vIdx + 1}`
    ]
    for (const c of candidates) {
      if (dict[c] !== undefined && dict[c] !== null && String(dict[c]).trim() !== '') {
        return dict[c]
      }
    }
    return undefined
  }

  for (let vIdx = 0; vIdx < dutiesCount; vIdx++) {
    const dutyNum = `${routeId}-${String(vIdx + 1).padStart(2, '0')}`
    
    // 1. Тип наряду
    let dutyType: 'DOUBLE' | 'SINGLE' | 'SPLIT' | 'PEAK' = 'DOUBLE'
    const assignedType = resolveDutyParam(dutyTypesMap, vIdx, dutyNum)
    if (assignedType) {
      dutyType = assignedType as any
    } else if (vIdx === 3 || vIdx === 7) {
      dutyType = 'SPLIT'
    } else if (vIdx === 11 || vIdx === 12) {
      dutyType = 'PEAK'
    } else if (vIdx === dutiesCount - 1 && dutiesCount > 4) {
      dutyType = 'SINGLE'
    }

    // 2. Станція старту
    let startStation = resolveDutyParam(startStationsMap, vIdx, dutyNum)
    if (!startStation) {
      startStation = (vIdx % 4 === 2) ? stationBName : stationAName
    }

    // 3. Депо приписки (Мультидепо)
    const assignedDepot = resolveDutyParam(depotsMap, vIdx, dutyNum)
    const dutyDepot = isTrolley ? 'ТРД-1' : (assignedDepot || depotName)

    const assignedVeh1 = resolveDutyParam(vehiclesMap, vIdx, dutyNum)
    const assignedVeh2 = resolveDutyParam(vehicles2Map, vIdx, dutyNum)
    // ПРИМІТКА: rotationJunctionsMap приймається лише для зворотної сумісності
    // payload і НЕ впливає на локацію ротації — ротація SPLIT-нарядів завжди
    // прив'язана до прибуття на ДП (stationAName), ніколи до проміжного вузла.

    const vehicleId1 = assignedVeh1 || (isTrolley ? `Тр-${3000 + vIdx + 1}` : `Вг-${4000 + (vIdx * 7) + 1}`)
    const vehicleId2 = dutyType === 'SPLIT' 
      ? (assignedVeh2 || (isTrolley ? `Тр-${3100 + vIdx + 1}` : `Вг-${4100 + (vIdx * 7) + 27}`)) 
      : undefined

    // Розрахунок нульового рейсу на основі нормативів КП «ОМЕТ»
    let zeroRunInfo = getDepotZeroRunInfo(dutyDepot, startStation, isTrolley)
    let zeroRunMin = zeroRunInfo.min
    let zeroRunKm = zeroRunInfo.km
    let zeroJunctionStop = zeroRunInfo.junctionStop
    let zeroRunDirectionLabel = `Депо (${dutyDepot}) → ${startStation}`
    let zeroRunTag = `Нульовий виїзд (Посадка від зуп. примикання: ${zeroJunctionStop})`

    // Якщо вагон виїжджає через протилежну кінцеву Б до ДП:
    // t_нуль = t(Депо -> Кінцева Б) + t_відст_B + t(Кінцева Б -> ДП)
    if (startStation !== stationAName && startStation === stationBName) {
      const zeroToB = getDepotZeroRunInfo(dutyDepot, stationBName, isTrolley)
      zeroRunMin = zeroToB.min + baseLayover + oneWayTime
      zeroRunKm = Math.round((zeroToB.km + (routeLengthKm / 2)) * 10) / 10
      zeroJunctionStop = zeroToB.junctionStop
      zeroRunDirectionLabel = `Депо (${dutyDepot}) через ${stationBName} → ${stationAName}`
      zeroRunTag = `Нульовий виїзд через ${stationBName} до ДП (Посадка від зуп. примикання: ${zeroJunctionStop})`
    }

    const dutyStartLineMins = startMinsGlobal + (vIdx * exactHeadway)
    const pulloutStartMins = dutyStartLineMins - zeroRunMin
    const reportTimeMins = pulloutStartMins - prepTimeMin

    let currMins = dutyStartLineMins
    const rounds: any[] = []
    const bookTrips: any[] = []
    let tripSeq = 1

    // Нульовий виїзд (Pull-out)
    bookTrips.push({
      trip_number: tripSeq++,
      round_number: 0,
      direction: 'PULL_OUT',
      direction_label: zeroRunDirectionLabel,
      departure_time: toTimeStr(pulloutStartMins),
      arrival_time: toTimeStr(dutyStartLineMins),
      layover_min: baseLayover,
      vehicle_id: vehicleId1,
      event_tag: zeroRunTag,
      control_point_times: [
        { cp_id: 'depot', cp_name: `Виїзд ${dutyDepot}`, arrival_time: toTimeStr(pulloutStartMins), is_dp: false },
        { cp_id: 'junction', cp_name: zeroJunctionStop, arrival_time: toTimeStr(pulloutStartMins + Math.round(zeroRunMin * 0.4)), is_dp: false },
        { cp_id: 'dp', cp_name: startStation, arrival_time: toTimeStr(dutyStartLineMins), is_dp: true }
      ]
    })
    totalZeroRuns += 1
    totalZeroKmSum += zeroRunKm

    // Розрахунок часу завершення роботи наряду на лінії (запобігання перевантаженню зміни 2)
    let dutyClosingMins = closingMinsGlobal
    if (dutyType === 'SINGLE') {
      dutyClosingMins = dutyStartLineMins + (7.8 * 60)
    } else if (dutyType === 'PEAK') {
      dutyClosingMins = dutyStartLineMins + (5.0 * 60)
    } else {
      // Поетапний вечірній заїзд вагонів у депо з 20:30 до 22:45
      // Чергові (останній випуск): до 22:45..23:15
      const echelonProgress = vIdx / Math.max(1, dutiesCount - 1)
      const targetWagonHours = 15.2 + (echelonProgress * 1.8) // від 15.2 до 17.0 годин роботи вагона
      dutyClosingMins = Math.min(1395, dutyStartLineMins + Math.round(targetWagonHours * 60))
    }

    // Збалансована перезмінка на ДП: точка поділу змін для двозмінки
    const totalWorkingWindow = dutyClosingMins - dutyStartLineMins
    const shiftChangeTargetMins = dutyStartLineMins + Math.round(totalWorkingWindow / 2)

    // Розрахунок обідів водіїв (ідентично backend/transit_solver.py):
    // ІНВАРІАНТ — обід рахується від явки водія (dutyStartLineMins) до моменту
    // ПРИБУТТЯ вагона на ДП (arrA), а не до відправлення (depA). Вікно —
    // [MIN_WORK_MINS_BEFORE_LUNCH; MAX_WORK_MINS_BEFORE_LUNCH]. Понаднормовий
    // час обіду (кратність інтервалу) плюсується до зміни водія.
    const lunchWindowShift1Start = dutyStartLineMins + MIN_WORK_MINS_BEFORE_LUNCH
    let lunchShift1Done = false
    let lunchShift1Duration = standardBreakMin
    let lunchShift1StartMins = 0

    let shiftChangeDone = false
    let shiftChangeTimeMins = 0

    const lunchWindowShift2Start = shiftChangeTargetMins + MIN_WORK_MINS_BEFORE_LUNCH
    let lunchShift2Done = false
    let lunchShift2Duration = standardBreakMin
    let lunchShift2StartMins = 0

    let rIdx = 1
    while (currMins < dutyClosingMins) {
      const depA = currMins
      const arrB = depA + oneWayTime
      const depB = arrB + baseLayover
      const arrA = depB + oneWayTime
      let layoverA = baseLayover
      let badge: string | undefined = undefined
      let lunchBreakObj: any = null

      // Динамічний обід 1-ї зміни — перевірка ЗА ПРИБУТТЯМ на ДП (arrA), не за depA.
      if (!lunchShift1Done && arrA >= lunchWindowShift1Start) {
        const minsWorked = arrA - dutyStartLineMins
        if (minsWorked > MAX_WORK_MINS_BEFORE_LUNCH) {
          console.warn(`⚠️ Наряд ${dutyNum}: обід І зміни надано через ${Math.round(minsWorked)} хв (понад ${MAX_WORK_MINS_BEFORE_LUNCH} хв)`)
        }
        // Якщо інтервал великий або потрібна синхронізація, обід може бути розширено
        lunchShift1Duration = exactHeadway > 10 ? Math.min(MAX_LUNCH_DURATION_MIN, standardBreakMin + 10) : standardBreakMin
        layoverA += lunchShift1Duration
        const overtimeMin = Math.max(0, lunchShift1Duration - standardBreakMin)
        badge = overtimeMin > 0 ? `[О-${lunchShift1Duration}*]` : `[О-${lunchShift1Duration}]`
        lunchShift1Done = true
        lunchShift1StartMins = arrA
        lunchBreakObj = {
          start: toTimeStr(arrA),
          end: toTimeStr(arrA + lunchShift1Duration),
          duration_min: lunchShift1Duration,
          standard_min: standardBreakMin,
          is_overtime: overtimeMin > 0,
          overtime_min: overtimeMin,
          is_paid_break: overtimeMin > 0,
          location: stationAName
        }
      }

      let isRotationTriggeredThisRound = false
      let isShiftChangeTriggeredThisRound = false

      // Перезмінка чи ротація вагонів (балансування змін). ІНВАРІАНТ: відбувається
      // ВИКЛЮЧНО на ДП (arrA / stationAName) — не на проміжному вузлі примикання.
      if (dutyType === 'SPLIT' && !shiftChangeDone && arrA >= shiftChangeTargetMins) {
        badge = `[РОТ: ДП]`
        isRotationTriggeredThisRound = true
        shiftChangeTimeMins = arrA
        layoverA += standardBreakMin
      } else if (dutyType === 'DOUBLE' && !shiftChangeDone && arrA >= shiftChangeTargetMins) {
        badge = '[ЗМ]'
        isShiftChangeTriggeredThisRound = true
        shiftChangeTimeMins = arrA
      }

      // Динамічний обід 2-ї зміни — теж за прибуттям на ДП (arrA).
      if (shiftChangeDone && !lunchShift2Done && arrA >= lunchWindowShift2Start) {
        const minsWorked2 = arrA - shiftChangeTimeMins
        if (minsWorked2 > MAX_WORK_MINS_BEFORE_LUNCH) {
          console.warn(`⚠️ Наряд ${dutyNum}: обід ІІ зміни надано через ${Math.round(minsWorked2)} хв (понад ${MAX_WORK_MINS_BEFORE_LUNCH} хв)`)
        }
        lunchShift2Duration = exactHeadway > 10 ? Math.min(MAX_LUNCH_DURATION_MIN, standardBreakMin + 10) : standardBreakMin
        layoverA += lunchShift2Duration
        const overtimeMin = Math.max(0, lunchShift2Duration - standardBreakMin)
        const lunchBadge = overtimeMin > 0 ? `[О-${lunchShift2Duration}*]` : `[О-${lunchShift2Duration}]`
        badge = badge ? `${badge} ${lunchBadge}` : lunchBadge
        lunchShift2Done = true
        lunchShift2StartMins = arrA
        lunchBreakObj = {
          start: toTimeStr(arrA),
          end: toTimeStr(arrA + lunchShift2Duration),
          duration_min: lunchShift2Duration,
          standard_min: standardBreakMin,
          is_overtime: overtimeMin > 0,
          overtime_min: overtimeMin,
          is_paid_break: overtimeMin > 0,
          location: stationAName
        }
      }

      if (dutyType === 'SINGLE' && depA > dutyStartLineMins + (8.0 * 60)) {
        break
      }

      if (dutyType === 'PEAK' && depA > dutyStartLineMins + (5.0 * 60) && !shiftChangeDone) {
        // Піковий ранковий випуск
        break
      }

      rounds.push({
        round_number: rIdx,
        departure_station_a: toTimeStr(depA),
        departure_station_b: toTimeStr(depB),
        arrival_station_a: toTimeStr(arrA),
        layover_station_a_min: layoverA,
        tag: badge && badge.includes('О-') ? 'LUNCH' : badge && badge.includes('РОТ') ? 'ROTATION' : badge && badge.includes('ЗМ') ? 'SHIFT_CHANGE' : null,
        note: badge,
        lunch_break: lunchBreakObj
      })

      // Прямий рейс (FORWARD)
      const fwdCpTimeline = controlPoints.map((cp) => ({
        cp_id: cp.id,
        cp_name: cp.name,
        arrival_time: toTimeStr(depA + (cp.offset_fwd || 0)),
        is_dp: !!cp.is_dp,
        is_break: !!cp.is_break
      }))

      bookTrips.push({
        trip_number: tripSeq++,
        round_number: rIdx,
        direction: 'FORWARD',
        direction_label: `${stationAName} → ${stationBName}`,
        departure_time: toTimeStr(depA),
        arrival_time: toTimeStr(arrB),
        layover_min: baseLayover,
        vehicle_id: (dutyType === 'SPLIT' && shiftChangeDone) ? (vehicleId2 || vehicleId1) : vehicleId1,
        event_tag: 'Лінійний рейс',
        control_point_times: fwdCpTimeline
      })
      totalRevenueTrips += 1

      // Зворотний рейс (BACKWARD)
      const bwdCpTimeline = [...controlPoints].reverse().map((cp) => ({
        cp_id: cp.id,
        cp_name: cp.name,
        arrival_time: toTimeStr(depB + (cp.offset_bwd || 0)),
        is_dp: !!cp.is_dp,
        is_break: !!cp.is_break
      }))

      let eventTag = 'Лінійний рейс'
      if (badge && badge.includes('О-')) eventTag = `Обід ${lunchShift1Done && !shiftChangeDone ? lunchShift1Duration : lunchShift2Duration} хв (ДП: ${stationAName})`
      if (badge && badge.includes('РОТ')) eventTag = `Ротація вагонів на ДП (${stationAName})`
      if (badge && badge.includes('ЗМ')) eventTag = 'Перезмінка водіїв'

      bookTrips.push({
        trip_number: tripSeq++,
        round_number: rIdx,
        direction: 'BACKWARD',
        direction_label: `${stationBName} → ${stationAName}`,
        departure_time: toTimeStr(depB),
        arrival_time: toTimeStr(arrA),
        layover_min: layoverA,
        vehicle_id: (dutyType === 'SPLIT' && shiftChangeDone) ? (vehicleId2 || vehicleId1) : vehicleId1,
        event_tag: eventTag,
        control_point_times: bwdCpTimeline
      })
      totalRevenueTrips += 1

      if (isRotationTriggeredThisRound || isShiftChangeTriggeredThisRound) {
        shiftChangeDone = true
      }

      currMins = arrA + layoverA
      rIdx++
    }

    // Нульовий заїзд у депо (Pull-in)
    const pullinStartMins = currMins
    const pullinZeroRunInfo = getDepotZeroRunInfo(dutyDepot, stationAName, isTrolley)
    const pullinZeroMin = pullinZeroRunInfo.min
    const pullinZeroKm = pullinZeroRunInfo.km
    const pullinEndMins = pullinStartMins + pullinZeroMin

    bookTrips.push({
      trip_number: tripSeq++,
      round_number: 0,
      direction: 'PULL_IN',
      direction_label: `${stationAName} → Депо (${dutyDepot})`,
      departure_time: toTimeStr(pullinStartMins),
      arrival_time: toTimeStr(pullinEndMins),
      layover_min: 0,
      vehicle_id: (dutyType === 'SPLIT' && shiftChangeDone) ? (vehicleId2 || vehicleId1) : vehicleId1,
      event_tag: 'Заїзд у депо',
      control_point_times: [
        { cp_id: 'dp', cp_name: stationAName, arrival_time: toTimeStr(pullinStartMins), is_dp: true },
        { cp_id: 'junction', cp_name: pullinZeroRunInfo.junctionStop, arrival_time: toTimeStr(pullinStartMins + Math.round(pullinZeroMin * 0.5)), is_dp: false },
        { cp_id: 'depot', cp_name: `Заїзд ${dutyDepot}`, arrival_time: toTimeStr(pullinEndMins), is_dp: false }
      ]
    })
    totalZeroRuns += 1
    totalZeroKmSum += pullinZeroKm

    const wagonDurationMins = pullinEndMins - pulloutStartMins
    totalWagonWorkingMins += wagonDurationMins

    // Розрахунок тривалості змін з обов'язковим врахуванням понаднормового обіду та ліміту КЗпП <= 9:59 (599 хв)
    let shift1Mins = 0
    let shift2Mins = 0

    if (dutyType === 'SINGLE' || dutyType === 'PEAK') {
      const overtimeShift1 = Math.max(0, lunchShift1Duration - standardBreakMin)
      const rawShift1 = wagonDurationMins + overtimeShift1
      shift1Mins = Math.min(599, Math.max(0, rawShift1))
      totalShiftsCount += 1
    } else {
      const splitPoint = shiftChangeTimeMins || shiftChangeTargetMins
      const overtimeShift1 = Math.max(0, lunchShift1Duration - standardBreakMin)
      const overtimeShift2 = Math.max(0, lunchShift2Duration - standardBreakMin)
      
      const rawShift1 = (splitPoint - reportTimeMins) + overtimeShift1
      const rawShift2 = (pullinEndMins - splitPoint) + overtimeShift2
      shift1Mins = Math.min(599, Math.max(0, rawShift1))
      shift2Mins = Math.min(599, Math.max(0, rawShift2))
      totalShiftsCount += 2
    }

    masterGridRows.push({
      duty_number: dutyNum,
      duty_type: dutyType,
      start_location: startStation,
      vehicle_id: vehicleId1,
      vehicle_id_2: vehicleId2 || null,
      depot_name: dutyDepot,
      zero_run_min: zeroRunMin,
      zero_run_km: zeroRunKm,
      junction_stop: zeroJunctionStop,
      rotation_location: dutyType === 'SPLIT' ? stationAName : null,
      driver_arrival_time: toTimeStr(reportTimeMins),
      pullout_time: toTimeStr(pulloutStartMins),
      dp_arrival_time: toTimeStr(dutyStartLineMins),
      first_departure_time: rounds[0] ? rounds[0].departure_station_a : toTimeStr(dutyStartLineMins),
      pullin_time: toTimeStr(pullinEndMins),
      total_work_hours_str: `${Math.floor(wagonDurationMins / 60)}:${String(wagonDurationMins % 60).padStart(2, '0')}`,
      shift1_hours_str: `${Math.floor(shift1Mins / 60)}:${String(shift1Mins % 60).padStart(2, '0')}`,
      shift2_hours_str: shift2Mins > 0 ? `${Math.floor(shift2Mins / 60)}:${String(shift2Mins % 60).padStart(2, '0')}` : '—',
      rounds
    })

    const driver1LunchStr = lunchShift1StartMins > 0
      ? `${toTimeStr(lunchShift1StartMins)} — ${toTimeStr(lunchShift1StartMins + lunchShift1Duration)} (${lunchShift1Duration} хв${lunchShift1Duration > standardBreakMin ? ` / +${lunchShift1Duration - standardBreakMin} до зм.` : ''})`
      : `${toTimeStr(dutyStartLineMins + MIN_WORK_MINS_BEFORE_LUNCH)} — ${toTimeStr(dutyStartLineMins + MIN_WORK_MINS_BEFORE_LUNCH + standardBreakMin)} (${standardBreakMin} хв)`

    const driver2LunchStr = (dutyType !== 'SINGLE' && dutyType !== 'PEAK' && lunchShift2StartMins > 0)
      ? `${toTimeStr(lunchShift2StartMins)} — ${toTimeStr(lunchShift2StartMins + lunchShift2Duration)} (${lunchShift2Duration} хв${lunchShift2Duration > standardBreakMin ? ` / +${lunchShift2Duration - standardBreakMin} до зм.` : ''})`
      : (dutyType !== 'SINGLE' && dutyType !== 'PEAK')
      ? `${toTimeStr(shiftChangeTargetMins + MIN_WORK_MINS_BEFORE_LUNCH)} — ${toTimeStr(shiftChangeTargetMins + MIN_WORK_MINS_BEFORE_LUNCH + standardBreakMin)} (${standardBreakMin} хв)`
      : '—'

    dutyBooks[dutyNum] = {
      duty_number: dutyNum,
      route_id: routeId,
      route_name: routeName,
      transport_type: isTrolley ? 'Тролейбус' : 'Трамвай',
      depot_name: dutyDepot,
      zero_run_min: zeroRunMin,
      zero_run_km: zeroRunKm,
      junction_stop: zeroJunctionStop,
      rotation_location: dutyType === 'SPLIT' ? stationAName : null,
      schedule_period: schedulePeriod,
      schedule_type: scheduleType,
      vehicle_id: vehicleId1,
      vehicle_id_2: vehicleId2 || null,
      duty_type: dutyType,
      driver1: {
        name: `Табельний №${1000 + vIdx * 3 + 1}`,
        arrival_time: toTimeStr(reportTimeMins),
        pullout_time: toTimeStr(pulloutStartMins),
        start_time: rounds[0] ? rounds[0].departure_station_a : toTimeStr(dutyStartLineMins),
        lunch_time: driver1LunchStr,
        shift_end_time: toTimeStr(shiftChangeTimeMins || (dutyStartLineMins + 8 * 60))
      },
      driver2: {
        name: (dutyType !== 'SINGLE' && dutyType !== 'PEAK') ? `Табельний №${2000 + vIdx * 3 + 2}` : '—',
        arrival_time: toTimeStr(shiftChangeTimeMins || (dutyStartLineMins + 8 * 60)),
        start_time: toTimeStr(shiftChangeTimeMins || (dutyStartLineMins + 8 * 60)),
        lunch_time: driver2LunchStr,
        pullin_time: toTimeStr(pullinEndMins),
        shift_end_time: toTimeStr(pullinEndMins)
      },
      trips: bookTrips
    }
  }

  const totalWagonHours = Math.round((totalWagonWorkingMins / 60) * 10) / 10
  const totalRevenueKm = totalRevenueTrips * (routeLengthKm / 2)
  const totalWagonKm = Math.round((totalRevenueKm + totalZeroKmSum) * 10) / 10

  const summaryPassport: SummaryPassport = {
    route_id: routeId,
    route_name: routeName,
    transport_type: isTrolley ? 'Тролейбус' : 'Трамвай',
    designated_dp_name: designatedDpName,
    total_wagon_hours: totalWagonHours,
    total_wagon_km: totalWagonKm,
    total_shifts: totalShiftsCount,
    total_trips: totalRevenueTrips,
    round_trip_min: roundTripMin,
    operating_speed_kmh: defaultSpeedKmh,
    route_length_km: routeLengthKm,
    headway_min: headwayMin,
    duties_count: dutiesCount,
    schedule_period: schedulePeriod,
    schedule_type: scheduleType,
    station_a_name: stationAName,
    station_b_name: stationBName,
    control_points: controlPoints
  }

  return {
    summary_passport: summaryPassport,
    master_grid_rows: masterGridRows,
    duty_books: dutyBooks
  }
}

/**
 * Експорт зведеної таблиці рейсів розкладу у формат CSV з UTF-8 BOM для бездоганного відкриття в Excel
 */
export const exportMasterGridToCsv = (masterData: MasterScheduleData): void => {
  if (!masterData || !masterData.summary_passport || !masterData.master_grid_rows) {
    throw new Error('Дані розкладу не сформовані для експорту')
  }

  const passport = masterData.summary_passport
  const rows = masterData.master_grid_rows
  const maxRounds = Math.max(1, ...rows.map((r) => r.rounds?.length || 0))
  const roundIndices = Array.from({ length: maxRounds }, (_, i) => i + 1)

  const lines: string[] = []

  // Заголовок паспорта
  lines.push(`КП «Одесміськелектротранс» - Служба Руху`)
  lines.push(`Зведена таблиця рейсів маршруту №${passport.route_id} (${passport.route_name})`)
  lines.push(`Період дії: ${passport.schedule_period}; Тип графіка: ${passport.schedule_type}; ДП: ${passport.designated_dp_name}`)
  lines.push(`Нарядів: ${passport.duties_count}; Інтервал: ${passport.headway_min} хв; Тоб: ${passport.round_trip_min} хв; Довжина: ${passport.route_length_km} км; Рейсів: ${passport.total_trips}; Змін: ${passport.total_shifts}; Вагоно-км: ${passport.total_wagon_km}; Вагоно-год: ${passport.total_wagon_hours}`)
  lines.push('')

  // Стовпці таблиці
  let headerCol1 = `№ наряду;Тип;Станція виходу;Явка в депо;Вихід з депо;Прибуття на ДП;1-й відхід`
  roundIndices.forEach((rNum) => {
    headerCol1 += `;Круг ${rNum} (ст. А);Круг ${rNum} (ст. Б)`
  })
  headerCol1 += `;Захід у депо;Час вагона;І зміна;ІІ зміна`
  lines.push(headerCol1)

  // Рядки нарядів
  rows.forEach((row) => {
    let line = `${row.duty_number};${row.duty_type};${row.start_location};${row.driver_arrival_time};${row.pullout_time};${row.dp_arrival_time};${row.first_departure_time}`
    
    roundIndices.forEach((rNum) => {
      const rd = row.rounds?.find((r) => r.round_number === rNum)
      if (rd) {
        const tag = rd.note ? ` ${rd.note}` : ''
        line += `;${rd.departure_station_a}${tag};${rd.departure_station_b}`
      } else {
        line += `;—;—`
      }
    })

    line += `;${row.pullin_time};${row.total_work_hours_str};${row.shift1_hours_str};${row.shift2_hours_str}`
    lines.push(line)
  })

  // Створюємо Blob з кодуванням UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + lines.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `OMET_Розклад_Маршрут_${passport.route_id}_${passport.schedule_type}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

