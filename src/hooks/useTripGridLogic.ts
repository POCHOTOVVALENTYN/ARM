import { useState, useEffect, useMemo, useCallback } from 'react'
import { useScheduleStore, ODESSA_DEFAULT_ROUTES } from '../store/useScheduleStore'
import { useRouteStore } from '../store/useRouteStore'
import { MasterGridRow, SummaryPassport, Route, MasterScheduleData } from '../types'
import { exportMasterGridToCsv, timeToMinutes } from '../utils/scheduleEngine'
import { api as apiClient } from '../utils/apiClient'
import { toast } from 'sonner'
import { getRouteSharedCorridors } from '../services/routesApi'
import { DetailedRouteOverlap } from '../constants/odessaCorridors'

export type TripGridFilterType = 'ALL' | 'DOUBLE' | 'SINGLE' | 'SPLIT' | 'PEAK'
export type TripGridViewMode = 'SCHEDULE' | 'HEADWAYS'

export interface EditingCell {
  dutyNumber: string
  roundNumber: number
  stationKey: 'departure_station_a' | 'departure_station_b'
  currentTime: string
  stationName: string
}

export interface HeadwayAuditInfo {
  headwayMin: number
  status: 'NORMAL' | 'CLUMPING' | 'GAP'
}

export const useTripGridLogic = () => {
  const routesFromStore = useRouteStore((state) => state.routes)
  const routes = routesFromStore && routesFromStore.length > 0 ? routesFromStore : ODESSA_DEFAULT_ROUTES
  const { 
    masterScheduleData, 
    setMasterScheduleData,
    archiveList = [],
    setPath
  } = useScheduleStore()

  const [selectedRouteId, setSelectedRouteId] = useState<string>('5')
  const [filterType, setFilterType] = useState<TripGridFilterType>('ALL')
  const [searchDuty, setSearchDuty] = useState<string>('')
  const [viewMode, setViewMode] = useState<TripGridViewMode>('SCHEDULE')
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [sharedCorridors, setSharedCorridors] = useState<DetailedRouteOverlap[]>([])
  const [isLoadingCorridors, setIsLoadingCorridors] = useState<boolean>(false)

  const currentRoute: Route = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || {
      id: '5',
      number: '5',
      name: 'Станція «Аркадія» — Автовокзал',
      type: 'tram',
      status: 'active',
      length_km: 17.9,
      default_speed_kmh: 12.3,
      color: '#16A34A',
      segments: []
    }
  }, [routes, selectedRouteId])

  // Завантаження суміщених ділянок для обраного маршруту
  useEffect(() => {
    let isCancelled = false
    const loadCorridors = async () => {
      setIsLoadingCorridors(true)
      try {
        const data = await getRouteSharedCorridors(selectedRouteId)
        if (!isCancelled) {
          setSharedCorridors(data.filter((c) => c.sharedStopsCount > 0))
        }
      } catch (err) {
        console.warn('Failed to load corridors for trip grid', err)
      } finally {
        if (!isCancelled) {
          setIsLoadingCorridors(false)
        }
      }
    }
    void loadCorridors()
    return () => {
      isCancelled = true
    }
  }, [selectedRouteId])

  // Автоматичне завантаження з архіву або наявної схеми при зміні маршруту
  useEffect(() => {
    if (!masterScheduleData || masterScheduleData.summary_passport?.route_id !== selectedRouteId) {
      const archived = archiveList.find((a) => a.routeId === selectedRouteId)
      if (archived && archived.data) {
        setMasterScheduleData(archived.data)
      }
    }
  }, [selectedRouteId, archiveList, masterScheduleData, setMasterScheduleData])

  const hasActiveSchedule = Boolean(
    masterScheduleData &&
    masterScheduleData.summary_passport?.route_id === selectedRouteId &&
    masterScheduleData.master_grid_rows &&
    masterScheduleData.master_grid_rows.length > 0
  )

  const passport: SummaryPassport = useMemo(() => {
    if (hasActiveSchedule && masterScheduleData?.summary_passport) {
      return masterScheduleData.summary_passport
    }

    return {
      route_id: selectedRouteId,
      route_name: currentRoute.name,
      transport_type: currentRoute.type === 'trolleybus' ? 'Тролейбус' : 'Трамвай',
      designated_dp_name: selectedRouteId === '7' ? 'ДП «вул. Паустовського»' : selectedRouteId === '18' ? 'Куликове поле' : 'Станція «Аркадія»',
      total_wagon_hours: 0,
      total_wagon_km: 0,
      total_shifts: 0,
      total_trips: 0,
      round_trip_min: 0,
      operating_speed_kmh: currentRoute.default_speed_kmh || 12.3,
      route_length_km: currentRoute.length_km || 17.9,
      headway_min: 0,
      duties_count: 0,
      schedule_period: 'Еталонний графік КП ОМЕТ',
      schedule_type: 'Будній',
      station_a_name: selectedRouteId === '7' ? 'вул. Паустовського' : selectedRouteId === '18' ? 'Куликове поле' : 'ст. Аркадія',
      station_b_name: selectedRouteId === '7' ? 'пл. Тираспільська' : selectedRouteId === '18' ? '16-та ст. Фонтану' : 'Автовокзал',
      control_points: []
    }
  }, [hasActiveSchedule, masterScheduleData, selectedRouteId, currentRoute])

  const currentDepotName = (passport as any).depot_name || (selectedRouteId === '18' ? 'ТД-1' : currentRoute.type === 'trolleybus' ? 'ТРД-1' : 'ТД-2')
  const currentDepotJunctionStop = (passport as any).depot_junction_stop_name || (selectedRouteId === '7' ? 'Пересипський міст' : selectedRouteId === '18' ? 'Куликове поле' : 'Музкомедія')

  const allRows: MasterGridRow[] = hasActiveSchedule ? (masterScheduleData?.master_grid_rows || []) : []

  const filteredRows = useMemo(() => {
    const searchLower = searchDuty.trim().toLowerCase()
    return allRows.filter((r) => {
      const matchesType = filterType === 'ALL' || r.duty_type === filterType
      const matchesSearch = !searchLower || r.duty_number.toLowerCase().includes(searchLower)
      return matchesType && matchesSearch
    })
  }, [allRows, filterType, searchDuty])

  const maxRounds = useMemo(() => {
    return Math.max(1, ...allRows.map((r) => r.rounds?.length || 0))
  }, [allRows])

  const roundIndices = useMemo(() => {
    return Array.from({ length: maxRounds }, (_, i) => i + 1)
  }, [maxRounds])

  // Мапа аналізу інтервалів (Headway Audit)
  const headwayMap = useMemo(() => {
    const map = new Map<string, HeadwayAuditInfo>()
    if (!allRows.length || !passport.headway_min) return map

    const targetHeadway = passport.headway_min

    roundIndices.forEach((rNum) => {
      const stationADepartures: { dutyNumber: string; minutes: number }[] = []
      const stationBDepartures: { dutyNumber: string; minutes: number }[] = []

      allRows.forEach((row) => {
        const round = row.rounds?.find((r) => r.round_number === rNum)
        if (round?.departure_station_a && round.departure_station_a.includes(':')) {
          stationADepartures.push({
            dutyNumber: row.duty_number,
            minutes: timeToMinutes(round.departure_station_a)
          })
        }
        if (round?.departure_station_b && round.departure_station_b.includes(':')) {
          stationBDepartures.push({
            dutyNumber: row.duty_number,
            minutes: timeToMinutes(round.departure_station_b)
          })
        }
      })

      stationADepartures.sort((a, b) => a.minutes - b.minutes)
      stationBDepartures.sort((a, b) => a.minutes - b.minutes)

      stationADepartures.forEach((dep, idx) => {
        let diff = targetHeadway
        if (idx > 0) {
          diff = dep.minutes - stationADepartures[idx - 1].minutes
        }
        let status: 'NORMAL' | 'CLUMPING' | 'GAP' = 'NORMAL'
        if (diff <= 2.0 && idx > 0) status = 'CLUMPING'
        else if (diff >= targetHeadway + 3.5) status = 'GAP'

        map.set(`${rNum}_departure_station_a_${dep.dutyNumber}`, {
          headwayMin: Math.round(diff * 10) / 10,
          status
        })
      })

      stationBDepartures.forEach((dep, idx) => {
        let diff = targetHeadway
        if (idx > 0) {
          diff = dep.minutes - stationBDepartures[idx - 1].minutes
        }
        let status: 'NORMAL' | 'CLUMPING' | 'GAP' = 'NORMAL'
        if (diff <= 2.0 && idx > 0) status = 'CLUMPING'
        else if (diff >= targetHeadway + 3.5) status = 'GAP'

        map.set(`${rNum}_departure_station_b_${dep.dutyNumber}`, {
          headwayMin: Math.round(diff * 10) / 10,
          status
        })
      })
    })

    return map
  }, [allRows, passport.headway_min, roundIndices])

  const totalAnomaliesCount = useMemo(() => {
    let count = 0
    headwayMap.forEach((info) => {
      if (info.status !== 'NORMAL') count++
    })
    return count
  }, [headwayMap])

  // Початок редагування конкретної клітинки
  const handleStartEditCell = useCallback((
    dutyNumber: string,
    roundNumber: number,
    stationKey: 'departure_station_a' | 'departure_station_b',
    currentTime: string,
    stationName: string
  ) => {
    setEditingCell({
      dutyNumber,
      roundNumber,
      stationKey,
      currentTime,
      stationName
    })
  }, [])

  const handleCancelEditCell = useCallback(() => {
    setEditingCell(null)
  }, [])

  // Збереження нового часу рейсу з синхронізацією в бекенд та БД
  const handleSaveCellTime = useCallback(async (newTime: string) => {
    if (!editingCell || !masterScheduleData) return

    try {
      const updatedRows = masterScheduleData.master_grid_rows.map((row) => {
        if (row.duty_number !== editingCell.dutyNumber) return row

        const updatedRounds = (row.rounds || []).map((round) => {
          if (round.round_number !== editingCell.roundNumber) return round
          return {
            ...round,
            [editingCell.stationKey]: newTime
          }
        })

        return {
          ...row,
          rounds: updatedRounds
        }
      })

      const updatedMasterData: MasterScheduleData = {
        ...masterScheduleData,
        master_grid_rows: updatedRows
      }

      setMasterScheduleData(updatedMasterData)

      // Синхронізація з базою даних через commit-static
      try {
        await apiClient.post('/api/v1/schedules/commit-static', updatedMasterData)
      } catch (err) {
        console.warn('Не вдалося синхронізувати оновлення з бекендом:', err)
      }

      toast.success(`Час рейсу відкориговано: Наряд №${editingCell.dutyNumber}, Круг ${editingCell.roundNumber} ➔ ${newTime}`)
      setEditingCell(null)
    } catch (err) {
      toast.error('Помилка оновлення часу рейсу')
    }
  }, [editingCell, masterScheduleData, setMasterScheduleData])

  const handlePrint = useCallback(() => {
    if (!hasActiveSchedule) return
    window.print()
  }, [hasActiveSchedule])

  const handleExportCsv = useCallback(() => {
    if (!hasActiveSchedule || !masterScheduleData) {
      toast.error('Немає активного розкладу для експорту')
      return
    }
    try {
      exportMasterGridToCsv(masterScheduleData)
      toast.success('Зведену таблицю рейсів успішно експортовано у файл Excel (.csv)!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Спробуйте пізніше'
      toast.error(`Помилка експорту: ${message}`)
    }
  }, [hasActiveSchedule, masterScheduleData])

  const handleNavigateToParameters = useCallback(() => {
    setPath('/planning/parameters')
  }, [setPath])

  const handleNavigateToInterline = useCallback(() => {
    setPath('/planning/interline')
  }, [setPath])

  return {
    routes,
    selectedRouteId,
    setSelectedRouteId,
    filterType,
    setFilterType,
    searchDuty,
    setSearchDuty,
    viewMode,
    setViewMode,
    currentRoute,
    hasActiveSchedule,
    passport,
    currentDepotName,
    currentDepotJunctionStop,
    allRows,
    filteredRows,
    maxRounds,
    roundIndices,
    headwayMap,
    totalAnomaliesCount,
    editingCell,
    sharedCorridors,
    isLoadingCorridors,
    handleStartEditCell,
    handleCancelEditCell,
    handleSaveCellTime,
    handlePrint,
    handleExportCsv,
    handleNavigateToParameters,
    handleNavigateToInterline
  }
}
