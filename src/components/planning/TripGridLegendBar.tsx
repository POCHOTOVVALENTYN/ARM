import React from 'react'
import { Info } from 'lucide-react'
import { Tooltip } from '../common/Tooltip'

interface LegendItem {
  badge: string
  badgeClass: string
  label: string
  tooltip: string
}

const LEGEND_ITEMS: LegendItem[] = [
  {
    badge: '🟢',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    label: 'Графіковий рейс',
    tooltip: 'Стандартний рух вагона лінією за розкладом, без відхилень.'
  },
  {
    badge: 'О-15 / О-20',
    badgeClass: 'bg-amber-500 text-white',
    label: 'Базовий обід',
    tooltip: 'Нормативна обідня перерва: 15 хв (трамвай) / 20 хв (тролейбус). Надається на Диспетчерському пункті (ДП) не раніше 4.0 год і не пізніше 5.5 год від явки водія.'
  },
  {
    badge: 'О-30* / О-35*',
    badgeClass: 'bg-amber-600 text-white',
    label: 'Понаднормовий обід',
    tooltip: 'Обід, розширений через кратність інтервалу руху на лінії. Час понад норму (15/20 хв) автоматично додається до тривалості зміни водія та оплачується.'
  },
  {
    badge: 'ЗМ',
    badgeClass: 'bg-blue-600 text-white',
    label: 'Перезмінка водіїв',
    tooltip: 'Передача вагона між водієм І та ІІ зміни (двозмінний наряд). Відбувається виключно на Диспетчерському пункті (ДП).'
  },
  {
    badge: 'РОТ',
    badgeClass: 'bg-purple-600 text-white',
    label: 'Ротація вагонів (SPLIT)',
    tooltip: 'Заміна фізичного вагона розривного наряду (1-й вагон їде в депо на ТО, 2-й виїжджає на лінію). Відбувається ВИКЛЮЧНО на ДП — ніколи на проміжному вузлі примикання лінії.'
  },
  {
    badge: '⚠️',
    badgeClass: 'bg-rose-600 text-white',
    label: 'Скупчення (≤ 2 хв)',
    tooltip: 'Інтервальний конфлікт ("паровозик") — два вагони прибувають на зупинку з інтервалом 2 хвилини або менше. Потребує корекції розкладу.'
  }
]

export const TripGridLegendBar: React.FC = () => {
  return (
    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
      <div className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
        <Info className="w-4 h-4 text-indigo-600" />
        <span>Умовні позначення та нормативи КП «Одесміськелектротранс»:</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-slate-600 dark:text-slate-400">
        {LEGEND_ITEMS.map((item) => (
          <Tooltip key={item.label} content={item.tooltip}>
            <div className="flex items-center space-x-2 cursor-help">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black whitespace-nowrap ${item.badgeClass}`}>
                {item.badge}
              </span>
              <span>{item.label}</span>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
