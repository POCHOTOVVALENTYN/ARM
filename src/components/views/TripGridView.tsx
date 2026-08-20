import React, { useState, useEffect } from 'react';
import { 
  Table as TableIcon, 
  Calculator, 
  Clock, 
  CheckCircle2, 
  Coffee, 
  Bus, 
  Layers, 
  ArrowRight, 
  MoveHorizontal, 
  Save, 
  Download, 
  Sparkles,
  Info,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

interface RouteItem {
  id: string;
  number: string;
  name: string;
  type: string;
  round_trip_min?: number;
  t_dir0_min?: number;
  t_dir1_min?: number;
  layover_min?: number;
  depot_pullout_min?: number;
  depot_pullin_min?: number;
  standard_break_min?: number;
  designated_break_hub?: string;
}

interface ColumnEvent {
  id: string;
  type: 'PULL_OUT' | 'TRIP' | 'LUNCH' | 'SHIFT_CHANGE' | 'PULL_IN' | 'LAYOVER';
  label: string;
  time: string;
  departure_time?: string;
  arrival_time?: string;
  duration_min?: number;
  standard_duration_min?: number;
  excess_min?: number;
  location?: string;
  from_stop?: string;
  to_stop?: string;
  trip_number?: number;
  direction?: string;
  shift?: number;
  badge_color?: string;
}

interface DutyColumn {
  duty_id: string;
  duty_number: number;
  duty_type: string;
  duty_type_name: string;
  duty_type_code: string;
  badge_color: string;
  start_time: string;
  end_time: string;
  total_work_hours: number;
  shift1_hours: number;
  shift2_hours: number;
  events_count: number;
  events: ColumnEvent[];
}

interface StaticCalculationResult {
  kpi: {
    route_id: string;
    route_name: string;
    route_type: string;
    vehicles_count: number;
    round_trip_min: number;
    headway_min: number;
    standard_break_min: number;
    designated_break_hub: string;
    total_duties_count: number;
    total_daily_trips: number;
    total_daily_km: number;
  };
  columns: DutyColumn[];
  gantt_tasks: any[];
}

export const TripGridView: React.FC = () => {
  const queryClient = useQueryClient();

  // Selected parameters for static scheduling
  const [selectedRouteId, setSelectedRouteId] = useState<string>('7');
  const [vehiclesCount, setVehiclesCount] = useState<number>(14);
  const [dayType, setDayType] = useState<string>('WORKDAY');
  const [startTime, setStartTime] = useState<string>('05:30');
  const [endTime, setEndTime] = useState<string>('23:30');

  // Column order state
  const [columnsOrder, setColumnsOrder] = useState<DutyColumn[]>([]);

  // Load all routes from backend (PostgreSQL DB)
  const { data: routes = [], isLoading: isRoutesLoading } = useQuery<RouteItem[]>({
    queryKey: ['routes-all'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/routes');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // Ensure selectedRouteId valid
  useEffect(() => {
    if (routes.length > 0 && !routes.some(r => r.id === selectedRouteId)) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0] || {
    id: '7',
    number: '7',
    name: 'вул. Паустовського — вул. Пастера (Херсонський сквер)',
    type: 'TRAM',
    round_trip_min: 84,
    standard_break_min: 15,
    designated_break_hub: 'ДП «вул. Паустовського»'
  };

  const isTram = (selectedRoute.type || 'TRAM').toUpperCase() === 'TRAM';
  const lunchNorm = isTram ? 15 : 20;
  const roundTripMin = selectedRoute.round_trip_min || 84;
  const calculatedHeadway = vehiclesCount > 0 ? (roundTripMin / vehiclesCount).toFixed(1) : '0';

  // Calculate static schedule mutation
  const calculateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/v1/schedules/calculate-static', {
        route_id: selectedRouteId,
        vehicles_count: vehiclesCount,
        day_type: dayType,
        start_time: startTime,
        end_time: endTime
      });
      return res.data as StaticCalculationResult;
    },
    onSuccess: (data) => {
      setColumnsOrder(data.columns || []);
      toast.success(`Статичний графік для маршруту №${selectedRoute.number || selectedRouteId} успішно розраховано! Інтервал: ${data.kpi.headway_min} хв.`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка розрахунку графіка');
    }
  });

  // Commit static schedule to DB
  const commitMutation = useMutation({
    mutationFn: async () => {
      if (!calculateMutation.data) return;
      const res = await apiClient.post('/api/v1/schedules/commit-static', {
        ...calculateMutation.data,
        columns: columnsOrder
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Еталонний статичний розклад успішно затверджено в PostgreSQL!');
      queryClient.invalidateQueries({ queryKey: ['active-schedule'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка затвердження графіка');
    }
  });

  // Trigger calculation when route changes or on initial load
  useEffect(() => {
    if (selectedRouteId) {
      calculateMutation.mutate();
    }
  }, [selectedRouteId]);

  // Reorder columns helper
  const moveColumn = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= columnsOrder.length) return;
    const updated = [...columnsOrder];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setColumnsOrder(updated);
  };

  const kpi = calculateMutation.data?.kpi || {
    route_id: selectedRouteId,
    route_name: selectedRoute.name,
    vehicles_count: vehiclesCount,
    round_trip_min: roundTripMin,
    headway_min: parseFloat(calculatedHeadway),
    standard_break_min: lunchNorm,
    designated_break_hub: selectedRoute.designated_break_hub || 'ДП «вул. Паустовського»',
    total_duties_count: columnsOrder.length || vehiclesCount,
    total_daily_trips: (columnsOrder.length || vehiclesCount) * 16,
    total_daily_km: 2600.0
  };

  return (
    <div className="space-y-6 max-w-full font-sans">
      {/* 1. Engineering Input Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[11px] uppercase tracking-wider">
                Служба Руху ОМЕТ
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <span>Інженерний розрахунок рейсів та контроль за КП</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Автозавантаження нормативів маршруту з PostgreSQL, розрахунок інтервалу та стовпчикова дошка випусків
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all"
            >
              {calculateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{calculateMutation.isPending ? 'Розрахунок...' : 'Розрахувати графік'}</span>
            </button>
            <button
              onClick={() => commitMutation.mutate()}
              disabled={commitMutation.isPending || !calculateMutation.data}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{commitMutation.isPending ? 'Збереження...' : 'Затвердити в БД'}</span>
            </button>
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          {/* Route Select */}
          <div className="space-y-1">
            <label className="block font-extrabold text-slate-700 dark:text-slate-300">
              Маршрут:
            </label>
            <select
              value={selectedRouteId}
              onChange={e => setSelectedRouteId(e.target.value)}
              disabled={isRoutesLoading}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-black cursor-pointer"
            >
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.type === 'TROLLEYBUS' ? '🚎' : '🚊'} №{r.number || r.id} — {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Day Type */}
          <div className="space-y-1">
            <label className="block font-extrabold text-slate-700 dark:text-slate-300">
              Тип дня:
            </label>
            <select
              value={dayType}
              onChange={e => setDayType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-black cursor-pointer"
            >
              <option value="WORKDAY">Будній (Робочий день)</option>
              <option value="WEEKEND">Вихідний (Субота/Неділя)</option>
              <option value="HOLIDAY">Святковий / Скорочений</option>
            </select>
          </div>

          {/* Vehicles Count (N) */}
          <div className="space-y-1">
            <label className="block font-extrabold text-slate-700 dark:text-slate-300">
              Кількість нарядів (N):
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={vehiclesCount}
              onChange={e => setVehiclesCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-slate-900 dark:text-white"
            />
          </div>

          {/* Fixed Round Trip Norm from DB */}
          <div className="space-y-1">
            <label className="block font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Час обороту (Тоб):</span>
              <span className="text-[10px] text-slate-400 font-mono">з БД</span>
            </label>
            <div className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-slate-700 dark:text-slate-300">
              {roundTripMin} хв
            </div>
          </div>

          {/* Calculated Headway */}
          <div className="space-y-1">
            <label className="block font-extrabold text-indigo-600 dark:text-indigo-400">
              Розрахунковий інтервал (H):
            </label>
            <div className="w-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 font-mono font-black text-indigo-700 dark:text-indigo-300 text-sm">
              {calculatedHeadway} хв
            </div>
          </div>

          {/* Lunch Norm from Rules */}
          <div className="space-y-1">
            <label className="block font-extrabold text-amber-600 dark:text-amber-400">
              Норматив обіду:
            </label>
            <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 font-mono font-black text-amber-700 dark:text-amber-300 flex items-center justify-between">
              <span>{lunchNorm} хв</span>
              <span className="text-[10px] font-sans font-bold text-amber-600">
                {isTram ? 'Трамвай' : 'Тролейбус'}
              </span>
            </div>
          </div>
        </div>

        {/* Informational Status Strip */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between text-xs gap-3 font-medium text-slate-600 dark:text-slate-300">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Закріплений пункт обідів: <strong className="text-slate-900 dark:text-white">{kpi.designated_break_hub}</strong></span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span>Добовий випуск: <strong>{kpi.total_duties_count} нарядів</strong></span>
            <span>Загалом рейсів: <strong>{kpi.total_daily_trips}</strong></span>
            <span>Плановий пробіг: <strong>{kpi.total_daily_km} км</strong></span>
          </div>
        </div>
      </div>

      {/* 2. Columnar Duty Board */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Стовпчикова дошка статичних нарядів (Columnar Duty Board)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold flex items-center space-x-1">
            <GripHorizontal className="w-4 h-4 text-slate-400" />
            <span>Колонки нарядів (стрілки для зміни черговості)</span>
          </span>
        </div>

        {/* Columns Horizontal Scroll Board */}
        <div className="flex space-x-4 overflow-x-auto pb-4 pt-2">
          {calculateMutation.isPending ? (
            <div className="w-full py-16 text-center text-slate-400 font-medium flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span>Розрахунок похвилинного статичного графіка...</span>
            </div>
          ) : columnsOrder.length === 0 ? (
            <div className="w-full py-16 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              Натисніть кнопку «Розрахувати графік» для генерації стовпчикової дошки.
            </div>
          ) : (
            columnsOrder.map((col, idx) => (
              <div
                key={col.duty_id}
                className="w-72 shrink-0 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between overflow-hidden"
              >
                {/* Column Header */}
                <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-black text-sm text-slate-900 dark:text-white">
                        Наряд {col.duty_id}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black text-white"
                        style={{ backgroundColor: col.badge_color || '#3b82f6' }}
                      >
                        {col.duty_type_code} • {col.duty_type_name}
                      </span>
                    </div>

                    {/* Reorder buttons */}
                    <div className="flex items-center space-x-0.5">
                      <button
                        onClick={() => moveColumn(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-20 cursor-pointer"
                        title="Перемістити ліворуч"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveColumn(idx, idx + 1)}
                        disabled={idx === columnsOrder.length - 1}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-20 cursor-pointer"
                        title="Перемістити праворуч"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Duty Timing Meta */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-100 dark:border-slate-700/60 pt-1.5">
                    <span>Випуск: <strong>{col.start_time} — {col.end_time}</strong></span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{col.total_work_hours} год</span>
                  </div>
                </div>

                {/* Column Events List */}
                <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto text-xs font-sans">
                  {col.events.map(ev => {
                    if (ev.type === 'PULL_OUT') {
                      return (
                        <div key={ev.id} className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1">
                          <div className="flex items-center justify-between font-black text-indigo-700 dark:text-indigo-300 text-[11px]">
                            <span>🚩 {ev.label}</span>
                            <span className="font-mono">{ev.time}</span>
                          </div>
                          <p className="text-[10px] text-indigo-600/80 font-medium">
                            {ev.location} ({ev.duration_min} хв)
                          </p>
                        </div>
                      );
                    }

                    if (ev.type === 'LUNCH') {
                      return (
                        <div key={ev.id} className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                          <div className="flex items-center justify-between font-black text-amber-700 dark:text-amber-300 text-[11px]">
                            <span className="flex items-center space-x-1">
                              <Coffee className="w-3.5 h-3.5" />
                              <span>{ev.label}</span>
                            </span>
                            <span className="font-mono">{ev.time}</span>
                          </div>
                          <p className="text-[10px] text-amber-700/80 font-medium">
                            {ev.location} • <strong>{ev.duration_min} хв</strong>
                            {ev.excess_min ? ` (+${ev.excess_min}хв до зміни)` : ''}
                          </p>
                        </div>
                      );
                    }

                    if (ev.type === 'SHIFT_CHANGE') {
                      return (
                        <div key={ev.id} className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center text-[10px] font-bold text-purple-700 dark:text-purple-300">
                          🔄 {ev.label} ({ev.time})
                        </div>
                      );
                    }

                    if (ev.type === 'PULL_IN') {
                      return (
                        <div key={ev.id} className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 space-y-1">
                          <div className="flex items-center justify-between font-black text-slate-800 dark:text-slate-200 text-[11px]">
                            <span>🏁 {ev.label}</span>
                            <span className="font-mono">{ev.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {ev.location}
                          </p>
                        </div>
                      );
                    }

                    // Default Trip
                    return (
                      <div key={ev.id} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1 hover:border-indigo-300 transition-colors">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-800 dark:text-slate-200">
                            #{ev.trip_number} {ev.direction === 'FORWARD' ? '→ Прямий' : '← Зворотній'}
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                            {ev.departure_time} — {ev.arrival_time}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          {ev.from_stop} → {ev.to_stop}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Column Footer */}
                <div className="p-2.5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Зміна 1: <strong>{col.shift1_hours} год</strong></span>
                  <span>Зміна 2: <strong>{col.shift2_hours} год</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TripGridView;
