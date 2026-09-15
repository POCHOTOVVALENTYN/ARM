import React from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink
} from 'lucide-react'
import { NotificationItem } from '../../hooks/useExecutiveDashboardLogic'

export interface ExecutiveNotificationItemProps {
  item: NotificationItem
  onNavigate: (path: string) => void
}

export const ExecutiveNotificationItem: React.FC<ExecutiveNotificationItemProps> = ({
  item,
  onNavigate
}) => {
  const getSeverityConfig = () => {
    if (item.severity === 'critical') {
      return {
        bgStyle: 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800',
        badgeStyle: 'bg-rose-600 text-white',
        badgeLabel: 'КРИТИЧНИЙ КОНФЛІКТ',
        icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
      }
    }
    if (item.severity === 'warning') {
      return {
        bgStyle: 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800',
        badgeStyle: 'bg-amber-500 text-slate-950 font-black',
        badgeLabel: 'УВАГА / ІНЦИДЕНТ',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
      }
    }
    if (item.severity === 'success') {
      return {
        bgStyle: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800',
        badgeStyle: 'bg-emerald-600 text-white',
        badgeLabel: 'УСПІШНО',
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
      }
    }
    return {
      bgStyle: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800',
      badgeStyle: 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
      badgeLabel: 'ІНФОРМАЦІЯ',
      icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
    }
  }

  const { bgStyle, badgeStyle, badgeLabel, icon } = getSeverityConfig()

  const handleActionClick = () => {
    onNavigate(item.actionPath)
  }

  return (
    <div
      tabIndex={0}
      aria-label={`${badgeLabel}: ${item.title}`}
      className={`p-3.5 rounded-2xl border transition-all hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${bgStyle}`}
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs mt-0.5 shrink-0">
          {icon}
        </div>

        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${badgeStyle}`}>
              {badgeLabel}
            </span>

            <span className="text-xs font-mono font-bold text-slate-400">
              [{item.time}]
            </span>

            {item.nodeOrRoute && (
              <span className="text-[11px] font-mono font-bold bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                📍 {item.nodeOrRoute}
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{item.title}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
        </div>
      </div>

      <div className="shrink-0 pt-1 md:pt-0">
        <button
          type="button"
          onClick={handleActionClick}
          aria-label={`${item.actionText} для ${item.title}`}
          className="w-full md:w-auto px-3.5 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span>{item.actionText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default ExecutiveNotificationItem
