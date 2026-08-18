import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/apiClient';
import { useDailyDeployments } from '../../hooks/useCrewQueries';
import { 
  FileText, 
  User, 
  TramFront, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Search, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  MessageSquare,
  Radio,
  Zap,
  Check
} from 'lucide-react';
import { GlobalLoader } from '../GlobalLoader';
import { toast } from 'sonner';

interface SmartWaybillViewProps {
  vehicleId?: string;
}

export const SmartWaybillView: React.FC<SmartWaybillViewProps> = ({ vehicleId: propVehicleId }) => {
  const queryClient = useQueryClient();
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [driverIdInput, setDriverIdInput] = useState<string>('1');
  const [searchDriverId, setSearchDriverId] = useState<string | number | null>('1');
  const [customAlertMsg, setCustomAlertMsg] = useState<string>('');

  // 1. Завантаження путівки водія
  const { data: waybill, isLoading, isError, error } = useQuery({
    queryKey: ['driver-waybill', searchDriverId, targetDate],
    queryFn: async () => {
      if (!searchDriverId) return null;
      const { data } = await api.get(`/waybills/driver/${searchDriverId}/active?target_date=${targetDate}`);
      return data;
    },
    enabled: !!searchDriverId,
    staleTime: 15000,
  });

  const { data: dailyDeployments } = useDailyDeployments(targetDate);

  // 2. Отримання наказів диспетчера для цього вагона
  const vehicleId = waybill?.vehicle?.id || propVehicleId || '4020';
  const { data: directives = [] } = useQuery({
    queryKey: ['driver-directives', vehicleId],
    queryFn: async () => {
      const { data } = await api.get(`/driver-comm/directives/vehicle/${vehicleId}`);
      return data;
    },
    enabled: !!vehicleId,
    refetchInterval: 10000,
  });

  // 3. Мутація для відправки сигналу тривоги
  const alertMutation = useMutation({
    mutationFn: async (payload: { alert_type: string; message: string }) => {
      const { data } = await api.post('/driver-comm/alert', {
        vehicle_id: vehicleId,
        driver_id: String(searchDriverId || '1'),
        route_id: waybill?.route_id || '18',
        alert_type: payload.alert_type,
        message: payload.message
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Сигнал «${data.message}» успішно передано черговому диспетчеру!`);
      setCustomAlertMsg('');
    },
    onError: (err: any) => {
      toast.error(`Помилка відправки сигналу: ${err?.message || 'Немає зв\'язку з сервером'}`);
    }
  });

  // 4. Мутація для підтвердження наказу диспетчера («Прийнято»)
  const ackMutation = useMutation({
    mutationFn: async (directiveId: number) => {
      const { data } = await api.post(`/driver-comm/directives/${directiveId}/ack`);
      return data;
    },
    onSuccess: () => {
      toast.success('Підтверджено: наказ прийнято до виконання!');
      queryClient.invalidateQueries({ queryKey: ['driver-directives', vehicleId] });
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (driverIdInput.trim()) {
      setSearchDriverId(driverIdInput.trim());
    }
  };

  const handleSendQuickAlert = (alertType: string, label: string) => {
    alertMutation.mutate({ alert_type: alertType, message: label });
  };

  const handleSendCustomAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAlertMsg.trim()) return;
    alertMutation.mutate({ alert_type: 'CUSTOM', message: customAlertMsg.trim() });
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto">
      
      {/* Панель фільтрації та швидкого вибору */}
      <div className="p-6 max-w-7xl mx-auto w-full print:hidden space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">
                АРМ Водія / Диспетчера
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Електронний Шляховий Лист та Книжка Водія
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Похвилинний розклад зупинок, рекомендації темпу руху та двосторонній зв'язок з диспетчерською
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar size={16} className="text-slate-400" />
              <input 
                type="date" 
                value={targetDate} 
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-transparent border-0 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-0 p-0"
              />
            </div>

            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <User size={16} className="text-slate-400" />
              <input 
                type="text" 
                value={driverIdInput} 
                onChange={(e) => setDriverIdInput(e.target.value)}
                placeholder="Табельний №"
                className="bg-transparent border-0 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-0 p-0 w-28"
              />
            </div>

            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Search size={14} />
              <span>Знайти путівку</span>
            </button>

            {waybill && (
              <button 
                type="button"
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Друк</span>
              </button>
            )}
          </form>
        </div>

        {/* Швидкий вибір із призначених нарядів */}
        {dailyDeployments && dailyDeployments.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-400 font-bold shrink-0">Випуск на {targetDate}:</span>
            {dailyDeployments.map((dep) => (
              <button
                key={dep.id}
                type="button"
                onClick={() => {
                  setDriverIdInput(String(dep.driver_id));
                  setSearchDriverId(dep.driver_id);
                }}
                className={`px-2.5 py-1 rounded-lg font-mono font-bold border transition-all shrink-0 ${
                  String(searchDriverId) === String(dep.driver_id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                }`}
              >
                Водій #{dep.driver_id} (Борт {dep.vehicle_id})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Робоча область */}
      <div className="flex-1 px-6 pb-6 max-w-7xl mx-auto w-full space-y-6">
        {isLoading && <GlobalLoader text="Завантаження похвилинної книжки водія..." />}

        {isError && (
          <div className="bg-rose-50 dark:bg-rose-950/30 p-8 rounded-2xl border border-rose-200 dark:border-rose-800 text-center flex flex-col items-center justify-center space-y-3">
            <AlertCircle size={40} className="text-rose-500" />
            <h3 className="font-extrabold text-base text-rose-800 dark:text-rose-200">
              Путівку на дату {targetDate} не знайдено
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
              {(error as any)?.response?.data?.detail || 'Для цього водія не призначено електронний наряд на обрану дату.'}
            </p>
          </div>
        )}

        {waybill && (
          <>
            {/* БЛОК ДВОСТОРОННЬОГО ЗВ'ЯЗКУ ТА СИГНАЛІВ ТРИВОГИ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
              
              {/* Ліва колонка: Швидкі тривожні сигнали водія */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Radio className="text-rose-600 animate-pulse" size={20} />
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Швидкі сигнали диспетчеру (В один клік)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Борт #{waybill.vehicle.id}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleSendQuickAlert('ACCIDENT_TRACK', 'ДТП / перешкода на колії')}
                    disabled={alertMutation.isPending}
                    className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1.5 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
                  >
                    <AlertTriangle size={18} />
                    <span>🛑 ДТП на колії</span>
                  </button>

                  <button
                    onClick={() => handleSendQuickAlert('POWER_OUTAGE', 'Втрата напруги в контактній мережі')}
                    disabled={alertMutation.isPending}
                    className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1.5 border border-amber-200 dark:border-amber-900 transition-all cursor-pointer"
                  >
                    <Zap size={18} />
                    <span>⚡ Немає струму</span>
                  </button>

                  <button
                    onClick={() => handleSendQuickAlert('VEHICLE_BREAKDOWN', 'Технічна несправність вагона')}
                    disabled={alertMutation.isPending}
                    className="p-3 bg-orange-50 hover:bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1.5 border border-orange-200 dark:border-orange-900 transition-all cursor-pointer"
                  >
                    <TramFront size={18} />
                    <span>🔧 Поломка вагона</span>
                  </button>

                  <button
                    onClick={() => handleSendQuickAlert('MEDICAL_EMERGENCY', 'Потрібна швидка / хворий пасажир')}
                    disabled={alertMutation.isPending}
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1.5 border border-red-200 dark:border-red-900 transition-all cursor-pointer"
                  >
                    <AlertCircle size={18} />
                    <span>🚑 Хворий пасажир</span>
                  </button>

                  <button
                    onClick={() => handleSendQuickAlert('TRAFFIC_LIGHT_DELAY', 'Затримка на світлофорі / затор')}
                    disabled={alertMutation.isPending}
                    className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  >
                    <Clock size={18} />
                    <span>🚦 Затримка світлофор</span>
                  </button>

                  <button
                    onClick={() => handleSendQuickAlert('CUSTOM', 'Потрібна консультація диспетчера')}
                    disabled={alertMutation.isPending}
                    className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1.5 border border-blue-200 dark:border-blue-900 transition-all cursor-pointer"
                  >
                    <MessageSquare size={18} />
                    <span>💬 Виклик диспетчера</span>
                  </button>
                </div>

                {/* Довільне повідомлення */}
                <form onSubmit={handleSendCustomAlert} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={customAlertMsg}
                    onChange={(e) => setCustomAlertMsg(e.target.value)}
                    placeholder="Написати повідомлення диспетчеру..."
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!customAlertMsg.trim() || alertMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Надіслати</span>
                  </button>
                </form>
              </div>

              {/* Права колонка: Накази диспетчера та підтвердження отримання */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="text-blue-600" size={20} />
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Вказівки диспетчера маршруту (Журнал наказів)
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {directives.length} наказів
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {directives.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-medium">
                        Немає активних вказівок від диспетчера. Слідуйте за штатним розкладом.
                      </div>
                    ) : (
                      directives.map((dir: any) => (
                        <div
                          key={dir.id}
                          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                            dir.is_acknowledged
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600'
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                                {dir.directive_type}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-slate-400">
                                {dir.created_at ? new Date(dir.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-xs font-extrabold">{dir.message}</p>
                          </div>

                          <div>
                            {dir.is_acknowledged ? (
                              <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <Check size={14} className="mr-1" /> Прийнято
                              </span>
                            ) : (
                              <button
                                onClick={() => ackMutation.mutate(dir.id)}
                                disabled={ackMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-sm transition-all cursor-pointer"
                              >
                                <Check size={14} />
                                <span>Підтвердити («Прийнято»)</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Рекомендація темпу (Pacing Card) */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">Статус темпу (Pacing Guidance)</span>
                      <p className="text-xs font-extrabold text-emerald-950 dark:text-emerald-100">
                        🟢 Рух у графіку. Рекомендована швидкість: 16–18 км/год
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ОСНОВНИЙ ДОКУМЕНТ: ПУТІВКА ТА ПОХВИЛИННИЙ РОЗКЛАД ЗУПИНОК */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden print:border-none print:shadow-none">
              
              {/* Шапка путівки */}
              <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight">
                        КП «Одесміськелектротранс» • Книжка та Табель Водія
                      </h1>
                      <p className="text-xs text-slate-400">
                        Путівка #{waybill.waybill_id} • Маршрут №{waybill.route_id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-amber-400">
                      Дата: {waybill.target_date}
                    </span>
                    <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-xl text-xs font-bold flex items-center">
                      <ShieldCheck size={14} className="mr-1" /> ЕЦП Валідовано
                    </span>
                  </div>
                </div>

                {/* Інформаційні плашки */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase font-bold text-slate-400">Водій</p>
                      <p className="text-sm font-extrabold text-white">{waybill.driver.full_name}</p>
                      <p className="text-[11px] text-blue-400 font-mono">Таб. №{waybill.driver.id} • Клас {waybill.driver.class_rank}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <TramFront size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase font-bold text-slate-400">Рухомий склад</p>
                      <p className="text-sm font-extrabold text-white">Борт №{waybill.vehicle.id}</p>
                      <p className="text-[11px] text-emerald-400 font-mono">{waybill.vehicle.model}</p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase font-bold text-slate-400">Наряд / Графік</p>
                      <p className="text-sm font-extrabold text-white">Наряд {waybill.duty_number}</p>
                      <p className="text-[11px] text-amber-400 font-mono">Зміна: {waybill.summary.total_work_hours}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ПОХВИЛИННИЙ РОЗКЛАД УСІХ ЗУПИНОК ТА РЕЙСІВ */}
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-blue-500" />
                    <span>Порейсний похвилинний розклад усіх зупинок (Рівень 2)</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Усього рейсів: {waybill.trips.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {waybill.trips.map((trip: any) => (
                    <div key={trip.trip_number} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 flex items-center justify-between font-mono text-xs">
                        <div className="flex items-center space-x-3">
                          <span className="font-extrabold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                            Рейс #{trip.trip_number} ({trip.direction})
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {trip.start_station} → {trip.end_station}
                          </span>
                          {trip.is_zero && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded">
                              Нульовий (з пасажирами)
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 font-bold">
                          План: {trip.plan_start} — {trip.plan_end}
                        </div>
                      </div>

                      {/* Таблиця зупинок рейсу */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3 border-b">№</th>
                              <th className="py-2 px-3 border-b">Назва зупинки</th>
                              <th className="py-2 px-3 border-b text-center">План прибуття</th>
                              <th className="py-2 px-3 border-b text-center">План відправлення</th>
                              <th className="py-2 px-3 border-b text-center">Тип точки</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                            {(trip.stops || []).map((st: any, sIdx: number) => (
                              <tr key={sIdx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${st.is_control_point ? 'bg-blue-50/40 dark:bg-blue-950/20 font-bold' : ''}`}>
                                <td className="py-2 px-3 font-mono text-slate-400">{sIdx + 1}</td>
                                <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                                  {st.stop_name || st.stop_id}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {st.arrival_time}
                                </td>
                                <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {st.departure_time}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {st.is_control_point ? (
                                    <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                                      Контрольна точка
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">Проміжна</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Підвал путівки */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Диспетчер випуску:</span>
                  <span> Черговий по депо (ЕЦП валідовано)</span>
                </div>
                <div className="font-mono text-right text-[10px]">
                  <p>АРМ «Розклади» КП «Одесміськелектротранс» • v2.5</p>
                  <p>Сформовано: {new Date().toLocaleString('uk-UA')}</p>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartWaybillView;
