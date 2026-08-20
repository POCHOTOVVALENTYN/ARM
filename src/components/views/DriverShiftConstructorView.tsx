import React, { useState } from 'react';
import { 
  Users, 
  Scissors, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Coffee, 
  Bus, 
  FileText, 
  Sparkles, 
  Radio, 
  Calendar,
  Building2,
  Wrench
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { KPZCardPrinterModal } from '../modals/KPZCardPrinterModal';
import { InterlineSyncView } from './InterlineSyncView';
import { toast } from 'sonner';

interface DriverShift {
  id: string;
  duty_number: number;
  duty_type: string;
  shift_index: number;
  shift_name: string;
  driver_id: string;
  driver_name: string;
  driver_tab_num: string;
  vehicle_num: string;
  second_vehicle_num?: string | null;
  prep_time_min: number;
  depot_arrival_time: string;
  pullout_time: string;
  start_time: string;
  end_time: string;
  lunch_start_time: string;
  lunch_end_time: string;
  lunch_duration_min: number;
  paid_excess_break_min: number;
  lunch_location: string;
  work_hours: number;
  driving_hours: number;
  night_hours: number;
  compliance_status: string;
  timeline_events: any[];
}

interface RunCuttingResponse {
  status: string;
  route_id: string;
  route_name: string;
  prep_time_min: number;
  total_shifts_count: number;
  shifts: DriverShift[];
}

export const DriverShiftConstructorView: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('7');
  const [selectedKpzShiftId, setSelectedKpzShiftId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'run_cutting' | 'interline'>('run_cutting');

  // Load routes
  const { data: routes = [] } = useQuery({
    queryKey: ['routes-all'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/routes');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // Fetch Run Cutting shifts
  const { data: runCuttingData, isLoading, refetch } = useQuery<RunCuttingResponse>({
    queryKey: ['run-cutting-shifts', selectedRouteId],
    queryFn: async () => {
      const res = await apiClient.post('/api/v1/shifts/generate-run-cutting', {
        route_id: selectedRouteId,
        vehicles_count: 14,
        day_type: 'WORKDAY'
      });
      return res.data;
    }
  });

  // Fetch KPZ card modal data
  const { data: kpzData } = useQuery({
    queryKey: ['kpz-card', selectedKpzShiftId],
    queryFn: async () => {
      if (!selectedKpzShiftId) return null;
      const res = await apiClient.get(`/api/v1/shifts/${selectedKpzShiftId}/kpz-card`);
      return res.data;
    },
    enabled: !!selectedKpzShiftId
  });

  const selectedRoute = routes.find((r: any) => r.id === selectedRouteId) || {
    id: '7',
    number: '7',
    name: 'вул. Паустовського — вул. Пастера',
    type: 'TRAM'
  };

  const isTram = (selectedRoute.type || 'TRAM').toUpperCase() === 'TRAM';
  const prepTimeMin = runCuttingData?.prep_time_min || (isTram ? 10 : 19);

  return (
    <div className="space-y-6 font-sans max-w-full">
      {/* View Sub-navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('run_cutting')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'run_cutting'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Scissors className="w-4 h-4 text-indigo-600" />
          <span>Конструктор ЗмінВодіїв (Run Cutting)</span>
        </button>

        <button
          onClick={() => setActiveTab('interline')}
          className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'interline'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4 text-purple-600" />
          <span>Синхронізація «Зв'язок»</span>
        </button>
      </div>

      {activeTab === 'interline' ? (
        <InterlineSyncView />
      ) : (
        <>
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-indigo-600" />
                  <span>Конструктор Змін Водіїв та Комплектування КПЗ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Автоматичне розрізання нарядів на нормовані зміни водіїв ($\le 8$ год), обіди у вікні (4–6 год) та заміна вагонів для розривного наряду
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <button
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isLoading ? 'Перерахунок...' : 'Сформувати Зміни (Run Cutting)'}</span>
                </button>
              </div>
            </div>

            {/* Config & Normative Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block font-extrabold text-slate-700 dark:text-slate-300">
                  Обраний Маршрут:
                </label>
                <select
                  value={selectedRouteId}
                  onChange={e => setSelectedRouteId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-slate-900 dark:text-white cursor-pointer"
                >
                  {routes.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.type === 'TROLLEYBUS' ? '🚎' : '🚊'} №{r.number || r.id} — {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-extrabold text-slate-700 dark:text-slate-300">
                  Підготовчо-заключний час:
                </label>
                <div className="w-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 font-mono font-black text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
                  <span>{prepTimeMin} хвилин</span>
                  <span className="text-[10px] font-sans font-bold text-indigo-600">
                    {isTram ? 'Трамвай (10хв)' : 'Тролейбус (19хв)'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-extrabold text-amber-600 dark:text-amber-400">
                  Вікно обіду (КЗпП):
                </label>
                <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 font-mono font-black text-amber-700 dark:text-amber-300">
                  Від 4.0h до 6.0h роботи
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-extrabold text-emerald-600 dark:text-emerald-400">
                  Сформовано змін водіїв:
                </label>
                <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 font-mono font-black text-emerald-700 dark:text-emerald-300">
                  {runCuttingData?.total_shifts_count || 0} змін КПЗ
                </div>
              </div>
            </div>
          </div>

          {/* Shifts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(runCuttingData?.shifts || []).map((shift) => (
              <div
                key={shift.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 flex flex-col justify-between"
              >
                {/* Card Header */}
                <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      Наряд #{shift.duty_number} • Зміна {shift.shift_index}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        shift.compliance_status === 'VALID'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {shift.compliance_status}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400">
                    {shift.shift_name}
                  </h3>
                </div>

                {/* Main Timing Attributes */}
                <div className="space-y-2.5 text-xs font-sans">
                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono">
                    <span className="text-slate-500 font-sans">Прихід у депо:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{shift.depot_arrival_time}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono">
                    <span className="text-slate-500 font-sans">Зміна:</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{shift.start_time} — {shift.end_time}</span>
                  </div>

                  {/* Rozryvnyi Duty 2-Vehicle Warning */}
                  {shift.duty_type === 'SPLIT' && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-1">
                      <div className="flex items-center space-x-1.5 font-extrabold text-purple-700 dark:text-purple-300 text-[11px]">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Розривний наряд (Заміна Вагона у депо)</span>
                      </div>
                      <p className="text-[10px] text-purple-600/90 font-medium">
                        Вагон А: <strong>{shift.vehicle_num}</strong> $\to$ в депо на ТО.<br />
                        Вагон Б: <strong>{shift.second_vehicle_num}</strong> з депо.
                      </p>
                    </div>
                  )}

                  {/* Lunch details */}
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                      <span className="flex items-center space-x-1">
                        <Coffee className="w-3.5 h-3.5" />
                        <span>Обід ({shift.lunch_location})</span>
                      </span>
                      <span className="font-mono">{shift.lunch_start_time} ({shift.lunch_duration_min} хв)</span>
                    </div>
                    {shift.paid_excess_break_min > 0 && (
                      <p className="text-[10px] text-amber-700 font-bold">
                        Понаднормово: +{shift.paid_excess_break_min} хв (плюсується до зміни)
                      </p>
                    )}
                  </div>

                  {/* Hours summary */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
                    <span>Робочі години: <strong>{shift.work_hours} год</strong></span>
                    <span>Нічні: <strong>{shift.night_hours} год</strong></span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <button
                  onClick={() => setSelectedKpzShiftId(shift.id)}
                  className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Сформувати бланкову Картку КПЗ</span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* KPZ Card Modal */}
      {selectedKpzShiftId && (
        <KPZCardPrinterModal
          data={kpzData}
          onClose={() => setSelectedKpzShiftId(null)}
        />
      )}
    </div>
  );
};

export default DriverShiftConstructorView;
