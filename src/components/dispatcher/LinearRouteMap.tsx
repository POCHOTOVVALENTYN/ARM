import React, { useMemo } from 'react';
import { TramFront } from 'lucide-react';
import { Trip } from '../../types';

interface LinearRouteMapProps {
  trips: Trip[];
  stopsCount: number;
  currentTime: number; // Отримуємо з батьківського компонента
}

export const LinearRouteMap: React.FC<LinearRouteMapProps> = ({ trips, stopsCount, currentTime }) => {
  const STATE_COLORS: Record<string, string> = {
    normal: 'text-emerald-600 bg-emerald-100 border-emerald-600',
    delay: 'text-orange-600 bg-orange-100 border-orange-600',
    catchup: 'text-blue-600 bg-blue-100 border-blue-600',
  };

  const activeVehicles = useMemo(() => {
    return trips.map(trip => {
      if (!trip.stop_times || trip.stop_times.length === 0) return null;

      const firstStop = trip.stop_times[0];
      const lastStop = trip.stop_times[trip.stop_times.length - 1];

      if (currentTime < firstStop.departure_minute || currentTime > lastStop.arrival_minute) return null;

      const tripDuration = lastStop.arrival_minute - firstStop.departure_minute;
      const elapsed = currentTime - firstStop.departure_minute;
      const progressPercent = tripDuration > 0 ? (elapsed / tripDuration) * 100 : 0;

      return { ...trip, progress: progressPercent };
    }).filter(Boolean) as (Trip & { progress: number })[];
  }, [trips, currentTime]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">Позиції на маршруті</h3>
      <div className="relative w-full h-16">
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-300 rounded -translate-y-1/2"></div>
        {Array.from({ length: stopsCount }).map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 w-3 h-3 bg-slate-400 rounded-full -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${(i / (Math.max(1, stopsCount - 1))) * 100}%` }}
          />
        ))}

        {activeVehicles.map(vehicle => {
          const state = vehicle.smoothing_state || 'normal';
          const colorClass = STATE_COLORS[state];

          return (
            <div
              key={vehicle.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group transition-all duration-200 ease-linear z-10"
              style={{ left: `${vehicle.progress}%` }}
            >
              <div className={`p-1.5 rounded-full border-2 bg-white ${colorClass} shadow-md`}>
                <TramFront size={20} />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-slate-800 text-white text-xs px-3 py-2 rounded shadow-lg z-20">
                <p className="font-bold">Наряд: {vehicle.duty_id}</p>
                <p>Стан: {state.toUpperCase()}</p>
                {vehicle.smoothing_delta && <p>Дельта: {vehicle.smoothing_delta > 0 ? '+' : ''}{vehicle.smoothing_delta} хв</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
