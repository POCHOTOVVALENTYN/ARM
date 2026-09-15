import { useState, useEffect } from 'react'
import { useScheduleStore } from '../store/useScheduleStore'
import apiClient from '../utils/apiClient'
import { VehicleBlock, Trip } from '../types'

export interface HotReserveSwapResult {
  success: boolean
  message: string
  regeneratedBooklets?: string[]
}

export interface UseHotReserveLogicReturn {
  draftBlocks: VehicleBlock[]
  brokenBlockId: string
  setBrokenBlockId: (id: string) => void
  targetTripId: string
  setTargetTripId: (id: string) => void
  reserveBlockId: string
  setReserveBlockId: (id: string) => void
  incidentTime: string
  setIncidentTime: (time: string) => void
  isSubmitting: boolean
  swapResult: HotReserveSwapResult | null
  selectedBrokenBlock: VehicleBlock | undefined
  availableTrips: Trip[]
  handleExecuteSwap: (e: React.FormEvent) => Promise<void>
}

export const useHotReserveLogic = (): UseHotReserveLogicReturn => {
  const { draftBlocks, executeHotReserveSwap } = useScheduleStore()
  
  const [brokenBlockId, setBrokenBlockId] = useState<string>(draftBlocks[0]?.id || '')
  const [targetTripId, setTargetTripId] = useState<string>('')
  const [reserveBlockId, setReserveBlockId] = useState<string>(
    draftBlocks.find((b) => b.id !== brokenBlockId)?.id || ''
  )
  
  const [incidentTime, setIncidentTime] = useState<string>('08:30')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [swapResult, setSwapResult] = useState<HotReserveSwapResult | null>(null)

  // Синхронізація рейсів та блоків
  useEffect(() => {
    const block = draftBlocks.find((b) => b.id === brokenBlockId)
    if (block && block.trips.length > 0) {
      if (!block.trips.find((t) => t.id === targetTripId)) {
        setTargetTripId(block.trips[0].id)
      }
    } else {
      setTargetTripId('')
    }
    
    if (reserveBlockId === brokenBlockId) {
      const newReserve = draftBlocks.find((b) => b.id !== brokenBlockId)
      setReserveBlockId(newReserve?.id || '')
    }
  }, [brokenBlockId, draftBlocks, targetTripId, reserveBlockId])

  const selectedBrokenBlock = draftBlocks.find((b) => b.id === brokenBlockId)
  const availableTrips = selectedBrokenBlock?.trips || []

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault()
    setSwapResult(null)
    
    if (!brokenBlockId || !targetTripId || !reserveBlockId) {
      setSwapResult({ 
        success: false, 
        message: 'Оберіть всі обов\'язкові параметри (Аварійний вагон, Рейс та Резервний вагон).' 
      })
      return
    }

    try {
      setIsSubmitting(true)
      const res = await apiClient.post('/api/v1/incidents/hot-reserve/activate', {
        reserve_vehicle_id: reserveBlockId,
        target_trip_id: targetTripId,
        reason: `Заміна по інциденту о ${incidentTime}`
      })

      const data = res.data
      const newVehicle = data?.new_vehicle_id || reserveBlockId
      setSwapResult({
        success: true,
        message: `Гарячий резерв активовано. Новий борт: ${newVehicle}`,
        regeneratedBooklets: [newVehicle, brokenBlockId]
      })
      
      if (executeHotReserveSwap) {
        executeHotReserveSwap(brokenBlockId, reserveBlockId, incidentTime)
      }
    } catch (error: unknown) {
      interface ErrorResponse {
        response?: {
          data?: {
            detail?: string
          }
        }
        message?: string
      }
      const err = error as ErrorResponse
      setSwapResult({
        success: false,
        message: err?.response?.data?.detail || err?.message || 'Помилка виконання транзакції резерву'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    draftBlocks,
    brokenBlockId,
    setBrokenBlockId,
    targetTripId,
    setTargetTripId,
    reserveBlockId,
    setReserveBlockId,
    incidentTime,
    setIncidentTime,
    isSubmitting,
    swapResult,
    selectedBrokenBlock,
    availableTrips,
    handleExecuteSwap
  }
}
