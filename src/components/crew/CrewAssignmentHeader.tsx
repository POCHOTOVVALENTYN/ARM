import React from 'react'
import { Users, Calendar } from 'lucide-react'

interface CrewAssignmentHeaderProps {
  targetDate: string
  onDateChange: (date: string) => void
}

export const CrewAssignmentHeader: React.FC<CrewAssignmentHeaderProps> = ({
  targetDate,
  onDateChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs gap-3">
      <div>
        <h1 className="text-base font-black text-slate-900 dark:text-white flex items-center">
          <Users className="mr-2 text-blue-600 dark:text-blue-400 w-5 h-5" />
          <span>Щоденна Рознарядка (Видача Путівок)</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
          Призначення рухомого складу та водіїв на графікові наряди із синхронізацією в Redis
        </p>
      </div>
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <Calendar size={16} className="text-slate-500 dark:text-slate-400 mr-2" />
        <input 
          type="date" 
          value={targetDate} 
          onChange={(e) => onDateChange(e.target.value)}
          aria-label="Дата рознарядки"
          className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-hidden text-xs cursor-pointer"
        />
      </div>
    </div>
  )
}
