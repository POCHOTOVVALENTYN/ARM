import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../utils/apiClient'
import { useScheduleStore } from '../store/useScheduleStore'
import { useRouteStore } from '../store/useRouteStore'
import { MasterScheduleArchiveItem } from '../types'
import { exportMasterGridToCsv } from '../utils/scheduleEngine'
import { toast } from 'sonner'

export type TransportArchiveFilter = 'ALL' | 'TRAM' | 'TROLLEYBUS'

export interface ArchiveRegistryItem {
  id: string
  routeId: string
  routeNumber: string
  routeName: string
  transportType: string
  scheduleType: string
  schedulePeriod: string
  savedAt: string
  activeDate: string
  dutiesCount: number
  totalTrips: number
  totalWagonKm: number
  depotName: string
  data?: any
}

export interface ActivationModalState {
  isOpen: boolean
  scheduleId: string | null
  routeNumber: string
  routeName: string
  versionName: string
}

export const useStaticDutiesArchiveLogic = () => {
  const queryClient = useQueryClient()
  const { setPath } = useScheduleStore()
  const setSelectedRouteId = useRouteStore((s) => s.setSelectedRouteId)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedTransportFilter, setSelectedTransportFilter] = useState<TransportArchiveFilter>('ALL')
  const [activationModal, setActivationModal] = useState<ActivationModalState>({
    isOpen: false,
    scheduleId: null,
    routeNumber: '',
    routeName: '',
    versionName: ''
  })

  // 1. Fetch real archive registry from database
  const archiveQuery = useQuery({
    queryKey: ['archive-registry'],
    queryFn: async () => {
      const res = await apiClient.get<ArchiveRegistryItem[]>('/api/v1/schedules/archive-registry')
      return res.data
    },
    staleTime: 10000
  })

  // 2. Filter archive items
  const filteredArchive = useMemo(() => {
    const list = archiveQuery.data || []
    return list.filter((item) => {
      const isTrolley = item.transportType?.toLowerCase().includes('тролейбус')

      if (selectedTransportFilter === 'TRAM' && isTrolley) return false
      if (selectedTransportFilter === 'TROLLEYBUS' && !isTrolley) return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesRoute = item.routeNumber.toLowerCase().includes(query)
        const matchesName = item.routeName.toLowerCase().includes(query)
        const matchesType = item.scheduleType.toLowerCase().includes(query)
        if (!matchesRoute && !matchesName && !matchesType) return false
      }

      return true
    })
  }, [archiveQuery.data, selectedTransportFilter, searchQuery])

  // 3. Scenario 1: Planned activation mutation
  const activationMutation = useMutation({
    mutationFn: async ({ scheduleId, effectiveDate }: { scheduleId: string; effectiveDate: string }) => {
      const res = await apiClient.post(`/api/v1/schedules/${scheduleId}/schedule-activation`, {
        effective_date: effectiveDate
      })
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Планове введення розкладу успішно призначено!')
      void queryClient.invalidateQueries({ queryKey: ['archive-registry'] })
      void queryClient.invalidateQueries({ queryKey: ['active-duties-registry'] })
      setActivationModal({
        isOpen: false,
        scheduleId: null,
        routeNumber: '',
        routeName: '',
        versionName: ''
      })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Помилка призначення дати розкладу'
      toast.error(msg)
    }
  })

  // 4. Delete archive schedule mutation
  const deleteMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const res = await apiClient.delete(`/api/v1/schedules/${scheduleId}`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Розклад успішно видалено з архіву')
      void queryClient.invalidateQueries({ queryKey: ['archive-registry'] })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Помилка видалення розкладу'
      toast.error(msg)
    }
  })

  // Handlers
  const handleOpenInMatrix = (item: ArchiveRegistryItem | MasterScheduleArchiveItem) => {
    setSelectedRouteId(item.routeId)
    toast.success(`Розклад маршруту №${item.routeId} завантажено в робочу зведену таблицю рейсів`)
    setPath('/planning/matrix')
  }

  const handleOpenActivationModal = (item: ArchiveRegistryItem) => {
    setActivationModal({
      isOpen: true,
      scheduleId: item.id,
      routeNumber: item.routeNumber || item.routeId,
      routeName: item.routeName,
      versionName: item.scheduleType
    })
  }

  const handleCloseActivationModal = () => {
    setActivationModal({
      isOpen: false,
      scheduleId: null,
      routeNumber: '',
      routeName: '',
      versionName: ''
    })
  }

  const handleConfirmActivation = (scheduleId: string, effectiveDate: string) => {
    activationMutation.mutate({ scheduleId, effectiveDate })
  }

  const handleExportCsv = (item: ArchiveRegistryItem | MasterScheduleArchiveItem) => {
    try {
      if (item.data) {
        exportMasterGridToCsv(item.data)
      } else {
        const header = 'Маршрут;Версія;Нарядів;Рейсів;Вагоно-км;Депо;Дата\n'
        const depot = ('depotName' in item && item.depotName) ? item.depotName : 'ТД-1'
        const row = `${item.routeId};"${item.scheduleType}";${item.dutiesCount};${item.totalTrips};${item.totalWagonKm};"${depot}";${item.savedAt}\n`
        const blob = new Blob([header + row], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `omet_archive_route_${item.routeId}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success(`Архівний розклад №${item.routeId} експортовано у файл Excel (.csv)`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Спробуйте ще раз'
      toast.error(`Помилка експорту: ${msg}`)
    }
  }

  const handleDeleteArchive = (id: string, routeId: string) => {
    if (window.confirm(`Ви дійсно бажаєте вилучити архівний розклад #${id} маршруту №${routeId} з бази даних?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleNavigateToParameters = () => {
    setPath('/planning/parameters')
  }

  return {
    archiveList: archiveQuery.data || [],
    filteredArchive,
    isLoading: archiveQuery.isLoading,
    isActivating: activationMutation.isPending,
    isDeleting: deleteMutation.isPending,
    searchQuery,
    setSearchQuery,
    selectedTransportFilter,
    setSelectedTransportFilter,
    activationModal,
    handleOpenInMatrix,
    handleOpenActivationModal,
    handleCloseActivationModal,
    handleConfirmActivation,
    handleExportCsv,
    handleDeleteArchive,
    handleNavigateToParameters
  }
}

export default useStaticDutiesArchiveLogic
