import React from 'react'
import { 
  Users, 
  Bus, 
  Layers, 
  Database 
} from 'lucide-react'
import { AdminTabKey } from '../../hooks/useAdminViewLogic'

interface AdminViewHeaderProps {
  activeTab: AdminTabKey
  onSelectTab: (tab: AdminTabKey) => void
}

const TAB_CONFIGS: Record<AdminTabKey, { title: string; subtitle: string; icon: React.ElementType }> = {
  users: {
    title: 'Керування користувачами та правами доступу (RBAC)',
    subtitle: 'Облікові записи диспетчерів, розкладників, адміністраторів та наглядачів',
    icon: Users
  },
  vehicles: {
    title: 'Облік рухомого складу та депо',
    subtitle: 'Розподіл вагонів і тролейбусів за транспортними депо КП «ОМЕТ»',
    icon: Bus
  },
  drivers: {
    title: 'Реєстр водіїв КП «Одесміськелектротранс»',
    subtitle: 'Табельні номери, кваліфікаційні класи, статуси та зміни',
    icon: Users
  },
  duty_types: {
    title: 'Довідник типів нарядів та змін',
    subtitle: 'Нормативи тривалості змін згідно з КЗпП України (ДВ, ОД, РОЗ, ПІК)',
    icon: Layers
  },
  backup: {
    title: 'Резервне копіювання та обслуговування БД',
    subtitle: 'Експорт, імпорт JSON-конфігурацій та скидання системного кешу',
    icon: Database
  },
  routes: {
    title: 'Реєстр маршрутів та паспортів',
    subtitle: 'Паспорти ліній, графіки швидкостей та контрольні точки',
    icon: Layers
  },
  stops: {
    title: 'Зупинки, контрольні точки та ДП',
    subtitle: 'Геолокація, інтервали, розрахунковий час проїзду перегонів',
    icon: Bus
  },
  infra: {
    title: 'Інфраструктура, вузли стику та обіди',
    subtitle: 'Місця технологічних перерв водіїв та міжмаршрутної координації',
    icon: Layers
  }
}

export const AdminViewHeader: React.FC<AdminViewHeaderProps> = ({
  activeTab,
  onSelectTab
}) => {
  const currentTab = TAB_CONFIGS[activeTab] || TAB_CONFIGS.users
  const ActiveIcon = currentTab.icon

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <ActiveIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{currentTab.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold border border-blue-200 dark:border-blue-800 uppercase">
                СИСТЕМНИЙ АДМІНІСТРАТОР
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {currentTab.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Навігація вкладок адмінки */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          tabIndex={0}
          onClick={() => onSelectTab('users')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Користувачі</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'routes'}
          tabIndex={0}
          onClick={() => onSelectTab('routes')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'routes'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Маршрути</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'vehicles'}
          tabIndex={0}
          onClick={() => onSelectTab('vehicles')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'vehicles'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>Рухомий склад</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'drivers'}
          tabIndex={0}
          onClick={() => onSelectTab('drivers')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'drivers'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Водії</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stops'}
          tabIndex={0}
          onClick={() => onSelectTab('stops')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'stops'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>Зупинки</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'infra'}
          tabIndex={0}
          onClick={() => onSelectTab('infra')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'infra'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Вузли та Обіди</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'duty_types'}
          tabIndex={0}
          onClick={() => onSelectTab('duty_types')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'duty_types'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Типи нарядів</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'backup'}
          tabIndex={0}
          onClick={() => onSelectTab('backup')}
          className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>БД та Резерв</span>
        </button>
      </div>
    </div>
  )
}
