import React, { useState } from 'react';
import { 
  Bus, 
  Clock, 
  Plus, 
  Calendar,
  Layers,
  Coffee,
  CheckCircle2,
  Building2,
  Info,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';

interface GanttTask {
  duty_id: string;
  duty_number: number;
  type: 'PULL_OUT' | 'TRIP' | 'LUNCH' | 'SHIFT_CHANGE' | 'PULL_IN';
  label: string;
  start_min: number;
  end_min: number;
  start_time: string;
  end_time: string;
  color: string;
}

interface StaticScheduleResponse {
  kpi: {
    route_id: string;
    route_name: string;
    route_type: string;
    vehicles_count: number;
    round_trip_min: number;
    headway_min: number;
    standard_break_min: number;
    designated_break_hub: string;
    total_duties_count: number;
    total_daily_trips: number;
    total_daily_km: number;
  };
  columns: any[];
  gantt_tasks: GanttTask[];
}

export const DutyBuilderView: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('7');
  const [vehiclesCount, setVehiclesCount] = useState<number>(14);

  // Fetch static schedule calculation for Gantt visualization
  const { data, isLoading } = useQuery<StaticScheduleResponse>({
    queryKey: ['gantt-schedule', selectedRouteId, vehiclesCount],
    queryFn: async () => {
      const res = await apiClient.post('/api/v1/schedules/calculate-static', {
        route_id: selectedRouteId,
        vehicles_count: vehiclesCount,
        day_type: 'WORKDAY',
        start_time: '05:30',
        end_time: '23:30'
      });
      return res.data;
    }
  });

  const ganttTasks = data?.gantt_tasks || [];
  const kpi = data?.kpi;

  // Group tasks by duty_id
  const dutiesGrouped: { [dutyId: string]: GanttTask[] } = {};
  ganttTasks.forEach(t => {
    if (!dutiesGrouped[t.duty_id]) {
      dutiesGrouped[t.duty_id] = [];
    }
    dutiesGrouped[t.duty_id].push(t);
  });

  const dutyIds = Object.keys(dutiesGrouped);

  // Time ruler: 05:00 to 24:00 (330 min to 1440 min = 1110 total mins)
  const START_MIN = 300; // 05:00
  const END_MIN = 1440;  // 24:00
  const TOTAL_SPAN = END_MIN - START_MIN;

  const hoursRuler = [];
  for (let h = 5; h <= 24; h++) {
    hoursRuler.push(h);
  }

  const getPositionStyle = (startMin: number, endMin: number) => {
    const leftPct = Math.max(0, ((startMin - START_MIN) / TOTAL_SPAN) * 100);
    const widthPct = Math.max(0.5, ((endMin - startMin) / TOTAL_SPAN) * 100);
    return {
      left: `${leftPct}%`,
      width: `${widthPct}%`
    };
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Діаграма Ганта випусків та змін водіїв (Gantt Shift Chart)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Візуалізація робочого часу нарядів, тривалості 1-ї та 2-ї змін, обідів (15 хв трамвай / 20 хв тролейбус) та перезмінок
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Маршрут:</label>
              <select
                value={selectedRouteId}
                onChange={e => setSelectedRouteId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-slate-900 dark:text-white"
              >
                <option value="7">Трамвай №7 (Паустовського ⇄ Херсонський сквер)</option>
                <option value="18">Трамвай №18 (Куликове поле ⇄ 16-та ст. Фонтану)</option>
                <option value="28">Трамвай №28 (Парк Шевченка ⇄ вул. Пастера)</option>
                <option value="5">Трамвай №5 (Аркадія ⇄ Автовокзал)</option>
                <option value="8">Тролейбус №8 (Вокзал ⇄ вул. Інглезі)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Наряди ($N$):</label>
              <input
                type="number"
                min="1"
                max="30"
                value={vehiclesCount}
                onChange={e => setVehiclesCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Legend bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-600 shrink-0 inline-block"></span>
            <span>Нульовий виїзд (15 хв)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 shrink-0 inline-block"></span>
            <span>Рейс на лінії</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500 shrink-0 inline-block"></span>
            <span>Обід водія ({kpi?.standard_break_min || 15} хв)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-purple-600 shrink-0 inline-block"></span>
            <span>Перезмінка водіїв</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-500 shrink-0 inline-block"></span>
            <span>Заїзд у депо</span>
          </div>
        </div>
      </div>

      {/* Gantt Canvas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-x-auto">
        <div className="min-w-[1000px] space-y-3">
          {/* Time Ruler */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-700 pb-2 text-[11px] font-mono font-bold text-slate-500">
            <div className="w-28 shrink-0">Наряд</div>
            <div className="flex-1 relative h-6">
              {hoursRuler.map(h => {
                const pct = ((h * 60 - START_MIN) / TOTAL_SPAN) * 100;
                return (
                  <div
                    key={h}
                    className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${pct}%` }}
                  >
                    <span>{String(h).padStart(2, '0')}:00</span>
                    <span className="w-[1px] h-2 bg-slate-300 dark:bg-slate-700 mt-1"></span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duty Lanes */}
          {dutyIds.map(dutyId => {
            const tasks = dutiesGrouped[dutyId] || [];
            return (
              <div
                key={dutyId}
                className="flex items-center py-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors border-b border-slate-100 dark:border-slate-800/60"
              >
                {/* Lane Header */}
                <div className="w-28 shrink-0 space-y-0.5">
                  <div className="font-black text-xs text-slate-900 dark:text-white">
                    Наряд {dutyId}
                  </div>
                  <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                    {tasks.length > 0 ? `${tasks[0].start_time} - ${tasks[tasks.length - 1].end_time}` : ''}
                  </div>
                </div>

                {/* Timeline Bar Container */}
                <div className="flex-1 relative h-8 bg-slate-100 dark:bg-slate-800/60 rounded-xl overflow-hidden">
                  {tasks.map((t, idx) => {
                    const style = getPositionStyle(t.start_min, t.end_min);
                    return (
                      <div
                        key={idx}
                        className="absolute top-1 bottom-1 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-2xs transition-all hover:scale-y-105 cursor-pointer group"
                        style={{ ...style, backgroundColor: t.color }}
                        title={`${t.label} (${t.start_time} - ${t.end_time})`}
                      >
                        {t.type === 'LUNCH' && (
                          <Coffee className="w-3 h-3 text-white shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DutyBuilderView;
