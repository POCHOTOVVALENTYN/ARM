import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, Route, MapPin } from 'lucide-react';
import { AdminHubsManager } from '../admin/AdminHubsManager';
import { AdminDepotsManager } from '../admin/AdminDepotsManager';
import { AdminEmergenciesManager } from '../admin/AdminEmergenciesManager';
import { AdminBreakLocationsManager } from '../admin/AdminBreakLocationsManager';
import { useConfigStore } from '../../store/useConfigStore';

export const AdminTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'hubs' | 'depots' | 'emergencies' | 'breaks'>('hubs');
  const { isLoaded, fetchConfigs } = useConfigStore();

  useEffect(() => {
    if (!isLoaded) {
      fetchConfigs();
    }
  }, [isLoaded, fetchConfigs]);

  const tabs = [
    { id: 'hubs', label: 'Транспортні вузли', icon: <Route size={18} /> },
    { id: 'depots', label: 'Депо', icon: <Settings size={18} /> },
    { id: 'emergencies', label: 'Шаблони НС', icon: <AlertTriangle size={18} /> },
    { id: 'breaks', label: 'Місця відпочинку', icon: <MapPin size={18} /> },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="text-blue-500" />
          Панель Адміністрування
        </h2>
        <div className="flex bg-slate-800 p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                activeSubTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        {!isLoaded ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {activeSubTab === 'hubs' && <AdminHubsManager />}
            {activeSubTab === 'depots' && <AdminDepotsManager />}
            {activeSubTab === 'emergencies' && <AdminEmergenciesManager />}
            {activeSubTab === 'breaks' && <AdminBreakLocationsManager />}
          </div>
        )}
      </div>
    </div>
  );
};
