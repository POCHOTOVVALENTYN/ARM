import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Radio, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  Zap, 
  Bus, 
  TrendingDown, 
  TrendingUp, 
  Pause, 
  Play, 
  Wrench, 
  Building2, 
  PhoneCall,
  X,
  Info
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';
import { ShortTurnModal } from '../modals/ShortTurnModal';
import { VehiclePacingModal } from '../modals/VehiclePacingModal';
import { RouteEmergencyActionModal } from '../modals/RouteEmergencyActionModal';
import { VehicleInspectorModal } from '../modals/VehicleInspectorModal';
import { VehicleActionDropdown, VehicleActionItem } from '../dispatcher/VehicleActionDropdown';
import { useTelemetryStore } from '../../store/useTelemetryStore';
import { resolveVehicleStops } from '../dispatcher/TelemetryMarkers';

export interface VehicleTelemetryRow {
  vehicle_id: string;
  display_name?: string;
  route_id: string;
  route_number?: string;
  duty_number?: number;
  driver_name?: string;
  service_department?: string;
  service_task?: string;
  depot_name?: string;
  depot_status?: string;
  vehicle_type?: string;
  model?: string;
  is_service?: boolean;
  is_accessible?: boolean;
  has_wifi?: boolean;
  has_aircond?: boolean;
  lat: number;
  lng?: number;
  lon?: number;
  speed: number;
  heading?: number;
  current_station?: string;
  next_station?: string;
  deviation_min: number;
  status: string;
  has_active_detour?: boolean;
  active_detour_loop?: string;
  last_updated?: number;
}

export interface RouteItem {
  id: string;
  number?: string;
  name?: string;
  type?: string;
  color?: string;
  length_km?: number;
  round_trip_min?: number;
  standard_break_min?: number;
  designated_break_hub?: string;
  t_dir0_min?: number;
  t_dir1_min?: number;
  layover_min?: number;
}

export interface StationItem {
  id?: string;
  name: string;
  lat?: number;
  lng?: number;
}

export interface ActiveDetourItem {
  id: number;
  vehicle_id: string;
  route_id: string;
  reason: string;
  target_loop?: string;
  new_path_description: string;
  started_at?: string;
}

type ModeFilterType = 'ALL_PASSENGER' | 'TRAM' | 'TROLLEYBUS' | 'SERVICE' | 'DEPOT';

export const DispatcherLiveView: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Фільтри та стан навігації
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<ModeFilterType>('ALL_PASSENGER');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_SCHEDULE' | 'MINOR_DELAY' | 'CRITICAL_DELAY'>('ALL');
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('uk-UA'));

  // Модальні вікна
  const [isShortTurnOpen, setIsShortTurnOpen] = useState(false);
  const [isPacingOpen, setIsPacingOpen] = useState(false);
  const [isRouteEmergencyOpen, setIsRouteEmergencyOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectedVehicle, setInspectedVehicle] = useState<VehicleTelemetryRow | null>(null);
  const [selectedVehicleForAction, setSelectedVehicleForAction] = useState<VehicleActionItem | null>(null);

  const handleOpenInspector = (v: VehicleTelemetryRow) => {
    setInspectedVehicle(v);
    setIsInspectorOpen(true);
  };

  // 1. Отримання повного довідника маршрутів з бекенду (23 офіційні лінії КП ОМЕТ)
  const { data: routes = [] } = useQuery<RouteItem[]>({
    queryKey: ['routes-directory'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/routes');
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60000
  });

  // 2. Отримання координат зупинок для географічного розрахунку пройденої/наступної станції
  const { data: stations = [] } = useQuery<StationItem[]>({
    queryKey: ['stations-directory'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/stations');
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 60000
  });

  // 3. Безшовне фонове отримання телеметрії (кожні 4 сек)
  const { data: telemetryList = [], refetch } = useQuery<VehicleTelemetryRow[]>({
    queryKey: ['telemetry-live-matrix'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/telemetry/live');
      const raw = Array.isArray(res.data) ? res.data : [];
      setLastSyncTime(new Date().toLocaleTimeString('uk-UA'));
      
      // Синхронізація з глобальним сховищем для карти
      if (raw.length > 0) {
        useTelemetryStore.getState().updateVehicles(raw as any);
      }
      return raw as VehicleTelemetryRow[];
    },
    refetchInterval: isAutoRefresh ? 4000 : false,
    placeholderData: (prev) => prev
  });

  // 4. Отримання активних оперативних розворотів
  const { data: activeDetours = [] } = useQuery<ActiveDetourItem[]>({
    queryKey: ['active-detours'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/emergencies/detours/active');
      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: isAutoRefresh ? 4000 : false
  });

  // Деактивація розвороту
  const deactivateMutation = useMutation({
    mutationFn: async (detourId: number) => {
      const res = await apiClient.post(`/v1/emergencies/detours/${detourId}/deactivate`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Транспорт повернуто на плановий маршрут!');
      queryClient.invalidateQueries({ queryKey: ['active-detours'] });
      refetch();
    }
  });

  // Ручне оновлення
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsManualRefreshing(false);
      toast.success('Телеметрію оновлено');
    }, 250);
  };

  // Активний обраний маршрут з урахуванням типу
  const activeRouteObj = useMemo(() => {
    if (selectedRouteId === 'ALL') return null;
    const cleanSel = selectedRouteId.replace(/^(t|tr)/i, '').toLowerCase();
    return routes.find(r => {
      const rType = (r.type || 'TRAM').toUpperCase();
      const matchNum = String(r.number || r.id).toLowerCase() === cleanSel || r.id === selectedRouteId;
      if (!matchNum) return false;
      if (modeFilter === 'TRAM') return rType === 'TRAM';
      if (modeFilter === 'TROLLEYBUS') return rType === 'TROLLEYBUS';
      return true;
    }) || null;
  }, [routes, selectedRouteId, modeFilter]);

  // Фільтрація списку маршрутів у кнопках швидкого вибору
  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      const rType = (r.type || 'TRAM').toUpperCase();
      if (modeFilter === 'TRAM' && rType !== 'TRAM') return false;
      if (modeFilter === 'TROLLEYBUS' && rType !== 'TROLLEYBUS') return false;
      return true;
    }).sort((a, b) => {
      const numA = parseInt(String(a.number || a.id).replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.number || b.id).replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [routes, modeFilter]);

  // Повний випуск на лінії для вибраного маршруту (незалежно від фільтра запізнень)
  const routeVehiclesTotal = useMemo(() => {
    if (!activeRouteObj) return [];
    const targetNum = String(activeRouteObj.number || activeRouteObj.id).replace(/^(t|tr)/i, '').toLowerCase();
    const targetType = (activeRouteObj.type || 'TRAM').toUpperCase();
    return telemetryList.filter(v => {
      const isMatch = String(v.route_number || v.route_id || '').replace(/^(t|tr)/i, '').toLowerCase() === targetNum;
      const isTypeMatch = (v.vehicle_type || 'TRAM').toUpperCase() === targetType;
      const notDepot = v.status !== 'IN_DEPOT' && v.route_id !== 'DEPOT';
      const notServ = !v.is_service && v.route_id !== 'SERVICE' && v.vehicle_type !== 'SERVICE';
      return isMatch && isTypeMatch && notDepot && notServ;
    });
  }, [activeRouteObj, telemetryList]);

  // Розрахунковий інтервал на основі реального випуску
  const calculatedIntervalMin = useMemo(() => {
    if (!activeRouteObj || routeVehiclesTotal.length === 0) return null;
    const roundTrip = activeRouteObj.round_trip_min || 70;
    return Math.max(2, Math.round((roundTrip / routeVehiclesTotal.length) * 10) / 10);
  }, [activeRouteObj, routeVehiclesTotal]);

  // Динамічний підрахунок кількості ТЗ за кожною категорією
  const counts = useMemo(() => {
    let passenger = 0;
    let trams = 0;
    let trols = 0;
    let service = 0;
    let depot = 0;
    let onTime = 0;
    let minor = 0;
    let critical = 0;

    telemetryList.forEach(v => {
      const inDep = v.status === 'IN_DEPOT' || v.route_id === 'DEPOT';
      const isServ = v.is_service || v.route_id === 'SERVICE' || v.vehicle_type === 'SERVICE';
      const vType = (v.vehicle_type || 'TRAM').toUpperCase();

      if (inDep) {
        depot += 1;
        return;
      }
      if (isServ) {
        service += 1;
        return;
      }

      passenger += 1;
      if (vType === 'TRAM') trams += 1;
      if (vType === 'TROLLEYBUS') trols += 1;

      const dev = Math.abs(v.deviation_min || 0);
      if (dev <= 2.0) onTime += 1;
      else if (dev <= 5.0) minor += 1;
      else critical += 1;
    });

    const compliance = passenger > 0 ? Math.round((onTime / passenger) * 100) : 100;

    return {
      passenger,
      trams,
      trols,
      service,
      depot,
      onTime,
      minor,
      critical,
      compliance
    };
  }, [telemetryList]);

  // Фільтровані вагони для таблиці-матриці
  const filteredVehicles = useMemo(() => {
    return telemetryList.filter(v => {
      const inDepot = v.status === 'IN_DEPOT' || v.route_id === 'DEPOT';
      const isService = v.is_service || v.route_id === 'SERVICE' || v.vehicle_type === 'SERVICE';
      const vType = (v.vehicle_type || 'TRAM').toUpperCase();

      // 1. Фільтр за категорією транспорту
      if (modeFilter === 'DEPOT') {
        if (!inDepot) return false;
      } else if (modeFilter === 'SERVICE') {
        if (!isService) return false;
      } else {
        // Пасажирські режими (на лінії)
        if (inDepot || isService) return false;

        if (modeFilter === 'TRAM' && vType !== 'TRAM') return false;
        if (modeFilter === 'TROLLEYBUS' && vType !== 'TROLLEYBUS') return false;

        // Фільтр за номером маршруту
        if (selectedRouteId !== 'ALL') {
          const targetClean = selectedRouteId.replace(/^(t|tr)/i, '').toLowerCase();
          const rIdClean = String(v.route_id || '').replace(/^(t|tr)/i, '').toLowerCase();
          const rNumClean = String(v.route_number || '').replace(/^(t|tr)/i, '').toLowerCase();
          if (rIdClean !== targetClean && rNumClean !== targetClean) {
            return false;
          }
        }
      }

      // 2. Пошуковий запит
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = String(v.vehicle_id || '').toLowerCase().includes(query);
        const matchDriver = (v.driver_name || '').toLowerCase().includes(query);
        const matchDept = (v.service_department || '').toLowerCase().includes(query);
        if (!matchId && !matchDriver && !matchDept) return false;
      }

      // 3. Фільтр за графіковістю (тільки для пасажирського транспорту)
      if (modeFilter !== 'SERVICE' && modeFilter !== 'DEPOT' && statusFilter !== 'ALL') {
        const dev = Math.abs(v.deviation_min || 0);
        if (statusFilter === 'IN_SCHEDULE' && dev > 2.0) return false;
        if (statusFilter === 'MINOR_DELAY' && (dev <= 2.0 || dev > 5.0)) return false;
        if (statusFilter === 'CRITICAL_DELAY' && dev <= 5.0) return false;
      }

      return true;
    });
  }, [telemetryList, modeFilter, selectedRouteId, searchQuery, statusFilter]);

  // Обробники дій
  const handleOpenShortTurn = (v: VehicleActionItem) => {
    setSelectedVehicleForAction(v);
    setIsShortTurnOpen(true);
  };

  const handleOpenPacing = (v: VehicleActionItem) => {
    setSelectedVehicleForAction(v);
    setIsPacingOpen(true);
  };

  const handleOpenDetour = (v: VehicleActionItem) => {
    setSelectedVehicleForAction(v);
    setIsShortTurnOpen(true);
  };

  const handlePullIn = (v: VehicleActionItem) => {
    toast.info(`Наказ на заїзд у депо передано на борт №${v.vehicle_id}`);
  };

  const handleSendMessage = (v: VehicleActionItem) => {
    toast.info(`Диспетчерський радіозв'язок з бортом №${v.vehicle_id} встановлено`);
  };

  const handleDeployReserve = (vehicleId: string) => {
    toast.success(`Борт №${vehicleId} оперативно випущено на лінію як резерв/підміна (Car Swap)!`);
  };

  const handleDispatchServiceCall = (vehicleId: string, department: string) => {
    toast.warning(`🚨 Екіпаж спецтехніки ${vehicleId} (${department}) направлено на термінову ліквідацію аварії!`);
  };

  const handleSelectRoute = (rNum: string) => {
    setSelectedRouteId(rNum);
    setStatusFilter('ALL'); // Скидаємо під-фільтр затримок для показу повного випуску на маршруті
  };

  return (
    <div className="w-full space-y-5 font-sans">
      {/* 1. Верхня панель моніторингу та лічильники KPI */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white font-mono font-black text-[10px] tracking-wider uppercase flex items-center space-x-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>LIVE CAD/AVL</span>
              </span>
              <h1 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span>Диспетчерський пульт оперативної обстановки КП «ОМЕТ»</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Моніторинг випуску міського електротранспорту Одеси (трамваї, тролейбуси, аварійні служби) у реальному часі за GPS-телеметрією
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Непомітний спокійний індикатор часу синхронізації */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-mono">Синхронізовано: <span className="font-bold text-slate-800 dark:text-slate-100">{lastSyncTime}</span></span>
            </div>

            {/* Автооновлення */}
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                isAutoRefresh
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              title={isAutoRefresh ? 'Автооновлення кожні 4с' : 'Автооновлення на паузі'}
            >
              {isAutoRefresh ? <Pause className="w-3.5 h-3.5 text-emerald-600" /> : <Play className="w-3.5 h-3.5 text-slate-600" />}
              <span>{isAutoRefresh ? 'Авто 4с' : 'Пауза'}</span>
            </button>

            {/* Ручне оновлення */}
            <button
              onClick={handleManualRefresh}
              disabled={isManualRefreshing}
              className="bg-white dark:bg-slate-800 hover:bg-blue-50/80 text-slate-700 hover:text-blue-700 dark:text-slate-200 border border-slate-200 hover:border-blue-400 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isManualRefreshing ? 'animate-spin' : ''}`} />
              <span>Оновити</span>
            </button>

            {/* Кнопка групових дій по вибраному маршруту */}
            {selectedRouteId !== 'ALL' && modeFilter !== 'SERVICE' && modeFilter !== 'DEPOT' && (
              <button
                onClick={() => setIsRouteEmergencyOpen(true)}
                className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-red-600/20 flex items-center space-x-2 cursor-pointer transition-all active:scale-95"
              >
                <ShieldAlert className="w-4 h-4 text-white" />
                <span>🚨 Заходи по лінії №{selectedRouteId}</span>
              </button>
            )}
          </div>
        </div>

        {/* Динамічні лічильники KPI графіковості */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-sans">
          <div 
            onClick={() => { setModeFilter('ALL_PASSENGER'); setSelectedRouteId('ALL'); setStatusFilter('ALL'); }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
              modeFilter === 'ALL_PASSENGER' && selectedRouteId === 'ALL' && statusFilter === 'ALL'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 ring-2 ring-blue-400/20'
                : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Випуск на лінії</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{counts.passenger} ТЗ</span>
            </div>
            <Bus className="w-6 h-6 text-blue-600 opacity-80" />
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === 'IN_SCHEDULE' ? 'ALL' : 'IN_SCHEDULE')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
              statusFilter === 'IN_SCHEDULE'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/50'
            }`}
          >
            <div>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">В графіку (|Δt| ≤ 2хв)</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">{counts.onTime}</span>
                <span className="text-[10px] font-bold text-emerald-600">({counts.compliance}%)</span>
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-600 opacity-80" />
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === 'MINOR_DELAY' ? 'ALL' : 'MINOR_DELAY')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
              statusFilter === 'MINOR_DELAY'
                ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:bg-amber-100/50'
            }`}
          >
            <div>
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block">Незначне (2-5хв)</span>
              <span className="text-2xl font-black text-amber-800 dark:text-amber-300 font-mono">{counts.minor} ТЗ</span>
            </div>
            <Clock className="w-6 h-6 text-amber-600 opacity-80" />
          </div>

          <div 
            onClick={() => setStatusFilter(statusFilter === 'CRITICAL_DELAY' ? 'ALL' : 'CRITICAL_DELAY')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
              statusFilter === 'CRITICAL_DELAY'
                ? 'bg-red-100 dark:bg-red-950/60 border-red-500 ring-2 ring-red-500/20'
                : 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:bg-red-100/50'
            }`}
          >
            <div>
              <span className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider block">Критичні (&gt;5хв)</span>
              <span className="text-2xl font-black text-red-800 dark:text-red-300 font-mono">{counts.critical} ТЗ</span>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600 opacity-80" />
          </div>

          <div 
            onClick={() => { setModeFilter('SERVICE'); setSelectedRouteId('ALL'); setStatusFilter('ALL'); }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
              modeFilter === 'SERVICE'
                ? 'bg-purple-100 dark:bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/20'
                : 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100/50'
            }`}
          >
            <div>
              <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider block">Спецтехніка / Служби</span>
              <span className="text-2xl font-black text-purple-800 dark:text-purple-300 font-mono">{counts.service} ТЗ</span>
            </div>
            <Wrench className="w-6 h-6 text-purple-600 opacity-80" />
          </div>
        </div>

        {/* Активний чіп фільтрації якщо увімкнено відбір за затримкою */}
        {statusFilter !== 'ALL' && (
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-fit">
            <span className="text-slate-500 font-medium">Активний фільтр затримки:</span>
            <span className={`font-black px-2 py-0.5 rounded-md ${
              statusFilter === 'IN_SCHEDULE' ? 'bg-emerald-100 text-emerald-800' :
              statusFilter === 'MINOR_DELAY' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
            }`}>
              {statusFilter === 'IN_SCHEDULE' ? 'В графіку (|Δt| ≤ 2хв)' :
               statusFilter === 'MINOR_DELAY' ? 'Незначне (2-5хв)' : 'Критичні (>5хв)'}
            </span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 cursor-pointer ml-1"
              title="Скинути фільтр затримки"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Селектор режимів та категорій транспорту */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* 5 режимів фільтрації */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => { setModeFilter('ALL_PASSENGER'); setSelectedRouteId('ALL'); setStatusFilter('ALL'); }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  modeFilter === 'ALL_PASSENGER'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                🌐 Всі пасажирські ({counts.passenger})
              </button>
              <button
                onClick={() => { setModeFilter('TRAM'); setSelectedRouteId('ALL'); setStatusFilter('ALL'); }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                  modeFilter === 'TRAM'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>🚊 Трамваї ({counts.trams})</span>
              </button>
              <button
                onClick={() => { setModeFilter('TROLLEYBUS'); setSelectedRouteId('ALL'); setStatusFilter('ALL'); }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                  modeFilter === 'TROLLEYBUS'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>🚎 Тролейбуси ({counts.trols})</span>
              </button>
              <button
                onClick={() => { setModeFilter('SERVICE'); setSelectedRouteId('ALL'); setStatusFilter('ALL'); }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                  modeFilter === 'SERVICE'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>🛠️ Спецтехніка ({counts.service})</span>
              </button>
              <button
                onClick={() => { setModeFilter('DEPOT'); setSelectedRouteId('ALL'); setStatusFilter('ALL'); }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1 ${
                  modeFilter === 'DEPOT'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>🏢 У депо ({counts.depot})</span>
              </button>
            </div>

            {/* Пошуковий рядок */}
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Пошук за бортовим номером, нарядом, службою..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Плашки швидкого вибору номерів маршрутів */}
          {(modeFilter === 'ALL_PASSENGER' || modeFilter === 'TRAM' || modeFilter === 'TROLLEYBUS') && (
            <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto p-1.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <button
                onClick={() => handleSelectRoute('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                  selectedRouteId === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-blue-50'
                }`}
              >
                Всі лінії
              </button>

              {filteredRoutes.map((route) => {
                const rNum = String(route.number || route.id);
                const isSelected = selectedRouteId === rNum || selectedRouteId === route.id;
                const isTram = (route.type || 'TRAM').toUpperCase() === 'TRAM';

                return (
                  <button
                    key={route.id}
                    onClick={() => handleSelectRoute(rNum)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer flex items-center space-x-1 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs scale-105 ring-2 ring-blue-400/30'
                        : isTram
                        ? 'bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-50'
                        : 'bg-white dark:bg-slate-800 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
                    }`}
                    title={`${isTram ? 'Трамвай' : 'Тролейбус'} №${rNum}: ${route.name}`}
                  >
                    <span>{isTram ? '🚊' : '🚎'} №{rNum}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Інформаційна плашка вибраного маршруту з інженерними показниками */}
        {activeRouteObj && modeFilter !== 'SERVICE' && modeFilter !== 'DEPOT' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-mono font-black text-xs">
                  {activeRouteObj.type === 'TROLLEYBUS' ? 'Тролейбус' : 'Трамвай'} №{activeRouteObj.number || activeRouteObj.id}
                </span>
                <span className="font-black text-slate-900 dark:text-white text-sm">
                  {activeRouteObj.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Протяжність: <span className="font-bold text-slate-700 dark:text-slate-300">{activeRouteObj.length_km} км</span> • Час повного обороту: <span className="font-bold text-slate-700 dark:text-slate-300">{activeRouteObj.round_trip_min} хв</span> • Нормативний обід: <span className="font-bold text-slate-700 dark:text-slate-300">{activeRouteObj.standard_break_min} хв</span> ({activeRouteObj.designated_break_hub})
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {calculatedIntervalMin && (
                <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs">
                  <span className="text-[10px] text-slate-500 uppercase font-black block">Розрахунковий інтервал</span>
                  <span className="font-mono font-black text-blue-700 dark:text-blue-300 text-sm">
                    ~{calculatedIntervalMin} хв
                  </span>
                </div>
              )}
              <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs">
                <span className="text-[10px] text-slate-500 uppercase font-black block">Випуск на лінії</span>
                <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                  {routeVehiclesTotal.length} ТЗ
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Сповіщення про активні оперативні розвороти */}
      {activeDetours.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-800/60 pb-2">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-amber-600 animate-spin" />
              <h3 className="text-sm font-black text-amber-900 dark:text-amber-300">
                Активні оперативні розвороти та скорочення ({activeDetours.length}):
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {activeDetours.map(detour => (
              <div
                key={detour.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-amber-300 dark:border-amber-800/80 shadow-2xs flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 font-black text-slate-900 dark:text-white">
                    <span>Вг-{detour.vehicle_id} (Маршрут №{detour.route_id})</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                      Кільце: {detour.target_loop || 'Лузанівка'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {detour.new_path_description}
                  </p>
                </div>
                <button
                  onClick={() => deactivateMutation.mutate(detour.id)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shrink-0 ml-3 cursor-pointer shadow-2xs transition-all"
                >
                  Зняти розворот
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Повноекранна уніфікована таблиця-матриця під кожен тип транспорту */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            {modeFilter === 'SERVICE' ? (
              <>
                <Wrench className="w-5 h-5 text-purple-600" />
                <span>Оперативна дислокація аварійно-відновлювальної спецтехніки</span>
              </>
            ) : modeFilter === 'DEPOT' ? (
              <>
                <Building2 className="w-5 h-5 text-slate-600" />
                <span>Резервний парк та рухомий склад на території депо</span>
              </>
            ) : (
              <>
                <Radio className="w-5 h-5 text-blue-600" />
                <span>Матриця випуску та відхилення за GPS-телеметрією</span>
              </>
            )}
          </h3>
          <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            Відображено: {filteredVehicles.length} одиниць
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          {/* РЕЖИМ 1: СПЕЦТЕХНІКА ТА АВАРІЙНІ СЛУЖБИ (ГАЗ, КАМАЗ, АВ-102, Ревізор, Снігоочисники) */}
          {modeFilter === 'SERVICE' ? (
            <table className="w-full min-w-full text-left text-xs font-sans border-collapse table-fixed">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Спецборт / Одиниця</th>
                  <th className="p-3">Служба / Підрозділ</th>
                  <th className="p-3">Екіпаж / Бригадир</th>
                  <th className="p-3">Поточна локація</th>
                  <th className="p-3">Швидкість</th>
                  <th className="p-3 text-right">Оперативна дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      Спецтехніки за обраними фільтрами не знайдено.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(v => {
                    const { passedStop } = resolveVehicleStops(v.lat, v.lng || 0, v.heading || 0, v.speed, stations as any);
                    return (
                      <tr key={v.vehicle_id} className="hover:bg-purple-50/40 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                          <button
                            onClick={() => handleOpenInspector(v)}
                            className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs inline-flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
                            title="Діагностика спецборта"
                          >
                            <span>🛠️ {v.vehicle_id}</span>
                            <Info className="w-3 h-3 text-purple-600 opacity-80" />
                          </button>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {v.service_department || 'Служба енергогосподарства (КМ)'}
                        </td>
                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                          {v.driver_name || 'Чергова аварійна бригада'}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          <div className="flex items-center space-x-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="truncate">{passedStop || 'м. Одеса'}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {v.speed} км/г
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDispatchServiceCall(v.vehicle_id, v.service_department || 'Служба КМ')}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] cursor-pointer shadow-2xs transition-all inline-flex items-center space-x-1"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Направити на аварію</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : modeFilter === 'DEPOT' ? (
            /* РЕЖИМ 2: У ДЕПО ТА РЕЗЕРВНИЙ ПАРК */
            <table className="w-full min-w-full text-left text-xs font-sans border-collapse table-fixed">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Борт (Тип)</th>
                  <th className="p-3">Депо базування</th>
                  <th className="p-3">Статус рухомого складу</th>
                  <th className="p-3">Відповідальний</th>
                  <th className="p-3 text-right">Оперативна дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                      Бортів у депо за обраними фільтрами не знайдено.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(v => (
                    <tr key={`${v.vehicle_type}-${v.vehicle_id}`} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                        <button
                          onClick={() => handleOpenInspector(v)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs inline-flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
                          title="Діагностика резервного борта"
                        >
                          <span>{v.vehicle_type === 'TROLLEYBUS' ? '🚎 Тролейбус' : '🚊 Трамвай'} №{v.vehicle_id}</span>
                          <Info className="w-3 h-3 text-blue-500 opacity-70" />
                        </button>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        🏢 {v.depot_name || (v.vehicle_type === 'TROLLEYBUS' ? 'Тролейбусне депо №1' : 'Трамвайне депо №1')}
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[11px] inline-block">
                          🟢 {v.depot_status || 'Резерв (Готовий до випуску)'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">
                        Черговий водій-перегонщик депо
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeployReserve(v.vehicle_id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] cursor-pointer shadow-2xs transition-all inline-flex items-center space-x-1"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Випустити на підміну</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* РЕЖИМ 3: ПАСАЖИРСЬКИЙ ТРАНСПОРТ НА ЛІНІЯХ (ТРАМВАЇ & ТРОЛЕЙБУСИ) */
            <table className="w-full min-w-full text-left text-xs font-sans border-collapse table-fixed">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                {selectedRouteId === 'ALL' && <col className="w-[8%]" />}
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[8%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="p-3">Борт</th>
                  <th className="p-3">Наряд</th>
                  {selectedRouteId === 'ALL' && <th className="p-3">Маршрут</th>}
                  <th className="p-3">Водій</th>
                  <th className="p-3">Пройдена зупинка</th>
                  <th className="p-3">Наступна зупинка</th>
                  <th className="p-3">Швидкість</th>
                  <th className="p-3">Відхилення (Δt)</th>
                  <th className="p-3">Стан випуску</th>
                  <th className="p-3 text-right">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={selectedRouteId === 'ALL' ? 10 : 9} className="p-8 text-center text-slate-400 font-medium">
                      Активних вагонів за обраними фільтрами не знайдено.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(v => {
                    const dev = v.deviation_min || 0;
                    const isDelay = dev > 0;
                    const lat = v.lat;
                    const lng = v.lng || v.lon || 0;
                    const heading = v.heading || 0;
                    const speed = v.speed || 0;
                    const isStanding = speed === 0;

                    // Розрахунок пройденої та наступної зупинки
                    const { passedStop, nextStop } = resolveVehicleStops(lat, lng, heading, speed, stations as any);

                    let statusBadge = (
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 font-bold text-[10px] flex items-center space-x-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>На лінії</span>
                      </span>
                    );

                    if (v.has_active_detour) {
                      statusBadge = (
                        <span className="px-2 py-1 rounded-lg bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 w-fit shadow-2xs">
                          <RotateCcw className="w-3 h-3" />
                          <span>Розворот ({v.active_detour_loop || 'Кільце'})</span>
                        </span>
                      );
                    } else if (isStanding) {
                      statusBadge = (
                        <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 font-bold text-[10px] flex items-center space-x-1 w-fit">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Стоянка</span>
                        </span>
                      );
                    }

                    const vehicleActionObj: VehicleActionItem = {
                      vehicle_id: v.vehicle_id,
                      route_id: v.route_id,
                      route_number: v.route_number || v.route_id,
                      duty_number: v.duty_number || 1,
                      driver_name: v.driver_name,
                      speed: v.speed,
                      deviation_min: v.deviation_min,
                      status: v.status
                    };

                    return (
                      <tr key={`${v.vehicle_type}-${v.vehicle_id}`} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        {/* 1. Борт (лаконічно: номер + тип + значки комфорту + кнопка інспектора) */}
                        <td className="p-3 font-mono">
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleOpenInspector(v)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-300 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-black text-xs cursor-pointer transition-all flex items-center space-x-1 shadow-2xs"
                              title="Відкрити технічну діагностику (GPS/Wialon/Коридор)"
                            >
                              <span>{v.vehicle_type === 'TROLLEYBUS' ? '🚎' : '🚊'} №{v.vehicle_id}</span>
                              <Info className="w-3 h-3 text-blue-500 opacity-70" />
                            </button>
                            <div className="flex items-center space-x-1 text-xs">
                              {v.is_accessible && <span title="Низька підлога (пандус ♿)" className="text-blue-600 font-bold">♿</span>}
                              {v.has_aircond && <span title="Кондиціонер ❄️" className="text-cyan-600 font-bold">❄️</span>}
                              {v.has_wifi && <span title="Wi-Fi 📶" className="text-indigo-600 font-bold">📶</span>}
                            </div>
                          </div>
                        </td>

                        {/* 2. Наряд */}
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                            #{v.duty_number || 1}
                          </span>
                        </td>

                        {/* 3. Маршрут (якщо в режимі Вся мережа) */}
                        {selectedRouteId === 'ALL' && (
                          <td className="p-3 font-bold text-blue-700 dark:text-blue-400 font-mono">
                            <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs">
                              {v.vehicle_type === 'TROLLEYBUS' ? '🚎' : '🚊'} №{v.route_number || v.route_id}
                            </span>
                          </td>
                        )}

                        {/* 4. Водій (без вигаданих імен, якщо не призначено — індикатор) */}
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          <div className="truncate text-xs font-medium">
                            <span className="block truncate">{v.driver_name || '—'}</span>
                          </div>
                        </td>

                        {/* 5. Пройдена зупинка */}
                        <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                          <div className="flex items-center space-x-1 text-[11px] truncate">
                            <span className="text-slate-400">⬅️</span>
                            <span className="truncate" title={passedStop}>{passedStop}</span>
                          </div>
                        </td>

                        {/* 6. Наступна зупинка */}
                        <td className="p-3 font-bold text-blue-900 dark:text-blue-300">
                          <div className="flex items-center space-x-1 text-[11px] truncate">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate" title={nextStop}>{nextStop}</span>
                          </div>
                        </td>

                        {/* 7. Швидкість */}
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span className={`px-2 py-0.5 rounded-md text-xs ${speed > 0 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {speed} км/г
                          </span>
                        </td>

                        {/* 8. Відхилення (Δt) */}
                        <td className="p-3 font-mono font-black text-xs">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl border ${
                            Math.abs(dev) <= 2.0 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800' 
                              : Math.abs(dev) <= 5.0
                              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                              : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                          }`}>
                            {isDelay ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            <span>{isDelay ? `+${dev.toFixed(1)} хв` : dev === 0 ? '0.0 хв' : `${dev.toFixed(1)} хв`}</span>
                          </span>
                        </td>

                        {/* 9. Стан випуску */}
                        <td className="p-3">
                          {statusBadge}
                        </td>

                        {/* 10. Оперативні Дії */}
                        <td className="p-3 text-right">
                          <VehicleActionDropdown
                            vehicle={vehicleActionObj}
                            onShortTurn={handleOpenShortTurn}
                            onPacing={handleOpenPacing}
                            onDetour={handleOpenDetour}
                            onPullIn={handlePullIn}
                            onSendMessage={handleSendMessage}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Модальне вікно оперативного розвороту */}
      <ShortTurnModal
        isOpen={isShortTurnOpen}
        onClose={() => setIsShortTurnOpen(false)}
        vehicleId={selectedVehicleForAction?.vehicle_id || '4001'}
        routeId={selectedVehicleForAction?.route_id || '7'}
        onSuccess={() => refetch()}
      />

      {/* Модальне вікно регулювання темпу руху (Pacing) */}
      <VehiclePacingModal
        isOpen={isPacingOpen}
        onClose={() => setIsPacingOpen(false)}
        vehicle={selectedVehicleForAction}
        onSuccess={() => refetch()}
      />

      {/* Модальне вікно групових дій по лінії */}
      <RouteEmergencyActionModal
        isOpen={isRouteEmergencyOpen}
        onClose={() => setIsRouteEmergencyOpen(false)}
        routeId={selectedRouteId !== 'ALL' ? selectedRouteId : '7'}
        routeName={activeRouteObj?.name}
        activeVehiclesCount={filteredVehicles.length}
        onSuccess={() => refetch()}
      />

      {/* Модальне вікно технічної діагностики та інспектора борта */}
      <VehicleInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        vehicle={inspectedVehicle}
        onShortTurn={handleOpenShortTurn}
        onPacing={handleOpenPacing}
      />
    </div>
  );
};

export default DispatcherLiveView;

