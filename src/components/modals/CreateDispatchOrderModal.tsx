import React, { useState } from 'react';
import { 
  X, 
  FilePlus, 
  RotateCcw, 
  Clock, 
  Zap, 
  Bus, 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle2, 
  ShieldAlert,
  Send
} from 'lucide-react';
import apiClient from '../../utils/apiClient'
import { useRouteStore } from '../../store/useRouteStore'
import { toast } from 'sonner'

interface CreateDispatchOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialRouteId?: string
  initialVehicleId?: string
}

export const CreateDispatchOrderModal: React.FC<CreateDispatchOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRouteId,
  initialVehicleId
}) => {
  const routesFromStore = useRouteStore((state) => state.routes)
  const routes = routesFromStore || []

  const [routeId, setRouteId] = useState<string>(initialRouteId || '7')
  const [vehicleId, setVehicleId] = useState<string>(initialVehicleId || '')
  const [dutyNumber, setDutyNumber] = useState<number>(1);
  const [driverName, setDriverName] = useState<string>('');
  const [orderType, setOrderType] = useState<string>('SHORT_TURN');
  const [targetLocation, setTargetLocation] = useState<string>('Кільце «Лузанівка»');
  const [durationMin, setDurationMin] = useState<number>(3);
  const [reason, setReason] = useState<string>('Запізнення на лінії > 10 хв');
  const [description, setDescription] = useState<string>('Скорочення рейсу через кільце для відновлення планового інтервалу');
  const [dispatcherName, setDispatcherName] = useState<string>('Іванова О.В. (Таб. Д-104)');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const selectedRoute = routes.find(r => r.id === routeId);
  const transportType = selectedRoute?.type === 'trolleybus' ? 'TROLLEYBUS' : 'TRAM';

  const ORDER_TYPES = [
    { id: 'SHORT_TURN', label: '🔄 Оперативний розворот (Short Turn)', defaultLoc: 'Кільце «Лузанівка»', defaultDesc: 'Скорочення рейсу через кільце для відновлення планового інтервалу' },
    { id: 'PACING', label: '⏱️ Регулювання темпу / Відстій (Pacing)', defaultLoc: '1-ша ст. Люстдорфської дороги', defaultDesc: 'Наказ на регулювальний відстій для усунення спарювання вагонів' },
    { id: 'CAR_SWAP', label: '⚡ Випуск резерву / Підміна вагона', defaultLoc: 'ТД-1 ім. Шевченка', defaultDesc: 'Заміна несправного борта резервним вагоном з депо' },
    { id: 'PULL_IN', label: '🏢 Наказ на заїзд у депо (Pull-In)', defaultLoc: 'Депо базування', defaultDesc: 'Передчасний схід з лінії за технічним станом' },
    { id: 'DETOUR', label: '🚨 Оперативний об\'їзд / Перенаправлення', defaultLoc: 'вул. Старопортофранківська', defaultDesc: 'Тимчасовий рух в об\'їзд через ДТП або перекриття колії' },
    { id: 'SERVICE_CALL', label: '🛠️ Виклик спецтехніки / Аварійної бригади', defaultLoc: 'Місце події на лінії', defaultDesc: 'Направлення аварійної вишки служби КМ або служби колії' },
  ];

  const handleOrderTypeChange = (typeId: string) => {
    setOrderType(typeId);
    const found = ORDER_TYPES.find(t => t.id === typeId);
    if (found) {
      setTargetLocation(found.defaultLoc);
      setDescription(found.defaultDesc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeId) {
      toast.error('Оберіть маршрут');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/dispatch/orders', {
        route_id: routeId,
        route_number: selectedRoute?.number || routeId,
        transport_type: transportType,
        vehicle_id: vehicleId.trim() || null,
        duty_number: Number(dutyNumber) || 1,
        driver_name: driverName.trim() || null,
        order_type: orderType,
        target_location: targetLocation.trim() || null,
        duration_min: orderType === 'PACING' ? Number(durationMin) : null,
        reason: reason.trim(),
        description: description.trim(),
        dispatcher_name: dispatcherName.trim() || 'Черговий диспетчер ЦД',
        notes: notes.trim() || null
      });

      toast.success('Розпорядження успішно зареєстровано в Журналі КП «ОМЕТ»!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Помилка реєстрації розпорядження:', error);
      toast.error('Не вдалося зареєструвати розпорядження');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Заголовок */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
              <FilePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Нове диспетчерське розпорядження
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Служба руху КП «Одесміськелектротранс» • Офіційний журнал
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Тип заходу */}
          <div>
            <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Тип оперативного заходу *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ORDER_TYPES.map(t => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleOrderTypeChange(t.id)}
                  className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    orderType === t.id
                      ? 'bg-blue-50 dark:bg-blue-950/80 border-blue-500 text-blue-900 dark:text-blue-200 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span>{t.label}</span>
                  {orderType === t.id && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Маршрут, борт, наряд */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Маршрут *
              </label>
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-blue-500"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.type === 'trolleybus' ? '🚎 Тролейбус' : '🚊 Трамвай'} №{r.number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Бортовий №
              </label>
              <input
                type="text"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                placeholder="напр. 4002"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Наряд №
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={dutyNumber}
                onChange={(e) => setDutyNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 3. Локація та тривалість */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Локація / Розворотне кільце / ДП
              </label>
              <input
                type="text"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="напр. Кільце «Лузанівка»"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {orderType === 'PACING' ? (
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Тривалість відстою (хвилини)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={durationMin}
                  onChange={(e) => setDurationMin(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  ПІБ Водія (за наявності)
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="напр. Коваленко С.М."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* 4. Причина та Зміст */}
          <div>
            <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Причина оперативного заходу *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="напр. Запізнення > 10 хв / ДТП на вул. Преображенська"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Зміст та текст розпорядження *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 5. Диспетчер */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Черговий диспетчер ЦД *
              </label>
              <input
                type="text"
                required
                value={dispatcherName}
                onChange={(e) => setDispatcherName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Службові примітки
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="напр. Погоджено зі старшим диспетчером"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-all flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Реєстрація...' : 'Зареєструвати розпорядження'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
