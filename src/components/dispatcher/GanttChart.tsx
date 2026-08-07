import React, { useState } from 'react';
import { DriverDuty, TransportType } from '../../types';
import { timeToMinutes, validateDriverDuty } from '../../utils/scheduleEngine';
import { AlertCircle, CheckCircle2, Clock, ShieldAlert, UserCheck, Coffee, Zap, Layers, User } from 'lucide-react';

interface GanttChartProps {
  duties: DriverDuty[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ duties }) => {
  const [viewMode, setViewMode] = useState<'driver' | 'vehicle'>('driver');
  const START_MIN = 300;  // 05:00
  const END_MIN = 1380;  // 23:00
  const TOTAL_MIN = END_MIN - START_MIN;

  const getPercent = (timeStr: string) => {
    const min = timeToMinutes(timeStr);
    const clamped = Math.max(START_MIN, Math.min(END_MIN, min));
    return ((clamped - START_MIN) / TOTAL_MIN) * 100;
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4 brutalist-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded text-xs border border-sky-500/30">
              Графік Ґантта v2.0
            </span>
            <h3 className="text-white font-bold text-base">
              {viewMode === 'driver' ? 'Режим Водіїв (Crew Roster & Breaks)' : 'Режим Вагонів (Vehicle Blocks & Turnaround)'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Контроль обіду в вікні 4–6 год, стандарти обіду (10-15 хв трамвай, 20 хв тролейбус) та граничний 10-год ліміт КЗпП.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Mode Switcher */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold font-mono">
            <button
              onClick={() => setViewMode('driver')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-all ${
                viewMode === 'driver' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Водії</span>
            </button>
            <button
              onClick={() => setViewMode('vehicle')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 cursor-pointer transition-all ${
                viewMode === 'vehicle' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Вагони</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-sky-500 rounded" />
            <span className="text-slate-300">Робочий час (Рух)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-purple-500 rounded" />
            <span className="text-slate-300">Нормативний обід (10-15 / 20 хв)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-amber-500 rounded" />
            <span className="text-slate-300">Понаднормовий обід (&gt;норма)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 bg-rose-500 rounded" />
            <span className="text-slate-300">Порушення (10 год / Вікно обіду)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Шкала: 05:00 — 23:00 (18 годин)
        </span>
      </div>

      {/* Gantt Rows */}
      <div className="space-y-3">
        {duties.map((rawDuty) => {
          const type: TransportType = rawDuty.transportType || 'tram';
          const duty = validateDriverDuty(rawDuty, type);

          const leftPct = getPercent(duty.shiftStartTime);
          const rightPct = getPercent(duty.shiftEndTime);
          const widthPct = Math.max(1, rightPct - leftPct);

          let lunchLeftPct = 0;
          let lunchWidthPct = 0;
          let overtimeWidthPct = 0;

          if (duty.lunchStartTime) {
            lunchLeftPct = getPercent(duty.lunchStartTime);
            const stdLunchMin = duty.standardLunchMin || 15;
            const stdEndMin = timeToMinutes(duty.lunchStartTime) + stdLunchMin;
            const stdEndPct = getPercent(`${Math.floor(stdEndMin / 60)}:${stdEndMin % 60}`);
            lunchWidthPct = Math.max(0.8, stdEndPct - lunchLeftPct);

            if (duty.overtimeLunchMin && duty.overtimeLunchMin > 0) {
              const otEndMin = stdEndMin + duty.overtimeLunchMin;
              const otEndPct = getPercent(`${Math.floor(otEndMin / 60)}:${otEndMin % 60}`);
              overtimeWidthPct = Math.max(0.5, otEndPct - stdEndPct);
            }
          }

          const hoursWorked = (duty.totalShiftMin / 60).toFixed(1);

          // 10-Hour Limit Indicator Position
          const shiftStartMin = timeToMinutes(duty.shiftStartTime);
          const limitMin = shiftStartMin + 600; // +10 hours
          const limitH = Math.floor(limitMin / 60) % 24;
          const limitM = limitMin % 60;
          const limitTimeStr = `${limitH.toString().padStart(2, '0')}:${limitM.toString().padStart(2, '0')}`;
          const limitPct = getPercent(limitTimeStr);

          // 4h - 6h Lunch Window Indicators
          const minLunchStartPct = getPercent(
            `${Math.floor((shiftStartMin + 240) / 60)}:${(shiftStartMin + 240) % 60}`
          );
          const maxLunchStartPct = getPercent(
            `${Math.floor((shiftStartMin + 360) / 60)}:${(shiftStartMin + 360) % 60}`
          );

          return (
            <div
              key={duty.id}
              className={`bg-slate-900/80 border rounded-xl p-3 space-y-2 transition-all ${
                duty.isViolating10hLimit || duty.lunchWindowViolation
                  ? 'border-rose-900/80 bg-rose-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
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
                      (Таб. № {duty.driverBadge} — {type === 'tram' ? 'Трамвай' : type === 'trolleybus' ? 'Тролейбус' : 'Електробус'})
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400">
                    Зміна: <strong className="text-white">{duty.shiftStartTime} — {duty.shiftEndTime}</strong> ({hoursWorked} год)
                  </span>

                  {duty.isViolating10hLimit && (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>&gt;10 год КЗпП</span>
                    </span>
                  )}

                  {duty.lunchWindowViolation && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Порушено вікно обіду (4-6г)</span>
                    </span>
                  )}

                  {!duty.isViolating10hLimit && !duty.lunchWindowViolation && (
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Норми дотримані</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Timeline Bar Container */}
              <div className="relative h-7 bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                {/* 4h - 6h Preferred Lunch Window Range */}
                <div
                  className="absolute top-0 bottom-0 bg-indigo-900/20 border-x border-indigo-500/30 z-0"
                  style={{
                    left: `${minLunchStartPct}%`,
                    width: `${Math.max(0, maxLunchStartPct - minLunchStartPct)}%`,
                  }}
                  title="Нормативне вікно обіду (від 4 до 6 годин зміни)"
                />

                {/* 10-Hour Cap Line Indicator */}
                <div
                  className="absolute top-0 bottom-0 border-r-2 border-dashed border-rose-500 z-10"
                  style={{ left: `${limitPct}%` }}
                  title={`Граничний 10-годинний ліміт КЗпП (${limitTimeStr})`}
                />

                {/* Main Shift Bar */}
                <div
                  className={`absolute top-1 bottom-1 rounded-md transition-all ${
                    duty.isViolating10hLimit ? 'bg-gradient-to-r from-sky-600 via-rose-600 to-rose-700' : 'bg-sky-600'
                  }`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                />

                {/* Standard Lunch Break Bar */}
                {duty.lunchStartTime && (
                  <div
                    className="absolute top-1 bottom-1 bg-purple-500 rounded border border-purple-300 z-20"
                    style={{ left: `${lunchLeftPct}%`, width: `${lunchWidthPct}%` }}
                    title={`Нормативний обід: ${duty.lunchStartTime} (${duty.standardLunchMin} хв) на станції ${duty.lunchLocationName || 'Старосінна пл.'}`}
                  />
                )}

                {/* Overtime Lunch Break Bar */}
                {duty.overtimeLunchMin && duty.overtimeLunchMin > 0 && (
                  <div
                    className="absolute top-1 bottom-1 bg-amber-500 rounded border border-amber-300 z-20"
                    style={{ left: `${lunchLeftPct + lunchWidthPct}%`, width: `${overtimeWidthPct}%` }}
                    title={`Понаднормовий обід (+${duty.overtimeLunchMin} хв) — зараховано в робочий час`}
                  />
                )}
              </div>

              {/* Extra Info Sub-bar */}
              {duty.lunchStartTime && (
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-0.5">
                  <span className="flex items-center space-x-1">
                    <Coffee className="w-3 h-3 text-purple-400" />
                    <span>
                      Обід: {duty.lunchStartTime} ({duty.lunchDurationMin} хв, з них понаднормово: +{duty.overtimeLunchMin || 0} хв)
                    </span>
                  </span>
                  <span>Локація: {duty.lunchLocationName || 'Старосінна площа (Вузол)'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
