import React, { useState, useMemo } from 'react'
import { 
  Share2, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Bus, 
  Layers, 
  X,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import apiClient from '../../utils/apiClient'
import { useRouteStore } from '../../store/useRouteStore'

export interface PassingRouteItem {
  route_id: string
  route_number: string
  route_name: string
  transport_type: 'TRAM' | 'TROLLEYBUS'
  direction_id: number
  stop_sequence: number
}

export interface SharedStopItem {
  id: string
  name: string
  lat: number
  lng: number
  type: string
  is_dispatch_station: boolean
  break_capacity: number
  route_count: number
  routes: PassingRouteItem[]
  transport_types: string[]
  is_multimodal: boolean
  corridor: { id: string; name: string } | null
}

export const SharedStopsPanel: React.FC = () => {
  const queryClient = useQueryClient()
  const { routes: allSystemRoutes } = useRouteStore()

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'TRAM' | 'TROLLEYBUS'>('ALL')
  const [corridorFilter, setCorridorFilter] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Modal States
  const [isAddRouteModalOpen, setIsAddRouteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStopForEdit, setSelectedStopForEdit] = useState<SharedStopItem | null>(null)

  // Form states for adding connection
  const [targetStopId, setTargetStopId] = useState('')
  const [selectedRouteIdToAdd, setSelectedRouteIdToAdd] = useState('')
  const [directionIdToAdd, setDirectionIdToAdd] = useState(0)

  // Form states for editing stop
  const [editStopName, setEditStopName] = useState('')
  const [editStopType, setEditStopType] = useState('STOP')
  const [editIsDispatch, setEditIsDispatch] = useState(false)
  const [editSelectedRoutes, setEditSelectedRoutes] = useState<string[]>([])

  // Fetch shared stops from backend
  const { data: sharedStops = [], isLoading, isFetching, refetch } = useQuery<SharedStopItem[]>({
    queryKey: ['shared-stops-list'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/stations/shared-stops')
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 60 * 1000
  })

  // Add route connection mutation
  const addRouteMutation = useMutation({
    mutationFn: async (payload: { stop_id: string; route_id: string; direction_id: number }) => {
      const res = await apiClient.post('/api/v1/stations/shared-stops', payload)
      return res.data
    },
    onSuccess: () => {
      toast.success('Маршрут успішно закріплено за спільною зупинкою!')
      queryClient.invalidateQueries({ queryKey: ['shared-stops-list'] })
      setIsAddRouteModalOpen(false)
      setTargetStopId('')
      setSelectedRouteIdToAdd('')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка закріплення маршруту')
    }
  })

  // Update stop and its routes mutation
  const updateStopMutation = useMutation({
    mutationFn: async ({ stopId, payload }: { stopId: string; payload: any }) => {
      const res = await apiClient.put(`/api/v1/stations/shared-stops/${stopId}`, payload)
      return res.data
    },
    onSuccess: () => {
      toast.success('Зупинку та зв\'язки маршрутів успішно оновлено в БД!')
      queryClient.invalidateQueries({ queryKey: ['shared-stops-list'] })
      setIsEditModalOpen(false)
      setSelectedStopForEdit(null)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка оновлення зупинки')
    }
  })

  // Remove specific route from stop mutation
  const removeRouteMutation = useMutation({
    mutationFn: async ({ stopId, routeId }: { stopId: string; routeId: string }) => {
      const res = await apiClient.delete(`/api/v1/stations/shared-stops/${stopId}/routes/${routeId}`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Маршрут відкріплено від спільної зупинки')
      queryClient.invalidateQueries({ queryKey: ['shared-stops-list'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка видалення зв\'язку')
    }
  })

  // Unlink stop completely mutation
  const unlinkStopMutation = useMutation({
    mutationFn: async (stopId: string) => {
      const res = await apiClient.delete(`/api/v1/stations/shared-stops/${stopId}`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Всі маршрутні прив\'язки зупинки очищено!')
      queryClient.invalidateQueries({ queryKey: ['shared-stops-list'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка видалення')
    }
  })

  // Handlers
  const handleOpenAddModal = (stopId?: string) => {
    setTargetStopId(stopId || (sharedStops[0]?.id || ''))
    setSelectedRouteIdToAdd(allSystemRoutes[0]?.id || '1')
    setDirectionIdToAdd(0)
    setIsAddRouteModalOpen(true)
  }

  const handleOpenEditModal = (stop: SharedStopItem) => {
    setSelectedStopForEdit(stop)
    setEditStopName(stop.name)
    setEditStopType(stop.type || 'STOP')
    setEditIsDispatch(stop.is_dispatch_station)
    setEditSelectedRoutes(stop.routes.map(r => r.route_id))
    setIsEditModalOpen(true)
  }

  const handleToggleRouteInEdit = (routeId: string) => {
    if (editSelectedRoutes.includes(routeId)) {
      setEditSelectedRoutes(editSelectedRoutes.filter(id => id !== routeId))
    } else {
      setEditSelectedRoutes([...editSelectedRoutes, routeId])
    }
  }

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStopForEdit) return

    updateStopMutation.mutate({
      stopId: selectedStopForEdit.id,
      payload: {
        name: editStopName,
        type: editStopType,
        is_dispatch_station: editIsDispatch,
        routes: editSelectedRoutes
      }
    })
  }

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStopId || !selectedRouteIdToAdd) {
      toast.error('Оберіть зупинку та маршрут')
      return
    }

    addRouteMutation.mutate({
      stop_id: targetStopId,
      route_id: selectedRouteIdToAdd,
      direction_id: directionIdToAdd
    })
  }

  const handleDeleteRouteLink = (stopId: string, routeId: string, stopName: string) => {
    if (window.confirm(`Відкріпити маршрут ${routeId} від зупинки «${stopName}»?`)) {
      removeRouteMutation.mutate({ stopId, routeId })
    }
  }

  const handleUnlinkStop = (stopId: string, stopName: string) => {
    if (window.confirm(`Видалити всі маршрутні прив'язки для зупинки «${stopName}»?`)) {
      unlinkStopMutation.mutate(stopId)
    }
  }

  // Filtered & Paginated Shared Stops
  const filteredStops = useMemo(() => {
    return sharedStops.filter(stop => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = stop.name.toLowerCase().includes(query)
        const matchesId = stop.id.toLowerCase().includes(query)
        const matchesRoute = stop.routes.some(r => r.route_number.toLowerCase().includes(query))
        if (!matchesName && !matchesId && !matchesRoute) return false
      }

      if (typeFilter !== 'ALL') {
        if (!stop.transport_types.includes(typeFilter)) return false
      }

      if (corridorFilter !== 'ALL') {
        if (stop.corridor?.id !== corridorFilter) return false
      }

      return true
    })
  }, [sharedStops, searchQuery, typeFilter, corridorFilter])

  const totalPages = Math.ceil(filteredStops.length / itemsPerPage) || 1
  const displayedStops = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStops.slice(start, start + itemsPerPage)
  }, [filteredStops, currentPage, itemsPerPage])

  // Extract unique corridors for filter dropdown
  const availableCorridors = useMemo(() => {
    const map = new Map<string, string>()
    sharedStops.forEach(s => {
      if (s.corridor) {
        map.set(s.corridor.id, s.corridor.name)
      }
    })
    return Array.from(map.entries())
  }, [sharedStops])

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Banner with Stats */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <span>Спільні зупинки маршрутів</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {sharedStops.length} ВУЗЛІВ
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Довідник пунктів мережі, через які проходять спільні трамвайні та тролейбусні маршрути Одеси
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Оновити дані з сервера"
            tabIndex={0}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Оновити</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            aria-label="Додати зв'язок маршруту"
            tabIndex={0}
            className="px-4 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Додати зв'язок</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Пошук за назвою зупинки, ID або номером маршруту..."
            aria-label="Пошук спільних зупинок"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Transport Type Pills */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setTypeFilter('ALL'); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Всі типи
            </button>
            <button
              type="button"
              onClick={() => { setTypeFilter('TRAM'); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'TRAM'
                  ? 'bg-blue-600 text-white shadow-2xs font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Трамваї
            </button>
            <button
              type="button"
              onClick={() => { setTypeFilter('TROLLEYBUS'); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                typeFilter === 'TROLLEYBUS'
                  ? 'bg-emerald-600 text-white shadow-2xs font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Тролейбуси
            </button>
          </div>

          {/* Corridor Dropdown */}
          <select
            value={corridorFilter}
            onChange={(e) => {
              setCorridorFilter(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Фільтр за магістральним коридором"
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
          >
            <option value="ALL">Всі коридори Одеси</option>
            {availableCorridors.map(([cId, cName]) => (
              <option key={cId} value={cId}>{cName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Main Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-400 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Завантаження спільних зупинок з бази даних omet.db...</span>
          </div>
        ) : displayedStops.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Спільних зупинок за вказаними фільтрами не знайдено
            </p>
            <p className="text-xs text-slate-400">Спробуйте змінити пошуковий запит або скинути фільтри</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Зупинка / Вузол</th>
                  <th className="py-3 px-3">Координати</th>
                  <th className="py-3 px-3">Тип / Статус</th>
                  <th className="py-3 px-4">Спільні маршрути</th>
                  <th className="py-3 px-3">Магістральний коридор</th>
                  <th className="py-3 px-4 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {displayedStops.map((stop) => (
                  <tr 
                    key={stop.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Stop Name & ID */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          stop.is_dispatch_station
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                            : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        }`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {stop.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            ID: {stop.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Coordinates */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                    </td>

                    {/* Type & Dispatch Badge */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          stop.type === 'HUB'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : stop.type === 'TERMINAL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {stop.type}
                        </span>
                        {stop.is_dispatch_station && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            <span>ДП ОМЕТ</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Routes Badges */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                        {stop.routes.map((r) => {
                          const isTram = r.transport_type === 'TRAM'
                          return (
                            <div 
                              key={`${stop.id}-${r.route_id}`}
                              className={`group/r px-2 py-1 rounded-lg text-xs font-black flex items-center space-x-1 border transition-all ${
                                isTram
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              }`}
                              title={`${isTram ? 'Трамвай' : 'Тролейбус'} №${r.route_number}: ${r.route_name}`}
                            >
                              <span>{isTram ? 'Т-' : 'Тр-'}{r.route_number}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteRouteLink(stop.id, r.route_id, stop.name)}
                                aria-label={`Відкріпити маршрут ${r.route_number}`}
                                tabIndex={0}
                                className="opacity-0 group-hover/r:opacity-100 hover:text-red-600 transition-opacity ml-1 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )
                        })}

                        <button
                          type="button"
                          onClick={() => handleOpenAddModal(stop.id)}
                          aria-label={`Додати маршрут до зупинки ${stop.name}`}
                          tabIndex={0}
                          className="px-2 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 text-xs font-bold transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Corridor Tag */}
                    <td className="py-3 px-3">
                      {stop.corridor ? (
                        <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-200 font-semibold text-xs">
                          <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[200px]" title={stop.corridor.name}>
                            {stop.corridor.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(stop)}
                          aria-label={`Редагувати зупинку ${stop.name}`}
                          tabIndex={0}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Редагувати параметри та маршрути"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnlinkStop(stop.id, stop.name)}
                          aria-label={`Очистити маршрути зупинки ${stop.name}`}
                          tabIndex={0}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Очистити всі маршрутні прив'язки"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination */}
        {!isLoading && filteredStops.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <div>
              Показано {(currentPage - 1) * itemsPerPage + 1}—{Math.min(currentPage * itemsPerPage, filteredStops.length)} з {filteredStops.length} спільних зупинок
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                Назад
              </button>
              <span className="px-2 font-mono text-slate-900 dark:text-white font-bold">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD ROUTE LINK */}
      {isAddRouteModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Прив'язка маршруту до спільної зупинки"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <span>Прив'язати маршрут до зупинки</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRouteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Цільова зупинка (ID та назва):
                </label>
                <select
                  value={targetStopId}
                  onChange={(e) => setTargetStopId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                >
                  {sharedStops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (ID: {s.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Маршрут для прив'язки:
                </label>
                <select
                  value={selectedRouteIdToAdd}
                  onChange={(e) => setSelectedRouteIdToAdd(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                >
                  {allSystemRoutes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.type === 'tram' ? 'Трамвай' : 'Тролейбус'} №{r.number} — {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Напрямок руху:
                </label>
                <select
                  value={directionIdToAdd}
                  onChange={(e) => setDirectionIdToAdd(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                >
                  <option value={0}>0 — Прямий напрямок</option>
                  <option value={1}>1 — Зворотній напрямок</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddRouteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={addRouteMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {addRouteMutation.isPending ? 'Збереження...' : 'Прив\'язати'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STOP & ROUTES */}
      {isEditModalOpen && selectedStopForEdit && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Редагування спільної зупинки"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-600" />
                  <span>Редагування спільної зупинки</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedStopForEdit.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Назва зупинки:
                </label>
                <input
                  type="text"
                  value={editStopName}
                  onChange={(e) => setEditStopName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Тип об'єкта:
                  </label>
                  <select
                    value={editStopType}
                    onChange={(e) => setEditStopType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="STOP">STOP — Звичайна зупинка</option>
                    <option value="HUB">HUB — Пересадковий вузол</option>
                    <option value="TERMINAL">TERMINAL — Кінцева станція</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_dp_check"
                    checked={editIsDispatch}
                    onChange={(e) => setEditIsDispatch(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor="is_dp_check" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Головний ДП ОМЕТ
                  </label>
                </div>
              </div>

              {/* Route checkboxes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-2">
                  Закріплені спільні маршрути:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  {allSystemRoutes.map(r => {
                    const isChecked = editSelectedRoutes.includes(r.id)
                    const isTram = r.type === 'tram'
                    return (
                      <label 
                        key={r.id} 
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/70 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-black' 
                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRouteInEdit(r.id)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded cursor-pointer"
                        />
                        <span>{isTram ? 'Т-' : 'Тр-'}{r.number}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={updateStopMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md cursor-pointer disabled:opacity-50"
                >
                  {updateStopMutation.isPending ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SharedStopsPanel
