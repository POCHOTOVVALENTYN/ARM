import { useState } from 'react'
import { 
  useActiveDetours, 
  useActivateDetour, 
  useDeactivateDetour, 
  ActiveDetour 
} from './useEmergencyQueries'
import { useConfigStore, EmergencyTemplate } from '../store/useConfigStore'
import { toast } from 'sonner'

export interface UseEmergencyDetoursLogicReturn {
  vehicleId: string
  setVehicleId: (id: string) => void
  routeId: string
  setRouteId: (id: string) => void
  reason: string
  setReason: (reason: string) => void
  newPath: string
  setNewPath: (path: string) => void
  detours: ActiveDetour[] | undefined
  isLoading: boolean
  isActivatePending: boolean
  isDeactivatePending: boolean
  emergencyTemplates: EmergencyTemplate[]
  handleActivate: (e: React.FormEvent) => Promise<void>
  handleApplyTemplate: (tmpl: EmergencyTemplate) => void
  handleDeactivate: (detourId: number, vid: string) => Promise<void>
}

export const useEmergencyDetoursLogic = (): UseEmergencyDetoursLogicReturn => {
  const { data: detours, isLoading } = useActiveDetours()
  const activateMutation = useActivateDetour()
  const deactivateMutation = useDeactivateDetour()
  const { emergencyTemplates } = useConfigStore()

  const [vehicleId, setVehicleId] = useState('')
  const [routeId, setRouteId] = useState('')
  const [reason, setReason] = useState('')
  const [newPath, setNewPath] = useState('')

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId.trim() || !routeId.trim() || !reason.trim() || !newPath.trim()) {
      toast.error('Заповніть усі поля форми перемикання')
      return
    }

    try {
      await activateMutation.mutateAsync({
        vehicle_id: vehicleId.trim(),
        route_id: routeId.trim(),
        reason: reason.trim(),
        new_path_description: newPath.trim()
      })
      toast.success(`Оперативне перемикання для борта №${vehicleId.trim()} успішно активовано!`)
      setVehicleId('')
      setReason('')
      setNewPath('')
    } catch {
      toast.error('Помилка активації оперативного перемикання')
    }
  }

  const handleApplyTemplate = (tmpl: EmergencyTemplate) => {
    setReason(tmpl.cause || tmpl.title)
    setNewPath(tmpl.detourDescription || '')
    if (tmpl.affectedRouteIds?.[0]) {
      setRouteId(tmpl.affectedRouteIds[0])
    }
    toast.info(`Завантажено шаблон: "${tmpl.title}"`)
  }

  const handleDeactivate = async (detourId: number, vid: string) => {
    try {
      await deactivateMutation.mutateAsync(detourId)
      toast.success(`Вагон №${vid} повернуто на плановий маршрут`)
    } catch {
      toast.error('Помилка повернення транспорту на маршрут')
    }
  }

  return {
    vehicleId,
    setVehicleId,
    routeId,
    setRouteId,
    reason,
    setReason,
    newPath,
    setNewPath,
    detours,
    isLoading,
    isActivatePending: activateMutation.isPending,
    isDeactivatePending: deactivateMutation.isPending,
    emergencyTemplates,
    handleActivate,
    handleApplyTemplate,
    handleDeactivate
  }
}
