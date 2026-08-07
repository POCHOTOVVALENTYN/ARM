import React from 'react';
import { DriverDuty } from '../../types';
import { timeToMinutes } from '../../utils/scheduleEngine';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, UserCheck } from 'lucide-react';

interface GanttChartProps {
  duties: DriverDuty[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ duties }) => {
  const START_MIN = 300;  // 05:00
  const END_MIN = 1380;  // 23:00
  const TOTAL_MIN = END_MIN - START_MIN;

  const getPercent = (timeStr: string) => {
    const min = timeToMinutes(timeStr);
    const clamped = Math.max(START_MIN, Math.min(END_MIN, min));
    return ((clamped - START_MIN) / TOTAL_MIN) * 100;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded text-xs border border-sky-500/30">
              Графік Ганта
            </span>
            <h3 className="text-white font-bold text-base">
              Контроль тривалості змін водіїв (Crew Roster)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Контроль дотримання КЗпП: граничний ліміт зміни — 10 годин (600 хв), вікно обіду — не раніше 4 год після початку.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-sky-500 rounded" />
            <span className="text-slate-300">Робочий час</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-slate-300">Обідня перерва</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-rose-500 rounded" />
            <span className="text-slate-300">Перевищення 10 год</span>
          </div>
        </div>
      </div>

      {/* Gantt Rows */}
      <div className="space-y-3">
        {duties.map((duty) => {
          const leftPct = getPercent(duty.shiftStartTime);
          const rightPct = getPercent(duty.shiftEndTime);
          const widthPct = Math.max(1, rightPct - leftPct);

          let lunchLeftPct = 0;
          let lunchWidthPct = 0;
          if (duty.lunchStartTime) {
            lunchLeftPct = getPercent(duty.lunchStartTime);
            const lunchEndMin = timeToMinutes(duty.lunchStartTime) + duty.lunchDurationMin;
            const lunchEndPct = getPercent(`${Math.floor(lunchEndMin / 60)}:${lunchEndMin % 60}`);
            lunchWidthPct = Math.max(1, lunchEndPct - lunchLeftPct);
          }

          const hoursWorked = (duty.totalShiftMin / 60).toFixed(1);
          const isOverLimit = duty.totalShiftMin > 600;

          // Dynamic 10-Hour Cap Calculation
          const shiftStartMin = timeToMinutes(duty.shiftStartTime);
          const limitMin = shiftStartMin + 600; // +10 hours
          const limitH = Math.floor(limitMin / 60) % 24;
          const limitM = limitMin % 60;
          const limitTimeStr = `${limitH.toString().padStart(2, '0')}:${limitM.toString().padStart(2, '0')}`;
          const limitPct = getPercent(limitTimeStr);

          return (
            <div
              key={duty.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                    <UserCheck className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm">
                      {duty.driverName}
                    </span>
                    <span className="text-slate-400 ml-2">
                      (Табельний № {duty.driverBadge})
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">
                    Зміна: <strong className="text-white">{duty.shiftStartTime} — {duty.shiftEndTime}</strong> ({hoursWorked} год)
                  </span>

                  {isOverLimit ? (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>ПОРУШЕННЯ (&gt;10 год)</span>
                    </span>
                  ) : (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Норма дотримані</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Timeline Bar Container */}
              <div className="relative h-6 bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                {/* 10-Hour Cap Line Indicator */}
                <div
                  className="absolute top-0 bottom-0 border-r-2 border-dashed border-rose-500 z-10"
                  style={{ left: `${limitPct}%` }}
                  title={`Граничний 10-годинний ліміт КЗпП (${limitTimeStr})`}
                />

                {/* Main Shift Bar */}
                <div
                  className={`absolute top-1 bottom-1 rounded-md transition-all ${
                    isOverLimit ? 'bg-gradient-to-r from-sky-600 via-rose-600 to-rose-700' : 'bg-sky-600'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />

                {/* Lunch Break Bar */}
                {duty.lunchStartTime && (
                  <div
                    className="absolute top-1 bottom-1 bg-purple-500 rounded border border-purple-300 z-20"
                    style={{ left: `${lunchLeftPct}%`, width: `${lunchWidthPct}%` }}
                    title={`Обід: ${duty.lunchStartTime} (${duty.lunchDurationMin} хв)`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
