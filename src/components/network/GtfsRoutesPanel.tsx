import React from 'react'
import { Search, CheckCircle2 } from 'lucide-react'
import { Route } from '../../types'
import { GtfsFilterType } from '../../hooks/useGtfsIntegrationLogic'

interface GtfsRoutesPanelProps {
  routes: Route[]
  filteredRoutes: Route[]
  searchQuery: string
  filterType: GtfsFilterType
  onSearchChange: (val: string) => void
  onFilterTypeChange: (val: GtfsFilterType) => void
}

export const GtfsRoutesPanel: React.FC<GtfsRoutesPanelProps> = ({
  routes,
  filteredRoutes,
  searchQuery,
  filterType,
  onSearchChange,
  onFilterTypeChange
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Пошук за номером або назвою маршруту..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onFilterTypeChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Усі ({routes.length})
          </button>
          <button
            onClick={() => onFilterTypeChange('tram')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'tram' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Трамваї ({routes.filter(r => r.type === 'tram').length})
          </button>
          <button
            onClick={() => onFilterTypeChange('trolleybus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'trolleybus' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Тролейбуси ({routes.filter(r => r.type === 'trolleybus').length})
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Тип / №</th>
              <th className="py-3 px-4">Назва Маршруту (Термінали)</th>
              <th className="py-3 px-4">Зупинки</th>
              <th className="py-3 px-4">Довжина (км)</th>
              <th className="py-3 px-4 text-center">Випуск (Робочий / Вихідний)</th>
              <th className="py-3 px-4">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredRoutes.map((route) => (
              <tr key={route.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-bold">
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-white font-mono text-xs ${
                    route.type === 'tram' ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    <span>{route.type === 'tram' ? 'Тм' : 'Тр'}</span>
                    <span>{route.number}</span>
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">{route.name}</td>
                <td className="py-3 px-4 text-slate-600 font-mono">{route.stations.length} станцій</td>
                <td className="py-3 px-4 text-slate-600 font-mono">{route.lengthDir1Km} км</td>
                <td className="py-3 px-4 text-center text-slate-600 font-mono">
                  {route.activeVehiclesCount?.workday ?? '—'} / {route.activeVehiclesCount?.weekend ?? '—'}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Активний GTFS</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
