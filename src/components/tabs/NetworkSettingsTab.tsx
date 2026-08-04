import React, { useState, useMemo } from 'react';
import { Route, RouteStatus, TransportType } from '../../types';
import { useRouteStore } from '../../store/useRouteStore';
import { RouteTable } from '../routes/RouteTable';
import { RoutePassport } from '../routes/RoutePassport';
import { RouteFormModal } from '../routes/RouteFormModal';
import { RouteControlPointsView } from '../routes/RouteControlPointsView';
import { GlobalHubFormModal } from '../network/GlobalHubFormModal';
import { JsonImportModal } from '../routes/JsonImportModal';
import { MOCK_DEPOTS, MOCK_DRIVER_BREAK_LOCATIONS } from '../../data/mockData';
import gtfsRoutesRaw from '../../data/gtfsParsed.json';
import { GtfsLogicalRoute } from '../../types';
import { useRouteDepotStore } from '../../store/useRouteDepotStore';

const logicalRoutes = gtfsRoutesRaw as GtfsLogicalRoute[];
import { useStationStore } from '../../store/useStationStore';
import { useControlPointStore } from '../../store/useControlPointStore';
import { 
  Settings, 
  Navigation, 
  MapPin, 
  Bus, 
  Coffee, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  Filter, 
  FileText, 
  Table as TableIcon, 
  Zap,
  ListFilter,
  X,
  ChevronDown,
  ChevronRight,
  Route as RouteIcon,
  Edit,
  Trash2
} from 'lucide-react';

export const NetworkSettingsTab: React.FC = () => {
  const stations = useStationStore(state => state.stations);
  const [activeSubTab, setActiveSubTab] = useState<'routes' | 'hubs' | 'depots' | 'breaks'>('routes');

  // Route Store State & Actions
  const {
    routes,
    searchQuery,
    typeFilter,
    statusFilter,
    selectedRouteId,
    activeViewMode,
    validationErrors,
    setSearchQuery,
    setTypeFilter,
    setStatusFilter,
    setSelectedRouteId,
    setActiveViewMode,
    addRoute,
    updateRoute,
    deleteRoute,
    duplicateRoute,
    updateSegmentTime,
    clearValidationError,
    exportRoutesJson,
    importRoutesJson,
    resetToDefaults,
  } = useRouteStore();

  const { controlPoints, addControlPoint, updateControlPoint, deleteControlPoint } = useControlPointStore();
  
  // Hub CRUD State
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<any>(null);

  // Modals local state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [selectedRouteForPoints, setSelectedRouteForPoints] = useState<string>('');
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [expandedDepotRouteId, setExpandedDepotRouteId] = useState<string | null>(null);

  // Route-Depot Config Store
  const { configs: routeDepotConfigs, addConfig, updateConfig, deleteConfig: deleteRouteDepotConfig } = useRouteDepotStore();
  
  const getStationById = useStationStore(state => state.getStationById);

  // Compute combined control points for the global directory
  const { allDirectoryPoints, routeUsageMap } = useMemo(() => {
    const routeUsage = new Map<string, Route[]>();
    
    // Track route usage based on stations and explicitly defined control points
    routes.forEach(r => {
      (r.stations || []).forEach(stationId => {
        if (!routeUsage.has(stationId)) {
          routeUsage.set(stationId, []);
        }
        routeUsage.get(stationId)!.push(r);
      });

      (r.controlPoints || []).forEach(cp => {
        if (!routeUsage.has(cp.controlPointId)) {
          routeUsage.set(cp.controlPointId, []);
        }
        const arr = routeUsage.get(cp.controlPointId)!;
        if (!arr.find(existingR => existingR.id === r.id)) {
           arr.push(r);
        }
      });
    });

    const complexHubs = controlPoints.map(hub => ({
      ...hub,
      isComplex: true,
    }));

    return {
      allDirectoryPoints: complexHubs.sort((a, b) => a.name.localeCompare(b.name)),
      routeUsageMap: routeUsage
    };
  }, [routes, controlPoints]);

  // Filtered routes calculation
  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || null;

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingRoute(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (routeToEdit: Route) => {
    setEditingRoute(routeToEdit);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (routeDataPayload: any) => {
    if (editingRoute) {
      updateRoute(routeDataPayload);
    } else {
      addRoute(routeDataPayload);
    }
  };

  const handleDeleteWithConfirm = (id: string) => {
    const routeToDelete = routes.find((r) => r.id === id);
    if (!routeToDelete) return;

    if (confirm(`Ви дійсно бажаєте видалити маршрут №${routeToDelete.number} «${routeToDelete.name}»?`)) {
      deleteRoute(id);
    }
  };

  const handleSelectRoute = (id: string, viewMode: 'passport' | 'matrix') => {
    setSelectedRouteId(id);
    setActiveViewMode(viewMode);
  };

  return (
    <div className="space-y-6">
      {/* Modern Executive Header & Sub-tab Navigation */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 text-slate-900 shadow-[0_8px_30px_rgba(37,99,235,0.12)] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle Decorative Ambient Background Glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Metadata Block */}
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs shrink-0">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                КП «ОДЕСМІСЬКЕЛЕКТРОТРАНС»
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Сервер синхронізовано" />
            </div>
            <h2 className="font-extrabold text-lg text-slate-900 tracking-tight mt-1">
              Налаштування та Довідники мережі
            </h2>
            <p className="text-xs text-slate-500 font-medium font-sans leading-relaxed">
              Централізований довідник маршрутів, паспортів, міжзупинкових перегонів та інфраструктурних вузлів
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation Buttons */}
        <div className="flex bg-blue-50/60 p-1.5 rounded-xl border border-blue-200 text-xs overflow-x-auto relative z-10 shrink-0 gap-1.5">
          {[
            { id: 'routes', label: '1. Маршрути (Route Master)', icon: Navigation },
            { id: 'hubs', label: '2. Контрольні точки', icon: MapPin },
            { id: 'depots', label: '3. Депо та Нульові пробіги', icon: Bus },
            { id: 'breaks', label: '4. Місця обідів водіїв', icon: Coffee },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg font-extrabold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-xs'
                    : 'bg-white text-blue-700 hover:text-blue-900 border border-blue-300 hover:border-blue-500 hover:bg-blue-50/80 font-bold'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Route Management (Route Master) Sub-tab */}
      {activeSubTab === 'routes' && (
        <div className="space-y-6">
          {/* Global Action Toolbar */}
          <div className="bg-white border-2 border-gray-900 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Left: View Mode Toggles */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-300 text-xs font-bold shrink-0">
              <button
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
                onClick={handleOpenCreateModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg border border-emerald-700 shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Додати новий маршрут</span>
              </button>

              <button
                onClick={() => exportRoutesJson()}
                title="Завантажити всі маршрути у форматі JSON"
                className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-900 px-3 py-2 rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Експорт JSON</span>
              </button>

              <button
                onClick={() => setIsJsonModalOpen(true)}
                title="Імпортувати конфігурацію з JSON файлу"
                className="bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-900 px-3 py-2 rounded-lg shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Імпорт JSON</span>
              </button>

              <button
                onClick={resetToDefaults}
                title="Скинути до стандартного набору маршрутів"
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
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-10 py-2 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Type Filter (Segmented Buttons) */}
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-300 text-xs font-bold col-span-1 md:col-span-1 items-center justify-center">
                <button
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
                  onChange={(e) => setStatusFilter(e.target.value as any)}
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
            <RouteTable
              routes={filteredRoutes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={handleSelectRoute}
              onEditRoute={handleOpenEditModal}
              onDuplicateRoute={duplicateRoute}
              onDeleteRoute={handleDeleteWithConfirm}
            />
          )}

          {/* VIEW 2: Route Passport (Master-Detail) */}
          {activeViewMode === 'passport' && selectedRoute && (
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              {/* Sidebar: Route List */}
              <div className="w-full lg:w-72 bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm shrink-0 lg:sticky lg:top-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between rounded-t-xl">
                  <span className="font-bold text-gray-700 text-sm">Маршрути мережі</span>
                  <button 
                    onClick={() => setActiveViewMode('overview')} 
                    className="text-gray-400 hover:text-gray-800 bg-white border border-gray-200 rounded p-1 shadow-xs cursor-pointer"
                    title="Закрити паспорт і повернутися до таблиці"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
                  {filteredRoutes.length > 0 ? filteredRoutes.map(r => (
                    <button 
                      key={r.id} 
                      onClick={() => handleSelectRoute(r.id, 'passport')}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        r.id === selectedRoute.id 
                          ? 'bg-indigo-50 border border-indigo-200 shadow-xs' 
                          : 'hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                          r.type === 'tram' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-indigo-100 text-indigo-600 border-indigo-200'
                      }`}>
                        <span className="font-bold text-xs">{r.type === 'tram' ? 'Тр' : 'Т'}</span>
                      </div>
                      <div className="ml-3 overflow-hidden flex-1">
                        <div className="font-bold text-sm text-gray-900">№ {r.number}</div>
                        <div className="text-[10px] text-gray-500 truncate" title={r.name}>{r.name}</div>
                      </div>
                    </button>
                  )) : (
                    <div className="p-4 text-center text-xs text-gray-500">Маршрути не знайдено</div>
                  )}
                </div>
              </div>
              
              {/* Main Content: Passport */}
              <div className="flex-1 w-full min-w-0">
                <RoutePassport
                  route={selectedRoute}
                  onUpdateRoute={updateRoute}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Control Points Master */}
      {activeSubTab === 'hubs' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-gray-900 font-bold text-base">Довідник контрольних точок (Control Points)</h3>
              <p className="text-xs text-gray-600">
                Глобальні інфраструктурні вузли та контрольні точки за маршрутами
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h4 className="text-sm font-bold text-gray-900">1. Глобальні вузли та диспетчерські пункти</h4>
              <button
                onClick={() => {
                  setEditingHub(null);
                  setIsHubModalOpen(true);
                }}
                className="flex items-center space-x-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Додати вузол</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allDirectoryPoints.map((cp) => {
                const isComplex = cp.isComplex;
                const routesUsing = routeUsageMap.get(cp.id) || [];
                
                return (
                  <div
                    key={cp.id}
                    className={`bg-white border-2 ${isComplex ? 'border-gray-900' : 'border-gray-300'} rounded-xl p-5 space-y-3 shadow-sm relative group`}
                  >
                    <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className={`w-5 h-5 ${isComplex ? 'text-amber-600' : 'text-gray-500'}`} />
                        <h4 className="text-gray-900 font-bold text-base">{cp.name}</h4>
                        {!isComplex && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border border-gray-200 ml-2 uppercase font-bold">
                            Звичайна зупинка
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {isComplex && cp.minHeadwayMin && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 font-mono">
                            h_min = {cp.minHeadwayMin}хв
                          </span>
                        )}
                        {isComplex && (
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => {
                                setEditingHub(cp);
                                setIsHubModalOpen(true);
                              }}
                              className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                              title="Редагувати вузол"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Видалити глобальний вузол "${cp.name}"? Це не видалить саму зупинку, але вона перестане бути вузлом.`)) {
                                  deleteControlPoint(cp.id);
                                }
                              }}
                              className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-600"
                              title="Видалити вузол"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isComplex && cp.locationDescription && (
                      <p className="text-[11px] text-gray-500 italic border-l-2 border-gray-300 pl-2">
                        {cp.locationDescription}
                      </p>
                    )}

                    {routesUsing.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center mr-1">Маршрути:</span>
                        {routesUsing.map(r => (
                          <span key={r.id} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            r.type === 'tram' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {r.type === 'tram' ? 'Тр' : 'Т'} {r.number}
                          </span>
                        ))}
                      </div>
                    )}

                    {isComplex && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                            Канали колій ({cp.availableTracksCount}):
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {cp.channels?.map((ch: any, idx: number) => (
                            <div
                              key={ch.trackId}
                              className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-2 py-1"
                            >
                              <div className="flex items-center space-x-1.5 overflow-hidden">
                                <span className="text-[10px] font-bold text-gray-400">#{idx + 1}</span>
                                <span className="text-[11px] font-medium text-gray-700 truncate" title={ch.name}>
                                  {ch.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 ml-2 shrink-0">
                                {ch.directionVector && (
                                  <span className="text-[9px] text-gray-500 bg-gray-200 px-1 rounded truncate max-w-[60px]" title={ch.directionVector}>
                                    {ch.directionVector}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 rounded" title="Місткість (ТЗ)">
                                  {ch.maxCapacity} тз
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2">2. Контрольні точки за маршрутами</h4>
            <div className="space-y-2">
              {routes.map(r => {
                const isExpanded = expandedRouteId === r.id;
                return (
                  <div key={r.id} className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedRouteId(isExpanded ? null : r.id)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <RouteIcon className="w-5 h-5 text-indigo-600" />
                        <span className="font-bold text-sm text-gray-900">
                          {r.type === 'tram' ? 'Тр' : 'Т'} {r.number}: {r.name}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-mono font-bold">
                          {(r.controlPoints || []).length} точок
                        </span>
                      </div>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-200 bg-white">
                        <RouteControlPointsView 
                          route={r}
                          controlPoints={controlPoints}
                          updateRoute={updateRoute}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Depots & Zero Runs Master */}
      {activeSubTab === 'depots' && (
        <div className="space-y-4">
          <h3 className="text-gray-900 font-bold text-base">Довідник депо та нульових пробігів (Depot & Zero-Run Master)</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_DEPOTS.map((dep) => (
              <div
                key={dep.id}
                className="bg-white border-2 border-gray-900 rounded-xl p-4 space-y-2 shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Bus className="w-5 h-5 text-indigo-600" />
                  <h4 className="text-gray-900 font-bold text-sm">{dep.name}</h4>
                </div>
                <p className="text-xs text-gray-600">{dep.address}</p>
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs flex justify-between font-mono">
                  <span className="text-gray-600">Підготовчо-заключний час:</span>
                  <strong className="text-amber-800 font-bold">{dep.prepTimeMin} хвилин</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Depot/Route Pull-in/Pull-out Settings */}
          <div className="space-y-3">
            <h4 className="text-gray-900 font-bold text-sm uppercase tracking-wider border-b border-gray-900 pb-2">
              Матриця виїздів та заїздів (Pull-outs & Pull-ins):
            </h4>
            <p className="text-xs text-gray-500">
              Налаштування нульових пробігів для кожного маршруту: виїзди з депо (Pull-out) та заїзди в депо (Pull-in).
              Натисніть на маршрут, щоб розгорнути деталі або призначити депо.
            </p>

            {/* --- Tram routes --- */}
            <div className="space-y-1">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Трамвайні маршрути</h5>
              {logicalRoutes.filter(r => r.type === 'tram').map(route => {
                const configs = routeDepotConfigs.filter(c => c.routeId === route.id);
                const isExpanded = expandedDepotRouteId === route.id;
                const hasConfig = configs.length > 0;

                return (
                  <div key={route.id} className={`border rounded-lg overflow-hidden ${hasConfig ? 'border-gray-300 bg-white' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                    <button
                      onClick={() => setExpandedDepotRouteId(isExpanded ? null : route.id)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <RouteIcon className="w-4 h-4 text-rose-600" />
                        <span className="font-bold text-gray-900 text-sm">Тр {route.short_name}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[300px]">{route.long_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasConfig ? (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                            ✓ Депо призначено ({configs.length})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                            ⚠ Потрібно налаштувати
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t border-gray-200 space-y-3 bg-white">
                        {configs.map(cfg => {
                          const depot = MOCK_DEPOTS.find(d => d.id === cfg.depotId);
                          return (
                            <div key={cfg.id} className="border border-indigo-100 rounded-lg bg-indigo-50/30 p-3 relative">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-bold text-sm text-indigo-900 flex items-center">
                                  <Bus className="w-4 h-4 mr-2" />
                                  {depot?.name || cfg.depotId}
                                </h5>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Видалити зв'язок маршруту Тр ${route.short_name} з депо "${depot?.name}"?`)) {
                                      deleteRouteDepotConfig(cfg.id);
                                    }
                                  }}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                  title="Видалити зв'язок"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {/* Pull-out */}
                                <div className="space-y-2">
                                  <h6 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">▶ Виїзди з депо (Pull-out)</h6>
                                  {(['dir0', 'dir1'] as const).map(dir => {
                                    const dirData = cfg.pullOut?.[dir];
                                    const dirInfo = route.directions[dir === 'dir0' ? '0' : '1'];
                                    if (!dirInfo) return null;
                                    return (
                                      <div key={dir} className="bg-white p-2 rounded border border-gray-200 text-xs space-y-1.5">
                                        <span className="font-bold text-gray-700 block">
                                          Напр. {dir === 'dir0' ? '1' : '2'} → {dirInfo.firstStopName}
                                        </span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <label className="flex items-center gap-1 text-gray-500">
                                            Відст:
                                            <input type="number" step="0.1" min="0"
                                              value={dirData?.distanceKm ?? 0}
                                              onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = { ...cfg, pullOut: { ...cfg.pullOut, [dir]: { ...(dirData || { targetStationId: dirInfo.firstStopId, durationMin: 0, passengerPickupAllowed: false }), distanceKm: val } } };
                                                updateConfig(updated);
                                              }}
                                              className="w-16 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400">км</span>
                                          </label>
                                          <label className="flex items-center gap-1 text-gray-500">
                                            Час:
                                            <input type="number" step="1" min="0"
                                              value={dirData?.durationMin ?? 0}
                                              onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                const updated = { ...cfg, pullOut: { ...cfg.pullOut, [dir]: { ...(dirData || { targetStationId: dirInfo.firstStopId, distanceKm: 0, passengerPickupAllowed: false }), durationMin: val } } };
                                                updateConfig(updated);
                                              }}
                                              className="w-14 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400">хв</span>
                                          </label>
                                          <label className="flex items-center gap-1 text-gray-500 cursor-pointer select-none">
                                            <input type="checkbox"
                                              checked={dirData?.passengerPickupAllowed ?? false}
                                              onChange={e => {
                                                const updated = { ...cfg, pullOut: { ...cfg.pullOut, [dir]: { ...(dirData || { targetStationId: dirInfo.firstStopId, distanceKm: 0, durationMin: 0 }), passengerPickupAllowed: e.target.checked } } };
                                                updateConfig(updated);
                                              }}
                                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            З пасажирами
                                          </label>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Pull-in */}
                                <div className="space-y-2">
                                  <h6 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">◀ Заїзди в депо (Pull-in)</h6>
                                  {(['dir0', 'dir1'] as const).map(dir => {
                                    const dirData = cfg.pullIn?.[dir];
                                    const dirInfo = route.directions[dir === 'dir0' ? '0' : '1'];
                                    if (!dirInfo) return null;
                                    return (
                                      <div key={dir} className="bg-white p-2 rounded border border-gray-200 text-xs space-y-1.5">
                                        <span className="font-bold text-gray-700 block">
                                          Напр. {dir === 'dir0' ? '1' : '2'} ← {dirInfo.lastStopName}
                                        </span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <label className="flex items-center gap-1 text-gray-500">
                                            Відст:
                                            <input type="number" step="0.1" min="0"
                                              value={dirData?.distanceKm ?? 0}
                                              onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = { ...cfg, pullIn: { ...cfg.pullIn, [dir]: { ...(dirData || { targetStationId: dirInfo.lastStopId, durationMin: 0, passengerPickupAllowed: false }), distanceKm: val } } };
                                                updateConfig(updated);
                                              }}
                                              className="w-16 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400">км</span>
                                          </label>
                                          <label className="flex items-center gap-1 text-gray-500">
                                            Час:
                                            <input type="number" step="1" min="0"
                                              value={dirData?.durationMin ?? 0}
                                              onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                const updated = { ...cfg, pullIn: { ...cfg.pullIn, [dir]: { ...(dirData || { targetStationId: dirInfo.lastStopId, distanceKm: 0, passengerPickupAllowed: false }), durationMin: val } } };
                                                updateConfig(updated);
                                              }}
                                              className="w-14 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400">хв</span>
                                          </label>
                                          <label className="flex items-center gap-1 text-gray-500 cursor-pointer select-none">
                                            <input type="checkbox"
                                              checked={dirData?.passengerPickupAllowed ?? false}
                                              onChange={e => {
                                                const updated = { ...cfg, pullIn: { ...cfg.pullIn, [dir]: { ...(dirData || { targetStationId: dirInfo.lastStopId, distanceKm: 0, durationMin: 0 }), passengerPickupAllowed: e.target.checked } } };
                                                updateConfig(updated);
                                              }}
                                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            З пасажирами
                                          </label>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Assign depot button */}
                        <button
                          onClick={() => {
                            const tramDepots = MOCK_DEPOTS.filter(d => d.type === 'tram');
                            const assignedDepotIds = configs.map(c => c.depotId);
                            const availableDepots = tramDepots.filter(d => !assignedDepotIds.includes(d.id));
                            if (availableDepots.length === 0) {
                              alert('Усі трамвайні депо вже призначені для цього маршруту.');
                              return;
                            }
                            const depot = availableDepots[0];
                            const dir0 = route.directions['0'];
                            const dir1 = route.directions['1'];
                            addConfig({
                              id: `cfg_${Date.now()}`,
                              routeId: route.id,
                              depotId: depot.id,
                              pullOut: {
                                ...(dir0 ? { dir0: { targetStationId: dir0.firstStopId, distanceKm: 0, durationMin: 0, passengerPickupAllowed: false } } : {}),
                                ...(dir1 ? { dir1: { targetStationId: dir1.firstStopId, distanceKm: 0, durationMin: 0, passengerPickupAllowed: false } } : {}),
                              },
                              pullIn: {
                                ...(dir0 ? { dir0: { targetStationId: dir0.lastStopId, distanceKm: 0, durationMin: 0, passengerPickupAllowed: false } } : {}),
                                ...(dir1 ? { dir1: { targetStationId: dir1.lastStopId, distanceKm: 0, durationMin: 0, passengerPickupAllowed: false } } : {}),
                              },
                            });
                          }}
                          className="w-full flex items-center justify-center space-x-2 text-xs font-bold text-indigo-600 border-2 border-dashed border-indigo-300 rounded-lg p-2 hover:bg-indigo-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Призначити депо</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* --- Trolleybus routes --- */}
            <div className="space-y-1 mt-4">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Тролейбусні маршрути</h5>
              {logicalRoutes.filter(r => r.type === 'trolleybus').map(route => {
                const configs = routeDepotConfigs.filter(c => c.routeId === route.id);
                const isExpanded = expandedDepotRouteId === route.id;
                const hasConfig = configs.length > 0;

                return (
                  <div key={route.id} className={`border rounded-lg overflow-hidden ${hasConfig ? 'border-gray-300 bg-white' : 'border-dashed border-gray-300 bg-gray-50'}`}>
                    <button
                      onClick={() => setExpandedDepotRouteId(isExpanded ? null : route.id)}
                      className="w-full flex items-center justify-between p-2.5 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <RouteIcon className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-gray-900 text-sm">Тб {route.short_name}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[300px]">{route.long_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasConfig ? (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                            ✓ Депо призначено ({configs.length})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                            ⚠ Потрібно налаштувати
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t border-gray-200 space-y-3 bg-white">
                        {configs.map(cfg => {
                          const depot = MOCK_DEPOTS.find(d => d.id === cfg.depotId);
                          return (
                            <div key={cfg.id} className="border border-indigo-100 rounded-lg bg-indigo-50/30 p-3 relative">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="font-bold text-sm text-indigo-900 flex items-center">
                                  <Bus className="w-4 h-4 mr-2" />
                                  {depot?.name || cfg.depotId}
                                </h5>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Видалити зв'язок маршруту Тб ${route.short_name} з депо "${depot?.name}"?`)) {
                                      deleteRouteDepotConfig(cfg.id);
                                    }
                                  }}
                                  className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                  title="Видалити зв'язок"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {/* Pull-out */}
                                <div className="space-y-2">
                                  <h6 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">▶ Виїзди з депо (Pull-out)</h6>
                                  {(['dir0', 'dir1'] as const).map(dir => {
                                    const dirData = cfg.pullOut?.[dir];
                                    const dirInfo = route.directions[dir === 'dir0' ? '0' : '1'];
                                    if (!dirInfo) return null;
                                    return (
                                      <div key={dir} className="bg-white p-2 rounded border border-gray-200 text-xs space-y-1.5">
                                        <span className="font-bold text-gray-700 block">
                                          Напр. {dir === 'dir0' ? '1' : '2'} → {dirInfo.firstStopName}
                                        </span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <label className="flex items-center gap-1 text-gray-500">
                                            Відст:
                                            <input type="number" step="0.1" min="0"
                                              value={dirData?.distanceKm ?? 0}
                                              onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = { ...cfg, pullOut: { ...cfg.pullOut, [dir]: { ...(dirData || { targetStationId: dirInfo.firstStopId, durationMin: 0, passengerPickupAllowed: false }), distanceKm: val } } };
                                                updateConfig(updated);
                                              }}
                                              className="w-16 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400">км</span>
                                          </label>
                                          <label className="flex items-center gap-1 text-gray-500">
                                            Час:
                                            <input type="number" step="1" min="0"
                                              value={dirData?.durationMin ?? 0}
                                              onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                const updated = { ...cfg, pullOut: { ...cfg.pullOut, [dir]: { ...(dirData || { targetStationId: dirInfo.firstStopId, distanceKm: 0, passengerPickupAllowed: false }), durationMin: val } } };
                                                updateConfig(updated);
                                              }}
                                              className="w-14 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400">хв</span>
                                          </label>
                                          <label className="flex items-center gap-1 text-gray-500 cursor-pointer select-none">
                                            <input type="checkbox"
                                              checked={dirData?.passengerPickupAllowed ?? false}
                                              onChange={e => {
                                                const updated = { ...cfg, pullOut: { ...cfg.pullOut, [dir]: { ...(dirData || { targetStationId: dirInfo.firstStopId, distanceKm: 0, durationMin: 0 }), passengerPickupAllowed: e.target.checked } } };
                                                updateConfig(updated);
                                              }}
                                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            З пасажирами
                                          </label>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                {/* Pull-in */}
                                <div className="space-y-2">
                                  <h6 className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">◀ Заїзди в депо (Pull-in)</h6>
                                  {(['dir0', 'dir1'] as const).map(dir => {
                                    const dirData = cfg.pullIn?.[dir];
                                    const dirInfo = route.directions[dir === 'dir0' ? '0' : '1'];
                                    if (!dirInfo) return null;
                                    return (
                                      <div key={dir} className="bg-white p-2 rounded border border-gray-200 text-xs space-y-1.5">
                                        <span className="font-bold text-gray-700 block">
                                          Напр. {dir === 'dir0' ? '1' : '2'} ← {dirInfo.lastStopName}
                                        </span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <label className="flex items-center gap-1 text-gray-500">
                                            Відст:
                                            <input type="number" step="0.1" min="0"
                                              value={dirData?.distanceKm ?? 0}
                                              onChange={e => {
                                                const val = parseFloat(e.target.value) || 0;
                                                const updated = { ...cfg, pullIn: { ...cfg.pullIn, [dir]: { ...(dirData || { targetStationId: dirInfo.lastStopId, durationMin: 0, passengerPickupAllowed: false }), distanceKm: val } } };
                                                updateConfig(updated);
                                              }}
                                              className="w-16 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400">км</span>
                                          </label>
                                          <label className="flex items-center gap-1 text-gray-500">
                                            Час:
                                            <input type="number" step="1" min="0"
                                              value={dirData?.durationMin ?? 0}
                                              onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                const updated = { ...cfg, pullIn: { ...cfg.pullIn, [dir]: { ...(dirData || { targetStationId: dirInfo.lastStopId, distanceKm: 0, passengerPickupAllowed: false }), durationMin: val } } };
                                                updateConfig(updated);
                                              }}
                                              className="w-14 text-center font-bold border border-gray-300 rounded px-1 py-0.5 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                                            />
                                            <span className="text-gray-400">хв</span>
                                          </label>
                                          <label className="flex items-center gap-1 text-gray-500 cursor-pointer select-none">
                                            <input type="checkbox"
                                              checked={dirData?.passengerPickupAllowed ?? false}
                                              onChange={e => {
                                                const updated = { ...cfg, pullIn: { ...cfg.pullIn, [dir]: { ...(dirData || { targetStationId: dirInfo.lastStopId, distanceKm: 0, durationMin: 0 }), passengerPickupAllowed: e.target.checked } } };
                                                updateConfig(updated);
                                              }}
                                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            З пасажирами
                                          </label>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Assign depot button */}
                        <button
                          onClick={() => {
                            const trolleyDepots = MOCK_DEPOTS.filter(d => d.type === 'trolleybus');
                            const assignedDepotIds = configs.map(c => c.depotId);
                            const availableDepots = trolleyDepots.filter(d => !assignedDepotIds.includes(d.id));
                            if (availableDepots.length === 0) {
                              alert('Усі тролейбусні депо вже призначені для цього маршруту.');
                              return;
                            }
                            const depot = availableDepots[0];
                            const dir0 = route.directions['0'];
                            const dir1 = route.directions['1'];
                            addConfig({
                              id: `cfg_${Date.now()}`,
                              routeId: route.id,
                              depotId: depot.id,
                              pullOut: {
                                ...(dir0 ? { dir0: { targetStationId: dir0.firstStopId, distanceKm: 0, durationMin: 0, passengerPickupAllowed: false } } : {}),
                                ...(dir1 ? { dir1: { targetStationId: dir1.firstStopId, distanceKm: 0, durationMin: 0, passengerPickupAllowed: false } } : {}),
                              },
                              pullIn: {
                                ...(dir0 ? { dir0: { targetStationId: dir0.lastStopId, distanceKm: 0, durationMin: 0, passengerPickupAllowed: false } } : {}),
                                ...(dir1 ? { dir1: { targetStationId: dir1.lastStopId, distanceKm: 0, durationMin: 0, passengerPickupAllowed: false } } : {}),
                              },
                            });
                          }}
                          className="w-full flex items-center justify-center space-x-2 text-xs font-bold text-indigo-600 border-2 border-dashed border-indigo-300 rounded-lg p-2 hover:bg-indigo-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Призначити депо</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Driver Break Database */}
      {activeSubTab === 'breaks' && (
        <div className="space-y-4">
          <h3 className="text-gray-900 font-bold text-base">
            База даних місць відпочинку та обіду водіїв (Driver Break Database)
          </h3>
          <p className="text-xs text-gray-600">
            Реєстр дозволених локацій для організації обідніх перерв (виключно ДП, Старосінна площа або протилежні кінцеві станції)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_DRIVER_BREAK_LOCATIONS.map((loc) => (
              <div
                key={loc.id}
                className="bg-white border-2 border-gray-900 rounded-xl p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-center space-x-2">
                  <Coffee className="w-5 h-5 text-amber-600" />
                  <h4 className="text-gray-900 font-bold text-sm">{loc.name}</h4>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-2.5 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-gray-600">Максимальна місткість ТЗ:</span>
                    <strong className="text-amber-900 font-bold">{loc.maxCapacityVehicles} вагони</strong>
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Обслуговує маршрути: <span className="text-indigo-700 font-bold">{loc.routeIds.join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <RouteFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialRoute={editingRoute}
      />

      <JsonImportModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        onImport={importRoutesJson}
      />

      {isHubModalOpen && (
        <GlobalHubFormModal
          hub={editingHub}
          existingHubIds={controlPoints.map(c => c.id)}
          onSave={(hub) => {
            if (editingHub) {
              updateControlPoint(hub);
            } else {
              addControlPoint(hub);
            }
            setIsHubModalOpen(false);
          }}
          onClose={() => setIsHubModalOpen(false)}
        />
      )}
    </div>
  );
};
