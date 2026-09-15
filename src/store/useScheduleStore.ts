export type ThemeMode = 'light' | 'dark' | 'system'
export enum UserRole { ADMIN = 'ADMIN', DISPATCHER = 'DISPATCHER', DRIVER = 'DRIVER', OBSERVER = 'OBSERVER' }

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import apiClient from '../utils/apiClient'
import { generateLocalMasterSchedule } from '../utils/scheduleEngine'
import { 
  VehicleBlock, 
  TransportType, 
  DriverDuty, 
  Trip, 
  Route, 
  MasterScheduleData, 
  MasterScheduleArchiveItem,
  ScheduleConflict 
} from '../types'
import { useRouteStore } from './useRouteStore'
import { useStationStore } from './useStationStore'

export interface TelemetryData {
  [vehicle_id: string]: {
    lat: number
    lon: number
    speed: number
    status: string
    timestamp: number
  }
}

import { ODESSA_DEFAULT_ROUTES } from '../constants/defaultRoutes'
export { ODESSA_DEFAULT_ROUTES }

interface ScheduleState {
  generatedTrips: Trip[]
  currentTime: number
  currentScheduleId: number | null
  currentScheduleStatus: any | null
  setGeneratedTrips: (trips: Trip[]) => void
  setCurrentScheduleInfo: (id: number, status: any) => void
  setCurrentTime: (time: number) => void
  clearGeneratedSchedule: () => void
  
  liveSchedule: any | null
  telemetry: TelemetryData
  isProcessingTransaction: boolean
  validationWarnings: string[]
  conflicts: ScheduleConflict[]
  activeDetourId?: string
  currentPath: string
  theme: string
  user: { name: string; role?: UserRole; badge?: string }
  userRole: string
  
  liveBlocks: VehicleBlock[]
  liveDuties: DriverDuty[]
  selectedDate: string
  setSelectedDate: (date: string) => void
  
  draftBlocks: VehicleBlock[]
  draftDuties: DriverDuty[]
  isDraftModified: boolean
  commitDraft: () => void
  discardDraft: () => void

  dutyDrafts: any[]
  saveDutyDraft: (draft: any) => void
  deleteDutyDraft: (draftId: string) => void

  activeDutyBuilderState: any | null
  setActiveDutyBuilderState: (draft: any) => void
  resetActiveDutyBuilderState: () => void

  isGtfsActive?: boolean
  historyStack: any[]
  redoStack: any[]
  undoLastAction: () => void
  redoAction: () => void

  deploymentPlans: any[]
  updateDeploymentPlan: (plan: any) => void
  executeHotReserveSwap: (brokenBlockId: string, reserveBlockId: string, incidentTime?: string) => void
  applySlackToNode: (nodeId: string, minutes: number) => void
  setDraftSchedule?: (payload: any) => void

  generateMultipleBlocks: (routeId: string, transportType: TransportType, count: number, date?: string) => void
  updateVehicleBlockInfo: (blockId: string, info: Partial<VehicleBlock>) => void
  deleteVehicleBlock: (blockId: string) => void
  clearVehicleBlocks: (blockIds?: string[]) => void
  reorderVehicleBlocks: (activeId: string, overId: string) => void
  validateScheduleConflicts: () => ScheduleConflict[]

  setLiveSchedule: (schedule: any) => void
  updateTelemetry: (data: any) => void
  setIsProcessingTransaction: (status: boolean) => void
  setValidationWarnings: (warnings: string[]) => void
  setActiveDetour: (id: string | undefined) => void
  setPath: (path: string) => void
  setTheme: (theme: string) => void
  setUserRole: (role: string) => void
  
  setInitialSchedule: (blocks: VehicleBlock[], duties: DriverDuty[]) => void
  updateTripDeparture: (blockId: string, tripId: string, startTime: number, delayMinutes: number) => Promise<void>

  routes: any[]
  stops: any[]
  isInitialized: boolean
  fetchInitialData: () => Promise<void>
  loadGtfsData: () => Promise<void>

  // Master Grid & Duty Books (Еталонний розклад ОМЕТ)
  masterScheduleData: MasterScheduleData | null
  masterScheduleError: string | null
  activeDutyNumber: string | null
  setMasterScheduleData: (data: MasterScheduleData) => void
  setActiveDutyNumber: (dutyNum: string | null) => void
  setMasterScheduleError: (message: string | null) => void
  generateMasterSchedule: (payload: any) => Promise<MasterScheduleData | null>

  // Архів затверджених розкладів КП «ОМЕТ»
  archiveList: MasterScheduleArchiveItem[]
  archiveCurrentSchedule: (label?: string) => void
  restoreArchivedSchedule: (archiveId: string) => void
  deleteArchivedSchedule: (archiveId: string) => void
}

export const useScheduleStore = create<ScheduleState>()(
  immer((set, get) => ({
    generatedTrips: [],
    currentTime: 360,
    currentScheduleId: null,
    currentScheduleStatus: null,
    setGeneratedTrips: (trips) => set((state) => { state.generatedTrips = trips }),
    setCurrentScheduleInfo: (id, status) => set((state) => { 
      state.currentScheduleId = id
      state.currentScheduleStatus = status
    }),
    setCurrentTime: (time) => set((state) => { state.currentTime = time }),
    clearGeneratedSchedule: () => set((state) => { 
      state.generatedTrips = []
      state.currentTime = 360
      state.currentScheduleId = null
      state.currentScheduleStatus = null
    }),

    liveSchedule: null,
    telemetry: {},
    isProcessingTransaction: false,
    validationWarnings: [],
    conflicts: [],

    draftBlocks: [],
    draftDuties: [],
    isDraftModified: false,
    commitDraft: () => set((state) => {
      state.liveBlocks = [...state.draftBlocks]
      state.liveDuties = [...state.draftDuties]
      state.liveSchedule = { current_blocks: [...state.draftBlocks] }
      state.isDraftModified = false
    }),
    discardDraft: () => set((state) => {
      state.draftBlocks = []
      state.draftDuties = []
      state.isDraftModified = false
    }),
    dutyDrafts: (() => {
      try {
        const saved = localStorage.getItem('omet_duty_drafts')
        return saved ? JSON.parse(saved) : []
      } catch (e) {
        return []
      }
    })(),
    saveDutyDraft: (draft: any) => set((state) => {
      const idx = state.dutyDrafts.findIndex((d: any) => d.id === draft.id)
      if (idx >= 0) {
        state.dutyDrafts[idx] = draft
      } else {
        state.dutyDrafts.unshift(draft)
      }
      try {
        localStorage.setItem('omet_duty_drafts', JSON.stringify(state.dutyDrafts))
      } catch (e) {}
    }),
    deleteDutyDraft: (draftId: string) => set((state) => {
      state.dutyDrafts = state.dutyDrafts.filter((d: any) => d.id !== draftId)
      try {
        localStorage.setItem('omet_duty_drafts', JSON.stringify(state.dutyDrafts))
      } catch (e) {}
    }),
    activeDutyBuilderState: (() => {
      try {
        const saved = localStorage.getItem('omet_active_duty_builder')
        return saved ? JSON.parse(saved) : null
      } catch (e) {
        return null
      }
    })(),
    setActiveDutyBuilderState: (draft: any) => set((state) => {
      if (!state.activeDutyBuilderState) {
        state.activeDutyBuilderState = { ...draft }
      } else {
        state.activeDutyBuilderState = { ...state.activeDutyBuilderState, ...draft }
      }
      try {
        localStorage.setItem('omet_active_duty_builder', JSON.stringify(state.activeDutyBuilderState))
      } catch (e) {}
    }),
    resetActiveDutyBuilderState: () => set((state) => {
      state.activeDutyBuilderState = null
      try {
        localStorage.removeItem('omet_active_duty_builder')
      } catch (e) {}
    }),
    isGtfsActive: true,
    historyStack: [],
    redoStack: [],
    undoLastAction: () => {},
    redoAction: () => {},
    deploymentPlans: [],
    updateDeploymentPlan: (plan: any) => set((state) => {
      state.deploymentPlans = [...state.deploymentPlans.filter((p: any) => p.id !== plan.id), plan]
    }),
    executeHotReserveSwap: () => {},
    applySlackToNode: () => {},
    setDraftSchedule: (schedulePayload: any) => set((state) => {
      state.currentScheduleId = schedulePayload?.id || null
      state.currentScheduleStatus = schedulePayload?.status || null
    }),
    activeDetourId: undefined,
    currentPath: '/planning/parameters',
    theme: (typeof window !== 'undefined' ? localStorage.getItem('omet_theme') : null) || 'omet-clean',
    user: { name: 'Головний Диспетчер', role: UserRole.ADMIN, badge: '12345' },
    userRole: 'DISPATCHER',

    routes: ODESSA_DEFAULT_ROUTES,
    stops: [],
    isInitialized: false,

    fetchInitialData: async () => {
      if (get().isInitialized) return
      set((draft) => { draft.isInitialized = true })
      try {
        const response = await apiClient.get('/schedule/init')
        const rList = response.data.routes && response.data.routes.length > 0 ? response.data.routes : ODESSA_DEFAULT_ROUTES
        const sList = response.data.stops || response.data.stations || []

        useRouteStore.getState().setInitialRoutes(rList)

        if (sList && sList.length > 0) {
          const formattedStations = sList.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            code: s.name ? s.name.substring(0, 3).toUpperCase() : `ЗП${s.id}`,
            isTerminal: Boolean(s.is_dispatch_station || s.type === 'TERMINAL'),
            lat: Number(s.lat) || 46.468,
            lng: Number(s.lng || s.lon) || 30.741,
          }))
          useStationStore.getState().setStations(formattedStations)
        }

        set((draft) => {
          draft.routes = rList
          draft.stops = sList
          draft.liveBlocks = response.data.blocks || []
          draft.liveDuties = response.data.driver_duties || []
          draft.liveSchedule = { current_blocks: response.data.blocks || [] }
        })
      } catch (error) {
        console.error('Помилка ініціалізації розкладу ОМЕТ, завантажуємо локальний пресет', error)
        useRouteStore.getState().setInitialRoutes(ODESSA_DEFAULT_ROUTES)
        set((draft) => { 
          draft.routes = ODESSA_DEFAULT_ROUTES
        })
      }
    },

    liveBlocks: [],
    liveDuties: [],
    selectedDate: new Date().toISOString().split('T')[0],
    setSelectedDate: (date: string) => set((state) => { state.selectedDate = date }),
    
    generateMultipleBlocks: (routeId: string, transportType: TransportType, count: number, date?: string) => {
      set((state) => {
        const isTrolley = transportType === 'trolleybus'
        const newBlocks = Array.from({ length: count }).map((_, i) => ({
          id: `B_${routeId}_${i + 1}`,
          vehicleNumber: isTrolley ? String(3000 + i + 1) : String(4000 + i + 1),
          type: transportType || 'tram',
          depotId: isTrolley ? 'depot_trolley_1' : 'depot_tram_1',
          routeId,
          date: date || state.selectedDate,
          depotExitTime: '05:30',
          depotReturnTime: '23:00',
          trips: []
        }))
        state.liveBlocks.push(...newBlocks)
        state.liveSchedule = { current_blocks: [...state.liveBlocks] }
      })
    },

    updateVehicleBlockInfo: (blockId, info) => set((state) => {
      const blockIndex = state.liveBlocks.findIndex((b: VehicleBlock) => b.id === blockId)
      if (blockIndex !== -1) {
        state.liveBlocks[blockIndex] = { ...state.liveBlocks[blockIndex], ...info }
        state.liveSchedule = { current_blocks: [...state.liveBlocks] }
      }
    }),

    deleteVehicleBlock: (blockId) => set((state) => {
      state.liveBlocks = state.liveBlocks.filter((b: VehicleBlock) => b.id !== blockId)
      state.liveSchedule = { current_blocks: [...state.liveBlocks] }
    }),

    clearVehicleBlocks: (blockIds) => set((state) => {
      state.liveBlocks = blockIds ? state.liveBlocks.filter((b: VehicleBlock) => !blockIds.includes(b.id)) : []
      state.liveSchedule = { current_blocks: [...state.liveBlocks] }
    }),

    reorderVehicleBlocks: (activeId, overId) => set((state) => {
      const oldIndex = state.liveBlocks.findIndex((b: VehicleBlock) => b.id === activeId)
      const newIndex = state.liveBlocks.findIndex((b: VehicleBlock) => b.id === overId)
      if (oldIndex === -1 || newIndex === -1) return

      const [moved] = state.liveBlocks.splice(oldIndex, 1)
      state.liveBlocks.splice(newIndex, 0, moved)
      state.liveSchedule = { current_blocks: [...state.liveBlocks] }
    }),

    validateScheduleConflicts: () => {
      const state = get()
      const detectedConflicts: ScheduleConflict[] = []
      const blocks = state.liveBlocks || []

      // Перевірка на збіги бортових номерів
      const vehicleMap = new Map<string, string>()
      blocks.forEach((b) => {
        if (b.vehicleNumber && b.vehicleNumber.trim()) {
          if (vehicleMap.has(b.vehicleNumber)) {
            detectedConflicts.push({
              id: `conf_veh_${b.id}`,
              nodeId: 'depot',
              nodeName: 'Депо / Випуск',
              trackId: 'track_1',
              vehicle1Id: vehicleMap.get(b.vehicleNumber)!,
              vehicle1Route: b.routeId,
              vehicle2Id: b.id,
              vehicle2Route: b.routeId,
              arrivalTime1: b.depotExitTime,
              arrivalTime2: b.depotExitTime,
              actualHeadwayMin: 0,
              requiredHeadwayMin: 2,
              timeGapMin: 0
            })
          } else {
            vehicleMap.set(b.vehicleNumber, b.id)
          }
        }
      })

      set((s) => { s.conflicts = detectedConflicts })
      return detectedConflicts
    },

    setLiveSchedule: (schedule) => {
      set((state) => {
        if (JSON.stringify(state.liveSchedule) !== JSON.stringify(schedule)) {
          state.liveSchedule = schedule
        }
      })
    },

    updateTelemetry: (incomingData: any) => set((draft) => {
      if (Object.keys(incomingData).length > 0 && !incomingData.vehicle_id) {
        Object.keys(incomingData).forEach((key) => {
          draft.telemetry[key] = incomingData[key]
        })
      } else if (incomingData.vehicle_id) {
        draft.telemetry[incomingData.vehicle_id] = incomingData
      }
    }),

    setIsProcessingTransaction: (status) => set((state) => { state.isProcessingTransaction = status }),
    setValidationWarnings: (warnings) => set((state) => { state.validationWarnings = warnings }),
    setActiveDetour: (id) => set((state) => { state.activeDetourId = id }),
    setPath: (path) => set((state) => { state.currentPath = path }),
    setTheme: (theme) => {
      try {
        localStorage.setItem('omet_theme', theme)
      } catch (e) {}
      set((state) => { state.theme = theme })
    },
    setUserRole: (role) => set((state) => { state.userRole = role }),

    setInitialSchedule: (blocks, duties) => {
      set((state) => {
        state.liveBlocks = blocks
        state.liveDuties = duties
        state.liveSchedule = { current_blocks: blocks }
      })
    },

    loadGtfsData: async () => {
      set((state) => { state.isProcessingTransaction = true })
      try {
        await apiClient.post('/api/v1/settings/gtfs/sync-local')
        set((state) => { state.isInitialized = false })
        await get().fetchInitialData()
      } catch (error) {
        console.error("GTFS Sync error:", error)
      } finally {
        set((state) => { state.isProcessingTransaction = false })
      }
    },

    updateTripDeparture: async (blockId: string, tripId: string, startTime: number, delayMinutes: number) => {
      set((state) => { state.isProcessingTransaction = true })
      try {
        const response = await apiClient.post('/api/v1/solver/apply-delay', {
          block_id: blockId,
          start_time: startTime,
          delay_minutes: delayMinutes,
          schedule_data: get().liveSchedule?.current_blocks || []
        })
        
        const result = response.data
        if (result.updated_schedule) {
          set((state) => { 
            state.liveSchedule = { current_blocks: result.updated_schedule }
            state.validationWarnings = result.warnings || []
          })
        }
      } catch (error) {
        console.error("Error applying delay:", error)
      } finally {
        set((state) => { state.isProcessingTransaction = false })
      }
    },

    masterScheduleData: null,
    masterScheduleError: null,
    activeDutyNumber: null,
    setMasterScheduleData: (data) => set((state) => { state.masterScheduleData = data }),
    setActiveDutyNumber: (dutyNum) => set((state) => { state.activeDutyNumber = dutyNum }),
    setMasterScheduleError: (message) => set((state) => { state.masterScheduleError = message }),

    generateMasterSchedule: async (payload) => {
      set((state) => { state.isProcessingTransaction = true })
      try {
        // Бекенд — ЄДИНЕ авторитетне джерело математики розкладів. При помилці
        // НЕ підміняємо мовчки локальним рушієм (це й спричиняло розбіжність
        // обідів фронтенд/бекенд) — показуємо явну помилку користувачу.
        let data: any = null
        try {
          const res = await apiClient.post('/api/v1/schedules/generate-master', payload)
          data = res.data
          if (!data || !data.summary_passport) {
            throw new Error('Порожня або невалідна відповідь бекенду')
          }
        } catch (apiErr) {
          console.error("Математичне ядро розрахунку розкладів ОМЕТ недоступне:", apiErr)
          set((state) => {
            state.masterScheduleError = "Математичне ядро розрахунку розкладів ОМЕТ тимчасово недоступне. Перевірте з'єднання з бекенд-сервером."
          })
          return null
        }

        set((state) => { state.masterScheduleError = null })

        // Конвертуємо рейси в єдиний масив для диспетчера
        const tripsFlat: Trip[] = []
        if (data.duty_books) {
          Object.values(data.duty_books).forEach((book: any) => {
            if (book.trips) {
              book.trips.forEach((t: any) => {
                tripsFlat.push({
                  id: `T_${book.duty_number}_${t.trip_number}`,
                  blockId: `B_${book.duty_number}`,
                  dutyId: book.duty_number,
                  routeId: data.summary_passport.route_id,
                  direction: t.direction === 'FORWARD' ? 1 : 2,
                  departureTime: t.departure_time,
                  arrivalTime: t.arrival_time,
                  startStationId: t.control_point_times?.[0]?.cp_name || data.summary_passport.station_a_name,
                  endStationId: t.control_point_times?.[t.control_point_times.length - 1]?.cp_name || data.summary_passport.station_b_name,
                  isZeroRun: t.direction === 'PULL_OUT' || t.direction === 'PULL_IN',
                  isLunchBreak: t.event_tag?.includes('Обід'),
                  status: 'normal'
                })
              })
            }
          })
        }

        set((state) => {
          state.masterScheduleData = data
          state.generatedTrips = tripsFlat
          if (data.master_grid_rows && data.master_grid_rows.length > 0) {
            state.activeDutyNumber = data.master_grid_rows[0].duty_number
          }
        })

        return data
      } finally {
        set((state) => { state.isProcessingTransaction = false })
      }
    },

    // --- АРХІВ ЗАТВЕРДЖЕНИХ РОЗКЛАДІВ КП «ОМЕТ» ---
    archiveList: (() => {
      try {
        const saved = localStorage.getItem('omet_schedule_archive')
        if (saved) return JSON.parse(saved)
      } catch (e) {}

      // Ініціалізуємо стандартним зразком архівного графіка маршруту №7
      const initialMaster = generateLocalMasterSchedule({
        route_id: '7',
        route_name: 'вул. Паустовського — 11-та ст. Люстдорфської дороги',
        transport_type: 'TRAM',
        duties_count: 16,
        round_trip_min: 102,
        route_length_km: 33.2,
        default_speed_kmh: 16.5,
        designated_dp_name: 'ДП «вул. Паустовського»',
        depot_name: 'ТД-2',
        schedule_period: 'з 01 вересня по 30 листопада 2026 року',
        schedule_type: 'Будній'
      })

      const defaultArchive: MasterScheduleArchiveItem[] = [
        {
          id: 'arch_7_workday_2026',
          routeId: '7',
          routeName: 'вул. Паустовського — 11-та ст. Люстдорфської дороги',
          transportType: 'Трамвай',
          scheduleType: 'Будній (Осінь 2026)',
          schedulePeriod: 'з 01 вересня по 30 листопада 2026 року',
          dutiesCount: 16,
          totalTrips: initialMaster.summary_passport.total_trips,
          totalWagonKm: initialMaster.summary_passport.total_wagon_km,
          totalWagonHours: initialMaster.summary_passport.total_wagon_hours,
          totalShifts: initialMaster.summary_passport.total_shifts,
          savedAt: '2026-09-01 10:00',
          data: initialMaster
        }
      ]

      try {
        localStorage.setItem('omet_schedule_archive', JSON.stringify(defaultArchive))
      } catch (e) {}

      return defaultArchive
    })(),

    archiveCurrentSchedule: (label?: string) => set((state) => {
      if (!state.masterScheduleData) return

      const passport = state.masterScheduleData.summary_passport
      const newArchiveItem: MasterScheduleArchiveItem = {
        id: `arch_${passport.route_id}_${Date.now()}`,
        routeId: passport.route_id,
        routeName: passport.route_name,
        transportType: passport.transport_type,
        scheduleType: label || `${passport.schedule_type} (${new Date().toLocaleDateString('uk-UA')})`,
        schedulePeriod: passport.schedule_period,
        dutiesCount: passport.duties_count,
        totalTrips: passport.total_trips,
        totalWagonKm: passport.total_wagon_km,
        totalWagonHours: passport.total_wagon_hours,
        totalShifts: passport.total_shifts,
        savedAt: new Date().toLocaleString('uk-UA'),
        data: JSON.parse(JSON.stringify(state.masterScheduleData))
      }

      state.archiveList.unshift(newArchiveItem)
      try {
        localStorage.setItem('omet_schedule_archive', JSON.stringify(state.archiveList))
      } catch (e) {
        console.error('Помилка збереження в архів localStorage:', e)
      }
    }),

    restoreArchivedSchedule: (archiveId: string) => set((state) => {
      const item = state.archiveList.find((a) => a.id === archiveId)
      if (item && item.data) {
        state.masterScheduleData = JSON.parse(JSON.stringify(item.data))
        if (item.data.master_grid_rows && item.data.master_grid_rows.length > 0) {
          state.activeDutyNumber = item.data.master_grid_rows[0].duty_number
        }
      }
    }),

    deleteArchivedSchedule: (archiveId: string) => set((state) => {
      state.archiveList = state.archiveList.filter((a) => a.id !== archiveId)
      try {
        localStorage.setItem('omet_schedule_archive', JSON.stringify(state.archiveList))
      } catch (e) {
        console.error('Помилка оновлення архіву localStorage:', e)
      }
    })
  }))
)
