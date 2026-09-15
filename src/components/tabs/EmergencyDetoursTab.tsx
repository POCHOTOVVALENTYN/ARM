import React from 'react'
import { useEmergencyDetoursLogic } from '../../hooks/useEmergencyDetoursLogic'
import { EmergencyDetoursHeader } from '../network/EmergencyDetoursHeader'
import { EmergencyDetoursForm } from '../network/EmergencyDetoursForm'
import { EmergencyDetoursList } from '../network/EmergencyDetoursList'

export const EmergencyDetoursTab: React.FC = () => {
  const {
    vehicleId,
    setVehicleId,
    routeId,
    setRouteId,
    reason,
    setReason,
    newPath,
    setNewPath,
    detours,
    isLoading,
    isActivatePending,
    isDeactivatePending,
    emergencyTemplates,
    handleActivate,
    handleApplyTemplate,
    handleDeactivate
  } = useEmergencyDetoursLogic()

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden font-sans text-slate-100">
      {/* Верхній банер */}
      <EmergencyDetoursHeader activeCount={detours?.length || 0} />

      {/* Основний вміст */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          {/* Ліва колонка: Форма створення об'їзду (5 колонок) */}
          <EmergencyDetoursForm 
            vehicleId={vehicleId}
            routeId={routeId}
            reason={reason}
            newPath={newPath}
            isPending={isActivatePending}
            emergencyTemplates={emergencyTemplates}
            onVehicleIdChange={setVehicleId}
            onRouteIdChange={setRouteId}
            onReasonChange={setReason}
            onNewPathChange={setNewPath}
            onApplyTemplate={handleApplyTemplate}
            onSubmit={handleActivate}
          />

          {/* Права колонка: Список активних перемикань (7 колонок) */}
          <EmergencyDetoursList 
            detours={detours}
            isLoading={isLoading}
            isDeactivatePending={isDeactivatePending}
            onDeactivate={handleDeactivate}
          />
        </div>
      </div>
    </div>
  )
}

export default EmergencyDetoursTab
