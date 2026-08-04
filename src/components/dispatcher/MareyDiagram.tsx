import React, { useState } from 'react';
import { Route, VehicleBlock, ScheduleConflict } from '../../types';
import { useStationStore } from '../../store/useStationStore';
import { timeToMinutes } from '../../utils/scheduleEngine';
import { AlertCircle, Clock, Info, RefreshCw } from 'lucide-react';

interface MareyDiagramProps {
  route: Route;
  blocks: VehicleBlock[];
  conflicts: ScheduleConflict[];
  onSelectTrip?: (tripId: string) => void;
}

export const MareyDiagram: React.FC<MareyDiagramProps> = ({
  route,
  blocks,
  conflicts,
  onSelectTrip
}) => {
  const stations = useStationStore(state => state.stations);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [hoveredTrip, setHoveredTrip] = useState<any>(null);

  // Time Axis configuration: 05:00 (300 min) to 22:00 (1320 min)
  const START_MIN = 300;
  const END_MIN = 1320;
  const TOTAL_DURATION = END_MIN - START_MIN;

  // Diagram SVG Dimensions
  const SVG_WIDTH = 900;
  const SVG_HEIGHT = 420;
  const PADDING_LEFT = 140;
  const PADDING_RIGHT = 30;
  const PADDING_TOP = 40;
  const PADDING_BOTTOM = 40;

  const CHART_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Stations mapping on Y-Axis
  const routeStationIds = route.stations;
  const stationCount = routeStationIds.length;

  const getStationY = (stationId: string): number => {
    const idx = routeStationIds.indexOf(stationId);
    if (idx === -1) return PADDING_TOP + CHART_HEIGHT / 2;
    return PADDING_TOP + (idx / Math.max(1, stationCount - 1)) * CHART_HEIGHT;
  };

  const getTimeX = (timeStr: string): number => {
    const mins = timeToMinutes(timeStr);
    const clamped = Math.max(START_MIN, Math.min(END_MIN, mins));
    return PADDING_LEFT + ((clamped - START_MIN) / TOTAL_DURATION) * CHART_WIDTH;
  };

  // Hours for grid
  const hours = [];
  for (let h = 5; h <= 22; h++) {
    hours.push(h);
  }

  // Color palette for vehicle blocks
  const BLOCK_COLORS = [
    '#38bdf8', // sky-400
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#a855f7', // purple-500
    '#ec4899', // pink-500
    '#3b82f6', // blue-500
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Chart Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-xs border border-amber-500/30">
              Графік Марея
            </span>
            <h3 className="text-white font-bold text-base">
              Маршрут №{route.number}: {route.name}
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Осі: «Час доби (05:00 - 22:00)» відносно «Зупинкових пунктів». Суцільні лінії — рейси, пунктир — нульові пробіги, товсті лінії — обіди.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-sky-400 rounded-full inline-block" />
            <span className="text-slate-300">Основний рейс</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400 inline-block" />
            <span className="text-slate-300">Нульовий пробіг</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-1 bg-purple-500 inline-block rounded" />
            <span className="text-slate-300">Обід водія</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
            <span className="text-rose-400 font-medium">Конфлікт (h &lt; 2 хв)</span>
          </div>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative overflow-x-auto bg-slate-900/60 rounded-xl border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-auto min-w-[700px] select-none"
        >
          {/* Background Station Lines */}
          {routeStationIds.map((stId, idx) => {
            const stObj = stations.find((s) => s.id === stId);
            const y = getStationY(stId);
            return (
              <g key={`st_line_${stId}`}>
                <line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={SVG_WIDTH - PADDING_RIGHT}
                  y2={y}
                  stroke="#334155"
                  strokeWidth={idx === 0 || idx === stationCount - 1 ? 1.5 : 0.8}
                  strokeDasharray={stObj?.isTerminal ? '' : '3,3'}
                />
                <text
                  x={PADDING_LEFT - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill={stObj?.isTerminal ? '#f59e0b' : '#94a3b8'}
                  fontSize="10"
                  fontWeight={stObj?.isTerminal ? 'bold' : 'normal'}
                >
                  {stObj?.name || stId}
                </text>
              </g>
            );
          })}

          {/* Vertical Time Grid (Hours) */}
          {hours.map((h) => {
            const timeStr = `${h.toString().padStart(2, '0')}:00`;
            const x = getTimeX(timeStr);
            return (
              <g key={`time_grid_${h}`}>
                <line
                  x1={x}
                  y1={PADDING_TOP}
                  x2={x}
                  y2={SVG_HEIGHT - PADDING_BOTTOM}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
                {/* Top Time Label */}
                <text
                  x={x}
                  y={PADDING_TOP - 12}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {timeStr}
                </text>
                {/* Bottom Time Label */}
                <text
                  x={x}
                  y={SVG_HEIGHT - PADDING_BOTTOM + 18}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                >
                  {timeStr}
                </text>
              </g>
            );
          })}

          {/* Vehicle Trips (Marey Lines) */}
          {blocks.map((block, blockIdx) => {
            const blockColor = BLOCK_COLORS[blockIdx % BLOCK_COLORS.length];

            return block.trips.map((trip) => {
              const x1 = getTimeX(trip.departureTime);
              const x2 = getTimeX(trip.arrivalTime);
              const y1 = getStationY(trip.startStationId);
              const y2 = getStationY(trip.endStationId);

              const isSelected = selectedTripId === trip.id;
              const isLunch = trip.isLunchBreak;
              const isZero = trip.isZeroRun;
              const isDelayed = trip.status === 'delayed';

              return (
                <g
                  key={trip.id}
                  onClick={() => {
                    setSelectedTripId(trip.id);
                    if (onSelectTrip) onSelectTrip(trip.id);
                  }}
                  onMouseEnter={() =>
                    setHoveredTrip({ trip, block, color: blockColor })
                  }
                  onMouseLeave={() => setHoveredTrip(null)}
                  className="cursor-pointer transition-all"
                >
                  {/* Trip Line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={
                      isDelayed
                        ? '#ef4444'
                        : isLunch
                        ? '#a855f7'
                        : isSelected
                        ? '#f59e0b'
                        : blockColor
                    }
                    strokeWidth={isLunch ? 5 : isSelected ? 4 : 2.5}
                    strokeDasharray={isZero ? '5,5' : ''}
                    opacity={selectedTripId && !isSelected ? 0.3 : 0.9}
                  />

                  {/* Start Node Circle */}
                  <circle
                    cx={x1}
                    cy={y1}
                    r={isSelected ? 5 : 3.5}
                    fill={blockColor}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />

                  {/* End Node Circle */}
                  <circle
                    cx={x2}
                    cy={y2}
                    r={isSelected ? 5 : 3.5}
                    fill={blockColor}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />

                  {/* Vehicle Tag Label */}
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    textAnchor="middle"
                    fill={isSelected ? '#f59e0b' : '#e2e8f0'}
                    fontSize="9"
                    fontWeight="bold"
                    className="pointer-events-none drop-shadow-md"
                  >
                    {block.vehicleNumber.split(' ')[0]} ({trip.departureTime})
                  </text>
                </g>
              );
            });
          })}

          {/* Conflict Highlight Circles (Red Pulsing Indicators) */}
          {conflicts.map((conf) => {
            const x = getTimeX(conf.arrivalTime1);
            const y = getStationY('st_starosinna'); // default node for mock conflict
            return (
              <g key={conf.id} className="animate-pulse">
                <circle cx={x} cy={y} r="14" fill="rgba(239, 68, 68, 0.25)" />
                <circle cx={x} cy={y} r="8" fill="none" stroke="#ef4444" strokeWidth="2" />
                <circle cx={x} cy={y} r="3" fill="#ef4444" />
                <text
                  x={x}
                  y={y - 18}
                  textAnchor="middle"
                  fill="#fca5a5"
                  fontSize="9"
                  fontWeight="bold"
                >
                  Конфлікт (Δt={conf.actualHeadwayMin}хв)
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Selection Details Tooltip Box */}
        {hoveredTrip && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-amber-500/40 p-3 rounded-xl text-xs space-y-1 shadow-2xl backdrop-blur-md max-w-xs z-10">
            <div className="flex items-center space-x-2 text-amber-400 font-bold border-b border-slate-800 pb-1">
              <Info className="w-4 h-4" />
              <span>{hoveredTrip.block.vehicleNumber}</span>
            </div>
            <p className="text-slate-300">
              <strong className="text-white">Наряд:</strong> {hoveredTrip.block.id}
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Рейс:</strong> {hoveredTrip.trip.departureTime} — {hoveredTrip.trip.arrivalTime}
            </p>
            <p className="text-slate-300">
              <strong className="text-white">Статус:</strong>{' '}
              <span className={hoveredTrip.trip.status === 'delayed' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {hoveredTrip.trip.status === 'delayed' ? `Затримка (+${hoveredTrip.trip.slackMin} хв)` : 'За розкладом'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
