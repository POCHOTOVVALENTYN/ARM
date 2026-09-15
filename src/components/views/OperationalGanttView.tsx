import React from 'react'
import { useOperationalGanttLogic } from '../../hooks/useOperationalGanttLogic'
import { OperationalGanttToolbar } from '../dispatcher/OperationalGanttToolbar'
import { OperationalGanttTimeline } from '../dispatcher/OperationalGanttTimeline'
import { OperationalGanttTaskModal } from '../dispatcher/OperationalGanttTaskModal'
import { GlobalLoader } from '../GlobalLoader'

export const OperationalGanttView: React.FC = () => {
  const {
    routes,
    selectedRouteId,
    taskFilter,
    searchDuty,
    inspectedTask,
    isLoading,
    currentTimelineOffsetPercent,
    currentTimeDisplay,
    metrics,
    groupedDuties,
    hoursMarks,

    handleRouteSelect,
    handleTaskFilterChange,
    handleSearchChange,
    handleTaskClick,
    handleCloseModal,
    handleNavigate,
    refetchSchedule
  } = useOperationalGanttLogic()

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto pb-6 font-sans">
      {isLoading && <GlobalLoader message="Завантаження оперативного розкладу Ґантта..." />}

      {/* 1. Верхня панель: Маршрут, фільтри завдань, пошук та лічильники */}
      <OperationalGanttToolbar
        routes={routes}
        selectedRouteId={selectedRouteId}
        taskFilter={taskFilter}
        searchDuty={searchDuty}
        metrics={metrics}
        currentTimeDisplay={currentTimeDisplay}
        isLoading={isLoading}
        onRouteSelect={handleRouteSelect}
        onTaskFilterChange={handleTaskFilterChange}
        onSearchChange={handleSearchChange}
        onRefresh={refetchSchedule}
      />

      {/* 2. Графік Ґантта з лінією Now */}
      <OperationalGanttTimeline
        groupedDuties={groupedDuties}
        hoursMarks={hoursMarks}
        currentTimelineOffsetPercent={currentTimelineOffsetPercent}
        currentTimeDisplay={currentTimeDisplay}
        onTaskClick={handleTaskClick}
      />

      {/* 3. Модальне вікно інспекції завдання */}
      {inspectedTask && (
        <OperationalGanttTaskModal
          task={inspectedTask}
          onClose={handleCloseModal}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  )
}

export default OperationalGanttView
