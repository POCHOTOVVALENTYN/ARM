import React, { useState, useEffect } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { Calendar, Save, Bus } from 'lucide-react';
import { DailyDeploymentPlan, DutyTypeCount } from '../../types';

export const DailyDeploymentPanel: React.FC = () => {
  const { deploymentPlans, updateDeploymentPlan } = useScheduleStore();
  const routes = useRouteStore(state => state.routes);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || 'T3');
  
  const [dutiesCount, setDutiesCount] = useState<DutyTypeCount>({
    singleShift: 0,
    doubleShift: 0,
    peak: 0,
    split: 0
  });

  // Load plan when date or route changes
  useEffect(() => {
    const planId = `${selectedDate}_${selectedRouteId}`;
    const existingPlan = deploymentPlans.find(p => p.id === planId);
    
    if (existingPlan) {
      setDutiesCount(existingPlan.dutiesCount);
    } else {
      setDutiesCount({
        singleShift: 0,
        doubleShift: 0,
        peak: 0,
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
  };

  const totalDuties = dutiesCount.singleShift + dutiesCount.doubleShift + dutiesCount.peak + dutiesCount.split;

  return (
    <div className="bg-white border-2 border-gray-900 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4 space-y-4">
      <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">План випуску рухомого складу (Наряди)</h3>
        </div>
        <div className="text-xs bg-indigo-100 text-indigo-900 px-3 py-1 rounded-full font-bold border border-indigo-200">
          Всього нарядів: {totalDuties}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        <div>
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-1">Дата</label>
          <input 
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-2 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-1">Маршрут</label>
          <select 
            value={selectedRouteId}
            onChange={e => setSelectedRouteId(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-2 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500"
          >
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.number}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-amber-700 uppercase tracking-wide block mb-1" title="Однозмінні">1-змінні</label>
          <input 
            type="number" min="0"
            value={dutiesCount.singleShift}
            onChange={e => setDutiesCount({...dutiesCount, singleShift: parseInt(e.target.value) || 0})}
            className="w-full bg-amber-50 border-2 border-amber-200 rounded-lg p-2 text-sm font-bold text-amber-900 outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-sky-700 uppercase tracking-wide block mb-1" title="Двозмінні">2-змінні</label>
          <input 
            type="number" min="0"
            value={dutiesCount.doubleShift}
            onChange={e => setDutiesCount({...dutiesCount, doubleShift: parseInt(e.target.value) || 0})}
            className="w-full bg-sky-50 border-2 border-sky-200 rounded-lg p-2 text-sm font-bold text-sky-900 outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-rose-700 uppercase tracking-wide block mb-1" title="Пікові">Пікові</label>
          <input 
            type="number" min="0"
            value={dutiesCount.peak}
            onChange={e => setDutiesCount({...dutiesCount, peak: parseInt(e.target.value) || 0})}
            className="w-full bg-rose-50 border-2 border-rose-200 rounded-lg p-2 text-sm font-bold text-rose-900 outline-none focus:border-rose-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide block mb-1" title="Розривні">Розривні</label>
          <input 
            type="number" min="0"
            value={dutiesCount.split}
            onChange={e => setDutiesCount({...dutiesCount, split: parseInt(e.target.value) || 0})}
            className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-lg p-2 text-sm font-bold text-emerald-900 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button 
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 text-sm shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Зберегти план випуску</span>
        </button>
      </div>
    </div>
  );
};
