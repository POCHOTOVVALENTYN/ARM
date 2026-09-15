import React from 'react'
import { Settings, MapPin, Share2, Bus, Layers, Clock } from 'lucide-react'
import { BreakLocationConfig, ControlPointNode } from '../../types'
import { useNetworkSettingsLogic } from '../../hooks/useNetworkSettingsLogic'
import { useScheduleStore } from '../../store/useScheduleStore'
import { NetworkRoutesPanel } from '../network/NetworkRoutesPanel'
import { NetworkHubsPanel } from '../network/NetworkHubsPanel'
import { NetworkDepotsPanel } from '../network/NetworkDepotsPanel'
import { NetworkBreaksPanel } from '../network/NetworkBreaksPanel'
import { SharedStopsPanel } from '../network/SharedStopsPanel'
import { AdminStopsManager } from '../admin/AdminStopsManager'
import { RouteFormModal } from '../routes/RouteFormModal'
import { JsonImportModal } from '../routes/JsonImportModal'
import { GlobalHubFormModal } from '../network/GlobalHubFormModal'
import { BreakLocationFormModal } from '../network/BreakLocationFormModal'

export interface NetworkSettingsTabProps {
  initialSubTab?: string
}

export const NetworkSettingsTab: React.FC<NetworkSettingsTabProps> = ({ initialSubTab }) => {
  const logic = useNetworkSettingsLogic({ initialSubTab })
  const { setPath } = useScheduleStore()

  const handleOpenAddBreakModal = (routeId: string) => {
    logic.setEditingBreakConfig(null)
    logic.setActiveBreakRouteId(routeId)
  }

  const handleOpenEditBreakModal = (routeId: string, config: BreakLocationConfig) => {
    logic.setEditingBreakConfig(config)
    logic.setActiveBreakRouteId(routeId)
  }

  const handleSaveHub = (hub: ControlPointNode) => {
    if (logic.editingHub) {
      logic.updateControlPoint(hub)
    } else {
      logic.addControlPoint(hub)
    }
    logic.setIsHubModalOpen(false)
  }

  const handleSaveBreak = (config: Omit<BreakLocationConfig, 'id'> | BreakLocationConfig) => {
    if ('id' in config && config.id) {
      logic.updateBreak(config as BreakLocationConfig)
    } else {
      logic.addBreak(config)
    }
    logic.setActiveBreakRouteId(null)
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Network Directories Sub-tab Navigation */}
      <div 
        className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black shrink-0 max-w-fit shadow-xs"
        role="tablist"
        aria-label="Підрозділи довідників мережі КП ОМЕТ"
      >
        <button
          type="button"
          onClick={() => setPath('/settings/routes')}
          className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
            logic.activeSubTab === 'routes'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-indigo-600" />
          <span>Паспорти маршрутів</span>
        </button>

        <button
          type="button"
          onClick={() => setPath('/settings/stops')}
          className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
            logic.activeSubTab === 'stops'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          <span>Зупинки, КТ та ДП</span>
        </button>

        <button
          type="button"
          onClick={() => setPath('/settings/shared-stops')}
          className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
            logic.activeSubTab === 'shared-stops'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Спільні зупинки маршрутів</span>
        </button>

        <button
          type="button"
          onClick={() => setPath('/settings/depots')}
          className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
            logic.activeSubTab === 'depots'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Депо та нульові рейси</span>
        </button>

        <button
          type="button"
          onClick={() => setPath('/settings/intersections')}
          className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
            logic.activeSubTab === 'hubs'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          <span>Колійні вузли</span>
        </button>

        <button
          type="button"
          onClick={() => setPath('/settings/breaks')}
          className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
            logic.activeSubTab === 'breaks'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs border border-slate-200 dark:border-slate-700 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Пункти обіду</span>
        </button>
      </div>

      {logic.activeSubTab === 'routes' && (
        <NetworkRoutesPanel
          routes={logic.routes}
          filteredRoutes={logic.filteredRoutes}
          searchQuery={logic.searchQuery}
          setSearchQuery={logic.setSearchQuery}
          typeFilter={logic.typeFilter}
          setTypeFilter={logic.setTypeFilter}
          statusFilter={logic.statusFilter}
          setStatusFilter={logic.setStatusFilter}
          selectedRouteId={logic.selectedRouteId}
          selectedRoute={logic.selectedRoute}
          activeViewMode={logic.activeViewMode}
          setActiveViewMode={logic.setActiveViewMode}
          onOpenCreateModal={logic.handleOpenCreateModal}
          onOpenEditModal={logic.handleOpenEditModal}
          onDuplicateRoute={logic.duplicateRoute}
          onDeleteRoute={logic.handleDeleteWithConfirm}
          onExportJson={logic.exportRoutesJson}
          onOpenJsonModal={() => logic.setIsJsonModalOpen(true)}
          onResetToDefaults={logic.resetToDefaults}
          onSelectRoute={logic.handleSelectRoute}
          onUpdateRoute={logic.updateRoute}
        />
      )}

      {logic.activeSubTab === 'hubs' && (
        <NetworkHubsPanel
          allDirectoryPoints={logic.allDirectoryPoints}
          routeUsageMap={logic.routeUsageMap}
          routes={logic.routes}
          controlPoints={logic.controlPoints}
          hubRouteTypeFilter={logic.hubRouteTypeFilter}
          setHubRouteTypeFilter={logic.setHubRouteTypeFilter}
          expandedRouteId={logic.expandedRouteId}
          setExpandedRouteId={logic.setExpandedRouteId}
          onOpenAddHubModal={() => {
            logic.setEditingHub(null)
            logic.setIsHubModalOpen(true)
          }}
          onOpenEditHubModal={(hub) => {
            logic.setEditingHub(hub)
            logic.setIsHubModalOpen(true)
          }}
          onDeleteHub={(id) => logic.deleteControlPoint(id)}
          onUpdateRoute={logic.updateRoute}
        />
      )}

      {logic.activeSubTab === 'depots' && (
        <NetworkDepotsPanel
          depots={logic.depots}
          routes={logic.routes}
          stations={logic.stations}
          routeDepotConfigs={logic.routeDepotConfigs}
          expandedDepotRouteId={logic.expandedDepotRouteId}
          setExpandedDepotRouteId={logic.setExpandedDepotRouteId}
          onAddDepotConfig={logic.addDepotConfig}
          onUpdateDepotConfig={logic.updateDepotConfig}
          onDeleteRouteDepotConfig={logic.deleteRouteDepotConfig}
        />
      )}

      {logic.activeSubTab === 'breaks' && (
        <NetworkBreaksPanel
          routes={logic.routes}
          breaks={logic.breaks}
          expandedBreakRouteId={logic.expandedBreakRouteId}
          setExpandedBreakRouteId={logic.setExpandedBreakRouteId}
          onOpenAddBreakModal={handleOpenAddBreakModal}
          onOpenEditBreakModal={handleOpenEditBreakModal}
          onDeleteBreak={logic.deleteBreak}
        />
      )}

      {logic.activeSubTab === 'stops' && <AdminStopsManager />}

      {logic.activeSubTab === 'shared-stops' && <SharedStopsPanel />}

      {/* Route CRUD Modals */}
      <RouteFormModal
        isOpen={logic.isFormModalOpen}
        onClose={() => logic.setIsFormModalOpen(false)}
        onSubmit={logic.handleFormSubmit}
        initialRoute={logic.editingRoute}
      />

      <JsonImportModal
        isOpen={logic.isJsonModalOpen}
        onClose={() => logic.setIsJsonModalOpen(false)}
        onImport={logic.importRoutesJson}
      />

      {logic.isHubModalOpen && (
        <GlobalHubFormModal
          hub={logic.editingHub}
          existingHubIds={logic.controlPoints.map((c) => c.id)}
          onSave={handleSaveHub}
          onClose={() => logic.setIsHubModalOpen(false)}
        />
      )}

      {logic.activeBreakRouteId && (
        <BreakLocationFormModal
          routeId={logic.activeBreakRouteId}
          existingConfig={logic.editingBreakConfig}
          onSave={handleSaveBreak}
          onClose={() => logic.setActiveBreakRouteId(null)}
        />
      )}
    </div>
  )
}

export default NetworkSettingsTab
