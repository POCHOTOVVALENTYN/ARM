import React from 'react'
import { MareyDiagram } from '../dispatcher/MareyDiagram'
import { Activity } from 'lucide-react'

export const MareyDiagramTab: React.FC = () => {
  return (
    <div className="space-y-4 font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-slate-900 dark:text-white font-black text-sm">Інтерактивний Графік Марея (D3)</h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Візуалізація руху транспортних засобів у координатах час-відстань для виявлення збоїв, інтервалів та накладок
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <MareyDiagram />
      </div>
    </div>
  )
}

export default MareyDiagramTab
