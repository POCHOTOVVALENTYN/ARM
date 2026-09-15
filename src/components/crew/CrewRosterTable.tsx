import React from 'react'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { CrewRosterItem } from '../../hooks/useCrewRosterLogic'

interface CrewRosterTableProps {
  items: CrewRosterItem[]
  isLoading: boolean
}

export const CrewRosterTable: React.FC<CrewRosterTableProps> = ({
  items,
  isLoading
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs">
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-3">ПІБ Водія</th>
              <th className="p-3">Табельний №</th>
              <th className="p-3">Кваліфікація</th>
              <th className="p-3">Закріплений наряд</th>
              <th className="p-3">Борт рухомого складу</th>
              <th className="p-3">Статус зміни</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                  Завантаження даних водіїв та путівок з бази...
                </td>
              </tr>
            ) : items.length > 0 ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                    {item.driverName}
                  </td>
                  <td className="p-3 text-slate-400 font-mono">{item.driverBadge}</td>
                  <td className="p-3 font-sans">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {item.classRank}
                    </span>
                  </td>
                  <td className="p-3 font-sans font-extrabold text-indigo-600 dark:text-indigo-400">
                    {item.dutyNumber}
                  </td>
                  <td className="p-3 font-sans font-bold text-slate-700 dark:text-slate-200">
                    {item.vehicleId}
                  </td>
                  <td className="p-3 font-sans">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${
                      item.isAssigned 
                        ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {item.isAssigned && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                      <span>{item.status}</span>
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="font-bold text-slate-600 dark:text-slate-300">Немає призначень на вказану дату</p>
                    <p className="text-xs text-slate-400">Натисніть кнопку «Виписати путівку», щоб призначити водія та вагон на статичний наряд.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
