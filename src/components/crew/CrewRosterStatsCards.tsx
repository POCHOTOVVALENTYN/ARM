import React from 'react'
import { Users, CheckCircle2, Award } from 'lucide-react'

interface CrewRosterStatsCardsProps {
  totalDriversCount: number
  assignedCount: number
  targetDate: string
}

export const CrewRosterStatsCards: React.FC<CrewRosterStatsCardsProps> = ({
  totalDriversCount,
  assignedCount,
  targetDate
}) => {
  const reserveCount = Math.max(0, totalDriversCount - assignedCount)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Всього водіїв у базі</span>
          <Users className="w-4 h-4 text-indigo-500" />
        </div>
        <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
          {totalDriversCount}
        </p>
        <span className="text-[10px] text-slate-400">Штатний розпис депо</span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Призначені путівки на дату</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
          {assignedCount}
        </p>
        <span className="text-[10px] text-emerald-600/80 font-bold">Закріплені наряди на {targetDate}</span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>Вільний резерв</span>
          <Award className="w-4 h-4 text-amber-500" />
        </div>
        <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
          {reserveCount}
        </p>
        <span className="text-[10px] text-slate-400">Доступні для підміни / випуску</span>
      </div>
    </div>
  )
}
