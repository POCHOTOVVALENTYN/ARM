import { DriverDuty, TransportType, VehicleBlock, Trip } from '../types';

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
  const totalShiftMin = pureDrivingMin + prepTimeMin + overtimeLunchMin;

  // Перевірка 10-годинного обмеження КЗпП (600 хвилин)
  const isViolating10hLimit = totalShiftMin > 600;

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
