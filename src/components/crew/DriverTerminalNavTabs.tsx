import React from 'react'
import { Navigation, FileText, Radio } from 'lucide-react'

interface DriverTerminalNavTabsProps {
  activeTab: 'trip' | 'waybill' | 'dispatch'
  isNightMode: boolean
  onTabChange: (tab: 'trip' | 'waybill' | 'dispatch') => void
}

export const DriverTerminalNavTabs: React.FC<DriverTerminalNavTabsProps> = ({
  activeTab,
  isNightMode,
  onTabChange
}) => {
  return (
    <nav className="grid grid-cols-3 gap-2" role="tablist">
      <button
        onClick={() => onTabChange('trip')}
        role="tab"
        aria-selected={activeTab === 'trip'}
        tabIndex={0}
        className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
          activeTab === 'trip'
            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
            : isNightMode
            ? 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
        }`}
      >
        <Navigation className="w-4 h-4" />
        <span>Рейс та Зупинки</span>
      </button>

      <button
        onClick={() => onTabChange('waybill')}
        role="tab"
        aria-selected={activeTab === 'waybill'}
        tabIndex={0}
        className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
          activeTab === 'waybill'
            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
            : isNightMode
            ? 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Е-Шляховий Лист</span>
      </button>

      <button
        onClick={() => onTabChange('dispatch')}
        role="tab"
        aria-selected={activeTab === 'dispatch'}
        tabIndex={0}
        className={`py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
          activeTab === 'dispatch'
            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
            : isNightMode
            ? 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
            : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
        }`}
      >
        <Radio className="w-4 h-4 text-amber-400" />
        <span>Диспетчер та SOS</span>
      </button>
    </nav>
  )
}
