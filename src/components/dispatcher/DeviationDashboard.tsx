import React, { useMemo } from 'react';

import { Trip } from '../../types';

interface DeviationDashboardProps {
  trips: Trip[];
}

export const DeviationDashboard: React.FC<DeviationDashboardProps> = ({ trips }) => {
  // Виділяємо лише змінені рейси і сортуємо за величиною дельти (за модулем)
  const deviations = useMemo(() => {
    return trips
      .filter(t => t.smoothing_state && t.smoothing_state !== 'normal')
      .sort((a, b) => Math.abs(b.smoothing_delta || 0) - Math.abs(a.smoothing_delta || 0));
  }, [trips]);

  if (deviations.length === 0) {
    return (
      <div className="p-6 bg-slate-50 text-slate-500 rounded border border-slate-200 text-center">
        Алгоритм згладжування не застосовувався. Розклад ідеальний.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
          <tr>
            <th className="px-4 py-3">№ Наряду</th>
            <th className="px-4 py-3">Рейс ID</th>
            <th className="px-4 py-3">Напрямок</th>
            <th className="px-4 py-3">Операція</th>
            <th className="px-4 py-3">Дельта (хв)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {deviations.map((trip) => (
            <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-800">{trip.duty_id}</td>
              <td className="px-4 py-3 text-slate-500 font-mono">{trip.id}</td>
              <td className="px-4 py-3">
                {trip.direction === 'FORWARD' ? 'Прямий' : 'Зворотній'}
              </td>
              <td className="px-4 py-3">
                {trip.smoothing_state === 'delay' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                    Відтяжка
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                    Нагін
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-mono font-semibold">
                {trip.smoothing_state === 'delay' ? (
                  <span className="text-orange-600">+{trip.smoothing_delta}</span>
                ) : (
                  <span className="text-blue-600">-{Math.abs(trip.smoothing_delta || 0)}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
