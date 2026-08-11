import React, { useState } from 'react';
import { Route, VehicleBlock, DriverDuty, ScheduleConflict } from '../../types';
import { GanttChart } from '../dispatcher/GanttChart';
import { LinearRouteMap } from '../dispatcher/LinearRouteMap';
import { SlackManager } from '../dispatcher/SlackManager';
import { AlertTriangle, CheckCircle, ChevronDown, Clock, Play, Radio, ShieldAlert } from 'lucide-react';

interface DispatcherTabProps {
  routes: Route[];
  blocks: VehicleBlock[];
  duties: DriverDuty[];
  conflicts: ScheduleConflict[];
  onApplySlack: (slackMin: number, tripId: string) => void;
  onTruncateTrip: () => void;
  onReserveVehicle: () => void;
}

export const DispatcherTab: React.FC<DispatcherTabProps> = ({
  routes = [],
  blocks = [],
  duties = [],
  conflicts = [],
  onApplySlack = (_slackMin: number, _tripId: string) => {},
  onTruncateTrip = () => {},
  onReserveVehicle = () => {}
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const routeBlocks = blocks.filter((b) => b.routeId === selectedRouteId);

  return (
    <div className="space-y-6">
      {/* Top Controls & Route Selector */}
      <div className="bg-white border border-blue-200 rounded-2xl p-4 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 shadow-sm overflow-hidden relative">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-base">АРМ Диспетчера «Графіки Руху»</h2>
            <p className="text-xs text-slate-500">
              Оперативне вирівнювання інтервалів, ліквідація заторів та візуальний контроль
            </p>
          </div>
        </div>

        {/* Route Selector & View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Dropdown Route Selector */}
          <div className="relative flex items-center bg-blue-50/60 px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs">
            <span className="text-xs font-bold text-blue-900 mr-2.5 whitespace-nowrap">
              Маршрут:
            </span>
            <div className="relative flex-1 min-w-[200px]">
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full appearance-none bg-white text-blue-700 font-extrabold text-xs pl-3 pr-8 py-1.5 rounded-lg border border-blue-300 hover:border-blue-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-xs"
              >
                {routes.map((r) => (
                  <option key={r.id} value={r.id} className="bg-white text-slate-900 font-bold py-1">
                    Маршрут №{r.number} ({r.type === 'TRAM' ? 'Трамвай' : r.type === 'TROLLEY' ? 'Тролейбус' : 'Електробус'}) — {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* Live Conflict Warning Bar if any */}
      {conflicts.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-rose-300 animate-pulse shadow-lg">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm text-white">
                Увага: Зафіксовано конфлікт інтервалу руху в канальному вузлі!
              </div>
              <p className="text-xs text-rose-300/80">
                Вузол «{conflicts[0].nodeName}» (Колія {conflicts[0].trackId}): фактичний інтервал між ТЗ {conflicts[0].vehicle1Route} та {conflicts[0].vehicle2Route} становить {conflicts[0].actualHeadwayMin} хв (норма h_min = {conflicts[0].requiredHeadwayMin} хв).
              </p>
            </div>
          </div>
          <button
            onClick={() => onApplySlack(2, 'trip_301_1')}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all whitespace-nowrap shadow-md"
          >
            Автоматично розвести ТЗ (+2 хв)
          </button>
        </div>
      )}

      {/* Main Diagram View */}
      <div className="space-y-6">
        <LinearRouteMap />
        <GanttChart />
      </div>

      {/* Slack Manager Widget */}
      <SlackManager
        onApplySlack={onApplySlack}
        onTruncateTrip={onTruncateTrip}
        onReserveVehicle={onReserveVehicle}
      />
    </div>
  );
};
