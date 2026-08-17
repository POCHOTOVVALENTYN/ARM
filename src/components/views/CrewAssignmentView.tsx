import React, { useState } from 'react';
import { Users, TramFront, Calendar, CheckCircle2, Link, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { useAssignWaybill, useWaybillsByDate, useAvailableDuties } from '../../hooks/useWaybillQueries';
import { toast } from 'sonner';

export const CrewAssignmentView: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Стейт форми
  const [selectedDuty, setSelectedDuty] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');

  const { data: dbDuties, isLoading: isDutiesLoading } = useAvailableDuties(targetDate);
  const { data: assignedWaybills } = useWaybillsByDate(targetDate);
  const assignMutation = useAssignWaybill();

  // Резервні наряди, якщо в БД ще не збережено активний розклад
  const defaultDuties = [
    { id: 1, number: '18-01', route: '18', start: '05:30', end: '14:20' },
    { id: 2, number: '18-02', route: '18', start: '05:42', end: '14:32' },
    { id: 3, number: '18-03', route: '18', start: '05:54', end: '14:44' },
    { id: 4, number: '18-04', route: '18', start: '06:06', end: '14:56' },
    { id: 5, number: '7-01', route: '7', start: '05:15', end: '13:45' },
    { id: 6, number: '7-02', route: '7', start: '05:30', end: '14:00' },
  ];

  const dutiesToDisplay = (dbDuties && dbDuties.length > 0) ? dbDuties : defaultDuties;

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuty || !vehicleId || !driverName) {
      toast.error('Будь ласка, заповніть бортовий номер та табельний/ПІБ водія');
      return;
    }

    const currentDutyObj = dutiesToDisplay.find((d: any) => d.id === selectedDuty);

    assignMutation.mutate(
      {
        duty_id: selectedDuty,
        vehicle_id: vehicleId.trim(),
        driver_id: driverName.trim(),
        target_date: targetDate
      },
      {
        onSuccess: (data: any) => {
          toast.success(`Е-Путівку для наряду №${currentDutyObj?.number || selectedDuty} (борт #${vehicleId}) створено та завантажено в Redis!`);
          setSelectedDuty(null);
          setVehicleId('');
          setDriverName('');
        },
        onError: (err: any) => {
          toast.error(`Помилка оформлення путівки: ${err?.message || 'Сервер не відповідає'}`);
        }
      }
    );
  };

  // Перевіряємо, чи наряд уже виданий
  const isAssigned = (dutyId: number) => {
    return assignedWaybills?.some((w: any) => w.duty_id === dutyId);
  };

  const getAssignedInfo = (dutyId: number) => {
    return assignedWaybills?.find((w: any) => w.duty_id === dutyId);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col space-y-6 font-sans">
      
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <Users className="mr-3 text-blue-600 dark:text-blue-400" size={28} />
            Щоденна Рознарядка (Видача Путівок)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Призначення рухомого складу та водіїв на статичні наряди з автоматичною синхронізацією телеметрії в Redis.
          </p>
        </div>
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
          <Calendar size={20} className="text-slate-500 dark:text-slate-400 mr-2" />
          <input 
            type="date" 
            value={targetDate} 
            onChange={(e) => setTargetDate(e.target.value)}
            className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none text-sm cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Ліва панель: Список нарядів на сьогодні */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:col-span-2 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              Доступні наряди на {targetDate}
            </h3>
            <span className="text-xs font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded">
              Всього: {dutiesToDisplay.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isDutiesLoading ? (
              <div className="text-center py-10 text-slate-400 text-sm">Завантаження нарядів...</div>
            ) : dutiesToDisplay.map((duty: any) => {
              const assigned = isAssigned(duty.id);
              const assignedInfo = getAssignedInfo(duty.id);

              return (
                <div 
                  key={duty.id} 
                  className={`border rounded-xl p-4 flex justify-between items-center transition-all ${
                    assigned 
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-75' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:shadow-sm cursor-pointer'
                  } ${selectedDuty === duty.id ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''}`}
                  onClick={() => !assigned && setSelectedDuty(duty.id)}
                >
                  <div className="flex items-center">
                    <div className={`p-2.5 rounded-xl mr-4 ${assigned ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'}`}>
                      <Link size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                        <span>Наряд №{duty.number}</span>
                        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-normal font-mono">
                          Маршрут {duty.route}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        {duty.start} — {duty.end} {duty.trips_count ? `• ${duty.trips_count} рейсів` : ''}
                      </p>
                      {assigned && assignedInfo && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                          Борт: #{assignedInfo.vehicle_id} • Водій: {assignedInfo.driver_id}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {assigned ? (
                    <span className="flex items-center text-emerald-700 dark:text-emerald-300 font-bold text-xs bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full">
                      <CheckCircle2 size={14} className="mr-1 text-emerald-600" /> В роботі
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xs bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                      Очікує призначення
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Права панель: Форма призначення */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-fit">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center border-b border-slate-100 dark:border-slate-800 pb-4 text-base">
            <TramFront className="mr-2 text-emerald-600 dark:text-emerald-400" size={20} />
            Оформлення Е-Путівки
          </h3>

          {!selectedDuty ? (
            <div className="text-center py-10 text-slate-400">
              <Users size={48} className="mx-auto mb-3 opacity-40 text-slate-400" />
              <p className="text-sm">Оберіть вільний наряд зі списку ліворуч для оформлення путівки.</p>
            </div>
          ) : (
            <form onSubmit={handleAssign} className="space-y-5">
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800 mb-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase block mb-1">Вибрано наряд</span>
                <span className="text-lg font-black text-blue-900 dark:text-blue-200 font-mono">
                  № {dutiesToDisplay.find((d: any) => d.id === selectedDuty)?.number}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                  Бортовий номер вагона
                </label>
                <input 
                  type="text" 
                  value={vehicleId} 
                  onChange={e => setVehicleId(e.target.value)} 
                  placeholder="Напр. 3014"
                  className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold font-mono" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                  Табельний або ПІБ Водія
                </label>
                <input 
                  type="text" 
                  value={driverName} 
                  onChange={e => setDriverName(e.target.value)} 
                  placeholder="Напр. Сидоренко В.В."
                  className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold" 
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={assignMutation.isPending}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 shadow-sm cursor-pointer text-sm"
              >
                {assignMutation.isPending ? 'Завантаження в Redis...' : 'Видати путівку на лінію'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default CrewAssignmentView;
