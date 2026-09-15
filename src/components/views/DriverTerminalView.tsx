import React from 'react'
import { useDriverTerminalLogic, POPULAR_VEHICLES } from '../../hooks/useDriverTerminalLogic'
import { DriverTerminalHeader } from '../crew/DriverTerminalHeader'
import { DriverTerminalQuickSelect } from '../crew/DriverTerminalQuickSelect'
import { DriverTerminalDirectiveAlert } from '../crew/DriverTerminalDirectiveAlert'
import { DriverTerminalNavTabs } from '../crew/DriverTerminalNavTabs'
import { DriverTerminalTripPanel } from '../crew/DriverTerminalTripPanel'
import { DriverTerminalWaybillPanel } from '../crew/DriverTerminalWaybillPanel'
import { DriverTerminalDispatchPanel } from '../crew/DriverTerminalDispatchPanel'
import { DriverTerminalSosModal } from '../crew/DriverTerminalSosModal'

export const DriverTerminalView: React.FC = () => {
  const {
    currentTime,
    vehicleId,
    customVehicleInput,
    setCustomVehicleInput,
    isCustomInputOpen,
    setIsCustomInputOpen,
    activeTab,
    setActiveTab,
    isNightMode,
    setIsNightMode,
    currentTripIdx,
    currentStopIdx,
    setCurrentStopIdx,
    isSosModalOpen,
    setIsSosModalOpen,
    waybill,
    isLoading,
    refetch,
    unacknowledgedDirectives,
    trips,
    currentTrip,
    stops,
    currentStop,
    nextStop,
    scheduleDeviation,
    isCheckInPending,
    isAckPending,
    isSosPending,
    handleSelectVehicle,
    handleCustomVehicleSubmit,
    handleCheckIn,
    handleAcknowledgeDirective,
    handleSendQuickAlert,
    handleConfirmSos,
    handleNextTrip,
    handlePrevTrip
  } = useDriverTerminalLogic()

  return (
    <div className={`min-h-[calc(100vh-140px)] p-3 md:p-6 transition-colors duration-300 font-sans select-none ${
      isNightMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* 1. Верхній приладовий щиток */}
        <DriverTerminalHeader 
          vehicleId={vehicleId}
          waybill={waybill}
          scheduleDeviation={scheduleDeviation}
          currentTime={currentTime}
          isNightMode={isNightMode}
          onToggleNightMode={() => setIsNightMode(!isNightMode)}
        />

        {/* Швидкий вибір вагона */}
        <DriverTerminalQuickSelect 
          vehicleId={vehicleId}
          popularVehicles={POPULAR_VEHICLES}
          isNightMode={isNightMode}
          isCustomInputOpen={isCustomInputOpen}
          customVehicleInput={customVehicleInput}
          isLoading={isLoading}
          onSelectVehicle={handleSelectVehicle}
          onOpenCustomInput={setIsCustomInputOpen}
          onCustomVehicleInputChange={setCustomVehicleInput}
          onCustomVehicleSubmit={handleCustomVehicleSubmit}
          onRefresh={refetch}
        />

        {/* Термінове сповіщення: наказ диспетчера */}
        <DriverTerminalDirectiveAlert 
          unacknowledgedDirectives={unacknowledgedDirectives}
          isAckPending={isAckPending}
          onAcknowledge={handleAcknowledgeDirective}
        />

        {/* 2. Вкладки навігації термінала */}
        <DriverTerminalNavTabs 
          activeTab={activeTab}
          isNightMode={isNightMode}
          onTabChange={setActiveTab}
        />

        {/* 3. Основний вміст обраної вкладки */}
        {activeTab === 'trip' && (
          <DriverTerminalTripPanel 
            currentTrip={currentTrip}
            tripsCount={trips.length}
            currentTripIdx={currentTripIdx}
            currentStop={currentStop}
            nextStop={nextStop}
            stops={stops}
            currentStopIdx={currentStopIdx}
            isNightMode={isNightMode}
            isCheckInPending={isCheckInPending}
            onPrevTrip={handlePrevTrip}
            onNextTrip={handleNextTrip}
            onCheckIn={handleCheckIn}
            onSelectStopIdx={setCurrentStopIdx}
          />
        )}

        {activeTab === 'waybill' && (
          <DriverTerminalWaybillPanel 
            waybill={waybill}
            vehicleId={vehicleId}
            tripsCount={trips.length}
            currentTripIdx={currentTripIdx}
            isNightMode={isNightMode}
          />
        )}

        {activeTab === 'dispatch' && (
          <DriverTerminalDispatchPanel 
            isNightMode={isNightMode}
            onSendQuickAlert={handleSendQuickAlert}
            onOpenSosModal={() => setIsSosModalOpen(true)}
          />
        )}
      </div>

      {/* 4. Модальне вікно підтвердження SOS сигналу */}
      <DriverTerminalSosModal 
        isOpen={isSosModalOpen}
        vehicleId={vehicleId}
        isSosPending={isSosPending}
        onClose={() => setIsSosModalOpen(false)}
        onConfirmSos={handleConfirmSos}
      />
    </div>
  )
}

export default DriverTerminalView
