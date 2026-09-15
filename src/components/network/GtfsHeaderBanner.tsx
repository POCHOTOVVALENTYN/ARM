import React from 'react'
import { Radio, RefreshCw, Zap } from 'lucide-react'
import { GtfsSubTabKey } from '../../hooks/useGtfsIntegrationLogic'

interface GtfsHeaderBannerProps {
  isGtfsActive: boolean
  activeSubTab: GtfsSubTabKey
  routesCount: number
  onTabChange: (tab: GtfsSubTabKey) => void
  onReloadDemo: () => void
  onLoadGtfsData: () => void
}

export const GtfsHeaderBanner: React.FC<GtfsHeaderBannerProps> = ({
  isGtfsActive,
  activeSubTab,
  routesCount,
  onTabChange,
  onReloadDemo,
  onLoadGtfsData
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-slate-900 font-extrabold text-lg tracking-tight">
              Інтеграційний модуль GTFS & Open Data м. Одеси
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              isGtfsActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'
            }`}>
              {isGtfsActive ? 'Активні GTFS Дані' : 'Симуляційний Режим'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Комплексний аналіз та синхронізація 48 реальних маршрутів електротранспорту КП «Одесміськелектротранс» з сервісами EasyWay, Google Maps та міськими валідаторами.
          </p>
        </div>
      </div>

      {/* Action Controls & Subtabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
        {isGtfsActive ? (
          <button
            onClick={onReloadDemo}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
            title="Повернутися до тестових симуляційних даних"
            aria-label="Повернутися до тестових симуляційних даних"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
            <span>Повернути демо-графік</span>
          </button>
        ) : (
          <button
            onClick={onLoadGtfsData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
            title="Завантажити та активувати реальний розклад з gtfs_static_data"
            aria-label="Завантажити реальні GTFS-дані"
          >
            <Zap className="w-4 h-4 fill-white text-white" />
            <span>Задіяти реальні GTFS-дані</span>
          </button>
        )}

        {/* Subtab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold" role="tablist">
          <button
            role="tab"
            aria-selected={activeSubTab === 'overview'}
            onClick={() => onTabChange('overview')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Аналіз БД
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === 'routes'}
            onClick={() => onTabChange('routes')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'routes'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Маршрути ({routesCount})
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === 'static'}
            onClick={() => onTabChange('static')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'static'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GTFS Static
          </button>
          <button
            role="tab"
            aria-selected={activeSubTab === 'realtime'}
            onClick={() => onTabChange('realtime')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'realtime'
                ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            GTFS-RT Stream
          </button>
        </div>
      </div>
    </div>
  )
}
