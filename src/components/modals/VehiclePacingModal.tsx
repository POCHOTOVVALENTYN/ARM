import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Bus, 
  Send,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../utils/apiClient';
import { VehicleActionItem } from '../dispatcher/VehicleActionDropdown';

interface VehiclePacingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleActionItem | null;
  onSuccess?: () => void;
}

export const VehiclePacingModal: React.FC<VehiclePacingModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSuccess
}) => {
  const [pacingType, setPacingType] = useState<'SPEED_UP' | 'HOLD_STOP' | 'SYNC_INTERVAL'>('HOLD_STOP');
  const [minutes, setMinutes] = useState<number>(3);
  const [controlStation, setControlStation] = useState<string>('Найближча контрольна зупинка');
  const [notes, setNotes] = useState<string>('Збільшити інтервал для запобігання спарюванню вагонів на лінії');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !vehicle) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const actionText = pacingType === 'HOLD_STOP' 
      ? `Витримка ${minutes} хв на зупинці`
      : pacingType === 'SPEED_UP'
      ? `Нагін +${minutes} хв`
      : `Вирівнювання інтервалу (${minutes} хв)`;

    try {
      await apiClient.post('/dispatch/orders', {
        route_id: vehicle.route_id,
        route_number: vehicle.route_number || vehicle.route_id,
        transport_type: vehicle.vehicle_id.startsWith('0') ? 'TROLLEYBUS' : 'TRAM',
        vehicle_id: vehicle.vehicle_id,
        duty_number: vehicle.duty_number || 1,
        driver_name: vehicle.driver_name || null,
        order_type: 'PACING',
        target_location: controlStation,
        duration_min: minutes,
        reason: 'Регулювання інтервалу та усунення спарювання вагонів',
        description: notes || `Наказ на ${actionText}`,
        dispatcher_name: 'Черговий диспетчер ЦД'
      });
    } catch (err) {
      console.warn('Не вдалося зберегти наказ pacing у журналі:', err);
    }

    setIsSubmitting(false);
    toast.success(`Наказ передано на борт №${vehicle.vehicle_id}: ${actionText}`);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-slate-800/80 dark:to-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Регулювання темпу руху (Pacing)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Борт №{vehicle.vehicle_id} • Маршрут №{vehicle.route_number || vehicle.route_id} • Наряд #{vehicle.duty_number || 1}
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

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Поточний стан */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Поточне відхилення:</span>
              <span className={`font-mono font-black text-sm ${
                (vehicle.deviation_min || 0) > 0 ? 'text-amber-600' : (vehicle.deviation_min || 0) < 0 ? 'text-blue-600' : 'text-emerald-600'
              }`}>
                {(vehicle.deviation_min || 0) > 0 
                  ? `+${(vehicle.deviation_min || 0).toFixed(1)} хв (запізнення)`
                  : (vehicle.deviation_min || 0) < 0
                  ? `${(vehicle.deviation_min || 0).toFixed(1)} хв (випередження)`
                  : '0.0 хв (в графіку)'
                }
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Швидкість:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {vehicle.speed || 0} км/год
              </span>
            </div>
          </div>

          {/* Вибір типу регулювання */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Тип диспетчерського регулювання:
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPacingType('HOLD_STOP');
                  setNotes('Витримка на зупинці для збільшення інтервалу');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  pacingType === 'HOLD_STOP'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-300 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Витримка на зупинці</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPacingType('SPEED_UP');
                  setNotes('Прискорення / нагін графіка для ліквідації запізнення');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  pacingType === 'SPEED_UP'
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-300 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Нагін графіка</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPacingType('SYNC_INTERVAL');
                  setNotes('Синхронізація рівномірного такту руху з сусідніми вагонами');
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                  pacingType === 'SYNC_INTERVAL'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-300 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Введення в такт</span>
              </button>
            </div>
          </div>

          {/* Час коригування */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Час дії наказу (хвилини):
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setMinutes(val)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-mono font-black transition-all cursor-pointer ${
                    minutes === val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {val} хв
                </button>
              ))}
            </div>
          </div>

          {/* Примітка */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Текст наказу / Інструкція водієві:
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 flex items-center space-x-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Відправка...' : 'Передати наказ на борт'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
