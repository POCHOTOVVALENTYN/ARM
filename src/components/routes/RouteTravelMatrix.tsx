import React, { useState } from 'react';
import { Route, TimePeriod } from '../../types';
import { useStationStore } from '../../store/useStationStore';
import { 
  Table as TableIcon, 
  AlertCircle, 
  Clock, 
  Save, 
  Zap, 
  CheckCircle2, 
  FileText,
  Info
} from 'lucide-react';

interface RouteTravelMatrixProps {
  route: Route;
  validationErrors: Record<string, string>;
  onUpdateSegmentTime: (
    routeId: string,
    segmentIndex: number,
    period: TimePeriod,
    value: number
  ) => { success: boolean; error?: string };
  onClearValidationError: (key: string) => void;
}

export const RouteTravelMatrix: React.FC<RouteTravelMatrixProps> = ({
  route,
  validationErrors,
  onUpdateSegmentTime,
  onClearValidationError,
}) => {
  const stations = useStationStore(state => state.stations);
  const [localTimes, setLocalTimes] = useState<Record<string, string>>({});
  const [activeCellError, setActiveCellError] = useState<string | null>(null);

  const timePeriods: { id: TimePeriod; label: string; sub: string; color: string }[] = [
    { id: 'morning_exit', label: 'Ранковий виїзд', sub: '05:00 - 06:30', color: 'text-gray-700 font-medium' },
    { id: 'morning_peak', label: 'Ранковий пік', sub: '06:30 - 09:30', color: 'text-amber-700 font-bold' },
    { id: 'off_peak', label: 'Міжпік', sub: '09:30 - 16:00', color: 'text-gray-700 font-medium' },
    { id: 'evening_peak', label: 'Вечірній пік', sub: '16:00 - 19:30', color: 'text-amber-700 font-bold' },
    { id: 'evening_decline', label: 'Вечірній спад', sub: '19:30 - 22:30', color: 'text-sky-700 font-medium' },
  ];

  // Calculate totals for each period
  const calculateTotals = () => {
    const totals: Record<TimePeriod, number> = {
      morning_exit: 0,
      morning_peak: 0,
      off_peak: 0,
      evening_peak: 0,
      evening_decline: 0,
    };

    route.segments.forEach((seg) => {
      timePeriods.forEach((p) => {
        totals[p.id] += Number(seg.baseTravelTimes[p.id] || 0);
      });
    });

    return totals;
  };

  const totals = calculateTotals();

  // Handle inline change
  const handleChange = (
    segIdx: number,
    period: TimePeriod,
    valStr: string
  ) => {
    const key = `${route.id}-${segIdx}-${period}`;
    setLocalTimes((prev) => ({ ...prev, [key]: valStr }));

    const numVal = parseFloat(valStr);

    if (valStr.trim() === '' || isNaN(numVal) || numVal <= 0) {
      setActiveCellError(`Увага! Час ходу на перегоні повинен бути більшим за 0 хв. (Введено: "${valStr}")`);
      onUpdateSegmentTime(route.id, segIdx, period, numVal);
    } else {
      setActiveCellError(null);
      onUpdateSegmentTime(route.id, segIdx, period, numVal);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-2 border-gray-900 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <span className="bg-indigo-100 text-indigo-800 font-mono font-bold text-xs px-3 py-1 rounded-md border border-indigo-300">
              {route.type === 'tram' ? 'Трамвай №' : 'Тролейбус №'}{route.number}
            </span>
            <h2 className="text-xl font-bold text-gray-900">
              Матриця часу ходу по перегонах (Зупинка → Зупинка)
            </h2>
          </div>
          <p className="text-xs text-gray-600 font-sans">
            Інтерактивна таблиця нормування часу ходу. Зміни в комірках зберігаються inline та автоматично перераховують оборотний рейс.
          </p>
        </div>
      </div>

      {/* Validation Error Alert Banner */}
      {(activeCellError || Object.keys(validationErrors).length > 0) && (
        <div className="bg-rose-50 border-2 border-rose-600 rounded-xl p-4 text-xs text-rose-800 flex items-center space-x-3 shadow-xs animate-shake">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong className="font-bold text-rose-900 block">Помилка валідації часу ходу!</strong>
            <span>{activeCellError || 'Знайдено недопустимі значення в матриці (час ходу повинен бути strictly > 0 хв).'}</span >
          </div>
        </div>
      )}

      {/* Interactive Matrix Table */}
      <div className="bg-white border-2 border-gray-900 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-900 text-white font-mono text-xs flex justify-between items-center border-b-2 border-gray-900">
          <div className="flex items-center space-x-2">
            <TableIcon className="w-4 h-4 text-indigo-400" />
            <span className="font-bold uppercase tracking-wider">
              Перегони та нормативний час ходу (у хвилинах)
            </span>
          </div>
          <span className="text-gray-400 text-[11px]">
            Всього перегонів: {route.segments.length}
          </span>
        </div>

        <div className="overflow-x-auto min-w-[1100px]">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-100 text-gray-800 font-mono text-[11px] border-b-2 border-gray-300">
              <tr>
                <th className="p-3 w-12 text-center">№</th>
                <th className="p-3 min-w-[220px]">Сегмент перегону</th>
                <th className="p-3 w-28 text-center">Відстань / Світлофори</th>
                {timePeriods.map((p) => (
                  <th key={p.id} className="p-3 text-center min-w-[130px]">
                    <div className={p.color}>{p.label}</div>
                    <div className="text-[10px] text-gray-500 font-normal">{p.sub}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono">
              {route.segments.map((seg, idx) => {
                const fromSt = stations.find((s) => s.id === seg.fromStationId)?.name || seg.fromStationId;
                const toSt = stations.find((s) => s.id === seg.toStationId)?.name || seg.toStationId;

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {/* Index */}
                    <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>

                    {/* From -> To */}
                    <td className="p-3 font-sans font-bold text-gray-900">
                      <div className="flex items-center space-x-1.5">
                        <span>{fromSt}</span>
                        <span className="text-indigo-600 font-mono font-bold">→</span>
                        <span>{toSt}</span>
                      </div>
                      {seg.isSharedSegment && (
                        <span className="text-[10px] text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 mt-0.5 inline-block">
                          Спільний з: {seg.sharedWithRoutes.join(', ')}
                        </span>
                      )}
                    </td>

                    {/* Distance & Traffic lights */}
                    <td className="p-3 text-center text-gray-700">
                      <div className="font-bold">{seg.distanceKm} км</div>
                      <div className="text-[10px] text-gray-500">
                        {seg.trafficLightCount} світлоф. ({seg.avgTrafficLightDelayMin} хв)
                      </div>
                    </td>

                    {/* Editable period cells */}
                    {timePeriods.map((p) => {
                      const key = `${route.id}-${idx}-${p.id}`;
                      const hasError = !!validationErrors[key];
                      const currentValue =
                        localTimes[key] !== undefined
                          ? localTimes[key]
                          : seg.baseTravelTimes[p.id];

                      return (
                        <td key={p.id} className="p-2 text-center">
                          <div className="relative inline-block w-20">
                            <input
                              type="number"
                              step="0.5"
                              min="0.1"
                              value={currentValue}
                              onChange={(e) => handleChange(idx, p.id, e.target.value)}
                              className={`w-full text-center font-mono font-bold text-sm p-1.5 rounded-md border-2 transition-all focus:outline-none focus:ring-2 ${
                                hasError
                                  ? 'bg-rose-100 border-rose-600 text-rose-900 focus:ring-rose-500 animate-pulse'
                                  : 'bg-gray-50 border-gray-300 text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-indigo-500'
                              }`}
                            />
                            {hasError && (
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-rose-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                                час &gt; 0 хв!
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row */}
            <tfoot className="bg-indigo-50 border-t-2 border-gray-900 font-mono text-xs">
              <tr>
                <td colSpan={3} className="p-3.5 font-bold text-right text-gray-900 uppercase tracking-wider">
                  Всього час ходу в один бік (Т_один_бік):
                </td>
                {timePeriods.map((p) => (
                  <td key={p.id} className="p-3.5 text-center font-extrabold text-indigo-900 text-sm">
                    {totals[p.id]} хв
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-900 text-white">
                <td colSpan={3} className="p-3.5 font-bold text-right uppercase tracking-wider text-amber-300">
                  Орієнтовний час оборотного рейсу T_rev (з диспетчерською відміткою 2 хв):
                </td>
                {timePeriods.map((p) => (
                  <td key={p.id} className="p-3.5 text-center font-mono font-bold text-emerald-400 text-sm">
                    {totals[p.id] * 2 + 2} хв
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Explanatory Info Card */}
      <div className="bg-gray-50 border border-gray-300 rounded-xl p-4 text-xs text-gray-700 flex items-start space-x-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold text-gray-900 block">Як працює інтерактивна матриця:</strong>
          <p>
            1. Для зміни часу ходу просто клацніть по відповідній комірці та введіть необхідне значення у хвилинах.<br />
            2. Система підтримує дробові числа (наприклад, <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">7.5</code> хв).<br />
            3. Значення повинні бути strictly більшими за <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">&gt; 0</code>. При введенні від'ємного значення або нуля спрацьовує автоматична валідація.<br />
            4. Оборотний рейс <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">T_rev</code> автоматично перераховується для всіх 5 періодів доби.
          </p>
        </div>
      </div>
    </div>
  );
};
