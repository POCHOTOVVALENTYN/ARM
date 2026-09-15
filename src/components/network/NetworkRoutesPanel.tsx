import React from 'react'
import { Route, RouteStatus, TransportType } from '../../types'
import { RoutesDirectoryTable } from '../routes/RoutesDirectoryTable'
import { RoutePassport } from '../routes/RoutePassport'
import {
  Table as TableIcon,
  FileText,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Search,
  Navigation,
  Bus,
  ListFilter,
  X
} from 'lucide-react'

export interface NetworkRoutesPanelProps {
  routes: Route[]
  filteredRoutes: Route[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  typeFilter: TransportType | 'all'
  setTypeFilter: (type: TransportType | 'all') => void
  statusFilter: RouteStatus | 'all'
  setStatusFilter: (status: RouteStatus | 'all') => void
  selectedRouteId: string
  selectedRoute: Route | null
  activeViewMode: 'overview' | 'passport' | 'matrix' | 'directory'
  setActiveViewMode: (mode: 'overview' | 'passport' | 'matrix' | 'directory') => void
  onOpenCreateModal: () => void
  onOpenEditModal: (route: Route) => void
  onDuplicateRoute: (id: string) => void
  onDeleteRoute: (id: string) => void
  onExportJson: () => void
  onOpenJsonModal: () => void
  onResetToDefaults: () => void
  onSelectRoute: (id: string, mode: 'passport' | 'matrix') => void
  onUpdateRoute: (route: Route) => void
}

export const NetworkRoutesPanel: React.FC<NetworkRoutesPanelProps> = ({
  filteredRoutes,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  selectedRouteId,
  selectedRoute,
  activeViewMode,
  setActiveViewMode,
  onOpenCreateModal,
  onOpenEditModal,
  onDuplicateRoute,
  onDeleteRoute,
  onExportJson,
  onOpenJsonModal,
  onResetToDefaults,
  onSelectRoute,
  onUpdateRoute
}) => {
  return (
    <div className="space-y-6">
      {/* Global Action Toolbar */}
      <div className="bg-white border-2 border-gray-900 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: View Mode Toggles */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-300 text-xs font-bold shrink-0" role="tablist" aria-label="Режими перегляду маршрутів">
          <button
            type="button"
            role="tab"
            aria-selected={activeViewMode === 'overview'}
            onClick={() => setActiveViewMode('overview')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeViewMode === 'overview'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Реєстр всіх маршрутів ({filteredRoutes.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeViewMode === 'passport'}
            onClick={() => setActiveViewMode('passport')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeViewMode === 'passport'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Паспорт маршруту</span>
          </button>
        </div>

        {/* Right: CRUD & Import/Export Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg border border-emerald-700 shadow-xs flex items-center space-x-1.5 cursor-pointer"
            aria-label="Додати новий маршрут"
          >
            <Plus className="w-4 h-4" />
            <span>Додати новий маршрут</span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            title="Завантажити всі маршрути у форматі JSON"
            aria-label="Експорт маршрутів у JSON"
            className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-900 px-3 py-2 rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Експорт JSON</span>
          </button>

          <button
            type="button"
            onClick={onOpenJsonModal}
            title="Імпортувати конфігурацію з JSON файлу"
            aria-label="Імпорт маршрутів з JSON"
            className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-900 px-3 py-2 rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Імпорт JSON</span>
          </button>

          <button
            type="button"
            onClick={onResetToDefaults}
            title="Скинути до стандартного набору маршрутів"
            aria-label="Скинути до стандартного набору маршрутів"
            className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-gray-300 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar (Only in Overview mode) */}
      {activeViewMode === 'overview' && (
        <div className="bg-white border-2 border-gray-900 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="relative col-span-1 md:col-span-1 flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук за номером чи назвою..."
              aria-label="Пошук за номером чи назвою маршруту"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-10 py-2 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Очистити пошуковий запит"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-300 text-xs font-bold col-span-1 md:col-span-1 items-center justify-center">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`flex-1 px-2 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Усі</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('tram')}
              className={`flex-1 px-2 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                typeFilter === 'tram'
                  ? 'bg-rose-100 text-rose-800 shadow-sm border border-rose-300'
                  : 'text-gray-600 hover:text-rose-700'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Трамваї</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('trolleybus')}
              className={`flex-1 px-2 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                typeFilter === 'trolleybus'
                  ? 'bg-indigo-100 text-indigo-800 shadow-sm border border-indigo-300'
                  : 'text-gray-600 hover:text-indigo-700'
              }`}
            >
              <Bus className="w-3.5 h-3.5" />
              <span>Тролейбуси</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <ListFilter className="w-4 h-4 text-gray-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RouteStatus | 'all')}
              aria-label="Фільтр за статусом маршруту"
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Усі статуси</option>
              <option value="active">Активні</option>
              <option value="maintenance">На ремонті / Скорочені</option>
              <option value="suspended">Призупинені</option>
              <option value="reserve">В резерві</option>
            </select>
          </div>
        </div>
      )}

      {/* VIEW 1: Overview Route Master Table */}
      {activeViewMode === 'overview' && (
        <RoutesDirectoryTable
          selectedRouteId={selectedRouteId}
          onSelectRoute={onSelectRoute}
          onEditRoute={onOpenEditModal}
          onDuplicateRoute={onDuplicateRoute}
          onDeleteRoute={onDeleteRoute}
        />
      )}

      {/* VIEW 2: Route Passport (Master-Detail) */}
      {activeViewMode === 'passport' && selectedRoute && (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          {/* Sidebar: Route List */}
          <div className="w-full lg:w-72 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm shrink-0 lg:sticky lg:top-4 max-h-[calc(100vh-120px)]">
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between rounded-t-xl">
              <span className="font-bold text-gray-700 text-sm">Маршрути мережі</span>
              <button
                type="button"
                onClick={() => setActiveViewMode('overview')}
                className="text-gray-400 hover:text-gray-800 bg-white border border-gray-200 rounded p-1 shadow-xs cursor-pointer"
                title="Закрити паспорт і повернутися до таблиці"
                aria-label="Закрити паспорт"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectRoute(r.id, 'passport')}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      r.id === selectedRoute.id
                        ? 'bg-indigo-50 border border-indigo-200 shadow-xs'
                        : 'hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        r.type === 'tram'
                          ? 'bg-rose-100 text-rose-600 border-rose-200'
                          : 'bg-indigo-100 text-indigo-600 border-indigo-200'
                      }`}
                    >
                      <span className="font-bold text-xs">{r.type === 'tram' ? 'Тр' : 'Т'}</span>
                    </div>
                    <div className="ml-3 overflow-hidden flex-1">
                      <div className="font-bold text-sm text-gray-900">№ {r.number}</div>
                      <div className="text-[10px] text-gray-500 truncate" title={r.name}>
                        {r.name}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-gray-500">Маршрути не знайдено</div>
              )}
            </div>
          </div>

          {/* Main Content: Passport */}
          <div className="flex-1 w-full min-w-0">
            <RoutePassport
              route={selectedRoute}
              onUpdateRoute={onUpdateRoute}
            />
          </div>
        </div>
      )}
    </div>
  )
}
