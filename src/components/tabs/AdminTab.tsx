import React, { useState, useEffect } from 'react'
import { Settings, AlertTriangle, Route, MapPin, Sliders } from 'lucide-react'
import { AdminHubsManager } from '../admin/AdminHubsManager'
import { AdminDepotsManager } from '../admin/AdminDepotsManager'
import { AdminEmergenciesManager } from '../admin/AdminEmergenciesManager'
import { AdminBreakLocationsManager } from '../admin/AdminBreakLocationsManager'
import { SystemConfigManager } from '../admin/SystemConfigManager'
import { useConfigStore } from '../../store/useConfigStore'
import { GlobalLoader } from '../GlobalLoader'

export type AdminSubTabId = 'system' | 'hubs' | 'depots' | 'emergencies' | 'breaks'

interface AdminTabConfig {
  id: AdminSubTabId
  label: string
  icon: React.ReactNode
}

export const AdminTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTabId>('system')
  const { isLoaded, fetchConfigs } = useConfigStore()

  useEffect(() => {
    if (!isLoaded) {
      fetchConfigs()
    }
  }, [isLoaded, fetchConfigs])

  const tabs: AdminTabConfig[] = [
    { id: 'system', label: 'Глобальні налаштування (ГІС)', icon: <Sliders size={18} /> },
    { id: 'hubs', label: 'Транспортні вузли', icon: <Route size={18} /> },
    { id: 'depots', label: 'Депо', icon: <Settings size={18} /> },
    { id: 'emergencies', label: 'Шаблони НС', icon: <AlertTriangle size={18} /> },
    { id: 'breaks', label: 'Місця відпочинку', icon: <MapPin size={18} /> }
  ]

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden font-sans">
      <div className="shrink-0 p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Settings size={18} />
          </div>
          <span>Панель Адміністрування КП «ОМЕТ»</span>
        </h2>
        <div className="flex flex-wrap bg-slate-800/90 p-1 rounded-xl border border-slate-700/60" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeSubTab === tab.id}
              tabIndex={0}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                activeSubTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeSubTab === 'system' && <SystemConfigManager />}
          {activeSubTab === 'hubs' && (!isLoaded ? <GlobalLoader text="Завантаження вузлів..." /> : <AdminHubsManager />)}
          {activeSubTab === 'depots' && (!isLoaded ? <GlobalLoader text="Завантаження депо..." /> : <AdminDepotsManager />)}
          {activeSubTab === 'emergencies' && (!isLoaded ? <GlobalLoader text="Завантаження шаблонів НС..." /> : <AdminEmergenciesManager />)}
          {activeSubTab === 'breaks' && (!isLoaded ? <GlobalLoader text="Завантаження місць відпочинку..." /> : <AdminBreakLocationsManager />)}
        </div>
      </div>
    </div>
  )
}

export default AdminTab
