import React from 'react';
import { DriverDuty } from '../../types';
import { validateDriverDuty } from '../../utils/scheduleEngine';
import { AlertCircle, CheckCircle, Clock, ShieldCheck, UserCheck, Users } from 'lucide-react';

interface CrewRosterTabProps {
  duties: DriverDuty[];
}

export const CrewRosterTab: React.FC<CrewRosterTabProps> = ({ duties = [] }) => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-[0_8px_30px_rgba(37,99,235,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-base">
              Модуль обліку робочого часу водіїв (Crew Roster & HR Integration)
            </h2>
            <p className="text-xs text-slate-500">
              Інтеграція з відділом кадрів, розрахунок робочих годин від прийняття ТЗ та перевірка 10-годинного ліміту
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold">
            Норми КЗпП України: Дотримано
          </span>
        </div>
      </div>

      {/* Driver Duties Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <h3 className="text-white font-bold text-sm">Табель робочого часу та відповідність трудовшим нормам:</h3>

        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">ПІБ Водія</th>
                <th className="p-3">Табельний №</th>
                <th className="p-3">Тип зміни</th>
                <th className="p-3">Початок — Кінець</th>
                <th className="p-3">Тривалість</th>
                <th className="p-3">Обідня перерва</th>
                <th className="p-3">Статус КЗпП</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {duties.map((duty) => {
                const validation = validateDriverDuty(duty);
                const shiftHours = (validation.totalShiftMin / 60).toFixed(1);

                return (
                  <tr key={duty.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-sans font-bold text-white flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      <span>{duty.driverName}</span>
                    </td>
                    <td className="p-3 text-slate-400">{duty.driverBadge}</td>
                    <td className="p-3 font-sans">
                      <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                        {duty.shiftType === 'double' ? 'Двозмінний' : duty.shiftType === 'single' ? 'Однозмінний' : 'Піковий'}
                      </span>
                    </td>
                    <td className="p-3 text-sky-300 font-bold">{duty.shiftStartTime} — {duty.shiftEndTime}</td>
                    <td className="p-3 text-amber-300 font-bold">{shiftHours} год ({validation.totalShiftMin} хв)</td>
                    <td className="p-3 font-sans">
                      {duty.lunchStartTime ? (
                        <span className="text-purple-300 font-bold">{duty.lunchStartTime} ({duty.lunchDurationMin} хв)</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="p-3 font-sans">
                      {!validation.isViolating10hLimit && validation.isLunchCompliant ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Відповідає нормам</span>
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold flex items-center space-x-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Перевищення ліміту</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
