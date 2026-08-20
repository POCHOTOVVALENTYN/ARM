import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Radio, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldAlert, 
  Send,
  Zap,
  Bus,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';
import { ShortTurnModal } from '../modals/ShortTurnModal';
import { useTelemetryStore } from '../../store/useTelemetryStore';

interface VehicleTelemetry {
  vehicle_id: string;
  route_id: string;
  route_number?: string;
  duty_number?: number;
  driver_name?: string;
  lat: number;
  lon: number;
  speed: number;
  current_station?: string;
  next_station?: string;
  deviation_min: number; // + delay, - aheadness
  status: 'IN_SCHEDULE' | 'MINOR_DELAY' | 'CRITICAL_DELAY' | 'OFF_ROUTE';
  has_active_detour?: boolean;
  active_detour_loop?: string;
  last_update?: string;
}

interface ActiveDetourItem {
  id: number;
  vehicle_id: string;
  route_id: string;
  reason: string;
  target_loop?: string;
  new_path_description: string;
  started_at?: string;
}

export const DispatcherLiveView: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalVehicleId, setModalVehicleId] = useState<string>('4001');
  const [modalRouteId, setModalRouteId] = useState<string>('7');

  // Load telemetry data every 5s
  const { data: telemetryList = [], isLoading, refetch } = useQuery<VehicleTelemetry[]>({
    queryKey: ['telemetry-live-matrix', selectedRouteId],
    queryFn: async () => {
      const url = selectedRouteId === 'ALL' 
        ? '/v1/telemetry/vehicles' 
        : `/v1/telemetry/vehicles?route_id=${selectedRouteId}`;
      const res = await apiClient.get(url);
      const raw = Array.isArray(res.data) ? res.data : [];
      
      // Update global telemetry store for map synchronization
      if (raw.length > 0) {
        useTelemetryStore.getState().updateVehicles(raw as any);
      }

      return raw as VehicleTelemetry[];
    },
    refetchInterval: 5000
  });

  // Load active detours from backend
  const { data: activeDetours = [] } = useQuery<ActiveDetourItem[]>({
    queryKey: ['active-detours'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/emergencies/detours/active');
      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: 5000
  });

  // Deactivate detour mutation
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

  const handleOpenShortTurn = (vId: string, rId: string) => {
    setModalVehicleId(vId);
    setModalRouteId(rId);
    setIsModalOpen(true);
  };

  // Filtered vehicles
  const filteredVehicles = telemetryList.filter(v => {
    const matchesRoute = selectedRouteId === 'ALL' || str(v.route_id) === str(selectedRouteId);
    const matchesSearch = v.vehicle_id.includes(searchQuery) || (v.driver_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesRoute && matchesSearch && matchesStatus;
  });

  const inScheduleCount = telemetryList.filter(v => v.status === 'IN_SCHEDULE').length;
  const minorDelayCount = telemetryList.filter(v => v.status === 'MINOR_DELAY').length;
  const criticalDelayCount = telemetryList.filter(v => v.status === 'CRITICAL_DELAY' || v.status === 'OFF_ROUTE').length;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Live Telemetry KPI Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white font-black text-[11px] uppercase tracking-wider animate-pulse">
                LIVE GPS CAD/AVL
              </span>
              <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-600" />
                <span>Диспетчерський пульт оперативної обстановки (CAD/AVL Matrix)</span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Моніторинг випуску рухомого складу в режимі реального часу, аналіз відхилень ($\Delta t$) та видача оперативних наказів
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => refetch()}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-black text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <span>Оновити Стрім</span>
            </button>

            <button
              onClick={() => handleOpenShortTurn('4001', '7')}
              className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-red-600/20 flex items-center space-x-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Оперативний Розворот</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Усього на лінії</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{telemetryList.length} ТЗ</span>
            </div>
            <Bus className="w-7 h-7 text-indigo-600 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">В графіку (|Δt| ≤ 2m)</span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{inScheduleCount} ТЗ</span>
            </div>
            <CheckCircle2 className="w-7 h-7 text-emerald-600 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Незначне (2-5m)</span>
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">{minorDelayCount} ТЗ</span>
            </div>
            <Clock className="w-7 h-7 text-amber-600 opacity-80" />
          </div>

          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider block">Критичні / Зходи (&gt;5m)</span>
              <span className="text-2xl font-black text-red-700 dark:text-red-300 font-mono">{criticalDelayCount} ТЗ</span>
            </div>
            <ShieldAlert className="w-7 h-7 text-red-600 opacity-80" />
          </div>
        </div>

        {/* Filters Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Пошук вагона або прізвища водія..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            <select
              value={selectedRouteId}
              onChange={e => setSelectedRouteId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="ALL">Усі Маршрути</option>
              <option value="7">🚊 Трамвай №7</option>
              <option value="18">🚊 Трамвай №18</option>
              <option value="5">🚊 Трамвай №5</option>
              <option value="28">🚊 Трамвай №28</option>
              <option value="8">🚎 Тролейбус №8</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-extrabold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white dark:bg-slate-900 text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Усі
            </button>
            <button
              onClick={() => setStatusFilter('CRITICAL_DELAY')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'CRITICAL_DELAY' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Запізнення &gt; 5 хв
            </button>
          </div>
        </div>
      </div>

      {/* 2. Active Detours Notification Banner */}
      {activeDetours.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 space-y-3">
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
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shrink-0 ml-3 cursor-pointer"
                >
                  Зняти розворот
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Live CAD/AVL Telemetry Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            <span>Матриця випуску та відхилення за GPS-телеметрією</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Показників у списку: {filteredVehicles.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="p-3">Борт / Наряд</th>
                <th className="p-3">Маршрут</th>
                <th className="p-3">Водій</th>
                <th className="p-3">Поточна зупинка</th>
                <th className="p-3">Швидкість</th>
                <th className="p-3">Відхилення (Δt)</th>
                <th className="p-3">Статус випуску</th>
                <th className="p-3 text-right">Оперативні Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    Активних вагонів за обраними фільтрами не знайдено.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => {
                  const isDelay = v.deviation_min > 0;
                  const isAhead = v.deviation_min < 0;

                  return (
                    <tr key={v.vehicle_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            Вг-{v.vehicle_id}
                          </span>
                          <span className="text-[10px] text-slate-400">Наряд #{v.duty_number || 1}</span>
                        </div>
                      </td>

                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                        🚊 №{v.route_number || v.route_id}
                      </td>

                      <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                        {v.driver_name || 'Водій ОМЕТ'}
                      </td>

                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{v.current_station || 'Лінія'}</span>
                        </div>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {v.speed} км/год
                      </td>

                      <td className="p-3 font-mono font-black text-sm">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg ${
                          Math.abs(v.deviation_min) <= 2.0 
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                            : Math.abs(v.deviation_min) <= 5.0
                            ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}>
                          {isDelay ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          <span>{isDelay ? `+${v.deviation_min} хв` : `${v.deviation_min} хв`}</span>
                        </span>
                      </td>

                      <td className="p-3">
                        {v.has_active_detour ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 w-fit">
                            <RotateCcw className="w-3 h-3" />
                            <span>Розворот ({v.active_detour_loop})</span>
                          </span>
                        ) : v.status === 'IN_SCHEDULE' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center space-x-1 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>В графіку</span>
                          </span>
                        ) : v.status === 'MINOR_DELAY' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center space-x-1 w-fit">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Запізнення</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 font-black text-[11px] flex items-center space-x-1 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span>Критично / Зхід</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenShortTurn(v.vehicle_id, v.route_id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] rounded-xl shadow-2xs flex items-center space-x-1.5 ml-auto cursor-pointer transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Розворот</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Short-Turn Modal Component */}
      <ShortTurnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicleId={modalVehicleId}
        routeId={modalRouteId}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

function str(val: any): string {
  return String(val || '');
}

export default DispatcherLiveView;
