import { useState, useEffect, useMemo } from 'react'
import { useRouteStore } from '../store/useRouteStore'
import { useScheduleStore, ODESSA_DEFAULT_ROUTES } from '../store/useScheduleStore'
import { toast } from 'sonner'
import { Route } from '../types'
import { api as apiClient } from '../utils/apiClient'
import { DetailedRouteOverlap } from '../constants/odessaCorridors'
import { getRouteSharedCorridors } from '../services/routesApi'

// Реальна, авторитетна впорядкована послідовність зупинок маршруту (напрямок 0)
// з бекенду (таблиці route_stations / stations у omet.db) — ЄДИНЕ джерело.
// Раніше тут був хардкодний ODESSA_ROUTE_STOPS_MAP (odessaCorridors.ts), який
// повністю видалено: він мав системні помилки (переплутані/зайві зупинки в
// кінці списку) для 19 з 23 маршрутів (напр. маршрут №1: хардкод завершувався
// «вул. Церковна», хоча реальна кінцева станція — «завод Центроліт»).
const fetchDirectionZeroStops = async (route: Route): Promise<string[]> => {
  const cleanId = String(route.number || route.id || '').trim().replace(/^(T|Tr)/i, '')
  if (!cleanId) return []
  try {
    const { data } = await apiClient.get<{ stops: { name: string }[] }>(`/routes/${cleanId}/stops`, {
      params: { direction_id: 0 }
    })
    const names = (data?.stops || []).map((s) => s.name).filter(Boolean)
    if (names.length > 0) return names
  } catch (err) {
    console.warn(`[DutyParametersBuilder] Не вдалося отримати реальні зупинки маршруту ${route.id} з БД:`, err)
  }
  // Немає більше хардкодного списку-заглушки (був системно неточний для
  // більшості маршрутів) — при недоступності бекенду повертаємо порожній
  // список; виклики нижче самі мають fallback на назву маршруту (А — Б).
  return []
}

export interface IndividualDutyConfig {
  dutyNumber: number
  dutyType: 'DOUBLE' | 'SINGLE' | 'SPLIT' | 'PEAK'
  startStation: string
  depotName?: string
  // Обід і ротація вагонів (SPLIT) НЕ конфігуруються per-наряд: алгоритм
  // завжди прив'язує їх до прибуття на Диспетчерський пункт (ДП) — див.
  // transit_rules.py / transitRules.ts. Тому тут лише тривалість обіду
  // (залежить від виду транспорту), без локації чи вікна часу.
  lunchDurationMin: number
  assignedVehicleNum?: string
  assignedVehicleNum2?: string
  assignedDriverName?: string
  assignedDriverName2?: string
}

export interface DutyTemplate {
  id: string
  name: string
  routeId: string
  routeName: string
  transportType: 'TRAM' | 'TROLLEYBUS'
  updatedAt: string
  dutiesCount: number
  roundTripMin: number
  defaultSpeedKmh: number
  routeLengthKm: number
  designatedDpName: string
  secondaryDpName?: string
  depotName?: string
  depotJunctionStop?: string
  startDate: string
  endDate: string
  scheduleType: string
  dutyConfigs: IndividualDutyConfig[]
}

export type DutyDraft = DutyTemplate

export interface CalculatedSummary {
  routeNumber: string
  dutiesCount: number
  headwayMin: number
  roundTripMin: number
  totalTrips: number
  totalShifts: number
  calculatedAt: string
}

const extractRouteLength = (r: Route): number => r.length_km || 17.6
const extractRouteSpeed = (r: Route): number => r.default_speed_kmh || 15.0

const extractRoundTrip = (r: Route): number => {
  if (r.round_trip_min) return r.round_trip_min
  const len = extractRouteLength(r)
  const spd = extractRouteSpeed(r)
  return Math.max(30, Math.round((len / spd) * 60 + 10))
}

// Ці функції дають лише миттєву заготовку ДО завантаження реальних зупинок
// маршруту з БД (fetchDirectionZeroStops/useRouteStops) — щойно реальні дані
// приходять, стан ДП/вузла коригується ефектом нижче. Раніше тут був
// хардкодний ODESSA_ROUTE_STOPS_MAP (odessaCorridors.ts) — прибрано, бо він
// мав системні помилки (неправильні кінцеві) для 19 з 23 маршрутів.
const extractDpName = (r: Route): string => {
  if (r.name?.includes('—')) {
    return r.name.split('—')[0].trim()
  }
  return r.name || 'Головний ДП'
}

const extractDepot = (r: Route): string => {
  return r.type === 'trolleybus' ? 'ТРД-1' : (r.id === '7' || r.id === '12' ? 'ТД-2' : 'ТД-1')
}

const extractJunctionStop = (r: Route): string => {
  if (r.name?.includes('—')) {
    return r.name.split('—')[1]?.trim() || r.name.split('—')[0]?.trim()
  }
  return 'Вузол примикання'
}

const extractDefaultDutiesCount = (r: Route): number => {
  const roundMin = extractRoundTrip(r)
  return Math.max(2, Math.round(roundMin / 8))
}

const generateDefaultDutyConfigs = (count: number, route: Route, realStops?: string[]): IndividualDutyConfig[] => {
  const list: IndividualDutyConfig[] = []
  const stops = realStops || []
  const baseStation = stops.length > 0 ? stops[0] : extractDpName(route)
  const defaultDepot = extractDepot(route)
  const isTrolley = route.type === 'trolleybus'

  for (let i = 1; i <= count; i++) {
    const isSplit = i === 3 || (count > 6 && i === 4)
    const isSingle = i === count
    const isPeak = count > 8 && (i === 5 || i === 6)

    const dtype: 'DOUBLE' | 'SINGLE' | 'SPLIT' | 'PEAK' = isSplit 
      ? 'SPLIT' 
      : isPeak 
      ? 'PEAK' 
      : isSingle 
      ? 'SINGLE' 
      : 'DOUBLE'

    const veh1 = isTrolley ? `Тр-${3000 + i}` : `Вг-${4000 + i}`
    const veh2 = isSplit ? (isTrolley ? `Тр-${3100 + i}` : `Вг-${4100 + i}`) : undefined

    list.push({
      dutyNumber: i,
      dutyType: dtype,
      startStation: baseStation,
      depotName: defaultDepot,
      lunchDurationMin: isTrolley ? 20 : 15,
      assignedVehicleNum: veh1,
      assignedVehicleNum2: veh2,
      assignedDriverName: '',
      assignedDriverName2: isSplit ? '' : undefined
    })
  }
  return list
}

export const useDutyParametersBuilderLogic = () => {
  const routesFromStore = useRouteStore((state) => state.routes)
  const routes = routesFromStore && routesFromStore.length > 0 ? routesFromStore : ODESSA_DEFAULT_ROUTES

  const { 
    masterScheduleData, 
    generateMasterSchedule, 
    isProcessingTransaction,
    dutyDrafts = [],
    saveDutyDraft,
    deleteDutyDraft,
    archiveCurrentSchedule,
    setPath,
    activeDutyBuilderState,
    setActiveDutyBuilderState
  } = useScheduleStore()

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    return (activeDutyBuilderState?.currentStep as (1 | 2 | 3)) || 1
  })

  const [transportTypeFilter, setTransportTypeFilter] = useState<'all' | 'tram' | 'trolleybus'>(() => {
    return activeDutyBuilderState?.transportTypeFilter || 'all'
  })

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (transportTypeFilter === 'tram') return r.type === 'tram'
      if (transportTypeFilter === 'trolleybus') return r.type === 'trolleybus'
      return true
    })
  }, [routes, transportTypeFilter])

  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => {
    return activeDutyBuilderState?.selectedRouteId || routes[0]?.id || '5'
  })

  const currentRoute: Route = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || routes[0] || {
      id: '5',
      number: '5',
      name: 'Автовокзал — Аркадія',
      type: 'tram',
      length_km: 14.2,
      default_speed_kmh: 14.0,
      color: '#16A34A',
      status: 'active',
      segments: []
    }
  }, [routes, selectedRouteId])

  // Повний список діючих зупинок для обраного маршруту. Ініціалізується
  // мінімальною заготовкою (назва маршруту А—Б) для миттєвого першого
  // рендеру, але одразу заміщується РЕАЛЬНИМИ даними з БД нижче (ефект).
  const [availableRouteStops, setAvailableRouteStops] = useState<string[]>(() => {
    if (currentRoute.allStations && currentRoute.allStations.length > 0) return currentRoute.allStations
    if (currentRoute.stations && currentRoute.stations.length > 0) return currentRoute.stations
    if (currentRoute.name?.includes('—')) {
      return currentRoute.name.split('—').map((s) => s.trim())
    }
    return ['Головний ДП', 'Кінцева станція Б']
  })

  // Підвантажуємо РЕАЛЬНІ зупинки маршруту (напрямок 0) з БД при виборі
  // маршруту. Якщо поточний Головний ДП не входить у щойно отриманий
  // справжній список — це ознака того, що початкове значення взяте з
  // хибного резервного джерела, і його потрібно виправити.
  useEffect(() => {
    let isMounted = true
    fetchDirectionZeroStops(currentRoute).then((stops) => {
      if (!isMounted || stops.length === 0) return
      setAvailableRouteStops(stops)
      setDesignatedDpName((prev) => (stops.includes(prev) ? prev : stops[0]))
    })
    return () => {
      isMounted = false
    }
  }, [currentRoute.id, currentRoute.number])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const nextMonthStr = useMemo(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], [])

  const [scheduleType, setScheduleType] = useState<string>(() => {
    return activeDutyBuilderState?.scheduleType || 'Будній'
  })
  const [startDate, setStartDate] = useState<string>(() => {
    return activeDutyBuilderState?.startDate || todayStr
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return activeDutyBuilderState?.endDate || nextMonthStr
  })

  const [dutiesCount, setDutiesCount] = useState<number>(() => {
    return activeDutyBuilderState?.dutiesCount !== undefined
      ? activeDutyBuilderState.dutiesCount
      : extractDefaultDutiesCount(currentRoute)
  })
  const [roundTripMin, setRoundTripMin] = useState<number>(() => {
    return activeDutyBuilderState?.roundTripMin !== undefined
      ? activeDutyBuilderState.roundTripMin
      : extractRoundTrip(currentRoute)
  })
  const [defaultSpeedKmh, setDefaultSpeedKmh] = useState<number>(() => {
    return activeDutyBuilderState?.defaultSpeedKmh !== undefined
      ? activeDutyBuilderState.defaultSpeedKmh
      : extractRouteSpeed(currentRoute)
  })
  const [routeLengthKm, setRouteLengthKm] = useState<number>(() => {
    return activeDutyBuilderState?.routeLengthKm !== undefined
      ? activeDutyBuilderState.routeLengthKm
      : extractRouteLength(currentRoute)
  })

  // Головний ДП (обирається з зупинок)
  const [designatedDpName, setDesignatedDpName] = useState<string>(() => {
    return activeDutyBuilderState?.designatedDpName || availableRouteStops[0] || extractDpName(currentRoute)
  })

  // Додатковий ДП (необов'язковий)
  const [secondaryDpName, setSecondaryDpName] = useState<string>(() => {
    return (activeDutyBuilderState as any)?.secondaryDpName || ''
  })

  // Протилежна кінцева станція (ст. Б) — останній пункт у списку зупинок
  // маршруту (відмінний від ДП). Наряд може виходити на лінію лише з ДП або
  // з протилежної кінцевої — довільна проміжна зупинка як точка старту не
  // має операційного сенсу.
  const oppositeTerminusName = useMemo(() => {
    if (availableRouteStops.length === 0) return ''
    const last = availableRouteStops[availableRouteStops.length - 1]
    return last !== designatedDpName ? last : (availableRouteStops[availableRouteStops.length - 2] || last)
  }, [availableRouteStops, designatedDpName])

  const [depotName, setDepotName] = useState<string>(() => {
    return activeDutyBuilderState?.depotName || extractDepot(currentRoute)
  })
  const [depotJunctionStop, setDepotJunctionStop] = useState<string>(() => {
    return activeDutyBuilderState?.depotJunctionStop || extractJunctionStop(currentRoute)
  })

  const [dutyConfigs, setDutyConfigs] = useState<IndividualDutyConfig[]>(() => {
    if (activeDutyBuilderState?.dutyConfigs && activeDutyBuilderState.dutyConfigs.length > 0) {
      return activeDutyBuilderState.dutyConfigs.map((d) => ({
        ...d,
        depotName: d.depotName || extractDepot(currentRoute)
      }))
    }
    return generateDefaultDutyConfigs(
      activeDutyBuilderState?.dutiesCount || extractDefaultDutiesCount(currentRoute),
      currentRoute
    )
  })

  const [lastCalculatedSummary, setLastCalculatedSummary] = useState<CalculatedSummary | null>(() => {
    return activeDutyBuilderState?.lastCalculatedSummary || null
  })

  // Автоматичне зникнення банера успіху через 5 секунд
  useEffect(() => {
    if (!lastCalculatedSummary) return
    const timer = setTimeout(() => {
      setLastCalculatedSummary(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [lastCalculatedSummary])

  const handleDismissCalculatedSummary = () => {
    setLastCalculatedSummary(null)
  }

  // Шаблони нарядів (колишні чернетки)
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState<boolean>(false)
  const [templateNameInput, setTemplateNameInput] = useState<string>('')
  const [isTemplatesListOpen, setIsTemplatesListOpen] = useState<boolean>(false)

  useEffect(() => {
    setActiveDutyBuilderState({
      selectedRouteId,
      transportTypeFilter,
      scheduleType,
      startDate,
      endDate,
      dutiesCount,
      roundTripMin,
      defaultSpeedKmh,
      routeLengthKm,
      designatedDpName,
      secondaryDpName,
      depotName,
      depotJunctionStop,
      dutyConfigs,
      currentStep,
      lastCalculatedSummary
    })
  }, [
    selectedRouteId,
    transportTypeFilter,
    scheduleType,
    startDate,
    endDate,
    dutiesCount,
    roundTripMin,
    defaultSpeedKmh,
    routeLengthKm,
    designatedDpName,
    secondaryDpName,
    depotName,
    depotJunctionStop,
    dutyConfigs,
    currentStep,
    lastCalculatedSummary,
    setActiveDutyBuilderState
  ])

  const handleChangeDutiesCount = (newCount: number) => {
    const count = Math.max(1, Math.min(45, newCount))
    setDutiesCount(count)
    setDutyConfigs((prev) => {
      if (prev.length === count) return prev
      if (prev.length > count) {
        return prev.slice(0, count)
      }
      const baseStation = designatedDpName || availableRouteStops[0] || extractDpName(currentRoute)
      const defaultDep = extractDepot(currentRoute)
      const isTrolley = currentRoute.type === 'trolleybus'
      const additional: IndividualDutyConfig[] = []
      
      for (let i = prev.length + 1; i <= count; i++) {
        const isSplit = i === 3 || (count > 6 && i === 4)
        const isSingle = i === count
        const isPeak = count > 8 && (i === 5 || i === 6)
        const dtype: 'DOUBLE' | 'SINGLE' | 'SPLIT' | 'PEAK' = isSplit 
          ? 'SPLIT' 
          : isPeak 
          ? 'PEAK' 
          : isSingle 
          ? 'SINGLE' 
          : 'DOUBLE'

        const veh1 = isTrolley ? `Тр-${3000 + i}` : `Вг-${4000 + i}`
        const veh2 = isSplit ? (isTrolley ? `Тр-${3100 + i}` : `Вг-${4100 + i}`) : undefined

        additional.push({
          dutyNumber: i,
          dutyType: dtype,
          startStation: baseStation,
          depotName: defaultDep,
          lunchDurationMin: isTrolley ? 20 : 15,
          assignedVehicleNum: veh1,
          assignedVehicleNum2: veh2,
          assignedDriverName: '',
          assignedDriverName2: isSplit ? '' : undefined
        })
      }
      return [...prev, ...additional]
    })
  }

  const handleMacroDepotChange = (newDepot: string) => {
    setDepotName(newDepot)
    setDutyConfigs((prev) =>
      prev.map((d) => ({
        ...d,
        depotName: d.depotName || newDepot
      }))
    )
  }

  const calculateRoundTripFromSpeed = (len: number, spd: number): number => {
    if (!spd || spd <= 0 || !len || len <= 0) return 60
    return Math.max(15, Math.round((len / spd) * 60 + 10))
  }

  const handleChangeSpeed = (newSpeed: number) => {
    const spd = Math.max(1, newSpeed)
    setDefaultSpeedKmh(spd)
    const newRt = calculateRoundTripFromSpeed(routeLengthKm, spd)
    setRoundTripMin(newRt)
  }

  const handleChangeRouteLength = (newLen: number) => {
    const len = Math.max(0.1, newLen)
    setRouteLengthKm(len)
    const newRt = calculateRoundTripFromSpeed(len, defaultSpeedKmh)
    setRoundTripMin(newRt)
  }

  const handleChangeRoundTrip = (newRt: number) => {
    const rt = Math.max(15, newRt)
    setRoundTripMin(rt)
    if (rt > 10 && routeLengthKm > 0) {
      const impliedSpeed = parseFloat(((routeLengthKm / (rt - 10)) * 60).toFixed(1))
      if (impliedSpeed > 0 && impliedSpeed < 100) {
        setDefaultSpeedKmh(impliedSpeed)
      }
    }
  }

  const handleChangeDesignatedDpName = (newDpName: string) => {
    const prevDp = designatedDpName
    setDesignatedDpName(newDpName)
    setDutyConfigs((prev) =>
      prev.map((d) => ({
        ...d,
        startStation: (d.startStation === prevDp || !d.startStation) ? newDpName : d.startStation
      }))
    )
  }

  const handleChangeSecondaryDpName = (newDpName: string) => {
    setSecondaryDpName(newDpName)
  }

  const handleChangeDepotJunctionStop = (newJunc: string) => {
    setDepotJunctionStop(newJunc)
  }

  const handleProceedToStep2 = () => {
    setDutyConfigs((prev) =>
      prev.map((d) => ({
        ...d,
        startStation: d.startStation?.trim() ? d.startStation : designatedDpName,
        depotName: d.depotName || depotName
      }))
    )
    setCurrentStep(2)
  }

  const handleBackToStep1 = () => {
    setCurrentStep(1)
  }

  const handleProceedToStep3 = () => {
    setCurrentStep(3)
  }

  const handleBackToStep2 = () => {
    setCurrentStep(2)
  }

  const handleSelectRoute = async (rId: string) => {
    setSelectedRouteId(rId)
    const target = routes.find((r) => r.id === rId)
    if (!target) return

    // Пріоритет — реальні зупинки маршруту з БД (запобігає показу хибної
    // протилежної кінцевої/ДП через помилки у резервному хардкод-списку).
    const stops = await fetchDirectionZeroStops(target)
    const len = extractRouteLength(target)
    const spd = extractRouteSpeed(target)
    const rt = extractRoundTrip(target)
    const dp = stops.length > 0 ? stops[0] : extractDpName(target)
    const dep = extractDepot(target)
    const junc = stops.length > 2 ? stops[Math.floor(stops.length / 2)] : extractJunctionStop(target)
    const duties = extractDefaultDutiesCount(target)

    setAvailableRouteStops(stops)
    setRouteLengthKm(len)
    setDefaultSpeedKmh(spd)
    setRoundTripMin(rt)
    setDesignatedDpName(dp)
    setSecondaryDpName('')
    setDepotName(dep)
    setDepotJunctionStop(junc)
    setDutiesCount(duties)
    setDutyConfigs(generateDefaultDutyConfigs(duties, target, stops))
    setLastCalculatedSummary(null)
  }

  const handleUpdateDutyField = <K extends keyof IndividualDutyConfig>(
    index: number,
    field: K,
    value: IndividualDutyConfig[K]
  ) => {
    setDutyConfigs((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleMoveDutyUp = (index: number) => {
    if (index <= 0) return
    setDutyConfigs((prev) => {
      const updated = [...prev]
      const temp = updated[index - 1]
      updated[index - 1] = updated[index]
      updated[index] = temp
      return updated.map((d, i) => ({ ...d, dutyNumber: i + 1 }))
    })
  }

  const handleMoveDutyDown = (index: number) => {
    if (index >= dutyConfigs.length - 1) return
    setDutyConfigs((prev) => {
      const updated = [...prev]
      const temp = updated[index + 1]
      updated[index + 1] = updated[index]
      updated[index] = temp
      return updated.map((d, i) => ({ ...d, dutyNumber: i + 1 }))
    })
  }

  const handleApplyFirstDutyToAll = () => {
    if (dutyConfigs.length === 0) return
    const first = dutyConfigs[0]
    setDutyConfigs((prev) =>
      prev.map((d) => ({
        ...d,
        depotName: first.depotName || depotName,
        startStation: first.startStation,
        lunchDurationMin: first.lunchDurationMin
      }))
    )
    toast.success('Параметри Наряду №1 застосовано до всіх нарядів!')
  }

  // Робота з шаблонами нарядів
  const handleSaveTemplateConfirm = () => {
    if (!templateNameInput.trim()) {
      toast.error('Введіть назву для шаблону!')
      return
    }

    const newTemplate: DutyTemplate = {
      id: `template_${Date.now()}`,
      name: templateNameInput.trim(),
      routeId: selectedRouteId,
      routeName: currentRoute.name,
      transportType: currentRoute.type === 'trolleybus' ? 'TROLLEYBUS' : 'TRAM',
      updatedAt: new Date().toLocaleString('uk-UA'),
      dutiesCount,
      roundTripMin,
      defaultSpeedKmh,
      routeLengthKm,
      designatedDpName,
      secondaryDpName,
      depotName,
      depotJunctionStop,
      startDate,
      endDate,
      scheduleType,
      dutyConfigs
    }

    saveDutyDraft(newTemplate)
    setIsSaveTemplateOpen(false)
    setTemplateNameInput('')
    toast.success(`Шаблон нарядів «${newTemplate.name}» успішно збережено!`)
  }

  const handleLoadTemplate = (template: DutyTemplate) => {
    setSelectedRouteId(template.routeId)
    setDutiesCount(template.dutiesCount)
    setRoundTripMin(template.roundTripMin)
    setDefaultSpeedKmh(template.defaultSpeedKmh)
    setRouteLengthKm(template.routeLengthKm)
    setDesignatedDpName(template.designatedDpName)
    setSecondaryDpName(template.secondaryDpName || '')
    setDepotName(template.depotName || extractDepot(currentRoute))
    setDepotJunctionStop(template.depotJunctionStop || extractJunctionStop(currentRoute))
    setStartDate(template.startDate || todayStr)
    setEndDate(template.endDate || nextMonthStr)
    setScheduleType(template.scheduleType || 'Будній')
    setDutyConfigs(template.dutyConfigs || [])
    setIsTemplatesListOpen(false)
    toast.success(`Шаблон нарядів «${template.name}» успішно завантажено!`)
  }

  const handleDeleteTemplate = (id: string, name: string) => {
    deleteDutyDraft(id)
    toast.success(`Шаблон нарядів «${name}» видалено`)
  }

  const calculatedInterval = dutiesCount > 0 ? (roundTripMin / dutiesCount).toFixed(1) : '0'

  const countDouble = dutyConfigs.filter((d) => d.dutyType === 'DOUBLE').length
  const countSingle = dutyConfigs.filter((d) => d.dutyType === 'SINGLE').length
  const countSplit = dutyConfigs.filter((d) => d.dutyType === 'SPLIT').length
  const countPeak = dutyConfigs.filter((d) => d.dutyType === 'PEAK').length

  const driversShift1 = countDouble + countSingle + countSplit + countPeak
  const driversShift2 = countDouble + countSplit
  const totalDriversNeeded = driversShift1 + driversShift2

  const handleCalculateSchedule = async () => {
    try {
      const startStationsMap: Record<string, string> = {}
      const dutyTypesMap: Record<string, string> = {}
      const depotsMap: Record<string, string> = {}
      const vehiclesMap: Record<string, string> = {}
      const vehicles2Map: Record<string, string> = {}

      dutyConfigs.forEach((d) => {
        const numStr = d.dutyNumber.toString()
        const fullKey = `${selectedRouteId}-${String(d.dutyNumber).padStart(2, '0')}`

        startStationsMap[numStr] = d.startStation
        startStationsMap[fullKey] = d.startStation

        dutyTypesMap[numStr] = d.dutyType
        dutyTypesMap[fullKey] = d.dutyType

        const assignedDepot = d.depotName || depotName
        depotsMap[numStr] = assignedDepot
        depotsMap[fullKey] = assignedDepot

        if (d.assignedVehicleNum) {
          vehiclesMap[numStr] = d.assignedVehicleNum
          vehiclesMap[fullKey] = d.assignedVehicleNum
        }

        if (d.dutyType === 'SPLIT' && d.assignedVehicleNum2) {
          vehicles2Map[numStr] = d.assignedVehicleNum2
          vehicles2Map[fullKey] = d.assignedVehicleNum2
        }
      })

      const periodString = `з ${startDate} по ${endDate}`

      const payload = {
        route_id: selectedRouteId,
        route_name: currentRoute.name || `Маршрут №${currentRoute.number}`,
        transport_type: currentRoute.type === 'trolleybus' ? 'TROLLEYBUS' : 'TRAM',
        duties_count: dutiesCount,
        round_trip_min: roundTripMin,
        route_length_km: routeLengthKm,
        default_speed_kmh: defaultSpeedKmh,
        designated_dp_name: designatedDpName,
        secondary_dp_name: secondaryDpName,
        depot_name: depotName,
        depot_junction_stop_name: depotJunctionStop,
        start_stations_per_duty: startStationsMap,
        duty_types_per_duty: dutyTypesMap,
        depots_per_duty: depotsMap,
        vehicles_per_duty: vehiclesMap,
        vehicles2_per_duty: vehicles2Map,
        schedule_period: periodString,
        schedule_type: scheduleType,
        duty_configs: dutyConfigs
      }

      const result = await generateMasterSchedule(payload)

      // ВАЖЛИВО: generateMasterSchedule повертає null, якщо бекенд недоступний
      // або відповів невалідними даними (useScheduleStore встановлює
      // masterScheduleError і показує банер на «Зведеній таблиці»). Раніше тут
      // не було перевірки на null — і виконання йшло далі: наряд «архівувався»
      // пустим/старим станом, показувався toast.success та відбувався перехід
      // на «Зведену таблицю», хоча насправді нічого не було розраховано. Це і
      // була та сама колізія «диск недоступний, але наряди успішно сформовано».
      if (!result || !result.summary_passport) {
        toast.error("Не вдалося сформувати розклад: математичне ядро ОМЕТ недоступне. Перевірте з'єднання з бекенд-сервером і спробуйте ще раз.")
        return
      }

      const passport = result.summary_passport

      archiveCurrentSchedule(`${scheduleType} (${new Date().toLocaleDateString('uk-UA')})`)

      // СИНХРОНІЗАЦІЯ З БАЗОЮ ДАНИХ (omet.db):
      // Фіксуємо розрахований еталонний розклад у БД зі збереженням нарядів, змін та рейсів
      try {
        await apiClient.post('/api/v1/schedules/commit-static', result)
      } catch (dbErr) {
        console.warn('Не вдалося автоматично зафіксувати розклад у базі даних (commit-static):', dbErr)
        toast.error('Розклад розраховано, але НЕ збережено в базі даних — перевірте зʼєднання і повторіть збереження.')
      }

      setLastCalculatedSummary({
        routeNumber: currentRoute.number,
        dutiesCount: dutiesCount,
        headwayMin: passport.headway_min || parseFloat(calculatedInterval),
        roundTripMin: roundTripMin,
        totalTrips: passport.total_trips,
        totalShifts: passport.total_shifts,
        calculatedAt: new Date().toLocaleTimeString('uk-UA')
      })

      // Автоматичне повернення на початковий Етап 1 після розрахунку та перехід на шахматку
      setCurrentStep(1)
      setPath('/planning/matrix')

      toast.success(`Розклад маршруту №${currentRoute.number} на ${dutiesCount} нарядів успішно розраховано та збережено в архів!`)
    } catch (err) {
      toast.error('Помилка формування розкладу. Перевірте параметри.')
    }
  }

  // Завантаження суміщених ділянок з API БД з автономним fallback
  const [apiCorridorOverlaps, setApiCorridorOverlaps] = useState<DetailedRouteOverlap[]>([])

  useEffect(() => {
    let isMounted = true
    const loadOverlaps = async () => {
      if (!currentRoute) return
      const routeId = currentRoute.id || currentRoute.number
      const data = await getRouteSharedCorridors(routeId)
      if (isMounted && data && data.length > 0) {
        setApiCorridorOverlaps(data)
      } else if (isMounted) {
        setApiCorridorOverlaps([])
      }
    }
    loadOverlaps()
    return () => {
      isMounted = false
    }
  }, [currentRoute?.id, currentRoute?.number, currentRoute?.name])

  // Точні суміщені маршрути (виключно ті, що мають > 0 спільних зупинок).
  // ЄДИНЕ джерело — БД (route_shared_corridors, обчислена з реальної
  // топології route_stations). Раніше тут був клієнтський fallback
  // getDetailedSharedStopsForRoute() на хардкод-список зупинок — прибрано
  // разом з ODESSA_ROUTE_STOPS_MAP: він мав неправильні кінцеві станції для
  // 19 з 23 маршрутів, тож міг рахувати фантомні/відсутні перетини.
  const detailedCorridorOverlaps: DetailedRouteOverlap[] = useMemo(() => {
    if (!currentRoute) return []
    return apiCorridorOverlaps.filter((o) => o.sharedStopsCount > 0)
  }, [currentRoute, apiCorridorOverlaps])

  return {
    routes,
    filteredRoutes,
    currentRoute,
    currentStep,
    selectedRouteId,
    transportTypeFilter,
    scheduleType,
    startDate,
    endDate,
    dutiesCount,
    roundTripMin,
    defaultSpeedKmh,
    routeLengthKm,
    designatedDpName,
    secondaryDpName,
    depotName,
    depotJunctionStop,
    dutyConfigs,
    lastCalculatedSummary,
    isProcessingTransaction,
    masterScheduleData,
    availableRouteStops,
    oppositeTerminusName,

    // Шаблони нарядів
    dutyTemplates: dutyDrafts as DutyTemplate[],
    dutyDrafts,
    isSaveTemplateOpen,
    isTemplatesListOpen,
    templateNameInput,
    isSaveDraftOpen: isSaveTemplateOpen,
    isDraftsListOpen: isTemplatesListOpen,
    draftNameInput: templateNameInput,

    calculatedInterval,
    countDouble,
    countSingle,
    countSplit,
    countPeak,
    driversShift1,
    driversShift2,
    totalDriversNeeded,
    detailedCorridorOverlaps,

    setTransportTypeFilter,
    setScheduleType,
    setStartDate,
    setEndDate,
    setIsSaveTemplateOpen,
    setIsTemplatesListOpen,
    setTemplateNameInput,
    setIsSaveDraftOpen: setIsSaveTemplateOpen,
    setIsDraftsListOpen: setIsTemplatesListOpen,
    setDraftNameInput: setTemplateNameInput,
    setPath,

    handleSelectRoute,
    handleChangeDutiesCount,
    handleMacroDepotChange,
    handleChangeSpeed,
    handleChangeRouteLength,
    handleChangeRoundTrip,
    handleChangeDesignatedDpName,
    handleChangeSecondaryDpName,
    handleChangeDepotJunctionStop,
    handleProceedToStep2,
    handleProceedToStep3,
    handleBackToStep1,
    handleBackToStep2,
    handleUpdateDutyField,
    handleMoveDutyUp,
    handleMoveDutyDown,
    handleApplyFirstDutyToAll,
    handleSaveTemplateConfirm,
    handleLoadTemplate,
    handleDeleteTemplate,
    handleSaveDraftConfirm: handleSaveTemplateConfirm,
    handleLoadDraft: handleLoadTemplate,
    handleDeleteDraft: handleDeleteTemplate,
    handleCalculateSchedule,
    handleDismissCalculatedSummary
  }
}
