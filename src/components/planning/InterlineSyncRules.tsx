import React from 'react'
import { CheckCircle2 } from 'lucide-react'

interface InterlineSyncRulesProps {
  minHeadway: number
  onMinHeadwayChange: (val: number) => void
}

export const InterlineSyncRules: React.FC<InterlineSyncRulesProps> = ({
  minHeadway,
  onMinHeadwayChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-2">
        <label htmlFor="min-headway-input" className="block font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase">
          Мінімальний інтервал між вагонами:
        </label>
        <div className="flex items-center space-x-2">
          <input
            id="min-headway-input"
            type="number"
            step="0.5"
            min="1.0"
            max="5.0"
            value={minHeadway}
            onChange={(e) => onMinHeadwayChange(parseFloat(e.target.value) || 2.0)}
            className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-mono font-black text-slate-900 dark:text-white text-sm"
          />
          <span className="text-xs font-bold text-slate-500">хвилини</span>
        </div>
        <p className="text-[11px] text-slate-400">
          Захищає від накладання графіків Трамваїв №7, №1, №28, №5 на вузлах Пересипського мосту, вул. Пастера та Привозу.
        </p>
      </div>

      <div className="bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 p-4 space-y-1.5 col-span-2">
        <div className="flex items-center space-x-1.5 font-black text-purple-700 dark:text-purple-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-purple-600" />
          <span>Діючі правила синхронізації коридорів «Зв'язок»</span>
        </div>
        <p className="text-xs text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
          Коли кілька маршрутів підходять до однієї контрольної точки (напр. <em>Херсонський сквер</em> або <em>вул. Пастера</em>), алгоритм автоматично зміщує час відправлення нульового рейсу чи лінійного обороту на ±1..3 хв для витримування часового вікна 2–3 хвилини.
        </p>
      </div>
    </div>
  )
}
