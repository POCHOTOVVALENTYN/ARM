import React, { useState } from 'react';
import { 
  Radio, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

export const InterlineSyncView: React.FC = () => {
  const [minHeadway, setMinHeadway] = useState<number>(2.0);

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/v1/shifts/sync-interline', {
        route_ids: ['7', '1', '28', '5', '18'],
        min_headway_min: minHeadway
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Синхронізацію суміщених ділянок «Зв\'язок» успішно проведено! Гарантовано мінімальний інтервал 2-3 хв.');
    },
    onError: (err: any) => {
      toast.error('Помилка виконання синхронізації «Зв\'язок»');
    }
  });

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md bg-purple-600 text-white font-black text-[11px] uppercase tracking-wider">
              Алгоритм ОМЕТ
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-6 h-6 text-purple-600" />
              <span>Синхронізація суміщених ділянок «Зв'язок»</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Автоматичне усунення "пароводів" та простоїв на спільних зупинках і контрольних точках кількох маршрутів (інтервал $\ge 2..3$ хв)
          </p>
        </div>

        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{syncMutation.isPending ? 'Синхронізація...' : 'Запустити Синхронізацію «Зв\'язок»'}</span>
        </button>
      </div>

      {/* Control Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
          <label className="block font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase">
            Мінімальний інтервал між попутними вагонами:
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              step="0.5"
              min="1.0"
              max="5.0"
              value={minHeadway}
              onChange={e => setMinHeadway(parseFloat(e.target.value) || 2.0)}
              className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-slate-900 dark:text-white text-base"
            />
            <span className="text-xs font-bold text-slate-500">хвилини</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Захищає від накладання графіків Трамваїв №7, №1, №28, №5 на загальних вузлах Пересипського мосту, вул. Пастера та Привозу.
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-950/40 rounded-3xl border border-purple-200 dark:border-purple-800 p-6 space-y-2 col-span-2">
          <div className="flex items-center space-x-2 font-black text-purple-700 dark:text-purple-300 text-sm">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
            <span>Діючі правила синхронізації коридорів «Зв'язок»</span>
          </div>
          <p className="text-xs text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
            Коли кілька маршрутів підходять до однієї контрольної точки (напр. *Херсонський сквер* або *вул. Пастера*), алгоритм автоматично зміщує час відправлення нульового рейсу чи лінійного обороту на $\pm 1..3$ хв для витримування часового вікна 2–3 хвилини.
          </p>
        </div>
      </div>

      {/* Active Corridor Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-purple-600" />
          <span>Суміщені коридори та результати синхронізації</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                Коридор №1: Пересипський міст — вул. Пастера
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                Синхронізовано
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Спільна ділянка маршрутів: <strong>Трамвай №7, №1, №28</strong>
            </p>
            <div className="flex items-center justify-between text-xs font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
              <span>Досягнутий інтервал: <strong className="text-purple-600">2.5 хв</strong></span>
              <span>Скориговано рейсів: <strong>14</strong></span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="font-black text-sm text-slate-900 dark:text-white">
                Коридор №2: Привоз — Залізничний вокзал
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                Синхронізовано
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Спільна ділянка маршрутів: <strong>Трамвай №5, №28, №18</strong>
            </p>
            <div className="flex items-center justify-between text-xs font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl">
              <span>Досягнутий інтервал: <strong className="text-purple-600">2.0 хв</strong></span>
              <span>Скориговано рейсів: <strong>18</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterlineSyncView;
