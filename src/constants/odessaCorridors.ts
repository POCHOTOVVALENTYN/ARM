import { ODESSA_DEFAULT_ROUTES } from './defaultRoutes'

// Дані реальної маршрутної мережі КП «Одесміськелектротранс»
// Згенеровано на основі топологічної бази даних omet.db (23 діючі маршрути)

export interface SharedCorridorDefinition {
  id: string
  name: string
  transportType: 'tram' | 'trolleybus'
  routeNumbers: string[]
  minHeadwayMin: number
  description: string
  keySharedStops: string[]
}

export const ODESSA_SHARED_CORRIDORS: SharedCorridorDefinition[] = [
  {
    "id": "corridor_peresyp",
    "name": "Пересипський магістральний коридор",
    "transportType": "tram",
    "routeNumbers": [
      "1",
      "6",
      "7"
    ],
    "minHeadwayMin": 2,
    "description": "Суміщений рух магістралі вул. Чорноморського козацтва — Миколаївська дорога (Пересипський міст, Ярмаркова, Лузанівка)",
    "keySharedStops": [
      "Пересипський міст",
      "вул. Миколи Плигуна",
      "пров. Кравцова",
      "Цукровий завод",
      "Ярмаркова площа",
      "Лузанівка"
    ]
  },
  {
    "id": "corridor_fontan",
    "name": "Коридор Великого Фонтану",
    "transportType": "tram",
    "routeNumbers": [
      "17",
      "18"
    ],
    "minHeadwayMin": 3,
    "description": "Суміщений рух вздовж Фонтанської дороги від Куликового поля до 11-ї ст. Великого Фонтану",
    "keySharedStops": [
      "Куликове поле",
      "1-а станція Великого Фонтану",
      "4-а станція Великого Фонтану",
      "6-а станція Великого Фонтану",
      "9-а станція Великого Фонтану",
      "11-а станція Великого Фонтану"
    ]
  },
  {
    "id": "corridor_lustdorf",
    "name": "Люстдорфський магістральний коридор",
    "transportType": "tram",
    "routeNumbers": [
      "7",
      "13",
      "26"
    ],
    "minHeadwayMin": 2,
    "description": "Спільна магістральна ділянка Люстдорфської дороги від Старосінної площі та 1-ї ст. до 11-ї ст.",
    "keySharedStops": [
      "пл. Старосінна",
      "Завод \"Стальканат\"",
      "1-а ст. Люстдорфської дороги",
      "3-я ст. Люстдорфської дороги",
      "11-а станція Люстдорфської дороги"
    ]
  },
  {
    "id": "corridor_lustdorf_suburban",
    "name": "Вузол 11-ї ст. Люстдорфської дороги",
    "transportType": "tram",
    "routeNumbers": [
      "7",
      "26",
      "27"
    ],
    "minHeadwayMin": 2,
    "description": "Вузлове стикування скороченого маршруту №27 з магістральними лініями №7 та №26",
    "keySharedStops": [
      "11-а ст. Люстдорфської дороги"
    ]
  },
  {
    "id": "corridor_slobidka",
    "name": "Слобідський трамвайний коридор",
    "transportType": "tram",
    "routeNumbers": [
      "12",
      "15"
    ],
    "minHeadwayMin": 3.5,
    "description": "Суміщений підйом та рух Слобідкою (вул. Маловського — Слобідський ринок — Міська лікарня №11)",
    "keySharedStops": [
      "Слобідський ринок",
      "Міська лікарня №11",
      "вул. Маловського",
      "Ольгіївський узвіз"
    ]
  },
  {
    "id": "corridor_privoz_vokzal",
    "name": "Привокзально-Преображенський коридор",
    "transportType": "tram",
    "routeNumbers": [
      "5",
      "28"
    ],
    "minHeadwayMin": 2.5,
    "description": "Спільна ділянка району Вокзалу та вул. Пантелеймонівської (Залізничний вокзал — Преображенська — Театр Музкомедії)",
    "keySharedStops": [
      "Залізничний вокзал",
      "вул. Пантелеймонівська",
      "вул. Преображенська",
      "Театр Музкомедії"
    ]
  },
  {
    "id": "corridor_moldavanka",
    "name": "Молдаваньско-Тираспольський коридор",
    "transportType": "tram",
    "routeNumbers": [
      "7",
      "10",
      "11",
      "15"
    ],
    "minHeadwayMin": 3,
    "description": "Спільні ділянки Молдаванки, Старопортофранківської та пл. Тираспольської / Олексіївської",
    "keySharedStops": [
      "пл. Тираспольська",
      "пл. Олексіївська",
      "станція Одеса-Товарна",
      "вул. Прохоровська"
    ]
  },
  {
    "id": "corridor_shevchenko",
    "name": "Фонтансько-Шевченківський тролейбусний коридор",
    "transportType": "trolleybus",
    "routeNumbers": [
      "7",
      "9",
      "10"
    ],
    "minHeadwayMin": 2,
    "description": "Суміщений тролейбусний рух просп. Шевченка та вул. Сегедською (Політехнічний університет — пл. 10 Квітня)",
    "keySharedStops": [
      "Політехнічний університет",
      "просп. Гагаріна",
      "пл. 10 Квітня",
      "вул. Сегедська",
      "вул. Армійська"
    ]
  },
  {
    "id": "corridor_tairova",
    "name": "Таїровський тролейбусний коридор",
    "transportType": "trolleybus",
    "routeNumbers": [
      "7",
      "12"
    ],
    "minHeadwayMin": 3,
    "description": "Спільна магістраль ж/м Таїрова (вул. Архітекторська — Ринок \"Південний\" — вул. Академіка Корольова)",
    "keySharedStops": [
      "вул. Архітекторська",
      "Ринок \"Південний\"",
      "ж/м Південний",
      "вул. Академіка Корольова"
    ]
  },
  {
    "id": "corridor_preobrazhenska_trolley",
    "name": "Преображенсько-Мечниковський коридор",
    "transportType": "trolleybus",
    "routeNumbers": [
      "3",
      "8"
    ],
    "minHeadwayMin": 3.5,
    "description": "Спільна ділянка сполучення Застави та Пересипу через Преображенську / Мечникова",
    "keySharedStops": [
      "вул. Преображенська",
      "вул. Мечникова",
      "вул. Богдана Хмельницького"
    ]
  },
  {
    "id": "corridor_center_trolley",
    "name": "Новосельського — Соборна площа",
    "transportType": "trolleybus",
    "routeNumbers": [
      "2",
      "7"
    ],
    "minHeadwayMin": 3.5,
    "description": "Спільний розворотний вузол у центрі міста (вул. Новосельського — Соборна площа — Торгова)",
    "keySharedStops": [
      "вул. Новосельського",
      "Соборна площа",
      "вул. Торгова",
      "вул. Коблевська"
    ]
  }
]

/**
 * Отримати коридори звʼязку для обраного маршруту
 */
export const getCorridorsForRoute = (
  routeNumberOrId?: string | null,
  transportType?: 'tram' | 'trolleybus' | string
): SharedCorridorDefinition[] => {
  if (!routeNumberOrId) return []
  const cleanNumber = String(routeNumberOrId).trim().replace(/^(T|Tr)/i, '')

  return ODESSA_SHARED_CORRIDORS.filter((corridor) => {
    if (transportType && corridor.transportType !== transportType.toLowerCase()) {
      return false
    }
    return corridor.routeNumbers.includes(cleanNumber)
  })
}

export interface DetailedRouteOverlap {
  targetRouteId: string
  targetRouteNumber: string
  targetRouteName: string
  targetRouteColor: string
  transportType: 'tram' | 'trolleybus'
  sharedStopsCount: number
  startStop: string
  endStop: string
  sharedStops: string[]
  minHeadwayMin: number
  corridorName?: string
}


