// src/constants/transitRules.ts
// Єдине джерело істини (Single Source of Truth) для бізнес-правил КП «Одесміськелектротранс»
// щодо обідів водіїв, підготовчого часу та перезмінок/ротацій вагонів.
//
// Дзеркальний модуль на бекенді: backend/app/core/transit_rules.py — значення мають
// бути ідентичними в обох файлах.

// Обідня перерва рахується від явки водія (початку зміни) до моменту прибуття
// вагона на Диспетчерський пункт (ДП / ст. А) під час чергового обороту.
export const MIN_WORK_MINS_BEFORE_LUNCH = 240 // 4.0 год — не раніше
export const MAX_WORK_MINS_BEFORE_LUNCH = 330 // 5.5 год — не пізніше (обід форсується на найближчому прибутті на ДП)

// Нормативна (базова) тривалість обіду. Будь-який час понад цю норму, що виникає
// через кратність інтервалу руху на лінії, є понаднормовим і додається до тривалості зміни водія.
export const TRAM_STANDARD_LUNCH_MIN = 15
export const TROLLEY_STANDARD_LUNCH_MIN = 20

// Максимальна тривалість обіду (базова + понаднормова).
export const MAX_LUNCH_DURATION_MIN = 45

// Підготовчий час водія перед виїздом з депо на лінію (явка -> виїзд).
export const TRAM_PREP_MIN = 10
export const TROLLEY_PREP_MIN = 19

// Час на перезмінку водіїв/ротацію вагонів на ДП (DOUBLE та SPLIT наряди).
// Відбувається ВИКЛЮЧНО на Диспетчерському пункті (ст. А) — ніколи на
// проміжному вузлі примикання лінії чи в депо.
export const DISPATCH_HANDOFF_MIN = 3

export function standardLunchMin(isTrolley: boolean): number {
  return isTrolley ? TROLLEY_STANDARD_LUNCH_MIN : TRAM_STANDARD_LUNCH_MIN
}

export function prepTimeMin(isTrolley: boolean): number {
  return isTrolley ? TROLLEY_PREP_MIN : TRAM_PREP_MIN
}
