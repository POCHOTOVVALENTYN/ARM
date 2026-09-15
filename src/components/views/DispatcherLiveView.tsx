import React from 'react'
import {
  Wrench,
  Building2,
  Radio,
  RotateCcw,
  X
} from 'lucide-react'
import {
  useDispatcherLiveLogic,
  VehicleTelemetryRow,
  RouteItem,
  StationItem,
  ActiveDetourItem,
  ModeFilterType,
  StatusFilterType,
  DispatcherCounts
} from '../../hooks/useDispatcherLiveLogic'
import { DispatcherMetricsHud } from '../dispatcher/DispatcherMetricsHud'
import { DispatcherPassengerTable } from '../dispatcher/DispatcherPassengerTable'
import { DispatcherServiceTable } from '../dispatcher/DispatcherServiceTable'
import { DispatcherDepotTable } from '../dispatcher/DispatcherDepotTable'
import { ShortTurnModal } from '../modals/ShortTurnModal'
import { VehiclePacingModal } from '../modals/VehiclePacingModal'
import { RouteEmergencyActionModal } from '../modals/RouteEmergencyActionModal'
import { VehicleInspectorModal } from '../modals/VehicleInspectorModal'

// Реекспорт інтерфейсів для зворотної сумісності з іншими модалками
export type {
  VehicleTelemetryRow,
  RouteItem,
  StationItem,
  ActiveDetourItem,
  ModeFilterType,
  StatusFilterType,
  DispatcherCounts
}

export const DispatcherLiveView: React.FC = () => {
  const {
    selectedRouteId,
    modeFilter,
    searchQuery,
    statusFilter,
    isAutoRefresh,
    isManualRefreshing,
    lastSyncTime,

    routes,
    activeRouteObj,
    calculatedIntervalMin,
    routeVehiclesTotalCount,
    counts,
    filteredVehicles,
    activeDetours,
    stations,

    isShortTurnOpen,
    isPacingOpen,
    isRouteEmergencyOpen,
    isInspectorOpen,
    inspectedVehicle,
    selectedVehicleForAction,

    handleManualRefresh,
    handleRouteSelect,
    handleModeSelect,
    handleStatusSelect,
    handleSearchChange,
    handleToggleAutoRefresh,
    handleOpenInspector,
    handleCloseInspector,
    handleOpenShortTurn,
    handleCloseShortTurn,
    handleOpenPacing,
    handleClosePacing,
    handleOpenRouteEmergency,
    handleCloseRouteEmergency,
    handleDeactivateDetour,
    refetchTelemetry
  } = useDispatcherLiveLogic()

  return (
    <div className="space-y-3.5 max-w-[1920px] mx-auto pb-6 font-sans">
      {/* 1. Смуга активних розворотів (якщо є) */}
      {activeDetours.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-amber-600 animate-spin" />
            <span className="font-black text-amber-950 dark:text-amber-200">
              Активні оперативні розвороти ({activeDetours.length}):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeDetours.map((det) => (
              <div
                key={det.id}
                className="bg-white dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] font-mono flex items-center space-x-1.5 shadow-2xs"
              >
                <span className="font-black text-slate-800 dark:text-slate-200">
                  Борт {det.vehicle_id} (№{det.route_id})
                </span>
                <span className="text-slate-400">→</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{det.target_loop || det.reason}</span>
                <button
                  type="button"
                  onClick={() => handleDeactivateDetour(det.id)}
                  aria-label={`Завершити розворот борта ${det.vehicle_id}`}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                  title="Завершити розворот та повернути на лінію"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Компактний диспетчерський HUD: Режими флоту, маршрути, запізнення, пошук */}
      <DispatcherMetricsHud
        modeFilter={modeFilter}
        selectedRouteId={selectedRouteId}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        isAutoRefresh={isAutoRefresh}
        isManualRefreshing={isManualRefreshing}
        lastSyncTime={lastSyncTime}
        counts={counts}
        routes={routes}
        activeRouteObj={activeRouteObj}
        calculatedIntervalMin={calculatedIntervalMin}
        routeVehiclesTotalCount={routeVehiclesTotalCount}
        onModeSelect={handleModeSelect}
        onRouteSelect={handleRouteSelect}
        onStatusSelect={handleStatusSelect}
        onSearchChange={handleSearchChange}
        onToggleAutoRefresh={handleToggleAutoRefresh}
        onManualRefresh={handleManualRefresh}
        onOpenRouteEmergency={handleOpenRouteEmergency}
      />

      {/* 3. Головна матриця рухомого складу із закріпленим thead */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
            {modeFilter === 'SERVICE' ? (
              <>
                <Wrench className="w-4 h-4 text-purple-600" />
                <span>Оперативна дислокація аварійно-відновлювальної спецтехніки</span>
              </>
            ) : modeFilter === 'DEPOT' ? (
              <>
                <Building2 className="w-4 h-4 text-slate-600" />
                <span>Резервний парк та рухомий склад на території депо</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 text-blue-600" />
                <span>Матриця випуску та відхилення за GPS-телеметрією</span>
              </>
            )}
          </h3>
          <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Відображено: {filteredVehicles.length} одиниць
          </span>
        </div>

        <div className="w-full max-h-[calc(100vh-230px)] overflow-y-auto">
          {modeFilter === 'SERVICE' ? (
            <DispatcherServiceTable
              vehicles={filteredVehicles}
              stations={stations}
              onOpenInspector={handleOpenInspector}
            />
          ) : modeFilter === 'DEPOT' ? (
            <DispatcherDepotTable
              vehicles={filteredVehicles}
              onOpenInspector={handleOpenInspector}
            />
          ) : (
            <DispatcherPassengerTable
              vehicles={filteredVehicles}
              stations={stations}
              onOpenInspector={handleOpenInspector}
              onOpenShortTurn={handleOpenShortTurn}
              onOpenPacing={handleOpenPacing}
              onOpenOrderModal={handleOpenShortTurn}
            />
          )}
        </div>
      </div>

      {/* 4. Модальні вікна диспетчерського втручання */}
      {isShortTurnOpen && selectedVehicleForAction && (
        <ShortTurnModal
          isOpen={isShortTurnOpen}
          onClose={handleCloseShortTurn}
          vehicleId={selectedVehicleForAction.vehicle_id}
          routeId={selectedVehicleForAction.route_id}
          onSuccess={() => refetchTelemetry()}
        />
      )}

      {isPacingOpen && selectedVehicleForAction && (
        <VehiclePacingModal
          isOpen={isPacingOpen}
          onClose={handleClosePacing}
          vehicle={selectedVehicleForAction}
          onSuccess={() => refetchTelemetry()}
        />
      )}

      {isRouteEmergencyOpen && (
        <RouteEmergencyActionModal
          isOpen={isRouteEmergencyOpen}
          onClose={handleCloseRouteEmergency}
          routeId={selectedRouteId !== 'ALL' ? selectedRouteId : '7'}
          routeName={activeRouteObj?.name}
          activeVehiclesCount={routeVehiclesTotalCount}
          onSuccess={() => refetchTelemetry()}
        />
      )}

      {isInspectorOpen && inspectedVehicle && (
        <VehicleInspectorModal
          isOpen={isInspectorOpen}
          onClose={handleCloseInspector}
          vehicle={inspectedVehicle as any}
        />
      )}
    </div>
  )
}

export default DispatcherLiveView
