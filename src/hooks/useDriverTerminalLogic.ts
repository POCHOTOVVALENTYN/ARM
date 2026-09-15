import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/apiClient'
import { toast } from 'sonner'
import { 
  SmartWaybillData, 
  WaybillTrip, 
  WaybillStop, 
  DirectiveItem 
} from './useSmartWaybillLogic'

export const POPULAR_VEHICLES = ['4020', '2965', '3012', '5001', '3024', '4015']

export interface ScheduleDeviation {
  minutes: number
  label: string
  color: 'emerald' | 'rose' | 'sky'
}

export interface UseDriverTerminalLogicReturn {
  currentTime: string
  vehicleId: string
  setVehicleId: (id: string) => void
  customVehicleInput: string
  setCustomVehicleInput: (input: string) => void
  isCustomInputOpen: boolean
  setIsCustomInputOpen: (open: boolean) => void
  activeTab: 'trip' | 'waybill' | 'dispatch'
  setActiveTab: (tab: 'trip' | 'waybill' | 'dispatch') => void
  isNightMode: boolean
  setIsNightMode: (night: boolean) => void
  currentTripIdx: number
  currentStopIdx: number
  setCurrentStopIdx: (idx: number) => void
  isSosModalOpen: boolean
  setIsSosModalOpen: (open: boolean) => void
  waybill: SmartWaybillData | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
  directives: DirectiveItem[]
  unacknowledgedDirectives: DirectiveItem[]
  trips: WaybillTrip[]
  currentTrip: WaybillTrip | null
  stops: WaybillStop[]
  currentStop: WaybillStop | null
  nextStop: WaybillStop | null
  scheduleDeviation: ScheduleDeviation
  isCheckInPending: boolean
  isAckPending: boolean
  isAlertPending: boolean
  isSosPending: boolean
  handleSelectVehicle: (id: string) => void
  handleCustomVehicleSubmit: (e: React.FormEvent) => void
  handleCheckIn: (action: 'ARRIVAL' | 'DEPARTURE') => void
  handleAcknowledgeDirective: (directiveId: number) => void
  handleSendQuickAlert: (alertType: string, message: string) => void
  handleConfirmSos: () => void
  handleNextTrip: () => void
  handlePrevTrip: () => void
}

export const useDriverTerminalLogic = (): UseDriverTerminalLogicReturn => {
  const queryClient = useQueryClient()

  // Поточний час водія (оновлюється щосекунди)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [currentMinutesOfDay, setCurrentMinutesOfDay] = useState<number>(0)

  useEffect(() => {
    const handleUpdateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setCurrentMinutesOfDay(now.getHours() * 60 + now.getMinutes())
    }
    handleUpdateTime()
    const interval = setInterval(handleUpdateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Стейт обраного вагона та налаштувань термінала
  const [vehicleId, setVehicleId] = useState<string>('4020')
  const [customVehicleInput, setCustomVehicleInput] = useState<string>('')
  const [isCustomInputOpen, setIsCustomInputOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'trip' | 'waybill' | 'dispatch'>('trip')
  const [isNightMode, setIsNightMode] = useState<boolean>(true)
  const [currentTripIdx, setCurrentTripIdx] = useState<number>(0)
  const [currentStopIdx, setCurrentStopIdx] = useState<number>(0)
  const [isSosModalOpen, setIsSosModalOpen] = useState<boolean>(false)

  // 1. Завантаження активної путівки для обраного вагона/водія
  const { data: waybill, isLoading, isError, refetch } = useQuery<SmartWaybillData>({
    queryKey: ['driver-terminal-waybill', vehicleId],
    queryFn: async () => {
      const res = await api.get(`/waybills/terminal/${vehicleId}/active`)
      return res.data
    },
    enabled: !!vehicleId,
    staleTime: 20000,
    refetchInterval: 30000
  })

  // 2. Завантаження оперативних розпоряджень диспетчера для цього вагона
  const { data: directives = [] } = useQuery<DirectiveItem[]>({
    queryKey: ['driver-directives', vehicleId],
    queryFn: async () => {
      const res = await api.get(`/driver-comm/directives/vehicle/${vehicleId}`)
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: !!vehicleId,
    refetchInterval: 8000
  })

  // 3. Мутація фіксації прибуття / відправлення на ДП
  const checkInMutation = useMutation({
    mutationFn: async (payload: { stop_id: string; action: 'ARRIVAL' | 'DEPARTURE'; trip_sequence: number }) => {
      if (!waybill?.waybill_id) return null
      const res = await api.post(`/waybills/${waybill.waybill_id}/checkin`, payload)
      return res.data
    },
    onSuccess: (_, variables) => {
      const actionText = variables.action === 'ARRIVAL' ? 'Прибуття зафіксовано' : 'Відправлення зафіксовано'
      toast.success(`🚏 ${actionText} на зупинці! Диспетчер сповіщений.`)
      if (variables.action === 'DEPARTURE') {
        setCurrentStopIdx(prev => prev + 1)
      }
    },
    onError: () => {
      toast.error('Помилка реєстрації відмітки на сервері')
    }
  })

  // 4. Мутація підтвердження наказу диспетчера («Прийнято до виконання»)
  const ackMutation = useMutation({
    mutationFn: async (directiveId: number) => {
      const res = await api.post(`/driver-comm/directives/${directiveId}/ack`)
      return res.data
    },
    onSuccess: () => {
      toast.success('✅ Розпорядження диспетчера прийнято до виконання!')
      queryClient.invalidateQueries({ queryKey: ['driver-directives', vehicleId] })
    },
    onError: () => {
      toast.error('Не вдалося підтвердити розпорядження')
    }
  })

  // 5. Мутація швидкого сповіщення диспетчера (Ситуація на лінії)
  const alertMutation = useMutation({
    mutationFn: async (payload: { alert_type: string; message: string }) => {
      const res = await api.post('/driver-comm/alert', {
        vehicle_id: vehicleId,
        driver_id: waybill?.driver?.id || 'Т-1001',
        route_id: waybill?.route_id || '18',
        alert_type: payload.alert_type,
        message: payload.message
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(`Сигнал «${data.message || 'Повідомлення'}» передано диспетчеру ЦД!`)
    },
    onError: () => {
      toast.error('Помилка відправки сигналу диспетчеру')
    }
  })

  // 6. Мутація екстреної кнопки SOS
  const sosMutation = useMutation({
    mutationFn: async () => {
      if (!waybill?.waybill_id) return null
      const res = await api.post(`/waybills/${waybill.waybill_id}/sos`, {
        message: `🚨 ЕКСТРЕНА ЗУПИНКА / СИГНАЛ SOS ВІД ВОДІЯ (Борт #${vehicleId})`
      })
      return res.data
    },
    onSuccess: () => {
      setIsSosModalOpen(false)
      toast.error('🚨 СИГНАЛ SOS ПЕРЕДАНО! Черговий диспетчер ЦД піднятий по тривозі!', {
        duration: 12000
      })
    },
    onError: () => {
      toast.error('Помилка передачі SOS сигналу')
    }
  })

  // Розрахунок поточного рейсу та зупинок
  const trips = useMemo(() => waybill?.trips || [], [waybill])
  const currentTrip = trips[currentTripIdx] || trips[0] || null
  const stops = useMemo(() => currentTrip?.stops || [], [currentTrip])
  const currentStop = stops[currentStopIdx] || stops[0] || null
  const nextStop = stops[currentStopIdx + 1] || null

  // Обчислення відхилення від графіка (запізнення / наганяння)
  const scheduleDeviation = useMemo((): ScheduleDeviation => {
    if (!currentStop?.departure_time) {
      return { minutes: 0, label: 'В ГРАФІКУ', color: 'emerald' }
    }
    const [hStr, mStr] = currentStop.departure_time.split(':')
    const schedMin = Number(hStr) * 60 + Number(mStr)
    if (isNaN(schedMin) || schedMin === 0) {
      return { minutes: 0, label: 'В ГРАФІКУ', color: 'emerald' }
    }

    const diff = currentMinutesOfDay - schedMin
    if (Math.abs(diff) <= 1) {
      return { minutes: 0, label: 'В ГРАФІКУ', color: 'emerald' }
    }
    if (diff > 1) {
      return { minutes: diff, label: `ЗАПІЗНЕННЯ: +${diff} хв`, color: 'rose' }
    }
    return { minutes: Math.abs(diff), label: `НАГАНЯННЯ: -${Math.abs(diff)} хв`, color: 'sky' }
  }, [currentStop, currentMinutesOfDay])

  // Непідтверджені розпорядження диспетчера
  const unacknowledgedDirectives = useMemo(() => {
    return directives.filter((d) => !d.is_acknowledged)
  }, [directives])

  const handleSelectVehicle = (id: string) => {
    setVehicleId(id)
    setIsCustomInputOpen(false)
    setCurrentTripIdx(0)
    setCurrentStopIdx(0)
  }

  const handleCustomVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customVehicleInput.trim()) return
    setVehicleId(customVehicleInput.trim())
    setIsCustomInputOpen(false)
    setCurrentTripIdx(0)
    setCurrentStopIdx(0)
  }

  const handleCheckIn = (action: 'ARRIVAL' | 'DEPARTURE') => {
    if (!currentStop) return
    checkInMutation.mutate({
      stop_id: String(currentStop.stop_id),
      action,
      trip_sequence: currentTrip?.trip_number || 1
    })
  }

  const handleAcknowledgeDirective = (directiveId: number) => {
    ackMutation.mutate(directiveId)
  }

  const handleSendQuickAlert = (alertType: string, message: string) => {
    alertMutation.mutate({ alert_type: alertType, message })
  }

  const handleConfirmSos = () => {
    sosMutation.mutate()
  }

  const handleNextTrip = () => {
    if (currentTripIdx < trips.length - 1) {
      setCurrentTripIdx(prev => prev + 1)
      setCurrentStopIdx(0)
    }
  }

  const handlePrevTrip = () => {
    if (currentTripIdx > 0) {
      setCurrentTripIdx(prev => prev - 1)
      setCurrentStopIdx(0)
    }
  }

  return {
    currentTime,
    vehicleId,
    setVehicleId,
    customVehicleInput,
    setCustomVehicleInput,
    isCustomInputOpen,
    setIsCustomInputOpen,
    activeTab,
    setActiveTab,
    isNightMode,
    setIsNightMode,
    currentTripIdx,
    currentStopIdx,
    setCurrentStopIdx,
    isSosModalOpen,
    setIsSosModalOpen,
    waybill,
    isLoading,
    isError,
    refetch,
    directives,
    unacknowledgedDirectives,
    trips,
    currentTrip,
    stops,
    currentStop,
    nextStop,
    scheduleDeviation,
    isCheckInPending: checkInMutation.isPending,
    isAckPending: ackMutation.isPending,
    isAlertPending: alertMutation.isPending,
    isSosPending: sosMutation.isPending,
    handleSelectVehicle,
    handleCustomVehicleSubmit,
    handleCheckIn,
    handleAcknowledgeDirective,
    handleSendQuickAlert,
    handleConfirmSos,
    handleNextTrip,
    handlePrevTrip
  }
}
