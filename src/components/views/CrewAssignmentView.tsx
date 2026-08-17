import React, { useState, useMemo } from 'react';
import { useAvailableResources, useAssignCrew, useDailyDeployments } from '../../hooks/useCrewQueries';
import { useActiveSchedules } from '../../hooks/useScheduleQueries';
import { useScheduleStore } from '../../store/useScheduleStore';
import { 
  Users, 
  TramFront, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight,
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface DutyItem {
  id: number;
  duty_number: string | number;
  route_id?: string;
  start_time: string;
  end_time: string;
  duty_type?: string;
  is_assigned: boolean;
  assigned_driver_id?: number | null;
  assigned_vehicle_id?: string | null;
}

export const CrewAssignmentView: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedDutyId, setSelectedDutyId] = useState<number | null>(null);
  
  // Локальний стан форми призначення
  const [driverId, setDriverId] = useState<number | "">("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [filterRoute, setFilterRoute] = useState<string>("ALL");

  // TanStack Query хуки
  const { data: resources, isLoading: isResourcesLoading } = useAvailableResources(targetDate);
  const { data: dailyDeployments, isLoading: isDeploymentsLoading } = useDailyDeployments(targetDate);
  const { data: activeSchedules, isLoading: isSchedulesLoading } = useActiveSchedules();
  const assignMutation = useAssignCrew();

  // Локальний стан нарядів з чернеток у сторі
  const { draftDuties } = useScheduleStore();

  // Обчислення списку нарядів з активних розкладів або чернеток
  const dutiesList: DutyItem[] = useMemo(() => {
    const list: DutyItem[] = [];

    // 1. Якщо є активні розклади з бекенду
    if (activeSchedules && activeSchedules.length > 0) {
      activeSchedules.forEach((sch) => {
        if (sch.duties && sch.duties.length > 0) {
          sch.duties.forEach((d) => {
            const firstShift = d.shifts?.[0];
            const lastShift = d.shifts?.[d.shifts.length - 1] || firstShift;
            
            const deployment = dailyDeployments?.find((dep) => dep.duty_id === d.id);

            list.push({
              id: d.id,
              duty_number: d.duty_number || `Наряд #${d.id}`,
              route_id: sch.route_id,
              start_time: firstShift?.start_time || '05:30',
              end_time: lastShift?.end_time || '14:30',
              duty_type: d.duty_type || 'SINGLE',
              is_assigned: !!deployment,
              assigned_driver_id: deployment?.driver_id,
              assigned_vehicle_id: deployment?.vehicle_id,
            });
          });
        }
      });
    }

    // 2. Якщо розкладів з бекенду немає, використовуємо локальні наряди
    if (list.length === 0) {
      if (draftDuties && draftDuties.length > 0) {
        draftDuties.forEach((dd, idx) => {
          const numId = idx + 1;
          const deployment = dailyDeployments?.find((dep) => dep.duty_id === numId);
          list.push({
            id: numId,
            duty_number: dd.id || `Наряд ${numId}`,
            route_id: 'Т-28',
            start_time: dd.shiftStartTime || '06:00',
            end_time: dd.shiftEndTime || '14:30',
            duty_type: 'SINGLE',
            is_assigned: !!deployment,
            assigned_driver_id: deployment?.driver_id,
            assigned_vehicle_id: deployment?.vehicle_id,
          });
        });
      } else {
        // Демо-наряди за замовчуванням
        const defaultMocks = [
          { id: 101, duty_number: '28-01', route_id: 'Т-28', start_time: '05:30', end_time: '14:15', duty_type: 'SINGLE' },
          { id: 102, duty_number: '28-02', route_id: 'Т-28', start_time: '06:00', end_time: '14:45', duty_type: 'SINGLE' },
          { id: 103, duty_number: '28-03', route_id: 'Т-28', start_time: '06:30', end_time: '15:15', duty_type: 'SINGLE' },
          { id: 104, duty_number: '5-01', route_id: 'Т-5', start_time: '05:45', end_time: '14:30', duty_type: 'DOUBLE' },
          { id: 105, duty_number: '5-02', route_id: 'Т-5', start_time: '06:15', end_time: '15:00', duty_type: 'DOUBLE' },
          { id: 106, duty_number: '7-01', route_id: 'Т-7', start_time: '05:15', end_time: '13:45', duty_type: 'PEAK' },
          { id: 107, duty_number: '7-02', route_id: 'Т-7', start_time: '06:45', end_time: '15:30', duty_type: 'PEAK' },
        ];

        defaultMocks.forEach((dm) => {
          const deployment = dailyDeployments?.find((dep) => dep.duty_id === dm.id);
          list.push({
            ...dm,
            is_assigned: !!deployment,
            assigned_driver_id: deployment?.driver_id,
            assigned_vehicle_id: deployment?.vehicle_id,
          });
        });
      }
    }

    return list;
  }, [activeSchedules, draftDuties, dailyDeployments]);

  // Фільтрація за маршрутом
  const filteredDuties = useMemo(() => {
    if (filterRoute === 'ALL') return dutiesList;
    return dutiesList.filter((d) => d.route_id === filterRoute);
  }, [dutiesList, filterRoute]);

  const uniqueRoutes = useMemo(() => {
    const routes = new Set<string>();
    dutiesList.forEach((d) => {
      if (d.route_id) routes.add(d.route_id);
    });
    return Array.from(routes);
  }, [dutiesList]);

  // Поточний обраний наряд
  const currentSelectedDuty = useMemo(() => {
    return dutiesList.find((d) => d.id === selectedDutyId) || null;
  }, [dutiesList, selectedDutyId]);

  // Підрахунок статистики
  const assignedCount = dutiesList.filter((d) => d.is_assigned).length;
  const totalCount = dutiesList.length;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDutyId || !driverId || !vehicleId) {
      toast.error('Оберіть водія та вагон для завершення рознарядки');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        duty_id: selectedDutyId,
        driver_id: Number(driverId),
        vehicle_id: vehicleId,
        target_date: targetDate,
      });

      toast.success(`Електронну путівку для наряду №${currentSelectedDuty?.duty_number || selectedDutyId} успішно відкрито!`);
      setDriverId('');
      setVehicleId('');
      setSelectedDutyId(null);
    } catch (error) {
      toast.error('Помилка формування електронної путівки. Перевірте журнал.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 p-6 bg-slate-900 overflow-hidden font-sans text-slate-100">
      
      {/* Ліва панель: Список нарядів / Рознарядка */}
      <div className="lg:w-5/12 bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl flex flex-col overflow-hidden backdrop-blur-md">
        
        {/* Заголовок панелі з вибором дати */}
        <div className="p-4 border-b border-slate-700/80 bg-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-400 font-mono text-xs font-bold border border-blue-500/30">
                ОМЕТ • РОЗНАРЯДКА
              </span>
              <h2 className="font-black text-sm text-white uppercase tracking-wider">
                Наряди на дату
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Закрито: <strong className="text-emerald-400">{assignedCount}</strong> з <strong className="text-slate-200">{totalCount}</strong> нарядів
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="date" 
              value={targetDate} 
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-mono font-bold"
            />
          </div>
        </div>

        {/* Фільтр маршрутів */}
        <div className="px-4 py-2 bg-slate-850 border-b border-slate-700/60 flex items-center space-x-2 overflow-x-auto text-xs">
          <Filter size={13} className="text-slate-400 shrink-0" />
          <button
            onClick={() => setFilterRoute('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filterRoute === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
            }`}
          >
            Всі маршрути
          </button>
          {uniqueRoutes.map((r) => (
            <button
              key={r}
              onClick={() => setFilterRoute(r)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                filterRoute === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Список нарядів */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isSchedulesLoading || isDeploymentsLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-medium">Завантаження розкладів...</span>
            </div>
          ) : filteredDuties.length === 0 ? (
            <div className="text-center text-slate-500 py-16 text-xs">
              Нарядів для обраного фільтра не знайдено
            </div>
          ) : (
            filteredDuties.map((duty) => {
              const isSelected = selectedDutyId === duty.id;
              
              return (
                <div 
                  key={duty.id} 
                  onClick={() => setSelectedDutyId(duty.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/50 shadow-md' 
                      : 'border-slate-700/80 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2 py-0.5 bg-slate-900 text-blue-400 border border-slate-700 rounded font-mono font-black text-xs">
                        {duty.route_id || 'Маршрут'}
                      </span>
                      <span className="font-extrabold text-sm text-white">
                        {duty.duty_number}
                      </span>
                    </div>

                    {duty.is_assigned ? (
                      <span className="flex items-center space-x-1 text-[11px] px-2.5 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 rounded-full font-bold">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        <span>Закріплено</span>
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800/70 rounded-full font-bold">
                        Вільний наряд
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2.5 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center space-x-1.5 font-mono">
                      <Clock size={13} className="text-slate-400" />
                      <span>{duty.start_time} — {duty.end_time}</span>
                    </div>

                    {duty.is_assigned && duty.assigned_vehicle_id && (
                      <div className="flex items-center space-x-1 text-slate-300 font-mono text-[11px]">
                        <TramFront size={13} className="text-blue-400" />
                        <span>Вагон <strong>#{duty.assigned_vehicle_id}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Права панель: Призначення екіпажу та електронна путівка */}
      <div className="lg:w-7/12 bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl p-6 flex flex-col justify-between backdrop-blur-md overflow-y-auto">
        <div>
          <div className="border-b border-slate-700/80 pb-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CalendarCheck size={22} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  Формування електронної путівки
                </h2>
                <p className="text-xs text-slate-400">
                  Призначення водія та випуск рухомого складу на лінію
                </p>
              </div>
            </div>

            {currentSelectedDuty && (
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400">Обраний наряд</span>
                <div className="font-extrabold text-blue-400 text-sm">
                  {currentSelectedDuty.duty_number} ({currentSelectedDuty.route_id})
                </div>
              </div>
            )}
          </div>

          {!selectedDutyId ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <Layers size={32} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-200 text-sm">Оберіть наряд зі списку зліва</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Виберіть потрібний вихід або рейс у лівій панелі, щоб призначити доступного водія та вагон на дату {targetDate}.
                </p>
              </div>
            </div>
          ) : isResourcesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400 font-medium">Отримання списку вільних водіїв та ТЗ...</span>
            </div>
          ) : (
            <form onSubmit={handleAssign} className="space-y-6 max-w-xl">
              
              {/* Попередження якщо наряд вже закріплений */}
              {currentSelectedDuty?.is_assigned && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center space-x-2.5 text-xs text-amber-300">
                  <AlertCircle size={18} className="text-amber-400 shrink-0" />
                  <span>
                    Цей наряд уже закріплений. Повторне затвердження оновить електронну путівку.
                  </span>
                </div>
              )}

              {/* Вибір водія */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="mr-2 text-blue-400" size={16} /> 
                    Водій з резервного списку депо
                  </span>
                  <span className="text-xs text-blue-400 font-mono">
                    {resources?.drivers?.length || 0} вільних
                  </span>
                </label>
                
                <select 
                  value={driverId} 
                  onChange={(e) => setDriverId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="" disabled>-- Оберіть доступного водія --</option>
                  {resources?.drivers?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} (Клас: {d.class_rank} • ID: {d.id})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400">
                  Відображаються лише водії, які не мають призначених змін на {targetDate}.
                </p>
              </div>

              {/* Вибір рухомого складу */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span className="flex items-center">
                    <TramFront className="mr-2 text-blue-400" size={16} /> 
                    Рухомий склад (Бортовий номер вагона / тролейбуса)
                  </span>
                  <span className="text-xs text-blue-400 font-mono">
                    {resources?.vehicles?.length || 0} доступних
                  </span>
                </label>
                
                <select 
                  value={vehicleId} 
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="" disabled>-- Оберіть бортовий номер --</option>
                  {resources?.vehicles?.map((v) => (
                    <option key={v.id} value={v.id}>
                      Борт № {v.id} — {v.model} ({v.type === 'tram' ? 'Трамвай' : v.type === 'trolleybus' ? 'Тролейбус' : 'Електробус'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedDutyId(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Скасувати
                </button>

                <button 
                  type="submit" 
                  disabled={assignMutation.isPending || !driverId || !vehicleId}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-xl text-xs shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>{assignMutation.isPending ? 'Формування путівки...' : 'Затвердити та відкрити путівку'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Підвал з інструкцією */}
        <div className="mt-8 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Sparkles size={14} className="text-blue-400" />
            <span>Інтегровано з телеметрією та автоматичним формуванням змін КЗпП</span>
          </div>
          <span className="font-mono text-slate-400">КП «Одесміськелектротранс» • 2026</span>
        </div>
      </div>
    </div>
  );
};

export default CrewAssignmentView;
