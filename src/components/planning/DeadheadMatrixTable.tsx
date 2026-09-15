import React from 'react'
import { Search } from 'lucide-react'
import { DeadheadMatrixRecord } from '../../types/deadhead'

interface DeadheadMatrixTableProps {
  matrixSearch: string
  matrixDepotFilter: string
  filteredMatrix: DeadheadMatrixRecord[]
  onSearchChange: (q: string) => void
  onDepotFilterChange: (filter: string) => void
}

export const DeadheadMatrixTable: React.FC<DeadheadMatrixTableProps> = ({
  matrixSearch,
  matrixDepotFilter,
  filteredMatrix,
  onSearchChange,
  onDepotFilterChange
}) => {
  return (
    <div className="space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Пошук кінцевої або вузла..."
              value={matrixSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              aria-label="Пошук у матриці"
            />
          </div>

          {/* Фільтр депо */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1" role="group" aria-label="Фільтр по депо">
            <button
              type="button"
              onClick={() => onDepotFilterChange('ALL')}
              aria-pressed={matrixDepotFilter === 'ALL'}
              aria-label="Всі депо"
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                matrixDepotFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Всі депо
            </button>
            <button
              type="button"
              onClick={() => onDepotFilterChange('depot_1')}
              aria-pressed={matrixDepotFilter === 'depot_1'}
              aria-label="ТД-1 (Водопровідна)"
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                matrixDepotFilter === 'depot_1' ? 'bg-red-500/20 text-red-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ТД-1 (Водопровідна)
            </button>
            <button
              type="button"
              onClick={() => onDepotFilterChange('depot_2')}
              aria-pressed={matrixDepotFilter === 'depot_2'}
              aria-label="ТД-2 (Слобідка)"
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                matrixDepotFilter === 'depot_2' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ТД-2 (Слобідка)
            </button>
            <button
              type="button"
              onClick={() => onDepotFilterChange('depot_3')}
              aria-pressed={matrixDepotFilter === 'depot_3'}
              aria-label="ТрД (Інглезі)"
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                matrixDepotFilter === 'depot_3' ? 'bg-blue-500/20 text-blue-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ТрД (Інглезі)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Всього записів у топологічній базі: <strong className="text-slate-200">{filteredMatrix.length}</strong>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300" aria-label="Топологічна матриця нульових рейсів">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Депо</th>
                <th className="py-3 px-4">Кінцева станція / Розворотне кільце</th>
                <th className="py-3 px-3">Тип</th>
                <th className="py-3 px-3 text-right">Дистанція</th>
                <th className="py-3 px-3 text-right">Нормативний час</th>
                <th className="py-3 px-4">Вузол примикання</th>
                <th className="py-3 px-4">Коридор прямування (траса)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredMatrix.map((item, idx) => (
                <tr key={`${item.depot_id}-${item.terminal_name}-${idx}`} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-4 font-sans font-bold">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      item.depot_code === 'TD-1' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                        : item.depot_code === 'TD-2' 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {item.depot_code}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-100">
                    {item.terminal_name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {item.terminal_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                    {item.distance_km} км
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-400">
                    {item.duration_min} хв
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">
                    {item.junction_stop}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 text-[10px] truncate max-w-md">
                    {item.path_description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
