import { DriverDuty, HubNode, ScheduleConflict } from '../types';

/**
 * Utility to convert HH:mm string to total minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Utility to convert total minutes from midnight to HH:mm string
 */
export function minutesToTime(totalMin: number): string {
  const norm = (totalMin + 1440) % 1440;
  const hours = Math.floor(norm / 60);
  const mins = norm % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Етап 1: Обчислення базового та динамічного часу оборотного рейсу (T_rev)
 * T_rev = t_dir1 + t_dir2 + 2 * t_disp (t_disp = 2 хв обов'язкова відмітка)
 */
export function calculateTurnaroundTime(
  tDir1Min: number,
  tDir2Min: number,
  tDispMin: number = 2,
  trafficCoeff: number = 1.0
): { tRevBase: number; tRevDynamic: number } {
  const tRevBase = tDir1Min + tDir2Min + 2 * tDispMin;
  const tRevDynamic = Math.round((tDir1Min + tDir2Min) * trafficCoeff + 2 * tDispMin);
  return { tRevBase, tRevDynamic };
}

/**
 * Етап 3: Розрахунок базового інтервалу руху (I = T_rev / N)
 */
export function calculateHeadway(tRevMin: number, vehicleCount: number): number {
  if (vehicleCount <= 0) return 0;
  return parseFloat((tRevMin / vehicleCount).toFixed(1));
}

/**
 * Етап 3: Розрахунок часу виїзду з депо (t_depot_exit = t_first_trip_start - t_zero_run - t_prep)
 */
export function calculateDepotExitTime(
  firstTripStartTime: string,
  zeroRunDurationMin: number,
  prepTimeMin: number // 10 min tram, 19 min trolleybus
): string {
  const startMin = timeToMinutes(firstTripStartTime);
  const exitMin = startMin - zeroRunDurationMin - prepTimeMin;
  return minutesToTime(exitMin);
}

/**
 * Етап 4: Перевірка норм праці водія (T_shift <= 600 хв, t_lunch_start >= t_shift_start + 240 хв)
 */
export function validateDriverDuty(duty: DriverDuty): {
  shiftDurationMin: number;
  isShiftValid: boolean;
  isLunchValid: boolean;
  warnings: string[];
} {
  const startMin = timeToMinutes(duty.shiftStartTime);
  const endMin = timeToMinutes(duty.shiftEndTime);
  let shiftDurationMin = endMin - startMin;
  if (shiftDurationMin < 0) shiftDurationMin += 1440; // overnight shift handling

  const warnings: string[] = [];
  const isShiftValid = shiftDurationMin <= 600; // 10 годин
  if (!isShiftValid) {
    warnings.push(`Перевищено граничну тривалість зміни (${Math.round(shiftDurationMin / 60)} год > 10 год)`);
  }

  let isLunchValid = true;
  if (duty.lunchStartTime) {
    const lunchStartMin = timeToMinutes(duty.lunchStartTime);
    const minLunchTimeAllowed = startMin + 240; // не раніше ніж через 4 години
    if (lunchStartMin < minLunchTimeAllowed) {
      isLunchValid = false;
      warnings.push(`Обід призначено занадто рано (${duty.lunchStartTime} < ${minutesToTime(minLunchTimeAllowed)})`);
    }
  }

  return {
    shiftDurationMin,
    isShiftValid,
    isLunchValid,
    warnings
  };
}

/**
 * Етап 5 & Розділ 4.2: Алгоритм валідації канальних вузлів (Старосінна площа тощо)
 * Пряма імплементація Python-коду з ТЗ: check_node_capacity_and_headway
 */
export interface NodeVehicleArrival {
  vehicleId: string;
  routeId: string;
  assignedTrack: string;
  directionVector: string;
  arrivalTimeStr: string;
}

export function checkNodeCapacityAndHeadway(
  hub: HubNode,
  targetVehicle: NodeVehicleArrival,
  activeVehiclesOnNode: NodeVehicleArrival[]
): ScheduleConflict | null {
  const targetMin = timeToMinutes(targetVehicle.arrivalTimeStr);

  // Фільтрація вагонів, що претендують на той самий колійний канал та напрямок
  const conflictingVehicles = activeVehiclesOnNode.filter(
    (v) =>
      v.vehicleId !== targetVehicle.vehicleId &&
      v.assignedTrack === targetVehicle.assignedTrack &&
      v.directionVector === targetVehicle.directionVector
  );

  for (const v of conflictingVehicles) {
    const vArrivalMin = timeToMinutes(v.arrivalTimeStr);
    const delta = Math.abs(targetMin - vArrivalMin);

    if (delta < hub.minHeadwayMin) {
      return {
        id: `conflict_${hub.id}_${v.vehicleId}_${targetVehicle.vehicleId}`,
        nodeId: hub.id,
        nodeName: hub.name,
        trackId: targetVehicle.assignedTrack,
        vehicle1Id: v.vehicleId,
        vehicle1Route: v.routeId,
        vehicle2Id: targetVehicle.vehicleId,
        vehicle2Route: targetVehicle.routeId,
        arrivalTime1: v.arrivalTimeStr,
        arrivalTime2: targetVehicle.arrivalTimeStr,
        actualHeadwayMin: delta,
        requiredHeadwayMin: hub.minHeadwayMin,
        timeGapMin: hub.minHeadwayMin - delta
      };
    }
  }

  return null;
}

/**
 * Розділ 4.1: Математика оперативної відтяжки (Delta t_slack) та коригування розкладу
 * Три сценарії:
 * 1. Повне поглинання (Delta t_slack <= t_buffer)
 * 2. Часткове поширення (Delta t_next = Delta t_slack - t_buffer)
 * 3. Аварійний зсув (загроза порушення 10-годинної зміни або вікна обіду) -> Потрібен "Гарячий резерв"
 */
export interface SlackPropagationResult {
  scenario: 'full_absorption' | 'partial_propagation' | 'emergency_shift_overflow';
  nextTripDelayMin: number;
  bufferTimeMin: number;
  message: string;
  recommendedAction: string;
}

export function calculateSlackEffect(
  slackMin: number,
  plannedTurnaroundMin: number,
  dispHoldMin: number = 2,
  currentShiftDurationMin: number = 480
): SlackPropagationResult {
  const bufferTimeMin = Math.max(0, plannedTurnaroundMin - dispHoldMin - 30); // buffer time available at terminal

  if (slackMin <= bufferTimeMin) {
    return {
      scenario: 'full_absorption',
      nextTripDelayMin: 0,
      bufferTimeMin,
      message: `Затримка в ${slackMin} хв повністю поглинається за рахунок планового резерву часу на кінцевій станції.`,
      recommendedAction: 'Диспетчерське спостереження, графік відновиться за планом.'
    };
  }

  const nextTripDelayMin = slackMin - bufferTimeMin;
  const newShiftDurationMin = currentShiftDurationMin + nextTripDelayMin;

  if (newShiftDurationMin > 600) {
    return {
      scenario: 'emergency_shift_overflow',
      nextTripDelayMin,
      bufferTimeMin,
      message: `АВАРІЙНИЙ ЗСУВ: Затримка призводить до перевищення 10-годинного ліміту зміни водія (${Math.round(newShiftDurationMin / 60)} год)!`,
      recommendedAction: 'Викликати «Гарячий резерв» або ввести Скорочений рейс («Змінений напрямок»).'
    };
  }

  return {
    scenario: 'partial_propagation',
    nextTripDelayMin,
    bufferTimeMin,
    message: `Часткове поширення: Некомпенсована частина в ${nextTripDelayMin} хв переноситься на наступний рейс.`,
    recommendedAction: 'Повідомити водія про скорочення вистою на ДП для надолуження інтервалу.'
  };
}
