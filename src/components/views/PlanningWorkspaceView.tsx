import React, { useState } from 'react';
import { 
  Table as TableIcon, 
  BookOpen, 
  Bus, 
  Layers, 
  Scissors, 
  Radio, 
  CheckCircle2, 
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import { TripGridView } from './TripGridView';
import { DutyBuilderView } from './DutyBuilderView';
import { DriverShiftConstructorView } from './DriverShiftConstructorView';
import { InterlineSyncView } from './InterlineSyncView';
import { DriverScheduleBookView } from './DriverScheduleBookView';

type PlanningSubTab = 'trips_kp' | 'gantt_static' | 'driver_shifts' | 'interline_sync' | 'driver_book';

export const PlanningWorkspaceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PlanningSubTab>('trips_kp');

  return (
    <div className="space-y-6 font-sans">
      {/* Top Planning Workspace Header & Sub-Navigation */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Робочий Простір Планування</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-800">
                СЛУЖБА РУХУ КП «ОМЕТ»
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Формування статичних нарядів, похвилинних графіків, розрізання змін водіїв та синхронізація коридорів
            </p>
          </div>
        </div>

        {/* 5 Distinct Sub-Tabs Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-extrabold shrink-0">
          <button
            onClick={() => setActiveTab('trips_kp')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'trips_kp'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>1. Рейси за КП</span>
          </button>

          <button
            onClick={() => setActiveTab('gantt_static')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'gantt_static'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bus className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. Ганта Статичних Нарядів</span>
          </button>

          <button
            onClick={() => setActiveTab('driver_shifts')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'driver_shifts'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-600" />
            <span>3. Конструктор Змін & КПЗ</span>
          </button>

          <button
            onClick={() => setActiveTab('interline_sync')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'interline_sync'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-purple-600" />
            <span>4. Синхронізація «Зв'язок»</span>
          </button>

          <button
            onClick={() => setActiveTab('driver_book')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'driver_book'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>5. Книжка водія</span>
          </button>
        </div>
      </div>

      {/* Canvas View Content */}
      <div className="animate-fade-in">
        {activeTab === 'trips_kp' && <TripGridView />}
        {activeTab === 'gantt_static' && <DutyBuilderView />}
        {activeTab === 'driver_shifts' && <DriverShiftConstructorView />}
        {activeTab === 'interline_sync' && <InterlineSyncView />}
        {activeTab === 'driver_book' && <DriverScheduleBookView />}
      </div>
    </div>
  );
};

export default PlanningWorkspaceView;
