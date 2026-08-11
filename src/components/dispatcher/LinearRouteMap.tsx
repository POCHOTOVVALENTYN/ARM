import React, { useState, useMemo } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { timeToMinutes } from '../../utils/scheduleEngine';
import { TramFront } from 'lucide-react';
import { Trip, StopTime } from '../../types';

export const LinearRouteMap: React.FC = () => {
  const blocks = useScheduleStore((state) => state.draftBlocks);
  const [currentTime, setCurrentTime] = useState<number>(480); // Default 08:00

  // 1. Extract standard route layout from the first available forward trip
  const routeStops = useMemo(() => {
    let forwardStops: StopTime[] = [];
    for (const block of blocks) {
      const trip = block.trips.find((t) => t.direction === 'FORWARD' || t.direction === 1);
      if (trip && trip.stop_times && trip.stop_times.length > 0) {
        forwardStops = trip.stop_times;
        break;
      }
    }
    return forwardStops;
  }, [blocks]);

  // Generate active vehicles for the given currentTime
  const activeVehicles = useMemo(() => {
    const vehicles: Array<{
      blockId: string;
      tripId: string;
      positionPct: number;
      smoothingState: string;
      direction: string | number;
    }> = [];

    blocks.forEach((block) => {
      block.trips.forEach((trip) => {
        if (!trip.stop_times || trip.stop_times.length < 2) return;

        const startTime = timeToMinutes(trip.stop_times[0].departure_time);
        const endTime = timeToMinutes(trip.stop_times[trip.stop_times.length - 1].arrival_time);

        // Check if the trip is active right now
        if (currentTime >= startTime && currentTime <= endTime) {
          // Find which segment the vehicle is in
          for (let i = 0; i < trip.stop_times.length - 1; i++) {
            const currentStop = trip.stop_times[i];
            const nextStop = trip.stop_times[i + 1];

            const segStart = timeToMinutes(currentStop.departure_time);
            const segEnd = timeToMinutes(nextStop.arrival_time);

            if (currentTime >= segStart && currentTime <= segEnd) {
              const segDuration = segEnd - segStart;
              const segProgress = segDuration > 0 ? (currentTime - segStart) / segDuration : 0;

              // Calculate overall percentage on the line
              // We assume routeStops defines the horizontal axis (0% to 100%)
              const totalStops = routeStops.length;
              if (totalStops > 1) {
                // Approximate stop index
                const startIdx = routeStops.findIndex((s) => s.stop_id === currentStop.stop_id);
                const endIdx = routeStops.findIndex((s) => s.stop_id === nextStop.stop_id);

                if (startIdx !== -1 && endIdx !== -1) {
                  const pctPerStop = 100 / (totalStops - 1);
                  let positionPct = 0;

                  if (trip.direction === 'FORWARD' || trip.direction === 1) {
                    positionPct = (startIdx + segProgress) * pctPerStop;
                  } else {
                    // Backward direction
                    positionPct = (startIdx - segProgress) * pctPerStop;
                  }

                  vehicles.push({
                    blockId: block.id,
                    tripId: trip.id,
                    positionPct: Math.max(0, Math.min(100, positionPct)),
                    smoothingState: trip.smoothing_state || 'normal',
                    direction: trip.direction,
                  });
                }
              }
              break;
            }
          }
        }
      });
    });

    return vehicles;
  }, [blocks, currentTime, routeStops]);

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getMarkerStyle = (state: string) => {
    switch (state) {
      case 'delay':
        return 'text-orange-400 bg-orange-950/50 border-orange-500';
      case 'catchup':
        return 'text-blue-400 bg-blue-950/50 border-blue-500';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-500';
    }
  };

  if (routeStops.length === 0) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl text-center text-slate-400">
        Недостатньо даних для побудови лінійної схеми (відсутні stop_times).
      </div>
    );
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6 brutalist-card">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center space-x-2">
            <span>Лінійна Схема Маршруту</span>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded border border-indigo-500/30">
              Live Tracker
            </span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Контроль інтервалів у динаміці та моніторинг еластичного згладжування
          </p>
        </div>
        <div className="text-2xl font-mono font-bold text-sky-400 bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-800">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Time Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>04:00</span>
          <span>12:00</span>
          <span>20:00</span>
          <span>00:00</span>
        </div>
        <input
          type="range"
          min={240}
          max={1440}
          step={1}
          value={currentTime}
          onChange={(e) => setCurrentTime(Number(e.target.value))}
          className="w-full accent-sky-500"
        />
      </div>

      {/* Route Track Visualization */}
      <div className="relative pt-10 pb-6 overflow-x-auto">
        <div className="min-w-[800px] relative">
          {/* Main Track Line */}
          <div className="absolute top-4 left-0 right-0 h-1.5 bg-slate-800 rounded-full" />

          {/* Stops */}
          {routeStops.map((stop, idx) => {
            const pct = (idx / (routeStops.length - 1)) * 100;
            return (
              <div
                key={stop.stop_id}
                className="absolute top-3 flex flex-col items-center w-32 -ml-16"
                style={{ left: `${pct}%` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-slate-600 z-10" />
                <div className="mt-2 text-[10px] text-slate-400 font-medium text-center break-words px-2 leading-tight">
                  {stop.stop_name}
                </div>
              </div>
            );
          })}

          {/* Vehicles */}
          {activeVehicles.map((vehicle, idx) => {
            const isForward = vehicle.direction === 'FORWARD' || vehicle.direction === 1;
            const markerStyle = getMarkerStyle(vehicle.smoothingState);
            
            return (
              <div
                key={`${vehicle.blockId}-${vehicle.tripId}-${idx}`}
                className={`absolute top-0 flex flex-col items-center transition-all duration-300 ease-linear w-12 -ml-6 z-20 hover:scale-110 cursor-help ${
                  isForward ? 'mt-0' : 'mt-8' // Stagger backward trips slightly lower if needed, or keep them on the line
                }`}
                style={{ left: `${vehicle.positionPct}%` }}
                title={`Вагон ${vehicle.blockId} | Рейс ${vehicle.tripId} | Стан: ${vehicle.smoothingState} | Напрямок: ${isForward ? 'Прямий' : 'Зворотній'}`}
              >
                <div className={`p-1 rounded-md border ${markerStyle} shadow-lg shadow-black/50`}>
                  <TramFront className="w-4 h-4" />
                </div>
                <div className="text-[9px] font-mono font-bold text-white bg-slate-900 px-1 py-0.5 rounded mt-0.5 border border-slate-700">
                  {vehicle.blockId}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-800 text-xs">
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded bg-slate-800 border border-slate-500 text-slate-300">
            <TramFront className="w-3 h-3" />
          </div>
          <span className="text-slate-400">За розкладом</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded bg-orange-950/50 border border-orange-500 text-orange-400">
            <TramFront className="w-3 h-3" />
          </div>
          <span className="text-slate-400">Затримка (Відтяжка)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded bg-blue-950/50 border border-blue-500 text-blue-400">
            <TramFront className="w-3 h-3" />
          </div>
          <span className="text-slate-400">Прискорення (Нагін)</span>
        </div>
      </div>
    </div>
  );
};
