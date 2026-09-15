import React from 'react'
import {
  Bell,
  Search,
  MessageSquare,
  ShieldAlert,
  Users,
  Clock,
  Info
} from 'lucide-react'
import { NotificationCategory, CategoryCounts } from '../../hooks/useExecutiveDashboardLogic'

export interface ExecutiveNotificationFilterProps {
  totalCount: number
  categoryCounts: CategoryCounts
  currentCategory: NotificationCategory
  searchQuery: string
  onCategoryChange: (category: NotificationCategory) => void
  onSearchChange: (query: string) => void
}

interface FilterTab {
  id: NotificationCategory
  label: string
  icon: React.ComponentType<{ className?: string }>
  count: number
}

export const ExecutiveNotificationFilter: React.FC<ExecutiveNotificationFilterProps> = ({
  totalCount,
  categoryCounts,
  currentCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange
}) => {
  const tabs: FilterTab[] = [
    { id: 'all', label: 'Усі події', icon: MessageSquare, count: categoryCounts.all },
    { id: 'node_conflict', label: '🚨 Конфлікти вузлів', icon: ShieldAlert, count: categoryCounts.node_conflict },
    { id: 'kzpp_violation', label: '⚠️ Норми КЗпП', icon: Users, count: categoryCounts.kzpp_violation },
    { id: 'delays_slack', label: '⏱️ Запізнення', icon: Clock, count: categoryCounts.delays_slack },
    { id: 'system_info', label: 'ℹ️ Статус Флоту', icon: Info, count: categoryCounts.system_info }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value)
  }

  const handleTabClick = (category: NotificationCategory) => {
    onCategoryChange(category)
  }

  const handleTabKeyDown = (e: React.KeyboardEvent, category: NotificationCategory) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onCategoryChange(category)
    }
  }

  return (
    <div className="space-y-4">
      {/* Заголовок та пошук */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Центр оперативних повідомлень та конфліктів
              </h2>
              {totalCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
                  {totalCount}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Жива стрічка: чергові інциденти, конфлікти паровозності на вузлах, норми КЗпП та Wialon-телеметрія
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Пошук маршруту, борту, вузла..."
            value={searchQuery}
            onChange={handleInputChange}
            aria-label="Пошук оперативного повідомлення"
            className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Segmented Control фільтрів */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3" role="tablist">
        {tabs.map((tab) => {
          const isActive = currentCategory === tab.id
          const TabIcon = tab.icon
          const tabClass = isActive
            ? 'bg-blue-600 text-white shadow-xs font-black'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          const countBadgeClass = isActive
            ? 'bg-blue-500 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${tabClass}`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${countBadgeClass}`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ExecutiveNotificationFilter
