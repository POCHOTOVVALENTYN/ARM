import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { LinearRouteMap } from './LinearRouteMap';
import { DeviationDashboard } from './DeviationDashboard';
import { GanttChart } from './GanttChart';
import { Clock } from 'lucide-react';

interface SchedulePreviewPanelProps {
  stopsCount?: number; // Кількість зупинок можна залишити в пропсах або теж винести в стор маршруту
}

export const SchedulePreviewPanel: React.FC<SchedulePreviewPanelProps> = ({ stopsCount: propStopsCount }) => {
  // Підписуємося на глобальний стан
  const { generatedTrips, currentTime, setCurrentTime, draftDuties } = useScheduleStore();
  const [activeTab, setActiveTab] = useState<'gantt' | 'deviations'>('gantt');

  const stopsCount = propStopsCount || 20; // Default to 20 stops if not provided

  // Якщо розклад ще не згенеровано
  if (!generatedTrips || generatedTrips.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-500 font-semibold">
        Розклад не згенеровано. Запустіть генератор для аналізу.
      </div>
    );
  }

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = Math.floor(minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div className="flex flex-col space-y-6 w-full">
      {/* Панель керування глобальним часом */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold">
            <Clock size={20} className="text-blue-600" />
            <span>Синхронний інспектор часу</span>
          </div>
          <div className="text-2xl font-mono font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">
            {formatTime(currentTime)}
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="1440"
          value={currentTime}
          onChange={(e) => setCurrentTime(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      {/* Передаємо дані у "тупі" презентаційні компоненти */}
      <LinearRouteMap 
        trips={generatedTrips} 
        stopsCount={stopsCount} 
        currentTime={currentTime} 
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setActiveTab('gantt')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'gantt' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Діаграма Ганта
          </button>
          <button
            onClick={() => setActiveTab('deviations')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'deviations' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Матриця відхилень (Прохід 4)
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'gantt' ? (
            <GanttChart trips={generatedTrips} duties={draftDuties} currentTime={currentTime} />
          ) : (
            <DeviationDashboard trips={generatedTrips} />
          )}
        </div>
      </div>
    </div>
  );
};
