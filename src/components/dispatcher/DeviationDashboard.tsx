import React, { useState, useMemo } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Clock, ArrowRightLeft } from 'lucide-react';

export const DeviationDashboard: React.FC = () => {
  const blocks = useScheduleStore((state) => state.draftBlocks);
  const [sortBy, setSortBy] = useState<'time' | 'delta'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract all non-normal trips
  const deviations = useMemo(() => {
    const list: Array<{
      id: string;
      dutyId: string;
      blockId: string;
      direction: string | number;
      smoothingState: string;
      smoothingDelta: number;
      timeStr: string;
      timeMin: number;
    }> = [];

    blocks.forEach((block) => {
      block.trips.forEach((trip) => {
        if (trip.smoothing_state === 'delay' || trip.smoothing_state === 'catchup') {
          // Calculate time in minutes for sorting
          const [h, m] = trip.departureTime.split(':').map(Number);
          const timeMin = h * 60 + m;

          list.push({
            id: trip.id,
            dutyId: trip.dutyId || trip.duty_id || 'N/A',
            blockId: block.id,
            direction: trip.direction,
            smoothingState: trip.smoothing_state,
            smoothingDelta: trip.smoothing_delta || 0,
            timeStr: trip.departureTime,
            timeMin,
          });
        }
      });
    });

    // Sort the list
    return list.sort((a, b) => {
      if (sortBy === 'time') {
        return sortOrder === 'asc' ? a.timeMin - b.timeMin : b.timeMin - a.timeMin;
      } else {
        // sort by delta absolute value or just raw value? Let's sort by magnitude of delta
        return sortOrder === 'asc' 
          ? Math.abs(a.smoothingDelta) - Math.abs(b.smoothingDelta)
          : Math.abs(b.smoothingDelta) - Math.abs(a.smoothingDelta);
      }
    });
  }, [blocks, sortBy, sortOrder]);

  const handleSort = (field: 'time' | 'delta') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending when switching to delta (biggest first)
    }
  };

  if (deviations.length === 0) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-xl text-center text-slate-400 brutalist-card">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <Clock className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h3 className="text-white font-bold text-lg mb-1">Відхилення відсутні</h3>
        <p className="text-sm">Алгоритм згладжування не застосовував відтяжок або нагонів. Розклад ідеальний.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 brutalist-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center space-x-2">
            <span>Матриця Відхилень</span>
            <span className="bg-rose-500/20 text-rose-300 text-xs px-2 py-0.5 rounded border border-rose-500/30">
              {deviations.length} рейсів змінено
            </span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Аналітичний зріз застосованих затримок та прискорень (Elastic Smoother)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">№ Наряду / Блоку</th>
              <th className="px-4 py-3">Напрямок</th>
              <th className="px-4 py-3">Тип відхилення</th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => handleSort('time')}
              >
                <div className="flex items-center space-x-1">
                  <span>Час (Відправлення)</span>
                  {sortBy === 'time' && (
                    sortOrder === 'asc' ? <ArrowUpNarrowWide className="w-3.5 h-3.5" /> : <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-slate-800 transition-colors"
                onClick={() => handleSort('delta')}
              >
                <div className="flex items-center space-x-1">
                  <span>Дельта (хв)</span>
                  {sortBy === 'delta' && (
                    sortOrder === 'asc' ? <ArrowUpNarrowWide className="w-3.5 h-3.5" /> : <ArrowDownWideNarrow className="w-3.5 h-3.5" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {deviations.map((dev) => {
              const isDelay = dev.smoothingState === 'delay';
              const directionName = dev.direction === 'FORWARD' || dev.direction === 1 ? 'Прямий' : 'Зворотній';
              
              return (
                <tr key={`${dev.id}`} className="hover:bg-slate-900/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-300">
                    <span className="text-white">{dev.dutyId}</span> <span className="text-slate-500">({dev.blockId})</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                      <span>{directionName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isDelay ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-orange-950/50 text-orange-400 border border-orange-500/30 text-xs font-bold">
                        Відтяжка
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-950/50 text-blue-400 border border-blue-500/30 text-xs font-bold">
                        Нагін
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-white">
                    {dev.timeStr}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">
                    {isDelay ? (
                      <span className="text-orange-400">+{dev.smoothingDelta.toFixed(1)}</span>
                    ) : (
                      <span className="text-blue-400">-{Math.abs(dev.smoothingDelta).toFixed(1)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
