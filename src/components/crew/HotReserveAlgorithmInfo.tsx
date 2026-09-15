import React from 'react'
import { Bus } from 'lucide-react'

interface HotReserveAlgorithmInfoProps {
  incidentTime: string
}

export const HotReserveAlgorithmInfo: React.FC<HotReserveAlgorithmInfoProps> = ({ incidentTime }) => {
  return (
    <div className="bg-purple-950/80 text-white p-4 rounded-2xl border border-purple-900 space-y-3 lg:col-span-1">
      <h4 className="font-bold text-xs text-purple-300 border-b border-purple-800/80 pb-2 flex items-center space-x-1.5">
        <Bus className="w-3.5 h-3.5 text-purple-400" />
        <span>Алгоритм Hot Reserve Swap</span>
      </h4>

      <ul className="space-y-2 text-[11px] text-purple-200 list-disc list-inside leading-relaxed">
        <li>Зламаний вагон зупиняє поточний рейс та прямує в Депо на аварійний огляд.</li>
        <li>Усі майбутні рейси після {incidentTime} передаються резервному борту.</li>
        <li>Глобальна сітка розкладу зберігається без руйнування тактового інтервалу.</li>
        <li>Автоматично генерується оновлений комплект документів для кабіни водія.</li>
      </ul>
    </div>
  )
}
