import React from 'react'
import {
  useDutyParametersBuilderLogic,
  type IndividualDutyConfig,
  type DutyTemplate,
  type DutyDraft
} from '../../hooks/useDutyParametersBuilderLogic'
import { DutyBuilderHeader } from '../planning/DutyBuilderHeader'
import { DutyMacroStep } from '../planning/DutyMacroStep'
import { DutyMicroStep } from '../planning/DutyMicroStep'
import { DutyValidationSummaryStep } from '../planning/DutyValidationSummaryStep'
import { DutyDraftModals } from '../planning/DutyDraftModals'

export type { IndividualDutyConfig, DutyTemplate, DutyDraft }

export const DutyParametersBuilderView: React.FC = () => {
  const {
    filteredRoutes,
    currentRoute,
    currentStep,
    selectedRouteId,
    transportTypeFilter,
    scheduleType,
    startDate,
    endDate,
    dutiesCount,
    roundTripMin,
    defaultSpeedKmh,
    routeLengthKm,
    designatedDpName,
    secondaryDpName,
    depotName,
    depotJunctionStop,
    dutyConfigs,
    lastCalculatedSummary,
    isProcessingTransaction,
    availableRouteStops,
    oppositeTerminusName,
    dutyTemplates,
    isSaveTemplateOpen,
    isTemplatesListOpen,
    templateNameInput,
    calculatedInterval,
    countDouble,
    countSingle,
    countSplit,
    countPeak,
    driversShift1,
    driversShift2,
    totalDriversNeeded,
    detailedCorridorOverlaps,

    setTransportTypeFilter,
    setScheduleType,
    setStartDate,
    setEndDate,
    setIsSaveTemplateOpen,
    setIsTemplatesListOpen,
    setTemplateNameInput,
    setPath,

    handleSelectRoute,
    handleChangeDutiesCount,
    handleChangeSpeed,
    handleChangeRouteLength,
    handleChangeRoundTrip,
    handleChangeDesignatedDpName,
    handleChangeSecondaryDpName,
    handleProceedToStep2,
    handleProceedToStep3,
    handleBackToStep1,
    handleBackToStep2,
    handleUpdateDutyField,
    handleMoveDutyUp,
    handleMoveDutyDown,
    handleApplyFirstDutyToAll,
    handleSaveTemplateConfirm,
    handleLoadTemplate,
    handleDeleteTemplate,
    handleCalculateSchedule,
    handleDismissCalculatedSummary
  } = useDutyParametersBuilderLogic()

  const isTram = currentRoute?.type === 'tram'

  const handleStepChange = (step: 1 | 2 | 3) => {
    if (step === 1) {
      handleBackToStep1()
    } else if (step === 2) {
      handleProceedToStep2()
    } else {
      handleProceedToStep3()
    }
  }

  const handleOpenTemplatesList = () => {
    setIsTemplatesListOpen(true)
  }

  const handleOpenSaveTemplate = () => {
    setTemplateNameInput(`${currentRoute.name} (${scheduleType}, ${dutiesCount} нар.)`)
    setIsSaveTemplateOpen(true)
  }

  const handleCloseSaveTemplate = () => {
    setIsSaveTemplateOpen(false)
  }

  const handleCloseTemplatesList = () => {
    setIsTemplatesListOpen(false)
  }

  const handleNavigateToIntersections = () => {
    setPath('/settings/intersections')
  }

  return (
    <div className="space-y-6 font-sans">
      <DutyBuilderHeader
        currentStep={currentStep}
        dutiesCount={dutiesCount}
        draftsCount={dutyTemplates.length}
        lastCalculatedSummary={lastCalculatedSummary}
        onStepChange={handleStepChange}
        onOpenDraftsList={handleOpenTemplatesList}
        onOpenSaveDraft={handleOpenSaveTemplate}
        onDismissCalculatedSummary={handleDismissCalculatedSummary}
        onNavigateToInterline={() => setPath('/planning/interline')}
      />

      {currentStep === 1 && (
        <DutyMacroStep
          filteredRoutes={filteredRoutes}
          currentRoute={currentRoute}
          selectedRouteId={selectedRouteId}
          transportTypeFilter={transportTypeFilter}
          scheduleType={scheduleType}
          startDate={startDate}
          endDate={endDate}
          dutiesCount={dutiesCount}
          calculatedInterval={calculatedInterval}
          routeLengthKm={routeLengthKm}
          defaultSpeedKmh={defaultSpeedKmh}
          roundTripMin={roundTripMin}
          designatedDpName={designatedDpName}
          secondaryDpName={secondaryDpName}
          availableRouteStops={availableRouteStops}
          detailedCorridorOverlaps={detailedCorridorOverlaps}
          onTransportTypeFilterChange={setTransportTypeFilter}
          onScheduleTypeChange={setScheduleType}
          onSelectRoute={handleSelectRoute}
          onChangeDutiesCount={handleChangeDutiesCount}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onChangeRouteLength={handleChangeRouteLength}
          onChangeSpeed={handleChangeSpeed}
          onChangeRoundTrip={handleChangeRoundTrip}
          onChangeDesignatedDpName={handleChangeDesignatedDpName}
          onChangeSecondaryDpName={handleChangeSecondaryDpName}
          onProceedToStep2={handleProceedToStep2}
          onNavigateToIntersections={handleNavigateToIntersections}
        />
      )}

      {currentStep === 2 && (
        <DutyMicroStep
          dutyConfigs={dutyConfigs}
          dutiesCount={dutiesCount}
          driversShift1={driversShift1}
          driversShift2={driversShift2}
          countSplit={countSplit}
          totalDriversNeeded={totalDriversNeeded}
          depotName={depotName}
          depotJunctionStop={depotJunctionStop}
          designatedDpName={designatedDpName}
          oppositeTerminusName={oppositeTerminusName}
          availableRouteStops={availableRouteStops}
          isTram={isTram}
          isProcessingTransaction={isProcessingTransaction}
          onMoveDutyUp={handleMoveDutyUp}
          onMoveDutyDown={handleMoveDutyDown}
          onUpdateDutyField={handleUpdateDutyField}
          onApplyFirstDutyToAll={handleApplyFirstDutyToAll}
          onBackToStep1={handleBackToStep1}
          onProceedToStep3={handleProceedToStep3}
          onCalculateSchedule={handleCalculateSchedule}
        />
      )}

      {currentStep === 3 && (
        <DutyValidationSummaryStep
          dutyConfigs={dutyConfigs}
          dutiesCount={dutiesCount}
          driversShift1={driversShift1}
          driversShift2={driversShift2}
          countSplit={countSplit}
          countSingle={countSingle}
          countPeak={countPeak}
          countDouble={countDouble}
          totalDriversNeeded={totalDriversNeeded}
          calculatedInterval={calculatedInterval}
          roundTripMin={roundTripMin}
          routeLengthKm={routeLengthKm}
          defaultSpeedKmh={defaultSpeedKmh}
          designatedDpName={designatedDpName}
          depotName={depotName}
          isTram={isTram}
          isProcessingTransaction={isProcessingTransaction}
          onBackToStep2={handleBackToStep2}
          onCalculateSchedule={handleCalculateSchedule}
        />
      )}

      <DutyDraftModals
        isSaveDraftOpen={isSaveTemplateOpen}
        isDraftsListOpen={isTemplatesListOpen}
        draftNameInput={templateNameInput}
        dutyDrafts={dutyTemplates}
        onDraftNameInputChange={setTemplateNameInput}
        onSaveDraftConfirm={handleSaveTemplateConfirm}
        onCloseSaveDraft={handleCloseSaveTemplate}
        onLoadDraft={handleLoadTemplate}
        onDeleteDraft={handleDeleteTemplate}
        onCloseDraftsList={handleCloseTemplatesList}
      />
    </div>
  )
}
