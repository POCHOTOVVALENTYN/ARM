import React, { useState } from 'react';
import { 
  Clock, 
  Bus, 
  RotateCcw, 
  Coffee, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';

interface OperationalTask {
  id: string;
  duty_number: number;
  vehicle_id: string;
  driver_name: string;
  type: 'TRIP' | 'LUNCH' | 'SHORT_TURN' | 'PULL_OUT' | 'PULL_IN';
  label: string;
  start_min: number; // minutes from 05:00
  duration_min: number;
  color: string;
  is_active_detour?: boolean;
  deviation_min?: number;
}

export const OperationalGanttView: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('7');

  const { data: ganttData = [], isLoading, refetch } = useQuery<OperationalTask[]>({
    queryKey: ['operational-gantt-tasks', selectedRouteId],
    queryFn: async () => {
      // Mock data for rich live demonstration
      return [
        { id: 't1', duty_number: 1, vehicle_id: '4001', driver_name: 'Петренко О.М.', type: 'PULL_OUT', label: '🚩 Виїзд z депо', start_min: 30, duration_min: 25, color: '#6366f1' },
        { id: 't2', duty_number: 1, vehicle_id: '4001', driver_name: 'Петренко О.М.', type: 'TRIP', label: 'Рейс №1 Паустовського → Пастера', start_min: 55, duration_min: 42, color: '#10b981', deviation_min: 1.2 },
        { id: 't3', duty_number: 1, vehicle_id: '4001', driver_name: 'Петренко О.М.', type: 'TRIP', label: 'Рейс №2 Пастера → Паустовського', start_min: 97, duration_min: 42, color: '#10b981', deviation_min: 0.5 },
        { id: 't4', duty_number: 1, vehicle_id: '4001', driver_name: 'Петренко О.М.', type: 'LUNCH', label: '☕ Обід на ДП Паустовського', start_min: 139, duration_min: 15, color: '#f59e0b' },
        
        { id: 't5', duty_number: 2, vehicle_id: '4002', driver_name: 'Ковальчук В.І.', type: 'PULL_OUT', label: '🚩 Виїзд z депо', start_min: 36, duration_min: 25, color: '#6366f1' },
        { id: 't6', duty_number: 2, vehicle_id: '4002', driver_name: 'Ковальчук В.І.', type: 'TRIP', label: 'Рейс №1 Паустовського → Пастера', start_min: 61, duration_min: 42, color: '#10b981' },
        { id: 't7', duty_number: 2, vehicle_id: '4002', driver_name: 'Ковальчук В.І.', type: 'SHORT_TURN', label: '🌀 Розворот Лузанівка (НС ДТП)', start_min: 103, duration_min: 20, color: '#ef4444', is_active_detour: true, deviation_min: 6.5 },

        { id: 't8', duty_number: 3, vehicle_id: '4003', driver_name: 'Сидоренко Г.П.', type: 'PULL_OUT', label: '🚩 Виїзд z депо', start_min: 42, duration_min: 25, color: '#6366f1' },
        { id: 't9', duty_number: 3, vehicle_id: '4003', driver_name: 'Сидоренко Г.П.', type: 'TRIP', label: 'Рейс №1 Паустовського → Пастера', start_min: 67, duration_min: 42, color: '#10b981', deviation_min: -1.8 },
      ] as OperationalTask[];
    }
  });

  const totalMinSpan = 18 * 60; // 05:00 to 23:00 (1080 min)
  const hoursMarks = Array.from({ length: 19 }, (_, i) => i + 5); // 5..23

  const duties = Array.from(new Set(ganttData.map(t => t.duty_number))).sort((a, b) => a - b);

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-purple-600 text-white font-black text-[11px] uppercase tracking-wider">
                LIVE GANTT CAD/AVL
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span>Оперативна Діаграма Ганта Випусків та Відхилень</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Співставлення графікового часу з фактичним виконанням руху, об'їздами та розворотами
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <select
              value={selectedRouteId}
              onChange={e => setSelectedRouteId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="7">🚊 Маршрут №7</option>
              <option value="18">🚊 Маршрут №18</option>
              <option value="5">🚊 Маршрут №5</option>
              <option value="28">🚊 Маршрут №28</option>
              <option value="8">🚎 Маршрут №8</option>
            </select>

            <button
              onClick={() => refetch()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Оновити Ґант</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded bg-indigo-600" />
            <span>Нульовий виїзд</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
            <span>Рейси в графіку</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded bg-amber-500" />
            <span>Обід на ДП</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded bg-red-500" />
            <span>Оперативний розворот (НС)</span>
          </div>
        </div>

        {/* Timeline Chart Container */}
        <div className="overflow-x-auto pt-2 pb-4">
          <div className="min-w-[1000px] space-y-3 font-mono text-xs">
            {/* Hours Header Row */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 pb-2 text-[10px] text-slate-400 font-bold">
              <div className="w-36 shrink-0 font-sans uppercase">Наряд / Вагон</div>
              <div className="flex-1 flex justify-between relative pl-2">
                {hoursMarks.map(h => (
                  <span key={h} className="text-center w-8">
                    {h < 10 ? `0${h}:00` : `${h}:00`}
                  </span>
                ))}
              </div>
            </div>

            {/* Duties Rows */}
            {duties.map(dNum => {
              const dTasks = ganttData.filter(t => t.duty_number === dNum);
              const sample = dTasks[0] || { vehicle_id: '4001', driver_name: 'Водій' };

              return (
                <div key={dNum} className="flex items-center hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 rounded-xl transition-colors">
                  <div className="w-36 shrink-0 font-sans text-xs font-black text-slate-800 dark:text-slate-200">
                    <div>Наряд №{dNum}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                      Вг-{sample.vehicle_id}
                    </div>
                  </div>

                  <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl relative overflow-hidden">
                    {dTasks.map(task => {
                      const leftPercent = (task.start_min / totalMinSpan) * 100;
                      const widthPercent = (task.duration_min / totalMinSpan) * 100;

                      return (
                        <div
                          key={task.id}
                          style={{
                            left: `${Math.max(0, leftPercent)}%`,
                            width: `${Math.max(1.5, widthPercent)}%`,
                            backgroundColor: task.color
                          }}
                          className={`absolute top-1 bottom-1 rounded-lg text-[10px] text-white font-bold flex items-center px-1.5 truncate shadow-2xs ${
                            task.is_active_detour ? 'animate-pulse ring-2 ring-red-400' : ''
                          }`}
                          title={`${task.label} (${task.duration_min} хв)`}
                        >
                          {task.label}
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
    </div>
  );
};

export default OperationalGanttView;
