import React from 'react'
import { useExecutiveDashboardLogic } from '../../hooks/useExecutiveDashboardLogic'
import { ExecutiveKpiCards } from '../analytics/ExecutiveKpiCards'
import { ExecutiveNotificationFilter } from '../analytics/ExecutiveNotificationFilter'
import { ExecutiveNotificationsFeed } from '../analytics/ExecutiveNotificationsFeed'
import { GlobalLoader } from '../GlobalLoader'

export const ExecutiveDashboardView: React.FC = () => {
  const {
    kpis,
    notifications,
    totalNotificationsCount,
    categoryCounts,
    currentCategory,
    searchQuery,
    isLoading,
    handleCategoryChange,
    handleSearchChange,
    handleNavigate
  } = useExecutiveDashboardLogic()

  return (
    <div className="space-y-4 max-w-[1920px] mx-auto pb-6 font-sans">
      {isLoading && <GlobalLoader message="Оновлення даних моніторингу КП «ОМЕТ»..." />}

      {/* 1. Верхній ряд KPI: Акцент на реальному випуску та якості */}
      <ExecutiveKpiCards kpis={kpis} />

      {/* 2. Центр оперативних повідомлень та конфліктів */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl space-y-4 border border-slate-200 dark:border-slate-800 shadow-xs">
        <ExecutiveNotificationFilter
          totalCount={totalNotificationsCount}
          categoryCounts={categoryCounts}
          currentCategory={currentCategory}
          searchQuery={searchQuery}
          onCategoryChange={handleCategoryChange}
          onSearchChange={handleSearchChange}
        />

        <ExecutiveNotificationsFeed
          notifications={notifications}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  )
}

export default ExecutiveDashboardView
