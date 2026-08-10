import React, { useMemo } from 'react';
import { MareyDiagram } from '../dispatcher/MareyDiagram';
import { Activity } from 'lucide-react';


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
