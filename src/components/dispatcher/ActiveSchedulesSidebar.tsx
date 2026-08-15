import React from 'react';
import { useActiveSchedules } from '../../hooks/useScheduleQueries';
import { Map, Bus, Radio, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface ActiveSchedulesSidebarProps {
  onSelectRoute: (routeId: string, scheduleId?: number) => void;
  activeRouteId: string | null;
}

export const ActiveSchedulesSidebar: React.FC<ActiveSchedulesSidebarProps> = ({
  onSelectRoute,
  activeRouteId,
}) => {
  const { data: schedules, isLoading, isError, refetch } = useActiveSchedules();

  if (isLoading) {
    return (
      <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full p-4 space-y-3 font-sans">
        <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
          <span>Завантаження розкладів...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full p-4 text-xs font-sans">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Помилка завантаження активних розкладів</span>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-2 flex items-center justify-center space-x-1 bg-white border border-slate-300 py-1.5 rounded-lg font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Спробувати знову</span>
        </button>
      </div>
    );
  }

  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full font-sans">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Активні Маршрути
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              КП «ОМЕТ» • {schedules?.length || 0} ліній
            </span>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          title="Оновити список розкладів"
          className="text-slate-400 hover:text-blue-600 p-1 rounded-md transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List of Active Schedules */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
        {(!schedules || schedules.length === 0) ? (
          <div className="p-6 text-center text-slate-400 text-xs font-semibold">
            Немає активних розкладів у базі даних.
          </div>
        ) : (
          schedules.map((schedule) => {
            const isSelected = activeRouteId === schedule.route_id;
            const totalDuties = schedule.duties?.length || 0;
            const totalShifts = schedule.duties?.reduce((acc, d) => acc + (d.shifts?.length || 0), 0) || 0;

            return (
              <button
                key={schedule.id}
                onClick={() => onSelectRoute(schedule.route_id, schedule.id)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex flex-col space-y-1 border ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      {schedule.route_id}
                    </span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                      Маршрут №{schedule.route_id}
                    </span>
                  </div>

                  <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Активний</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pl-8 pt-0.5">
                  <span>Випусків: <strong>{totalDuties}</strong></span>
                  <span>Змін: <strong>{totalShifts}</strong></span>
                  <span className="font-mono text-[10px]">{schedule.active_date}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};

export default ActiveSchedulesSidebar;
