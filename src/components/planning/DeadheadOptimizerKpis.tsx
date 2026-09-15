import React from 'react'
import { 
  TrendingDown, 
  Clock, 
  Zap, 
  Flame, 
  Leaf 
} from 'lucide-react'
import { NetworkSummary } from '../../types/deadhead'

interface DeadheadOptimizerKpisProps {
  summary: NetworkSummary | undefined
}

export const DeadheadOptimizerKpis: React.FC<DeadheadOptimizerKpisProps> = ({ summary }) => {
  if (!summary) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-sans" role="region" aria-label="Показники оптимізації нульових рейсів">
      {/* Скорочення пробігу */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Скорочення пробігу</span>
          <TrendingDown className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {summary.daily_km_saved > 0 ? `-${summary.daily_km_saved} км` : '0.0 км'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            на добу ({summary.optimal_total_daily_km.toLocaleString('uk-UA')} км оптимал)
          </p>
        </div>
      </div>

      {/* Робочий час водіїв */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Робочий час водіїв</span>
          <Clock className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="text-2xl font-black text-blue-400 tracking-tight">
            {summary.daily_hours_saved > 0 ? `-${summary.daily_hours_saved} год` : '0.0 год'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            холостого простою / доба
          </p>
        </div>
      </div>

      {/* Електроенергія */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Електроенергія</span>
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">
            {summary.daily_kwh_saved > 0 ? `-${summary.daily_kwh_saved} кВт·год` : '0 кВт·год'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            збережено на добу (2.5/1.8 кВт)
          </p>
        </div>
      </div>

      {/* Річна економія */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Річна економія</span>
          <Flame className="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <div className="text-2xl font-black text-teal-300 tracking-tight">
            {summary.annual_cost_saved_uah > 0 
              ? `${Math.round(summary.annual_cost_saved_uah / 1000).toLocaleString('uk-UA')} тис. ₴`
              : '0 ₴'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {summary.daily_cost_saved_uah.toLocaleString('uk-UA')} грн/добу ефекту
          </p>
        </div>
      </div>

      {/* Екологічний баланс */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Екологічний баланс</span>
          <Leaf className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl font-black text-emerald-300 tracking-tight">
            {summary.annual_co2_tons_saved > 0 ? `-${summary.annual_co2_tons_saved} т` : '0 т'}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            викидів CO₂ на рік
          </p>
        </div>
      </div>
    </div>
  )
}
