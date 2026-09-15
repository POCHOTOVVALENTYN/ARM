import React from 'react'
import {
  Bus,
  Printer
} from 'lucide-react'
import { Route } from '../../types'
import { DirectionType } from '../../hooks/useControlPointsTripsLogic'

interface ControlPointsToolbarProps {
  routes: Route[]
  selectedRouteId: string
  selectedDirection: DirectionType
  onSelectRouteId: (id: string) => void
  onSelectDirection: (dir: DirectionType) => void
  onNavigateToMatrix: () => void
  onPrint: () => void
}

export const ControlPointsToolbar: React.FC<ControlPointsToolbarProps> = ({
  routes,
  selectedRouteId,
  selectedDirection,
  onSelectRouteId,
  onSelectDirection,
  onNavigateToMatrix,
  onPrint
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Bus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Маршрут:</span>
            </span>
            <select
              value={selectedRouteId}
              onChange={(e) => onSelectRouteId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              aria-label="Вибір маршруту"
            >
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  №{r.number} — {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Напрямок:</span>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => onSelectDirection('both')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDirection === 'both' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs font-black' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Обидва напрямки
              </button>
              <button
                type="button"
                onClick={() => onSelectDirection('direct')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDirection === 'direct' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs font-black' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ст. А (Прямий)
              </button>
              <button
                type="button"
                onClick={() => onSelectDirection('reverse')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedDirection === 'reverse' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs font-black' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ст. Б (Зворотний)
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToMatrix}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <span>Зведена таблиця</span>
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Друк погодинної сітки</span>
          </button>
        </div>
      </div>
    </div>
  )
}
