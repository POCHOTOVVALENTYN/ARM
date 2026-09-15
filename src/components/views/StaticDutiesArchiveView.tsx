import React from 'react'
import { useStaticDutiesArchiveLogic } from '../../hooks/useStaticDutiesArchiveLogic'
import { StaticDutiesArchiveToolbar } from '../planning/StaticDutiesArchiveToolbar'
import { StaticDutiesArchiveEmptyState } from '../planning/StaticDutiesArchiveEmptyState'
import { StaticDutiesArchiveCard } from '../planning/StaticDutiesArchiveCard'
import { ScheduleActivationModal } from '../planning/ScheduleActivationModal'

export const StaticDutiesArchiveView: React.FC = () => {
  const {
    archiveList,
    filteredArchive,
    isLoading,
    isActivating,
    searchQuery,
    setSearchQuery,
    selectedTransportFilter,
    setSelectedTransportFilter,
    activationModal,
    handleOpenInMatrix,
    handleOpenActivationModal,
    handleCloseActivationModal,
    handleConfirmActivation,
    handleExportCsv,
    handleDeleteArchive,
    handleNavigateToParameters
  } = useStaticDutiesArchiveLogic()

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto" role="region" aria-label="Архів затверджених розкладів">
      {/* 1. Панель керування та фільтри */}
      <StaticDutiesArchiveToolbar
        totalCount={archiveList.length}
        searchQuery={searchQuery}
        selectedTransportFilter={selectedTransportFilter}
        onSearchChange={setSearchQuery}
        onTransportFilterChange={setSelectedTransportFilter}
        onNavigateToParameters={handleNavigateToParameters}
      />

      {/* 2. Контент: Стан завантаження, Пустий стан або Сітка карток */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 font-bold text-xs animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          Завантаження архівних розкладів із бази даних...
        </div>
      ) : filteredArchive.length === 0 ? (
        <StaticDutiesArchiveEmptyState
          onNavigateToParameters={handleNavigateToParameters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredArchive.map((item) => (
            <StaticDutiesArchiveCard
              key={item.id}
              item={item}
              onOpenInMatrix={handleOpenInMatrix}
              onOpenActivationModal={handleOpenActivationModal}
              onExportCsv={handleExportCsv}
              onDeleteArchive={handleDeleteArchive}
            />
          ))}
        </div>
      )}

      {/* 3. Модальне вікно планового введення в дію (Сценарій 1) */}
      <ScheduleActivationModal
        isOpen={activationModal.isOpen}
        scheduleId={activationModal.scheduleId}
        routeNumber={activationModal.routeNumber}
        routeName={activationModal.routeName}
        versionName={activationModal.versionName}
        isPending={isActivating}
        onClose={handleCloseActivationModal}
        onConfirm={handleConfirmActivation}
      />
    </div>
  )
}

export default StaticDutiesArchiveView
