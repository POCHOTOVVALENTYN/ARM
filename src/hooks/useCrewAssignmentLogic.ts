import { useState } from 'react'
import { toast } from 'sonner'
import { 
  useAssignWaybill, 
  useWaybillsByDate, 
  useAvailableDuties, 
  AvailableDuty, 
  AssignedWaybillInfo 
} from './useWaybillQueries'

export interface UseCrewAssignmentLogicReturn {
  targetDate: string
  setTargetDate: (date: string) => void
  selectedDuty: number | null
  setSelectedDuty: (dutyId: number | null) => void
  vehicleId: string
  setVehicleId: (id: string) => void
  driverName: string
  setDriverName: (name: string) => void
  dutiesToDisplay: AvailableDuty[]
  isDutiesLoading: boolean
  isPending: boolean
  selectedDutyObject: AvailableDuty | undefined
  isAssigned: (dutyId: number) => boolean
  getAssignedInfo: (dutyId: number) => AssignedWaybillInfo | undefined
  handleAssign: (e: React.FormEvent) => void
}

export const useCrewAssignmentLogic = (): UseCrewAssignmentLogicReturn => {
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [selectedDuty, setSelectedDuty] = useState<number | null>(null)
  const [vehicleId, setVehicleId] = useState<string>('')
  const [driverName, setDriverName] = useState<string>('')

  const { data: dbDuties, isLoading: isDutiesLoading } = useAvailableDuties(targetDate)
  const { data: assignedWaybills } = useWaybillsByDate(targetDate)
  const assignMutation = useAssignWaybill()

  const dutiesToDisplay: AvailableDuty[] = dbDuties || []
  const selectedDutyObject = dutiesToDisplay.find((d) => d.id === selectedDuty)

  const isAssigned = (dutyId: number): boolean => {
    return !!assignedWaybills?.some((w) => w.duty_id === dutyId)
  }

  const getAssignedInfo = (dutyId: number): AssignedWaybillInfo | undefined => {
    return assignedWaybills?.find((w) => w.duty_id === dutyId)
  }

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDuty || !vehicleId.trim() || !driverName.trim()) {
      toast.error('Будь ласка, заповніть бортовий номер та табельний/ПІБ водія')
      return
    }

    assignMutation.mutate(
      {
        duty_id: selectedDuty,
        vehicle_id: vehicleId.trim(),
        driver_id: driverName.trim(),
        target_date: targetDate
      },
      {
        onSuccess: () => {
          toast.success(`Е-Путівку для наряду №${selectedDutyObject?.number || selectedDuty} (борт #${vehicleId.trim()}) створено та завантажено в Redis!`)
          setSelectedDuty(null)
          setVehicleId('')
          setDriverName('')
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Сервер не відповідає'
          toast.error(`Помилка оформлення путівки: ${message}`)
        }
      }
    )
  }

  return {
    targetDate,
    setTargetDate,
    selectedDuty,
    setSelectedDuty,
    vehicleId,
    setVehicleId,
    driverName,
    setDriverName,
    dutiesToDisplay,
    isDutiesLoading,
    isPending: assignMutation.isPending,
    selectedDutyObject,
    isAssigned,
    getAssignedInfo,
    handleAssign
  }
}
