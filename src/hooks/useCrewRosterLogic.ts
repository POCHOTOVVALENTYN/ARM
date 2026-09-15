import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../utils/apiClient'
import { useDailyDeployments } from './useCrewQueries'
import { useScheduleStore } from '../store/useScheduleStore'
import { DriverDuty } from '../types'

export interface DriverItem {
  id: number
  full_name: string
  class_rank: number
  status: string
  is_active: boolean
}

export interface DeploymentRecord {
  id: string | number
  driver_id: string | number
  driver_name?: string
  duty_id?: number
  duty_number?: string | number
  vehicle_id?: string | number
  vehicle_model?: string
  route_id?: string | number
  status?: string
}

export interface CrewRosterItem {
  id: string
  driverName: string
  driverBadge: string
  classRank: string
  dutyNumber: string
  vehicleId: string
  routeId: string | number | null
  status: string
  isAssigned: boolean
}

export interface ExtendedDriverDuty extends DriverDuty {
  dutyNumber?: string | number
  assignedVehicleId?: string | number
  routeId?: string | number | null
}

export interface UseCrewRosterLogicProps {
  duties?: (DriverDuty | ExtendedDriverDuty)[]
}

export interface UseCrewRosterLogicReturn {
  targetDate: string
  setTargetDate: (date: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterMode: 'ALL' | 'ASSIGNED' | 'ROSTER'
  setFilterMode: (mode: 'ALL' | 'ASSIGNED' | 'ROSTER') => void
  allDrivers: DriverItem[]
  deployments: DeploymentRecord[]
  filteredItems: CrewRosterItem[]
  isDeploymentsLoading: boolean
  isDriversLoading: boolean
  handleRefresh: () => Promise<void>
  handleNavigateToAssignment: () => void
}

export const useCrewRosterLogic = ({ duties = [] }: UseCrewRosterLogicProps): UseCrewRosterLogicReturn => {
  const setPath = useScheduleStore((state) => state.setPath)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])
  const [targetDate, setTargetDate] = useState<string>(todayStr)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [filterMode, setFilterMode] = useState<'ALL' | 'ASSIGNED' | 'ROSTER'>('ALL')

  // Отримання призначених путівок на вибрану дату
  const { 
    data: rawDeployments = [], 
    isLoading: isDeploymentsLoading, 
    refetch: refetchDeployments 
  } = useDailyDeployments(targetDate)

  const deployments = rawDeployments as unknown as DeploymentRecord[]

  // Отримання повного реєстру водіїв з бази даних КП ОМЕТ
  const { 
    data: allDrivers = [], 
    isLoading: isDriversLoading, 
    refetch: refetchDrivers 
  } = useQuery<DriverItem[]>({
    queryKey: ['all-crew-drivers'],
    queryFn: async () => {
      try {
        const { data } = await api.get<DriverItem[]>('/crew/drivers')
        return Array.isArray(data) ? data : []
      } catch {
        try {
          const { data } = await api.get<DriverItem[]>('/crew')
          return Array.isArray(data) ? data : []
        } catch {
          return []
        }
      }
    },
    staleTime: 60000
  })

  const handleRefresh = async () => {
    await Promise.all([refetchDeployments(), refetchDrivers()])
  }

  const handleNavigateToAssignment = () => {
    setPath('/crew/assignment')
  }

  // Об'єднання даних
  const filteredItems = useMemo((): CrewRosterItem[] => {
    const q = searchQuery.toLowerCase().trim()

    if (filterMode === 'ROSTER' || (deployments.length === 0 && duties.length === 0)) {
      return allDrivers
        .filter((d) => !q || d.full_name.toLowerCase().includes(q) || String(d.id).includes(q))
        .map((d) => {
          const matchedDeployment = deployments.find((dep) => String(dep.driver_id) === String(d.id))
          return {
            id: String(d.id),
            driverName: d.full_name,
            driverBadge: `Таб. №${d.id}`,
            classRank: `${d.class_rank}-й клас`,
            dutyNumber: matchedDeployment ? `Наряд #${matchedDeployment.duty_number || matchedDeployment.duty_id}` : 'Не закріплено',
            vehicleId: matchedDeployment ? `Борт #${matchedDeployment.vehicle_id}` : '—',
            routeId: matchedDeployment ? (matchedDeployment.route_id ?? null) : null,
            status: matchedDeployment ? 'На лінії' : (d.status === 'AVAILABLE' ? 'Вільний / Резерв' : d.status),
            isAssigned: Boolean(matchedDeployment)
          }
        })
    }

    if (duties.length > 0) {
      return duties
        .filter((d) => !q || (d.driverName && d.driverName.toLowerCase().includes(q)) || (d.driverBadge && d.driverBadge.toLowerCase().includes(q)))
        .map((d) => {
          const ext = d as ExtendedDriverDuty
          return {
            id: String(ext.id),
            driverName: ext.driverName || 'Водій не закріплений',
            driverBadge: ext.driverBadge || '—',
            classRank: '1-й клас',
            dutyNumber: `Наряд #${ext.dutyNumber || ext.id}`,
            vehicleId: ext.assignedVehicleId ? `Борт #${ext.assignedVehicleId}` : '—',
            routeId: ext.routeId || null,
            status: 'Штатний наряд',
            isAssigned: Boolean(ext.driverName)
          }
        })
    }

    return deployments
      .filter((dep) => {
        const name = dep.driver_name || ''
        const vId = dep.vehicle_id ? String(dep.vehicle_id) : ''
        return !q || name.toLowerCase().includes(q) || vId.toLowerCase().includes(q)
      })
      .map((dep) => ({
        id: String(dep.id),
        driverName: dep.driver_name || `Водій #${dep.driver_id}`,
        driverBadge: `Таб. #${dep.driver_id}`,
        classRank: 'Водій КП «ОМЕТ»',
        dutyNumber: `Наряд #${dep.duty_number || dep.duty_id}`,
        vehicleId: `Борт #${dep.vehicle_id} (${dep.vehicle_model || 'Електротранспорт'})`,
        routeId: dep.route_id ?? null,
        status: dep.status === 'ACTIVE' ? 'На лінії' : 'Виконано',
        isAssigned: true
      }))
  }, [searchQuery, filterMode, deployments, allDrivers, duties])

  return {
    targetDate,
    setTargetDate,
    searchQuery,
    setSearchQuery,
    filterMode,
    setFilterMode,
    allDrivers,
    deployments,
    filteredItems,
    isDeploymentsLoading,
    isDriversLoading,
    handleRefresh,
    handleNavigateToAssignment
  }
}
