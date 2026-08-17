import React, { useState } from 'react';
import { Calculator, Settings, Activity, ArrowRight, Save, TrendingUp, Route as RouteIcon, CheckCircle2 } from 'lucide-react';
import { useGenerateDraftSchedule, useCommitScheduleDraft } from '../../hooks/useScheduleQueries';
import { RouteTable } from '../routes/RouteTable';
import { toast } from 'sonner';

export const OperationalScheduleGenerator: React.FC = () => {
  const [routeId, setRouteId] = useState('18');
  const [vehiclesCount, setVehiclesCount] = useState(12);
  const [startTime, setStartTime] = useState('05:30');
  const [endTime, setEndTime] = useState('23:00');
  
  // НОВІ ФІЗИЧНІ ПАРАМЕТРИ
  const [routeLengthKm, setRouteLengthKm] = useState(11.5);
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(14.5);
  const [zeroTripMin, setZeroTripMin] = useState(15);
  const [useElasticSmoother, setUseElasticSmoother] = useState(true);

  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const generateMutation = useGenerateDraftSchedule();
  const commitMutation = useCommitScheduleDraft();

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
          toast.success(`Згенеровано розклад для маршруту №${routeId} (${data.metrics.total_trips} рейсів)`);
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
        version_name: `Розрахунок від ${new Date().toLocaleDateString()}`
      },
      {
        onSuccess: (res: any) => {
          setSaveSuccess(true);
          toast.success(`Еталонний розклад для маршруту №${routeId} успішно записано в БД (ID: ${res.schedule_id})`);
        },
        onError: (err: any) => {
          toast.error(`Помилка збереження в БД: ${err?.message || 'Не вдалося зберегти розклад'}`);
        }
      }
    );
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 p-6 gap-6 font-sans">
      {/* Ліва панель: Введення параметрів */}
      <div className="w-1/3 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center mb-6">
          <Calculator className="mr-2 text-blue-600 dark:text-blue-400" /> Конструктор графіків
        </h2>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Маршрут</label>
              <input 
                type="text" 
                value={routeId} 
                onChange={e => setRouteId(e.target.value)} 
                className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Випуск (Вагонів)</label>
              <input 
                type="number" 
                value={vehiclesCount} 
                onChange={e => setVehiclesCount(Number(e.target.value))} 
                className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                required 
                min={1} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Початок руху</label>
              <input 
                type="time" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)} 
                className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded font-mono font-bold" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Кінець руху</label>
              <input 
                type="time" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)} 
                className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded font-mono font-bold" 
                required 
              />
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center">
              <RouteIcon size={16} className="mr-2 text-slate-500 dark:text-slate-400"/> Фізика маршруту
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Довжина (км)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={routeLengthKm} 
                  onChange={e => setRouteLengthKm(Number(e.target.value))} 
                  className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded font-bold" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Швидкість (км/год)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={avgSpeedKmh} 
                  onChange={e => setAvgSpeedKmh(Number(e.target.value))} 
                  className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded font-bold" 
                  required 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Нульовий рейс з депо (хв)</label>
              <input 
                type="number" 
                value={zeroTripMin} 
                onChange={e => setZeroTripMin(Number(e.target.value))} 
                className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2 rounded font-bold" 
                required 
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">З урахуванням посадки пасажирів по дорозі на диспетчерський пункт.</p>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <input 
                type="checkbox" 
                checked={useElasticSmoother} 
                onChange={e => setUseElasticSmoother(e.target.checked)} 
                className="mt-1 accent-blue-600" 
              />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center">
                  <TrendingUp size={16} className="mr-1 text-amber-500" /> Пікове згладжування
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Компенсація заторів (+25% до часу рейсу з 7 до 9 та з 16 до 18 год).</p>
              </div>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={generateMutation.isPending} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {generateMutation.isPending ? 'Розрахунок...' : 'Генерувати математичну модель'}
          </button>
        </form>

        {generatedDraft && (
          <div className="mt-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center">
              <Activity size={16} className="mr-2" /> Параметри згенерованого розкладу
            </h3>
            <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1">
              <li className="flex justify-between border-b border-emerald-200/50 dark:border-emerald-800/50 pb-1">
                <span>Розрахований інтервал:</span> <strong>{generatedDraft.metrics?.headway_min} хв</strong>
              </li>
              <li className="flex justify-between border-b border-emerald-200/50 dark:border-emerald-800/50 pb-1">
                <span>Час рейсу (в один бік):</span> <strong>{generatedDraft.metrics?.actual_trip_min} хв</strong>
              </li>
              <li className="flex justify-between border-b border-emerald-200/50 dark:border-emerald-800/50 pb-1">
                <span>Відтяжка на кільці:</span> <strong>{generatedDraft.metrics?.layover_min} хв</strong>
              </li>
              <li className="flex justify-between border-b border-emerald-200/50 dark:border-emerald-800/50 pb-1" title="Якщо відтяжка була більше 10 хв, система автоматично занизила швидкість">
                <span>Фактична швидкість:</span> <strong>{generatedDraft.metrics?.actual_speed_kmh} км/год</strong>
              </li>
              <li className="flex justify-between pt-1">
                <span>Усього рейсів:</span> <strong>{generatedDraft.metrics?.total_trips}</strong>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Права панель */}
      <div className="w-2/3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        {!generatedDraft ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
            <Calculator size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
            <p className="font-bold">Введіть фізичні параметри маршруту та натисніть «Генерувати математичну модель»</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-white">Попередній перегляд (Чорновик)</h3>
              
              {/* Кнопка збереження / підтвердження */}
              {saveSuccess ? (
                <div className="flex items-center text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-4 py-2 rounded-xl font-bold text-sm">
                  <CheckCircle2 size={18} className="mr-2 text-emerald-600" />
                  Успішно збережено в БД
                </div>
              ) : (
                <button 
                  onClick={handleCommit}
                  disabled={commitMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Save size={16} className="mr-2" /> 
                  {commitMutation.isPending ? 'Збереження...' : 'Затвердити в Бойовий розклад'}
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
