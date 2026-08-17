import React, { useState } from 'react';
import { useActiveDetours, useActivateDetour, useDeactivateDetour } from '../../hooks/useEmergencyQueries';
import { useConfigStore } from '../../store/useConfigStore';
import { 
  AlertOctagon, 
  Undo2, 
  ArrowRightLeft, 
  TramFront, 
  ShieldAlert, 
  Flame, 
  Zap, 
  CheckCircle, 
  Sparkles,
  Clock,
  Layers,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

export const EmergencyDetoursTab: React.FC = () => {
  const { data: detours, isLoading } = useActiveDetours();
  const activateMutation = useActivateDetour();
  const deactivateMutation = useDeactivateDetour();
  const { emergencyTemplates } = useConfigStore();

  const [vehicleId, setVehicleId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [reason, setReason] = useState('');
  const [newPath, setNewPath] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !routeId || !reason || !newPath) {
      toast.error('Заповніть усі поля форми перемикання');
      return;
    }

    try {
      await activateMutation.mutateAsync({
        vehicle_id: vehicleId,
        route_id: routeId,
        reason,
        new_path_description: newPath,
      });
      toast.success(`Оперативне перемикання для борта №${vehicleId} успішно активовано!`);
      setVehicleId('');
      setReason('');
      setNewPath('');
    } catch (error) {
      toast.error('Помилка активації оперативного перемикання');
    }
  };

  const handleApplyTemplate = (tmpl: any) => {
    setReason(tmpl.cause || tmpl.title);
    setNewPath(tmpl.detourDescription || tmpl.instructions || '');
    if (tmpl.affectedRouteIds?.[0]) {
      setRouteId(tmpl.affectedRouteIds[0]);
    }
    toast.info(`Завантажено шаблон: "${tmpl.title}"`);
  };

  const handleDeactivate = async (detourId: number, vid: string) => {
    try {
      await deactivateMutation.mutateAsync(detourId);
      toast.success(`Вагон №${vid} повернуто на плановий маршрут`);
    } catch (error) {
      toast.error('Помилка повернення транспорту на маршрут');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden font-sans text-slate-100">
      
      {/* Верхній банер */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-600 text-white font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Модуль НС
              </span>
              <h2 className="text-base font-extrabold text-white">
                Оперативні перемикання та Аварійні детури (Emergency Detours)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Фіксація об'їздів при ДТП або обривах контактної мережі з автоматичним відключенням хибних запізнень
            </p>
          </div>
        </div>

        {detours && detours.length > 0 && (
          <div className="bg-amber-950/80 border border-amber-800/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 animate-pulse flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>АКТИВНО {detours.length} ПЕРЕМИКАНЬ НА ЛІНІЇ</span>
          </div>
        )}
      </div>

      {/* Основний вміст */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          
          {/* Ліва колонка: Форма створення об'їзду (5 колонок) */}
          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
            <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <AlertOctagon className="text-amber-400" size={18} />
                <span>Нове оперативне перемикання</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Форма диспетчера</span>
            </div>

            {/* Швидкі шаблони НС */}
            {emergencyTemplates && emergencyTemplates.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center">
                  <Sparkles size={12} className="mr-1 text-amber-400" />
                  Швидкі шаблони аварійних трасувань:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {emergencyTemplates.slice(0, 3).map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-bold text-slate-200 transition-all text-left"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleActivate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Бортовий № ТЗ
                  </label>
                  <input 
                    type="text"
                    value={vehicleId} 
                    onChange={(e) => setVehicleId(e.target.value)} 
                    required 
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" 
                    placeholder="Напр. 3012" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Маршрут
                  </label>
                  <input 
                    type="text"
                    value={routeId} 
                    onChange={(e) => setRouteId(e.target.value)} 
                    required 
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" 
                    placeholder="Напр. Т-28" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Причина перемикання
                </label>
                <input 
                  type="text"
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  required 
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all" 
                  placeholder="ДТП сторонніх авто на коліях, обрив КС тощо" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Опис нового напрямку / схема об'їзду
                </label>
                <textarea 
                  value={newPath} 
                  onChange={(e) => setNewPath(e.target.value)} 
                  required 
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none" 
                  placeholder="До Залізничного вокзалу замість Куликового поля через Тираспольську пл...." 
                />
              </div>

              <button 
                type="submit" 
                disabled={activateMutation.isPending} 
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-3 rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
              >
                <Zap size={16} />
                <span>{activateMutation.isPending ? 'Активація...' : 'Активувати схему об\'їзду'}</span>
              </button>
            </form>
          </div>

          {/* Права колонка: Список активних перемикань (7 колонок) */}
          <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <ArrowRightLeft className="text-amber-400" size={18} />
                <span>Транспорт на змінених маршрутах (DETOUR)</span>
              </h3>
              <span className="text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                {detours?.length || 0} ТЗ
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400">Завантаження активних перемикань...</span>
              </div>
            ) : !detours || detours.length === 0 ? (
              <div className="text-center text-slate-400 py-20 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <CheckCircle size={32} />
                </div>
                <h4 className="text-sm font-bold text-slate-200">Усі транспортні засоби рухаються за планом</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Оперативних змін маршрутів не зафіксовано. Рух електротранспорту здійснюється згідно з базовим графіком.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {detours.map((detour) => (
                  <div 
                    key={detour.id} 
                    className="p-4 bg-slate-900/90 border border-amber-500/40 rounded-xl space-y-3 shadow-md transition-all hover:border-amber-400"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-black text-xs">
                          {detour.route_id}
                        </span>
                        <span className="font-extrabold text-sm text-white flex items-center">
                          <TramFront size={15} className="mr-1.5 text-amber-400" />
                          Борт №{detour.vehicle_id}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                        <Clock size={12} className="text-slate-500" />
                        <span>
                          {detour.started_at ? new Date(detour.started_at).toLocaleTimeString('uk-UA') : 'Щойно'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400">Причина: </span>
                        <strong className="text-rose-400 font-bold">{detour.reason}</strong>
                      </div>
                      <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-200">
                        <strong className="text-amber-400 block mb-0.5">Направлено за схемою:</strong>
                        <span>{detour.new_path_description}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button 
                        onClick={() => handleDeactivate(detour.id, detour.vehicle_id)}
                        disabled={deactivateMutation.isPending}
                        className="bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-4 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500 transition-all flex items-center space-x-1.5 text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <Undo2 size={14} />
                        <span>Повернути на маршрут</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDetoursTab;
