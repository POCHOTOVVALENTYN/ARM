import React, { useMemo } from 'react';
import { useStationStore } from '../../store/useStationStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { MareyDiagram, Stop, Trip } from '../dispatcher/MareyDiagram';
import { Activity } from 'lucide-react';

export const MareyDiagramTab: React.FC = () => {
  const stations = useStationStore((state) => state.stations);
  const liveSchedule = useScheduleStore((state) => state.liveSchedule);

  // Convert stations to stops for the diagram
  const stops: Stop[] = useMemo(() => {
    return stations.map((s, i) => ({
      id: s.id,
      name: s.name,
      // We need some accumulated distance. Assuming ~500m between stations for visualization
      distance_from_start: i * 0.5,
    }));
  }, [stations]);

  // Convert live blocks to trips
  const trips: Trip[] = useMemo(() => {
    if (!liveSchedule || !liveSchedule.current_blocks) return [];

    return liveSchedule.current_blocks.map((block) => {
      // Map all events from all trips in the block
      const events = block.trips.flatMap((trip) => 
        trip.nodes.map((node) => ({
          stop_id: node.node_id,
          // If arrival_time is available use it, otherwise use current time as fallback for mock
          timestamp: node.arrival_time,
          is_actual: false, // For now assuming scheduled, could be enriched with telemetry
        }))
      );

      return {
        id: block.block_id,
        vehicle_id: block.vehicle_id || block.block_id,
        events,
      };
    });
  }, [liveSchedule]);

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
        {trips.length > 0 ? (
          <MareyDiagram stops={stops} trips={trips} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Activity className="w-12 h-12 mb-4 opacity-50" />
            <p>Немає даних розкладу для побудови графіка</p>
          </div>
        )}
      </div>
    </div>
  );
};
