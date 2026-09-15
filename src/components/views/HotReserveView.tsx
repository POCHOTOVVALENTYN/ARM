import React from 'react'
import { useHotReserveLogic } from '../../hooks/useHotReserveLogic'
import { HotReserveHeader } from '../crew/HotReserveHeader'
import { HotReserveResultBanner } from '../crew/HotReserveResultBanner'
import { HotReserveForm } from '../crew/HotReserveForm'
import { HotReserveAlgorithmInfo } from '../crew/HotReserveAlgorithmInfo'

export const HotReserveView: React.FC = () => {
  const {
    draftBlocks,
    brokenBlockId,
    setBrokenBlockId,
    targetTripId,
    setTargetTripId,
    reserveBlockId,
    setReserveBlockId,
    incidentTime,
    setIncidentTime,
    isSubmitting,
    swapResult,
    availableTrips,
    handleExecuteSwap
  } = useHotReserveLogic()

  return (
    <div className="space-y-4 font-sans max-w-6xl mx-auto">
      {/* 1. Заголовок */}
      <HotReserveHeader />

      {/* 2. Сповіщення результату */}
      <HotReserveResultBanner swapResult={swapResult} />

      {/* 3. Форма та Інфоблок */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HotReserveForm 
          draftBlocks={draftBlocks}
          brokenBlockId={brokenBlockId}
          targetTripId={targetTripId}
          reserveBlockId={reserveBlockId}
          incidentTime={incidentTime}
          availableTrips={availableTrips}
          isSubmitting={isSubmitting}
          onBrokenBlockIdChange={setBrokenBlockId}
          onTargetTripIdChange={setTargetTripId}
          onReserveBlockIdChange={setReserveBlockId}
          onIncidentTimeChange={setIncidentTime}
          onSubmit={handleExecuteSwap}
        />

        {/* 4. Інфобокс алгоритму */}
        <HotReserveAlgorithmInfo incidentTime={incidentTime} />
      </div>
    </div>
  )
}

export default HotReserveView
