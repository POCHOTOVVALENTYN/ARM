import React from 'react'
import { useActiveDutiesLogic } from '../../hooks/useActiveDutiesLogic'
import { ActiveDutiesToolbar } from '../planning/ActiveDutiesToolbar'
import { ActiveDutyRouteCard } from '../planning/ActiveDutyRouteCard'
import { SaveScheduleTemplateModal } from '../planning/SaveScheduleTemplateModal'
import { AlertCircle, PlusCircle } from 'lucide-react'

export const ActiveDutiesView: React.FC = () => {
  const {
    schedules,
    isLoading,
    isSavingTemplate,
    metrics,
    transportFilter,
    searchQuery,
    expandedRouteId,
    templateModalTarget,
    setTransportFilter,
    setSearchQuery,
    handleToggleExpand,
    handleOpenInMatrix,
    handleEditInBuilder,
    handleOpenShiftConstructor,
    handleArchiveSchedule,
    handleOpenTemplateModal,
    handleCloseTemplateModal,
    handleSaveTemplateSubmit,
    handleNavigateToBuilder
  } = useActiveDutiesLogic()

  return (
    <div
      className="space-y-6 font-sans max-w-7xl mx-auto"
      role="region"
      aria-label="Реєстр активних нарядів діючих розкладів"
    >
      {/* 1. Головна панель показників та фільтрів */}
      <ActiveDutiesToolbar
        metrics={metrics}
        transportFilter={transportFilter}
        searchQuery={searchQuery}
        onTransportFilterChange={setTransportFilter}
        onSearchChange={setSearchQuery}
        onNavigateToBuilder={handleNavigateToBuilder}
      />

      {/* 2. Контент: Стан завантаження або Реєстр маршрутів */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 font-bold text-xs animate-pulse bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          Завантаження діючих нарядів маршрутів КП «ОМЕТ»...
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Не знайдено активних нарядів за заданими критеріями
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Складіть та затвердіть графік руху у Конструкторі нарядів, щоб запустити маршрут на лінію.
            </p>
          </div>
          <button
            type="button"
            onClick={handleNavigateToBuilder}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black inline-flex items-center space-x-2 shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Скласти новий розклад</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((item) => (
            <ActiveDutyRouteCard
              key={item.schedule_id}
              item={item}
              isExpanded={expandedRouteId === item.route_id}
              onToggleExpand={handleToggleExpand}
              onOpenInMatrix={handleOpenInMatrix}
              onOpenShiftConstructor={handleOpenShiftConstructor}
              onEditInBuilder={handleEditInBuilder}
              onOpenTemplateModal={handleOpenTemplateModal}
              onArchiveSchedule={handleArchiveSchedule}
            />
          ))}
        </div>
      )}

      {/* 3. Модальне вікно збереження розкладу у шаблон */}
      <SaveScheduleTemplateModal
        item={templateModalTarget}
        isOpen={Boolean(templateModalTarget)}
        isPending={isSavingTemplate}
        onClose={handleCloseTemplateModal}
        onSave={handleSaveTemplateSubmit}
      />
    </div>
  )
}

export default ActiveDutiesView
