import React, { useState, useEffect } from 'react';
import { useScheduleStore, ODESSA_DEFAULT_ROUTES } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { Calendar, Save, Bus, ChevronDown } from 'lucide-react';
import { DailyDeploymentPlan, DutyTypeCount } from '../../types';
import { toast } from 'sonner';

export const DailyDeploymentPanel: React.FC = () => {
  const { deploymentPlans, updateDeploymentPlan } = useScheduleStore();
  const storeRoutes = useRouteStore(state => state.routes);
  const scheduleRoutes = useScheduleStore(state => state.routes);
  const routes = (storeRoutes && storeRoutes.length > 0)
    ? storeRoutes
    : ((scheduleRoutes && scheduleRoutes.length > 0) ? scheduleRoutes : ODESSA_DEFAULT_ROUTES);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '18');
  
  const [dutiesCount, setDutiesCount] = useState<DutyTypeCount>({
    singleShift: 0,
    doubleShift: 6,
    peak: 2,
    split: 0
  });

  // Load plan when date or route changes
  useEffect(() => {
    const planId = `${selectedDate}_${selectedRouteId}`;
    const existingPlan = deploymentPlans.find((p: any) => p.id === planId);
    
    if (existingPlan) {
      setDutiesCount(existingPlan.dutiesCount);
    } else {
      setDutiesCount({
        singleShift: 0,
        doubleShift: 6,
        peak: 2,
        split: 0
      });
    }
  }, [selectedDate, selectedRouteId, deploymentPlans]);

  const handleSave = () => {
    const planId = `${selectedDate}_${selectedRouteId}`;
    const newPlan: DailyDeploymentPlan = {
      id: planId,
      date: selectedDate,
      routeId: selectedRouteId,
      dutiesCount
    };
    updateDeploymentPlan(newPlan);
    toast.success(`План випуску на ${selectedDate} для маршруту №${selectedRouteId} збережено!`);
  };

  const totalDuties = dutiesCount.singleShift + dutiesCount.doubleShift + dutiesCount.peak + dutiesCount.split;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wide">
            План добового випуску рухомого складу (Наряди)
          </h3>
        </div>
        <div className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-bold border border-blue-200 dark:border-blue-800">
          Всього нарядів: {totalDuties}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <div>
          <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide block mb-1">
            Дата випуску
          </label>
          <input 
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wide block mb-1">
            Маршрут
          </label>
          <div className="relative">
            <select 
              value={selectedRouteId}
              onChange={e => setSelectedRouteId(e.target.value)}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
            >
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.type === 'trolleybus' ? 'Тролейбус' : 'Трамвай'} №{r.number || r.id}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wide block mb-1" title="Однозмінні">
            1-змінні (SINGLE)
          </label>
          <input 
            type="number" min="0" max="30"
            value={dutiesCount.singleShift}
            onChange={e => setDutiesCount({...dutiesCount, singleShift: parseInt(e.target.value) || 0})}
            className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-2 text-xs font-mono font-bold text-amber-900 dark:text-amber-200 outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-sky-700 dark:text-sky-400 uppercase tracking-wide block mb-1" title="Двозмінні">
            2-змінні (DOUBLE)
          </label>
          <input 
            type="number" min="0" max="30"
            value={dutiesCount.doubleShift}
            onChange={e => setDutiesCount({...dutiesCount, doubleShift: parseInt(e.target.value) || 0})}
            className="w-full bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 rounded-xl p-2 text-xs font-mono font-bold text-sky-900 dark:text-sky-200 outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase tracking-wide block mb-1" title="Пікові">
            Пікові (PEAK)
          </label>
          <input 
            type="number" min="0" max="30"
            value={dutiesCount.peak}
            onChange={e => setDutiesCount({...dutiesCount, peak: parseInt(e.target.value) || 0})}
            className="w-full bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl p-2 text-xs font-mono font-bold text-rose-900 dark:text-rose-200 outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide block mb-1" title="Розривні">
            Розривні (SPLIT)
          </label>
          <input 
            type="number" min="0" max="30"
            value={dutiesCount.split}
            onChange={e => setDutiesCount({...dutiesCount, split: parseInt(e.target.value) || 0})}
            className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-2 text-xs font-mono font-bold text-emerald-900 dark:text-emerald-200 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-4 rounded-xl flex items-center space-x-2 text-xs transition-all shadow-xs cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Зберегти план випуску</span>
        </button>
      </div>
    </div>
  );
};
