import React from 'react'
import { ShieldAlert, Flame } from 'lucide-react'

interface EmergencyDetoursHeaderProps {
  activeCount: number
}

export const EmergencyDetoursHeader: React.FC<EmergencyDetoursHeaderProps> = ({ activeCount }) => {
  return (
    <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div className="flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <ShieldAlert size={24} />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-600 text-white font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
              Модуль НС
            </span>
            <h2 className="text-base font-extrabold text-white">
              Оперативні перемикання та Аварійні детури (Emergency Detours)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Фіксація об'їздів при ДТП або обривах контактної мережі з автоматичним відключенням хибних запізнень
          </p>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="bg-amber-950/80 border border-amber-800/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 animate-pulse flex items-center space-x-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>АКТИВНО {activeCount} ПЕРЕМИКАНЬ НА ЛІНІЇ</span>
        </div>
      )}
    </div>
  )
}
