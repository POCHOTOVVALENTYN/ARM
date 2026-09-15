import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { NotificationItem } from '../../hooks/useExecutiveDashboardLogic'
import { ExecutiveNotificationItem } from './ExecutiveNotificationItem'

export interface ExecutiveNotificationsFeedProps {
  notifications: NotificationItem[]
  onNavigate: (path: string) => void
}

export const ExecutiveNotificationsFeed: React.FC<ExecutiveNotificationsFeedProps> = ({
  notifications,
  onNavigate
}) => {
  if (notifications.length === 0) {
    return (
      <div 
        tabIndex={0}
        aria-label="Немає повідомлень за обраним фільтром"
        className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Немає повідомлень за обраним фільтром
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Усі оперативні параметри руху, розкладу та безпеки знаходяться в межах встановлених норм ОМЕТ.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {notifications.map((item) => (
        <ExecutiveNotificationItem
          key={item.id}
          item={item}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

export default ExecutiveNotificationsFeed
