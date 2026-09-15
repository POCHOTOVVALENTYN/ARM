import React, { useState, useEffect } from 'react'
import { 
  Table as TableIcon, 
  Layers, 
  Scissors, 
  Radio, 
  Settings2,
  Archive,
  Zap
} from 'lucide-react'
import { useScheduleStore } from '../../store/useScheduleStore'
import { DutyParametersBuilderView } from './DutyParametersBuilderView'
import { TripGridView } from './TripGridView'
import { DriverShiftConstructorView } from './DriverShiftConstructorView'
import { InterlineSyncView } from './InterlineSyncView'
import { ActiveDutiesView } from './ActiveDutiesView'
import { StaticDutiesArchiveView } from './StaticDutiesArchiveView'

export type PlanningSubTab = 
  | 'parameters' 
  | 'matrix' 
  | 'shifts' 
  | 'interline' 
  | 'active-duties'
  | 'archive'

interface PlanningWorkspaceViewProps {
  initialTab?: PlanningSubTab
}

export const PlanningWorkspaceView: React.FC<PlanningWorkspaceViewProps> = ({ initialTab }) => {
  const { currentPath, setPath } = useScheduleStore()

  // Map path to tab with safe fallbacks
  const getTabFromPath = (path: string): PlanningSubTab => {
    if (path === '/planning/parameters') return 'parameters'
    if (path === '/planning/matrix') return 'matrix'
    if (path === '/planning/shifts') return 'shifts'
    if (path === '/planning/interline') return 'interline'
    if (path === '/planning/active-duties') return 'active-duties'
    if (path === '/planning/archive') return 'archive'
    return initialTab || 'parameters'
  }

  const [activeTab, setActiveTab] = useState<PlanningSubTab>(getTabFromPath(currentPath))

  useEffect(() => {
    const tab = getTabFromPath(currentPath)
    setActiveTab(tab)
  }, [currentPath])

  const handleTabChange = (tab: PlanningSubTab) => {
    setActiveTab(tab)
    if (tab === 'parameters') setPath('/planning/parameters')
    else if (tab === 'matrix') setPath('/planning/matrix')
    else if (tab === 'shifts') setPath('/planning/shifts')
    else if (tab === 'interline') setPath('/planning/interline')
    else if (tab === 'active-duties') setPath('/planning/active-duties')
    else if (tab === 'archive') setPath('/planning/archive')
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Planning Workspace Header & Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Підсистема Планування Розкладів</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-800">
                СЛУЖБА РУХУ КП «ОМЕТ»
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Конструктор нарядів, активні випуски, зведена таблиця рейсів, розрізання змін КПЗ та зв'язки
            </p>
          </div>
        </div>

        {/* 6 Distinct Navigation Tabs */}
        <div 
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold shrink-0"
          role="tablist"
          aria-label="Вкладки підсистеми планування розкладів"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'parameters'}
            tabIndex={0}
            onClick={() => handleTabChange('parameters')}
            onKeyDown={(e) => e.key === 'Enter' && handleTabChange('parameters')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'parameters'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. Конструктор нарядів</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active-duties'}
            tabIndex={0}
            onClick={() => handleTabChange('active-duties')}
            onKeyDown={(e) => e.key === 'Enter' && handleTabChange('active-duties')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'active-duties'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Активні наряди</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'matrix'}
            tabIndex={0}
            onClick={() => handleTabChange('matrix')}
            onKeyDown={(e) => e.key === 'Enter' && handleTabChange('matrix')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. Зведена таблиця</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'shifts'}
            tabIndex={0}
            onClick={() => handleTabChange('shifts')}
            onKeyDown={(e) => e.key === 'Enter' && handleTabChange('shifts')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'shifts'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-600" />
            <span>4. Зміни & КПЗ</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'interline'}
            tabIndex={0}
            onClick={() => handleTabChange('interline')}
            onKeyDown={(e) => e.key === 'Enter' && handleTabChange('interline')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'interline'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-purple-600" />
            <span>5. «Зв'язок»</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'archive'}
            tabIndex={0}
            onClick={() => handleTabChange('archive')}
            onKeyDown={(e) => e.key === 'Enter' && handleTabChange('archive')}
            className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-slate-600" />
            <span>6. Архів</span>
          </button>
        </div>
      </div>

      {/* Canvas View Content */}
      <div className="animate-fade-in">
        {activeTab === 'parameters' && <DutyParametersBuilderView />}
        {activeTab === 'matrix' && <TripGridView />}
        {activeTab === 'shifts' && <DriverShiftConstructorView />}
        {activeTab === 'interline' && <InterlineSyncView />}
        {activeTab === 'active-duties' && <ActiveDutiesView />}
        {activeTab === 'archive' && <StaticDutiesArchiveView />}
      </div>
    </div>
  )
}

export default PlanningWorkspaceView
