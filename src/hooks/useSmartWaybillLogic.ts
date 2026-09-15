import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/apiClient'
import { useDailyDeployments } from './useCrewQueries'
import { toast } from 'sonner'

export interface WaybillStop {
  stop_id: string | number
  stop_name: string
  arrival_time: string
  departure_time: string
  is_control_point: boolean
}

export interface WaybillTrip {
  trip_number: number
  direction: string
  start_station: string
  end_station: string
  plan_start: string
  plan_end: string
  is_zero?: boolean
  stops: WaybillStop[]
}

export interface WaybillDriver {
  id: string | number
  full_name: string
  class_rank: number | string
}

export interface WaybillVehicle {
  id: string | number
  model: string
  type?: string
}

export interface WaybillSummary {
  total_work_hours: string
}

export interface SmartWaybillData {
  waybill_id: string | number
  route_id: string | number
  duty_number: string | number
  target_date: string
  driver: WaybillDriver
  vehicle: WaybillVehicle
  summary: WaybillSummary
  trips: WaybillTrip[]
}

export interface DirectiveItem {
  id: number
  directive_type: string
  message: string
  is_acknowledged: boolean
  created_at?: string
}

export interface UseSmartWaybillLogicProps {
  vehicleId?: string
}

export interface UseSmartWaybillLogicReturn {
  targetDate: string
  setTargetDate: (date: string) => void
  driverIdInput: string
  setDriverIdInput: (id: string) => void
  searchDriverId: string | number | null
  setSearchDriverId: (id: string | number | null) => void
  customAlertMsg: string
  setCustomAlertMsg: (msg: string) => void
  waybill: SmartWaybillData | null | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
  dailyDeployments: Array<{ id: string | number; driver_id: string | number; vehicle_id: string | number }> | undefined
  directives: DirectiveItem[]
  isAlertPending: boolean
  isAckPending: boolean
  handleSearch: (e: React.FormEvent) => void
  handleSendQuickAlert: (alertType: string, label: string) => void
  handleSendCustomAlert: (e: React.FormEvent) => void
  handleAcknowledgeDirective: (directiveId: number) => void
  handlePrint: () => void
  handleSelectDeploymentDriver: (driverId: string | number) => void
}

export const useSmartWaybillLogic = ({ vehicleId: propVehicleId }: UseSmartWaybillLogicProps): UseSmartWaybillLogicReturn => {
  const queryClient = useQueryClient()
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [driverIdInput, setDriverIdInput] = useState<string>('1')
  const [searchDriverId, setSearchDriverId] = useState<string | number | null>('1')
  const [customAlertMsg, setCustomAlertMsg] = useState<string>('')

  // 1. Завантаження путівки водія
  const { data: waybill, isLoading, isError, error } = useQuery<SmartWaybillData | null>({
    queryKey: ['driver-waybill', searchDriverId, targetDate],
    queryFn: async () => {
      if (!searchDriverId) return null
      const { data } = await api.get(`/waybills/driver/${searchDriverId}/active?target_date=${targetDate}`)
      return data
    },
    enabled: !!searchDriverId,
    staleTime: 15000
  })

  const { data: rawDeployments } = useDailyDeployments(targetDate)
  const dailyDeployments = rawDeployments as Array<{ id: string | number; driver_id: string | number; vehicle_id: string | number }> | undefined

  // 2. Отримання наказів диспетчера для цього вагона
  const activeVehicleId = waybill?.vehicle?.id || propVehicleId || '4020'
  const { data: rawDirectives = [] } = useQuery<DirectiveItem[]>({
    queryKey: ['driver-directives', activeVehicleId],
    queryFn: async () => {
      const { data } = await api.get(`/driver-comm/directives/vehicle/${activeVehicleId}`)
      return Array.isArray(data) ? data : []
    },
    enabled: !!activeVehicleId,
    refetchInterval: 10000
  })

  // 3. Мутація сигналу тривоги
  const alertMutation = useMutation({
    mutationFn: async (payload: { alert_type: string; message: string }) => {
      const { data } = await api.post('/driver-comm/alert', {
        vehicle_id: activeVehicleId,
        driver_id: String(searchDriverId || '1'),
        route_id: waybill?.route_id || '18',
        alert_type: payload.alert_type,
        message: payload.message
      })
      return data
    },
    onSuccess: (data) => {
      toast.success(`Сигнал «${data.message || 'Сповіщення'}» успішно передано черговому диспетчеру!`)
      setCustomAlertMsg('')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Немає зв\'язку з сервером'
      toast.error(`Помилка відправки сигналу: ${message}`)
    }
  })

  // 4. Мутація підтвердження наказу диспетчера
  const ackMutation = useMutation({
    mutationFn: async (directiveId: number) => {
      const { data } = await api.post(`/driver-comm/directives/${directiveId}/ack`)
      return data
    },
    onSuccess: () => {
      toast.success('Підтверджено: наказ прийнято до виконання!')
      queryClient.invalidateQueries({ queryKey: ['driver-directives', activeVehicleId] })
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (driverIdInput.trim()) {
      setSearchDriverId(driverIdInput.trim())
    }
  }

  const handleSendQuickAlert = (alertType: string, label: string) => {
    alertMutation.mutate({ alert_type: alertType, message: label })
  }

  const handleSendCustomAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customAlertMsg.trim()) return
    alertMutation.mutate({ alert_type: 'CUSTOM', message: customAlertMsg.trim() })
  }

  const handleAcknowledgeDirective = (directiveId: number) => {
    ackMutation.mutate(directiveId)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSelectDeploymentDriver = (driverId: string | number) => {
    setDriverIdInput(String(driverId))
    setSearchDriverId(driverId)
  }

  return {
    targetDate,
    setTargetDate,
    driverIdInput,
    setDriverIdInput,
    searchDriverId,
    setSearchDriverId,
    customAlertMsg,
    setCustomAlertMsg,
    waybill,
    isLoading,
    isError,
    error,
    dailyDeployments,
    directives: rawDirectives,
    isAlertPending: alertMutation.isPending,
    isAckPending: ackMutation.isPending,
    handleSearch,
    handleSendQuickAlert,
    handleSendCustomAlert,
    handleAcknowledgeDirective,
    handlePrint,
    handleSelectDeploymentDriver
  }
}
