import React from 'react'
import { AlertCircle } from 'lucide-react'
import { GlobalLoader } from '../GlobalLoader'
import { useSmartWaybillLogic } from '../../hooks/useSmartWaybillLogic'
import { SmartWaybillHeader } from '../crew/SmartWaybillHeader'
import { SmartWaybillCommPanel } from '../crew/SmartWaybillCommPanel'
import { SmartWaybillDocument } from '../crew/SmartWaybillDocument'

interface SmartWaybillViewProps {
  vehicleId?: string
}

export const SmartWaybillView: React.FC<SmartWaybillViewProps> = ({ vehicleId: propVehicleId }) => {
  const {
    targetDate,
    setTargetDate,
    driverIdInput,
    setDriverIdInput,
    searchDriverId,
    customAlertMsg,
    setCustomAlertMsg,
    waybill,
    isLoading,
    isError,
    error,
    dailyDeployments,
    directives,
    isAlertPending,
    isAckPending,
    handleSearch,
    handleSendQuickAlert,
    handleSendCustomAlert,
    handleAcknowledgeDirective,
    handlePrint,
    handleSelectDeploymentDriver
  } = useSmartWaybillLogic({ vehicleId: propVehicleId })

  const activeVehicleId = waybill?.vehicle?.id || propVehicleId || '4020'
  const errorMessage = error instanceof Error ? error.message : 'Для цього водія не призначено електронний наряд на обрану дату.'

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto">
      <SmartWaybillHeader 
        targetDate={targetDate}
        driverIdInput={driverIdInput}
        hasWaybill={Boolean(waybill)}
        dailyDeployments={dailyDeployments}
        selectedDriverId={searchDriverId}
        onDateChange={setTargetDate}
        onDriverIdInputChange={setDriverIdInput}
        onSearch={handleSearch}
        onPrint={handlePrint}
        onSelectDeploymentDriver={handleSelectDeploymentDriver}
      />

      <div className="flex-1 px-4 pb-4 max-w-7xl mx-auto w-full space-y-4">
        {isLoading && <GlobalLoader text="Завантаження похвилинної книжки водія..." />}

        {isError && (
          <div className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-2xl border border-rose-200 dark:border-rose-800 text-center flex flex-col items-center justify-center space-y-2">
            <AlertCircle size={36} className="text-rose-500" />
            <h3 className="font-extrabold text-sm text-rose-800 dark:text-rose-200">
              Путівку на дату {targetDate} не знайдено
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
              {errorMessage}
            </p>
          </div>
        )}

        {waybill && (
          <>
            <SmartWaybillCommPanel 
              vehicleId={activeVehicleId}
              directives={directives}
              customAlertMsg={customAlertMsg}
              isAlertPending={isAlertPending}
              isAckPending={isAckPending}
              onSendQuickAlert={handleSendQuickAlert}
              onSendCustomAlert={handleSendCustomAlert}
              onCustomAlertMsgChange={setCustomAlertMsg}
              onAcknowledgeDirective={handleAcknowledgeDirective}
            />

            <SmartWaybillDocument waybill={waybill} />
          </>
        )}
      </div>
    </div>
  )
}

export default SmartWaybillView
