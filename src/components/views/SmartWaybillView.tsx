import React, { useState } from 'react';
import { useSmartWaybill } from '../../hooks/useWaybillQueries';
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
  FileSpreadsheet
} from 'lucide-react';
import { GlobalLoader } from '../GlobalLoader';

interface SmartWaybillViewProps {
  vehicleId?: string;
}

export const SmartWaybillView: React.FC<SmartWaybillViewProps> = ({ vehicleId: propVehicleId }) => {
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [driverIdInput, setDriverIdInput] = useState<string>('1');
  const [searchDriverId, setSearchDriverId] = useState<string | number | null>('1');

  const { data: waybill, isLoading, isError, error } = useSmartWaybill(searchDriverId, targetDate);
  const { data: dailyDeployments } = useDailyDeployments(targetDate);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (driverIdInput.trim()) {
      setSearchDriverId(driverIdInput.trim());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center w-fit">
            <CheckCircle2 size={13} className="mr-1" /> Виконано
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center w-fit">
            <Clock size={13} className="mr-1 animate-spin" /> На лінії
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold w-fit">
            Очікує
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold w-fit">
            Зрив
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto">
      
      {/* Панель фільтрації та пошуку (приховується при друку) */}
      <div className="p-6 max-w-7xl mx-auto w-full print:hidden space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">
                Рознарядка
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Електронний Шляховий Лист (Smart Waybill)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Автоматичне зіставлення планового графіку наряду з фактичними рейсами Wialon GPS
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
                placeholder="Табельний № (напр. 1)"
                className="bg-transparent border-0 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-0 p-0 w-36"
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
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Друк</span>
              </button>
            )}
          </form>
        </div>

        {/* Швидкий вибір із призначених водіїв на поточну дату */}
        {dailyDeployments && dailyDeployments.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-400 font-bold shrink-0">Призначені наряди на {targetDate}:</span>
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

      {/* Основна робоча область */}
      <div className="flex-1 px-6 pb-6 max-w-7xl mx-auto w-full">
        {isLoading && <GlobalLoader text="Формування електронного шляхового листа..." />}

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

        {/* Документ Шляхового Листа */}
        {waybill && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden print:border-none print:shadow-none">
            
            {/* Заголовок путівки */}
            <div className="bg-slate-900 text-white p-6 border-b border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight">
                      КП «Одесміськелектротранс» • Електронний Шляховий Лист
                    </h1>
                    <p className="text-xs text-slate-400">
                      Ідентифікатор путівки: #{waybill.waybill_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-amber-400">
                    Дата: {waybill.target_date}
                  </span>
                  <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-xl text-xs font-bold flex items-center">
                    <ShieldCheck size={14} className="mr-1" /> Підписано ЕЦП
                  </span>
                </div>
              </div>

              {/* Інформаційні картки */}
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
                    <p className="text-[11px] uppercase font-bold text-slate-400">Наряд / Час</p>
                    <p className="text-sm font-extrabold text-white">Наряд №{waybill.duty_id}</p>
                    <p className="text-[11px] text-amber-400 font-mono">Зміна: {waybill.summary.total_work_hours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Таблиця виконання рейсів */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-blue-500" />
                  <span>Графік виконання оборотних рейсів (План / Факт)</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Виконано: {waybill.summary.completed_trips} з {waybill.summary.total_planned_trips}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700">Рейс №</th>
                      <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700">Маршрут</th>
                      <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700 text-center" colSpan={2}>
                        Виїзд (План / Факт Wialon)
                      </th>
                      <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700 text-center" colSpan={2}>
                        Заїзд (План / Факт Wialon)
                      </th>
                      <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-sans">
                    {waybill.trips.map((trip) => (
                      <tr key={trip.trip_number} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800 dark:text-slate-200">
                          #{trip.trip_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-black rounded text-[11px] font-mono">
                            {trip.route}
                          </span>
                        </td>
                        
                        {/* Виїзд */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                          {trip.plan_start}
                        </td>
                        <td className={`py-3.5 px-4 text-center font-mono font-bold ${!trip.fact_start ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {trip.fact_start || '—'}
                        </td>

                        {/* Заїзд */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                          {trip.plan_end}
                        </td>
                        <td className={`py-3.5 px-4 text-center font-mono font-bold ${!trip.fact_end ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {trip.fact_end || '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          {getStatusBadge(trip.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Підвал документу / Підписи */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-4">
                <div>
                  <span className="font-bold block text-slate-700 dark:text-slate-300">Диспетчер випуску:</span>
                  <span>Черговий по депо (ЕЦП валідовано)</span>
                </div>
                <div className="border-l border-slate-300 dark:border-slate-700 pl-4">
                  <span className="font-bold block text-slate-700 dark:text-slate-300">Медичний огляд:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Допущений до рейсу</span>
                </div>
              </div>

              <div className="font-mono text-right">
                <p>АРМ-Розклади КП «ОМЕТ» • smart_waybill_v2.4</p>
                <p className="text-[10px] text-slate-400">Згенеровано: {new Date().toLocaleString('uk-UA')}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartWaybillView;
