import React from 'react'
import { Building2, Compass, Sliders } from 'lucide-react'
import { DeadheadTab } from '../../hooks/useDeadheadOptimizerLogic'

interface DeadheadOptimizerTabsProps {
  activeTab: DeadheadTab
  onTabChange: (tab: DeadheadTab) => void
  routesCount: number
  suboptimalCount: number
  matrixRecordsCount: number
}

export const DeadheadOptimizerTabs: React.FC<DeadheadOptimizerTabsProps> = ({
  activeTab,
  onTabChange,
  routesCount,
  suboptimalCount,
  matrixRecordsCount
}) => {
  return (
    <div className="flex items-center gap-2 border-b border-slate-800 pb-1 font-sans" role="tablist" aria-label="Вкладки модуля оптимізатора нульових рейсів">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'routes'}
        onClick={() => onTabChange('routes')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
          activeTab === 'routes'
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        aria-label="Вкладка Оптимізація маршрутів"
      >
        <Building2 className="w-4 h-4" />
        <span>Оптимізація маршрутів ({routesCount})</span>
        {suboptimalCount > 0 && (
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
            {suboptimalCount} субопт.
          </span>
        )}
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'matrix'}
        onClick={() => onTabChange('matrix')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
          activeTab === 'matrix'
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        aria-label="Вкладка Топологічна матриця нульових рейсів"
      >
        <Compass className="w-4 h-4" />
        <span>Топологічна матриця нульових рейсів ({matrixRecordsCount})</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'calculator'}
        onClick={() => onTabChange('calculator')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
          activeTab === 'calculator'
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
        aria-label="Вкладка Калькулятор одиничного виїзду"
      >
        <Sliders className="w-4 h-4" />
        <span>Калькулятор одиничного виїзду</span>
      </button>
    </div>
  )
}
