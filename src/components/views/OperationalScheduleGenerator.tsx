import React, { useState, useEffect } from 'react';
import { Calculator, Settings, Activity, ArrowRight, Save, TrendingUp, Route as RouteIcon, CheckCircle2, ChevronDown } from 'lucide-react';
import { useGenerateDraftSchedule, useCommitScheduleDraft } from '../../hooks/useScheduleQueries';
import { useScheduleStore, ODESSA_DEFAULT_ROUTES } from '../../store/useScheduleStore';
import { RouteTable } from '../routes/RouteTable';
import { toast } from 'sonner';

export const OperationalScheduleGenerator: React.FC = () => {
  const routesFromStore = useScheduleStore(state => state.routes);
  const routes = routesFromStore && routesFromStore.length > 0 ? routesFromStore : ODESSA_DEFAULT_ROUTES;

  const [routeId, setRouteId] = useState('18');
  const [vehiclesCount, setVehiclesCount] = useState(8);
  const [startTime, setStartTime] = useState('05:30');
  const [endTime, setEndTime] = useState('23:00');
  
  // ФІЗИЧНІ ПАРАМЕТРИ
  const [routeLengthKm, setRouteLengthKm] = useState(11.8);
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(15.0);
  const [zeroTripMin, setZeroTripMin] = useState(15);
  const [useElasticSmoother, setUseElasticSmoother] = useState(true);

  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const generateMutation = useGenerateDraftSchedule();
  const commitMutation = useCommitScheduleDraft();

  // Автоматичне підтягування довжини та швидкості при зміні маршруту
  const handleRouteChange = (newRouteId: string) => {
    setRouteId(newRouteId);
    const selected = routes.find(r => String(r.id) === String(newRouteId));
    if (selected) {
      if (selected.length_km) setRouteLengthKm(Number(selected.length_km));
      if (selected.default_speed_kmh) setAvgSpeedKmh(Number(selected.default_speed_kmh));
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    generateMutation.mutate(
      { 
        route_id: routeId, 
        vehicles_count: vehiclesCount, 
        start_time: startTime, 
        end_time: endTime, 
        route_length_km: routeLengthKm, 
        avg_speed_kmh: avgSpeedKmh,
        zero_trip_min: zeroTripMin, 
        use_elastic_smoother: useElasticSmoother
      },
      { 
        onSuccess: (data) => {
          setGeneratedDraft(data);
          toast.success(`Згенеровано розклад для маршруту №${routeId} (${data.metrics?.total_trips || data.duties?.length || 0} нарядів)`);
        },
        onError: (err: any) => {
          toast.error(`Помилка генерації розкладу: ${err?.message || 'Сервер не відповідає'}`);
        }
      }
    );
  };

  const handleCommit = () => {
    if (!generatedDraft) return;

    commitMutation.mutate(
      {
        route_id: generatedDraft.route_id || routeId,
        duties: generatedDraft.duties,
        version_name: `Еталонний розклад від ${new Date().toLocaleDateString()}`
      },
      {
        onSuccess: (res: any) => {
          setSaveSuccess(true);
          toast.success(`Еталонний розклад для маршруту №${routeId} успішно збережено в БД (ID: ${res.schedule_id})`);
        },
        onError: (err: any) => {
          toast.error(`Помилка збереження в БД: ${err?.message || 'Не вдалося зберегти розклад'}`);
        }
      }
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50/70 dark:bg-slate-950 p-6 gap-6 font-sans">
      {/* Ліва панель: Введення параметрів */}
      <div className="w-full lg:w-1/3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-y-auto space-y-5">
        <div>
          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 text-[10px] font-black rounded-md uppercase tracking-wider">
            Transit Solver v2.5
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center mt-2">
            <Calculator className="mr-2 text-blue-600 dark:text-blue-400" /> Конструктор графіків
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Математичний розрахунок табелів, інтервалів та поворотних рейсів
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Оберіть маршрут:
            </label>
            <div className="relative">
              <select
                value={routeId}
                onChange={e => handleRouteChange(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-2xs hover:border-blue-400"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.type === 'trolleybus' ? 'Тролейбус' : 'Трамвай'} №{r.number || r.id} — {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                Випуск (Вагонів)
              </label>
              <input 
                type="number" 
                value={vehiclesCount} 
                onChange={e => setVehiclesCount(Number(e.target.value))} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs" 
                required 
                min={1}
                max={50}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                Нульовий рейс (хв)
              </label>
              <input 
                type="number" 
                value={zeroTripMin} 
                onChange={e => setZeroTripMin(Number(e.target.value))} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                Початок руху
              </label>
              <input 
                type="time" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none shadow-2xs focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                Кінець руху
              </label>
              <input 
                type="time" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none shadow-2xs focus:ring-2 focus:ring-blue-500" 
                required 
              />
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center uppercase tracking-wider">
              <RouteIcon size={15} className="mr-1.5 text-blue-600 dark:text-blue-400"/> Фізичні характеристики
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Довжина кола (км)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={routeLengthKm} 
                  onChange={e => setRouteLengthKm(Number(e.target.value))} 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs" 
                  required 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Швидкість (км/год)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={avgSpeedKmh} 
                  onChange={e => setAvgSpeedKmh(Number(e.target.value))} 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs" 
                  required 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-start space-x-3 cursor-pointer p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-blue-50/60 dark:hover:bg-slate-800/50 transition-colors shadow-2xs">
              <input 
                type="checkbox" 
                checked={useElasticSmoother} 
                onChange={e => setUseElasticSmoother(e.target.checked)} 
                className="mt-0.5 accent-blue-600 w-4 h-4 rounded" 
              />
              <div>
                <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center">
                  <TrendingUp size={14} className="mr-1 text-amber-500" /> Пікове згладжування (Elastic Smoother)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Автоматична компенсація заторів у пікові години (07:00-09:30 та 16:30-19:00).
                </p>
              </div>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={generateMutation.isPending} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl transition-all flex justify-center items-center disabled:opacity-50 shadow-md shadow-blue-600/20 cursor-pointer text-xs uppercase tracking-wider active:scale-95"
          >
            {generateMutation.isPending ? 'Розрахунок математичної моделі...' : 'Генерувати математичну модель'}
          </button>
        </form>

        {generatedDraft && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-4 space-y-2 shadow-2xs">
            <h3 className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200 flex items-center uppercase tracking-wide">
              <Activity size={15} className="mr-1.5 text-emerald-600" /> Метрики згенерованого розкладу
            </h3>
            <ul className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5 font-mono">
              <li className="flex justify-between border-b border-emerald-200 dark:border-emerald-800/50 pb-1">
                <span>Розрахований інтервал:</span> <strong>{generatedDraft.metrics?.headway_min} хв</strong>
              </li>
              <li className="flex justify-between border-b border-emerald-200 dark:border-emerald-800/50 pb-1">
                <span>Час рейсу в один бік:</span> <strong>{generatedDraft.metrics?.actual_trip_min} хв</strong>
              </li>
              <li className="flex justify-between border-b border-emerald-200 dark:border-emerald-800/50 pb-1">
                <span>Відтяжка на кінцевій:</span> <strong>{generatedDraft.metrics?.layover_min} хв</strong>
              </li>
              <li className="flex justify-between border-b border-emerald-200 dark:border-emerald-800/50 pb-1">
                <span>Експлуатаційна швидкість:</span> <strong>{generatedDraft.metrics?.actual_speed_kmh} км/год</strong>
              </li>
              <li className="flex justify-between pt-0.5">
                <span>Усього рейсів:</span> <strong>{generatedDraft.metrics?.total_trips}</strong>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Права панель: Попередній перегляд та затвердження */}
      <div className="w-full lg:w-2/3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden min-h-[500px]">
        {!generatedDraft ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 shadow-2xs">
              <Calculator size={32} />
            </div>
            <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-sm">
              Чорновик розкладу ще не сформовано
            </h3>
            <p className="text-xs text-slate-500 max-w-sm font-medium">
              Оберіть маршрут, вкажіть випуск рухомого складу та натисніть «Генерувати математичну модель» для перегляду сітки.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Попередній перегляд сітки нарядів (Маршрут №{routeId})
                </span>
                <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {generatedDraft.duties?.length || 0} нарядів
                </span>
              </div>
              
              {/* Кнопка збереження */}
              {saveSuccess ? (
                <div className="flex items-center text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl font-bold text-xs shadow-2xs">
                  <CheckCircle2 size={16} className="mr-1.5 text-emerald-600" />
                  Затверджено та збережено в БД
                </div>
              ) : (
                <button 
                  onClick={handleCommit}
                  disabled={commitMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  <Save size={15} className="mr-1.5" /> 
                  {commitMutation.isPending ? 'Запис у БД...' : 'Затвердити в Бойовий розклад'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto p-4">
              <RouteTable schedule={generatedDraft} routeId={routeId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationalScheduleGenerator;
