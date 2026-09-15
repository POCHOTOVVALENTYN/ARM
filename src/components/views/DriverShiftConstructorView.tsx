import React from 'react'
import { useDriverShiftConstructorLogic } from '../../hooks/useDriverShiftConstructorLogic'
import { DriverShiftConstructorToolbar } from '../planning/DriverShiftConstructorToolbar'
import { DriverShiftCard } from '../planning/DriverShiftCard'
import { DriverShiftEmptyState } from '../planning/DriverShiftEmptyState'
import { DriverShiftAssignmentModal } from '../planning/DriverShiftAssignmentModal'
import { KPZCardPrinterModal } from '../modals/KPZCardPrinterModal'
import { SearchX } from 'lucide-react'

export const DriverShiftConstructorView: React.FC = () => {
  const {
    routes,
    selectedRouteId,
    selectedRoute,
    shifts,
    allShifts,
    hasActiveSchedule,
    isLoading,
    kpzData,
    selectedKpzShiftId,
    selectedAssignmentShift,
    isAssignmentModalOpen,
    isTram,
    prepTimeMin,
    validCount,
    extendedCount,
    violationCount,
    activeFilter,
    searchQuery,
    setActiveFilter,
    setSearchQuery,
    handleRefetch,
    handleSelectRouteId,
    handleOpenKpzModal,
    handleCloseKpzModal,
    handleOpenAssignmentModal,
    handleCloseAssignmentModal,
    handleSaveAssignment,
    handleNavigateToParameters
  } = useDriverShiftConstructorLogic()

  return (
    <div className="space-y-4 font-sans max-w-full">
      {/* Верхня панель фільтрів та показників */}
      <DriverShiftConstructorToolbar
        routes={routes}
        selectedRouteId={selectedRouteId}
        prepTimeMin={prepTimeMin}
        isTram={isTram}
        totalShiftsCount={allShifts.length}
        validCount={validCount}
        extendedCount={extendedCount}
        violationCount={violationCount}
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        isLoading={isLoading}
        onSelectRouteId={handleSelectRouteId}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearchQuery}
        onRefetch={handleRefetch}
      />

      {/* Штатний стан очікування, якщо для маршруту немає активного розкладу */}
      {!hasActiveSchedule && !isLoading ? (
        <DriverShiftEmptyState
          currentRoute={selectedRoute}
          onNavigateToParameters={handleNavigateToParameters}
        />
      ) : (
        <>
          {shifts.length === 0 && !isLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <SearchX className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
                Змін за обраними критеріями не знайдено
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Спробуйте змінити фільтр або очистити пошуковий запит
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('ALL')
                  setSearchQuery('')
                }}
                className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-100 cursor-pointer"
              >
                Скинути фільтри
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <DriverShiftCard
                  key={shift.id}
                  shift={shift}
                  onOpenKpzModal={handleOpenKpzModal}
                  onOpenAssignmentModal={handleOpenAssignmentModal}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Модальне вікно призначення водія та вагона */}
      {isAssignmentModalOpen && (
        <DriverShiftAssignmentModal
          shift={selectedAssignmentShift}
          isOpen={isAssignmentModalOpen}
          onClose={handleCloseAssignmentModal}
          onSave={handleSaveAssignment}
        />
      )}

      {/* Модальне вікно друку картки КПЗ */}
      {selectedKpzShiftId && (
        <KPZCardPrinterModal
          data={kpzData}
          onClose={handleCloseKpzModal}
        />
      )}
    </div>
  )
}

export default DriverShiftConstructorView
