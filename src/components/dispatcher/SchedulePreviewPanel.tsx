import React, { useState, useMemo } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useSchedule, useActivateSchedule } from '../../hooks/useScheduleQueries';
import { LinearRouteMap } from './LinearRouteMap';
import { DeviationDashboard } from './DeviationDashboard';
import { GanttChart } from './GanttChart';
import { Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SchedulePreviewPanelProps {
  stopsCount?: number;
}

export const SchedulePreviewPanel: React.FC<SchedulePreviewPanelProps> = ({ stopsCount: propStopsCount }) => {
  // З Zustand беремо UI-стан (час), ID розкладу та локальні чернетки
  const { 
    generatedTrips, 
    currentTime, 
    setCurrentTime, 
    draftDuties, 
    currentScheduleId, 
    currentScheduleStatus,
    setCurrentScheduleInfo 
  } = useScheduleStore();

  const [activeTab, setActiveTab] = useState<'gantt' | 'deviations'>('gantt');

  // React Query запит для завантаження серверної ієрархії розкладу
  const { data: serverSchedule, isLoading } = useSchedule(currentScheduleId ? Number(currentScheduleId) : null);
  const activateMutation = useActivateSchedule();

  const stopsCount = propStopsCount || 20;

  // Трансформація ієрархії (якщо є серверний розклад, або використовуємо локальні generatedTrips)
  const displayTrips = useMemo(() => {
    if (serverSchedule && serverSchedule.duties && serverSchedule.duties.length > 0) {
      return serverSchedule.duties.flatMap((duty) =>
        duty.shifts.flatMap((shift) =>
          shift.trips.map((trip) => ({
            ...trip,
            duty_id: duty.duty_number.toString(),
            trip_id: trip.id ? trip.id.toString() : `${duty.duty_number}_${trip.trip_number}`,
            start_stop_id: trip.stop_times[0]?.stop_id || 'ST_1',
            end_stop_id: trip.stop_times[trip.stop_times.length - 1]?.stop_id || 'ST_20',
          }))
        )
      );
    }
    return generatedTrips || [];
  }, [serverSchedule, generatedTrips]);

  if (!displayTrips || displayTrips.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-500 font-semibold">
        {isLoading ? 'Завантаження ієрархії розкладу...' : 'Розклад не згенеровано. Запустіть генератор для аналізу.'}
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = Math.floor(minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleActivateSchedule = () => {
    if (!currentScheduleId) return;

    activateMutation.mutate(currentScheduleId, {
      onSuccess: (data) => {
        toast.success(`Розклад #${currentScheduleId} успішно затверджено та активовано!`);
        if (data && data.status) {
          setCurrentScheduleInfo(currentScheduleId, data.status);
        }
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.detail || 'Помилка активації розкладу');
      },
    });
  };

  return (
    <div className="flex flex-col space-y-6 w-full font-sans">
      {/* Панель керування глобальним часом */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold">
            <Clock size={20} className="text-blue-600" />
            <span>Синхронний інспектор часу</span>
          </div>

          <div className="flex items-center space-x-4">
            {currentScheduleStatus && (
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  currentScheduleStatus === 'ACTIVE' || currentScheduleStatus === 'active'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : currentScheduleStatus === 'DRAFT' || currentScheduleStatus === 'draft'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}>
                  {currentScheduleStatus === 'ACTIVE' || currentScheduleStatus === 'active'
                    ? 'Активний розклад' 
                    : currentScheduleStatus === 'DRAFT' || currentScheduleStatus === 'draft'
                    ? 'Чернетка' 
                    : currentScheduleStatus}
                </span>

                {(currentScheduleStatus === 'DRAFT' || currentScheduleStatus === 'draft') && currentScheduleId && (
                  <button 
                    onClick={handleActivateSchedule}
                    disabled={activateMutation.isPending}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-xs font-bold shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{activateMutation.isPending ? 'Активація...' : 'Затвердити'}</span>
                  </button>
                )}
              </div>
            )}

            <div className="text-2xl font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="1440"
          value={currentTime}
          onChange={(e) => setCurrentTime(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Роздача плоского масиву в презентаційні компоненти */}
      <LinearRouteMap 
        trips={displayTrips} 
        stopsCount={stopsCount} 
        currentTime={currentTime} 
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('gantt')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'gantt' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Діаграма Ганта
          </button>
          <button
            onClick={() => setActiveTab('deviations')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'deviations' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Матриця відхилень (Прохід 4)
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'gantt' ? (
            <GanttChart trips={displayTrips} duties={draftDuties} currentTime={currentTime} />
          ) : (
            <DeviationDashboard trips={displayTrips} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulePreviewPanel;
