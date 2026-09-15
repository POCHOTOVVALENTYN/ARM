import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/apiClient'
import { toast } from 'sonner'
import {
  NetworkEvaluationResponse,
  DeadheadMatrixResponse,
  SingleCalculationResult
} from '../types/deadhead'

export type DeadheadTab = 'routes' | 'matrix' | 'calculator'
export type DeadheadTypeFilter = 'ALL' | 'TRAM' | 'TROLLEYBUS'

export const useDeadheadOptimizerLogic = () => {
  const queryClient = useQueryClient()

  // Вкладки модуля
  const [activeTab, setActiveTab] = useState<DeadheadTab>('routes')

  // Фільтри та пошук для маршрутів
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<DeadheadTypeFilter>('ALL')
  const [suboptimalOnly, setSuboptimalOnly] = useState<boolean>(false)
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null)

  // Стан для калькулятора одиничного рейсу
  const [calcDepotId, setCalcDepotId] = useState<string>('depot_1')
  const [calcTerminal, setCalcTerminal] = useState<string>('Станція «Аркадія»')
  const [calcType, setCalcType] = useState<string>('TRAM')
  const [calcResult, setCalcResult] = useState<SingleCalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  // Фільтрація матриці
  const [matrixDepotFilter, setMatrixDepotFilter] = useState<string>('ALL')
  const [matrixSearch, setMatrixSearch] = useState<string>('')

  // 1. Отримання глобального стану мережі
  const { 
    data: networkData, 
    isLoading: isNetworkLoading, 
    isFetching: isNetworkFetching,
    refetch: refetchNetwork
  } = useQuery<NetworkEvaluationResponse>({
    queryKey: ['deadhead', 'network'],
    queryFn: async () => {
      const res = await api.get('/deadhead/network')
      return res.data
    },
    staleTime: 60000
  })

  // 2. Отримання матриці нульових рейсів
  const { 
    data: matrixData, 
    isLoading: isMatrixLoading 
  } = useQuery<DeadheadMatrixResponse>({
    queryKey: ['deadhead', 'matrix'],
    queryFn: async () => {
      const res = await api.get('/deadhead/matrix')
      return res.data
    },
    staleTime: 120000
  })

  // 3. Мутація: Застосування оптимізації до БД
  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/deadhead/apply')
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Оптимальні параметри нульових рейсів успішно записано в БД!', {
        description: `Оновлено ${data.applied_count} маршрутів. Річна економія: ${data.savings?.annual_cost_saved_uah?.toLocaleString('uk-UA')} грн.`
      })
      queryClient.invalidateQueries({ queryKey: ['deadhead'] })
      queryClient.invalidateQueries({ queryKey: ['routes'] })
    },
    onError: (err: unknown) => {
      const errorObj = err as { response?: { data?: { detail?: string } }, message?: string }
      toast.error('Помилка застосування оптимізації', {
        description: errorObj?.response?.data?.detail || errorObj?.message || 'Спробуйте пізніше'
      })
    }
  })

  // Обробник запуску калькулятора одиничного рейсу
  const handleCalculateSingle = async () => {
    setIsCalculating(true)
    try {
      const res = await api.post('/deadhead/calculate', {
        depot_id: calcDepotId,
        terminal_name: calcTerminal,
        transport_type: calcType
      })
      setCalcResult(res.data)
      toast.success(`Розраховано: ${res.data.distance_km} км / ${res.data.duration_min} хв`)
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }, message?: string }
      toast.error('Не вдалося виконати розрахунок нульового рейсу', {
        description: errorObj?.response?.data?.detail || errorObj?.message || 'Спробуйте пізніше'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Обробник кліку на розгортання маршруту
  const handleToggleRoute = (routeId: string) => {
    setExpandedRouteId((prev) => (prev === routeId ? null : routeId))
  }

  // Фільтрація списку маршрутів
  const filteredRoutes = useMemo(() => {
    if (!networkData?.routes) return []
    return networkData.routes.filter((r) => {
      if (typeFilter !== 'ALL' && r.transport_type !== typeFilter) return false
      if (suboptimalOnly && r.is_already_optimal) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNum = r.route_number.toLowerCase().includes(q)
        const matchName = r.route_name.toLowerCase().includes(q)
        const matchTermA = r.terminals.terminal_a.toLowerCase().includes(q)
        const matchTermB = r.terminals.terminal_b.toLowerCase().includes(q)
        if (!matchNum && !matchName && !matchTermA && !matchTermB) return false
      }
      return true
    })
  }, [networkData?.routes, typeFilter, suboptimalOnly, searchQuery])

  // Фільтрація матриці
  const filteredMatrix = useMemo(() => {
    if (!matrixData?.matrix) return []
    return matrixData.matrix.filter((m) => {
      if (matrixDepotFilter !== 'ALL' && m.depot_id !== matrixDepotFilter) return false
      if (matrixSearch.trim()) {
        const q = matrixSearch.toLowerCase()
        const matchTerm = m.terminal_name.toLowerCase().includes(q)
        const matchJunc = m.junction_stop.toLowerCase().includes(q)
        const matchPath = m.path_description.toLowerCase().includes(q)
        if (!matchTerm && !matchJunc && !matchPath) return false
      }
      return true
    })
  }, [matrixData?.matrix, matrixDepotFilter, matrixSearch])

  const summary = networkData?.summary

  const handleApplyOptimization = () => {
    applyMutation.mutate()
  }

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    suboptimalOnly,
    setSuboptimalOnly,
    expandedRouteId,
    handleToggleRoute,
    calcDepotId,
    setCalcDepotId,
    calcTerminal,
    setCalcTerminal,
    calcType,
    setCalcType,
    calcResult,
    isCalculating,
    handleCalculateSingle,
    matrixDepotFilter,
    setMatrixDepotFilter,
    matrixSearch,
    setMatrixSearch,
    networkData,
    isNetworkLoading,
    isNetworkFetching,
    refetchNetwork,
    matrixData,
    isMatrixLoading,
    filteredRoutes,
    filteredMatrix,
    summary,
    isApplyPending: applyMutation.isPending,
    handleApplyOptimization
  }
}
