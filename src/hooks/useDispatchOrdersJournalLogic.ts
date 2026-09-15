import { useState, useEffect, useMemo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import apiClient from '../utils/apiClient'
import { useRouteStore } from '../store/useRouteStore'
import { ODESSA_DEFAULT_ROUTES } from '../store/useScheduleStore'
import { Route } from '../types'

export interface DispatchOrder {
  id: number
  order_number: string
  created_at: string
  completed_at: string | null
  dispatcher_name: string
  dispatcher_id: string | null
  route_id: string
  route_number: string
  transport_type: string
  vehicle_id: string | null
  duty_number: number | null
  driver_name: string | null
  order_type: string
  target_location: string | null
  duration_min: number | null
  reason: string
  description: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
}

export interface DispatchStats {
  total_today: number
  active_count: number
  completed_count: number
  short_turns_count: number
  pacing_count: number
  pull_in_count: number
  detour_count: number
  service_calls_count: number
}

export const useDispatchOrdersJournalLogic = () => {
  const routesFromStore = useRouteStore(useShallow((s) => s.routes || []))
  const routes = routesFromStore.length > 0 ? routesFromStore : ODESSA_DEFAULT_ROUTES

  const [orders, setOrders] = useState<DispatchOrder[]>([])
  const [stats, setStats] = useState<DispatchStats | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)

  // Фільтри
  const [selectedDate, setSelectedDate] = useState<string>('today')
  const [selectedRoute, setSelectedRoute] = useState<string>('ALL')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true)
      const params: Record<string, string> = {}
      if (selectedDate !== 'ALL') params.date_str = selectedDate
      if (selectedRoute !== 'ALL') params.route_id = selectedRoute
      if (selectedType !== 'ALL') params.order_type = selectedType
      if (selectedStatus !== 'ALL') params.status = selectedStatus

      const [ordersRes, statsRes] = await Promise.all([
        apiClient.get<DispatchOrder[]>('/dispatch/orders', { params }),
        apiClient.get<DispatchStats>('/dispatch/orders/stats')
      ])

      setOrders(ordersRes.data || [])
      setStats(statsRes.data || null)
    } catch (error) {
      console.error('Помилка завантаження журналу розпоряджень:', error)
      toast.error('Не вдалося завантажити журнал розпоряджень')
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, selectedRoute, selectedType, selectedStatus])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await apiClient.patch(`/dispatch/orders/${orderId}/complete`)
      toast.success('Розпорядження позначено як виконане')
      fetchOrders()
    } catch (error) {
      toast.error('Помилка оновлення статусу')
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    try {
      await apiClient.patch(`/dispatch/orders/${orderId}/cancel`)
      toast.success('Розпорядження скасовано')
      fetchOrders()
    } catch (error) {
      toast.error('Помилка скасування')
    }
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
  }

  const handleRouteChange = (routeId: string) => {
    setSelectedRoute(routeId)
  }

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handlePrint = () => {
    window.print()
  }

  // Фільтрація
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return orders

    return orders.filter((o) => 
      o.order_number.toLowerCase().includes(q) ||
      o.route_number.toLowerCase().includes(q) ||
      (o.vehicle_id && o.vehicle_id.toLowerCase().includes(q)) ||
      (o.driver_name && o.driver_name.toLowerCase().includes(q)) ||
      o.dispatcher_name.toLowerCase().includes(q) ||
      o.reason.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q) ||
      (o.target_location && o.target_location.toLowerCase().includes(q))
    )
  }, [orders, searchQuery])

  // Експорт у CSV (Excel-сумісний UTF-8 з BOM)
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Немає даних для експорту')
      return
    }

    const headers = [
      'Номер наказу', 
      'Час видачі', 
      'Маршрут', 
      'Борт', 
      'Наряд', 
      'Водій', 
      'Тип заходу', 
      'Локація/Кільце', 
      'Причина', 
      'Зміст розпорядження', 
      'Диспетчер', 
      'Статус'
    ]

    const rows = filteredOrders.map((o) => [
      `"${o.order_number}"`,
      `"${new Date(o.created_at).toLocaleString('uk-UA')}"`,
      `"${o.transport_type === 'TROLLEYBUS' ? 'Тролейбус' : 'Трамвай'} №${o.route_number}"`,
      `"${o.vehicle_id || '—'}"`,
      `"${o.duty_number ? '#' + o.duty_number : '—'}"`,
      `"${o.driver_name || '—'}"`,
      `"${o.order_type}"`,
      `"${o.target_location || '—'}"`,
      `"${o.reason.replace(/"/g, '""')}"`,
      `"${o.description.replace(/"/g, '""')}"`,
      `"${o.dispatcher_name}"`,
      `"${o.status}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Журнал_розпоряджень_ОМЕТ_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Журнал успішно експортовано у CSV')
  }

  return {
    routes,
    orders: filteredOrders,
    stats,
    isLoading,
    isCreateModalOpen,
    selectedDate,
    selectedRoute,
    selectedType,
    selectedStatus,
    searchQuery,

    fetchOrders,
    handleCompleteOrder,
    handleCancelOrder,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleDateChange,
    handleRouteChange,
    handleTypeChange,
    handleStatusChange,
    handleSearchChange,
    handlePrint,
    handleExportCSV
  }
}
