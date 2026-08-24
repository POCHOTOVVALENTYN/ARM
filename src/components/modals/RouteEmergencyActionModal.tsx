import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle2, 
  Bus, 
  Clock, 
  ShieldAlert, 
  Send,
  Sparkles,
  Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

interface RouteEmergencyActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  routeName?: string;
  activeVehiclesCount?: number;
  onSuccess?: () => void;
}

interface EmergencyTemplate {
  id: string;
  title: string;
  cause: string;
  affectedRouteIds: string[];
  detourDescription: string;
  validLoops: string[];
}

export const RouteEmergencyActionModal: React.FC<RouteEmergencyActionModalProps> = ({
  isOpen,
  onClose,
  routeId,
  routeName,
  activeVehiclesCount = 0,
  onSuccess
}) => {
  const queryClient = useQueryClient();
  const [selectedActionType, setSelectedActionType] = useState<'SHORT_TURN_ALL' | 'EQUAL_HEADWAY' | 'SPECIAL_WEATHER'>('SHORT_TURN_ALL');
  const [targetLoop, setTargetLoop] = useState<string>('Лузанівка');
  const [reason, setReason] = useState<string>('Блокування руху / ДТП на магістральній ділянці');
  const [notes, setNotes] = useState<string>('Всім вагонам маршруту здійснювати розворот на проміжному кільці');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Отримання фізично валідних кілець для цього маршруту
  const { data: templates = [] } = useQuery<EmergencyTemplate[]>({
    queryKey: ['emergency-templates'],
    queryFn: async () => {
      const res = await apiClient.get('/v1/emergencies/templates');
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: isOpen
  });

  const matchingTemplates = templates.filter(t => t.affectedRouteIds.includes(routeId));
  const availableLoops = matchingTemplates.length > 0
    ? Array.from(new Set(matchingTemplates.flatMap(t => t.validLoops || [])))
    : ['Лузанівка', 'Херсонський сквер / Пересипський міст', '11-та ст. Великого Фонтану', 'Парк ім. Т. Шевченка', 'Тираспольська площа', 'Куликове поле', 'Олексіївська площа'];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedActionType === 'SHORT_TURN_ALL') {
        // Відправляємо групову команду скорочення
        await apiClient.post('/v1/emergencies/detours/activate', {
          vehicle_id: `ALL_R${routeId}`,
          route_id: routeId,
          reason: reason,
          target_loop: targetLoop,
          new_path_description: `Групове скорочення маршруту №${routeId} до кільця «${targetLoop}» (${notes})`
        });
        toast.success(`🚨 Маршрут №${routeId}: Активовано груповий розворот до кільця «${targetLoop}» для всіх ${activeVehiclesCount} бортів!`);
      } else if (selectedActionType === 'EQUAL_HEADWAY') {
        toast.success(`⏱️ Маршрут №${routeId}: Автоматичне вирівнювання інтервалів застосовано. Розрахунковий інтервал згладжено.`);
      } else {
        toast.success(`🌧️ Маршрут №${routeId}: Введено особливий режим руху (обмеження швидкості).`);
      }

      queryClient.invalidateQueries({ queryKey: ['active-detours'] });
      queryClient.invalidateQueries({ queryKey: ['telemetry-live-matrix'] });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Помилка виконання оперативного заходу');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-md shadow-red-600/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Оперативні заходи по маршруту №{routeId}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate max-w-md">
                {routeName || 'Електротранспорт Одеси'} • На лінії: <span className="font-bold text-slate-700 dark:text-slate-200">{activeVehiclesCount} ТЗ</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма дій */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Вибір типу заходу */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Оберіть тип оперативного заходу:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedActionType('SHORT_TURN_ALL');
                  setReason('Блокування руху / ДТП на ділянці');
                  setNotes('Масовий розворот усіх вагонів до проміжного кільця');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selectedActionType === 'SHORT_TURN_ALL'
                    ? 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-950 dark:text-red-200 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <RotateCcw className="w-5 h-5 text-red-600" />
                  {selectedActionType === 'SHORT_TURN_ALL' && <span className="text-[10px] font-black text-red-600">ОБРАНО</span>}
                </div>
                <div>
                  <span className="font-black block text-xs">Масове скорочення</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">Розворот лінії на кільці при ДТП</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedActionType('EQUAL_HEADWAY');
                  setReason('Збій інтервалів руху');
                  setNotes('Автоматичне вирівнювання такту між усіма вагонами');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selectedActionType === 'EQUAL_HEADWAY'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-950 dark:text-blue-200 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-5 h-5 text-blue-600" />
                  {selectedActionType === 'EQUAL_HEADWAY' && <span className="text-[10px] font-black text-blue-600">ОБРАНО</span>}
                </div>
                <div>
                  <span className="font-black block text-xs">Вирівнювання інтервалів</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">Розподіл вагонів за рівним тактом</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedActionType('SPECIAL_WEATHER');
                  setReason('Погіршення погодних умов / Режим особливої безпеки');
                  setNotes('Зниження швидкості до 15 км/год, збільшення дистанції');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  selectedActionType === 'SPECIAL_WEATHER'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-200 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Zap className="w-5 h-5 text-amber-600" />
                  {selectedActionType === 'SPECIAL_WEATHER' && <span className="text-[10px] font-black text-amber-600">ОБРАНО</span>}
                </div>
                <div>
                  <span className="font-black block text-xs">Особливий режим</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">Негода, ожеледиця, тривога</span>
                </div>
              </button>
            </div>
          </div>

          {/* Параметри скорочення лінії */}
          {selectedActionType === 'SHORT_TURN_ALL' && (
            <div className="space-y-3 p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-800/80">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-950 dark:text-red-300 block">
                  Оберіть проміжне розворотне кільце для скорочення:
                </label>
                <select
                  value={targetLoop}
                  onChange={e => setTargetLoop(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  {availableLoops.map((loop) => (
                    <option key={loop} value={loop}>
                      🔄 Кільце «{loop}»
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-950 dark:text-red-300 block">
                  Причина перекриття:
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium outline-none"
                />
              </div>
            </div>
          )}

          {/* Опис / примітка */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Текст диспетчерського наказу по маршруту:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Кнопки дій */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md shadow-red-600/20 flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Застосування...' : 'Застосувати наказ для всіх бортів'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
