const fs = require('fs');

// 1. Refactor MareyDiagram.tsx
let marey = fs.readFileSync('src/components/dispatcher/MareyDiagram.tsx', 'utf-8');
marey = marey.replace(
  "import React, { useMemo, useRef, useEffect } from 'react';",
  "import React, { useMemo, useRef, useEffect } from 'react';\nimport { useStationStore } from '../../store/useStationStore';\nimport { useScheduleStore } from '../../store/useScheduleStore';"
);
marey = marey.replace(
  "interface MareyDiagramProps {\n    stops: Stop[];\n    trips: Trip[];\n    width?: number;\n    height?: number;\n}",
  "interface MareyDiagramProps {\n    width?: number;\n    height?: number;\n}"
);
const mareyLogic = `
export const MareyDiagram: React.FC<MareyDiagramProps> = ({ 
    width = 1200, 
    height = 800 
}) => {
    const stations = useStationStore((state) => state.stations);
    const liveSchedule = useScheduleStore((state) => state.liveSchedule);

    const stops: Stop[] = useMemo(() => {
        return stations.map((s, i) => ({
            id: s.id,
            name: s.name,
            distance_from_start: i * 0.5,
        }));
    }, [stations]);

    const trips: Trip[] = useMemo(() => {
        if (!liveSchedule || !liveSchedule.current_blocks) return [];
        return liveSchedule.current_blocks.map((block) => {
            const events = block.trips.flatMap((trip) => 
                trip.nodes.map((node) => ({
                    stop_id: node.node_id,
                    timestamp: node.arrival_time,
                    is_actual: false,
                }))
            );
            return {
                id: block.block_id,
                vehicle_id: block.vehicle_id || block.block_id,
                events,
            };
        });
    }, [liveSchedule]);
`;
marey = marey.replace(
  "export const MareyDiagram: React.FC<MareyDiagramProps> = ({ \n    stops, \n    trips, \n    width = 1200, \n    height = 800 \n}) => {",
  mareyLogic
);
fs.writeFileSync('src/components/dispatcher/MareyDiagram.tsx', marey);

// 2. Refactor MareyDiagramTab.tsx
let mareyTab = fs.readFileSync('src/components/tabs/MareyDiagramTab.tsx', 'utf-8');
mareyTab = mareyTab.replace(
  "import { useStationStore } from '../../store/useStationStore';\nimport { useScheduleStore } from '../../store/useScheduleStore';\n",
  ""
);
mareyTab = mareyTab.replace(
  "import { MareyDiagram, Stop, Trip } from '../dispatcher/MareyDiagram';",
  "import { MareyDiagram } from '../dispatcher/MareyDiagram';"
);
const tabLogic = `
export const MareyDiagramTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-slate-900 font-bold text-base">Інтерактивний Графік Марея (D3)</h2>
          <p className="text-xs text-slate-500">
            Візуалізація руху транспортних засобів у координатах час-відстань
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm overflow-hidden">
        <MareyDiagram />
      </div>
    </div>
  );
};
`;
// Replace the entire component function with the simpler one
const startIdx = mareyTab.indexOf("export const MareyDiagramTab");
mareyTab = mareyTab.substring(0, startIdx) + tabLogic;
fs.writeFileSync('src/components/tabs/MareyDiagramTab.tsx', mareyTab);

console.log("Refactored MareyDiagram");
