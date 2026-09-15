import React from 'react'
import { ArrowRightLeft, CheckCircle, TramFront, Clock, Undo2 } from 'lucide-react'
import { ActiveDetour } from '../../hooks/useEmergencyQueries'

interface EmergencyDetoursListProps {
  detours: ActiveDetour[] | undefined
  isLoading: boolean
  isDeactivatePending: boolean
  onDeactivate: (detourId: number, vid: string) => void
}

export const EmergencyDetoursList: React.FC<EmergencyDetoursListProps> = ({
  detours,
  isLoading,
  isDeactivatePending,
  onDeactivate
}) => {
  return (
    <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <ArrowRightLeft className="text-amber-400" size={18} />
          <span>Транспорт на змінених маршрутах (DETOUR)</span>
        </h3>
        <span className="text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
          {detours?.length || 0} ТЗ
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Завантаження активних перемикань...</span>
        </div>
      ) : !detours || detours.length === 0 ? (
        <div className="text-center text-slate-400 py-20 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
            <CheckCircle size={32} />
          </div>
          <h4 className="text-sm font-bold text-slate-200">Усі транспортні засоби рухаються за планом</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Оперативних змін маршрутів не зафіксовано. Рух електротранспорту здійснюється згідно з базовим графіком.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {detours.map((detour) => (
            <div 
              key={detour.id} 
              className="p-4 bg-slate-900/90 border border-amber-500/40 rounded-xl space-y-3 shadow-md transition-all hover:border-amber-400"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-black text-xs">
                    {detour.route_id}
                  </span>
                  <span className="font-extrabold text-sm text-white flex items-center">
                    <TramFront size={15} className="mr-1.5 text-amber-400" />
                    Борт №{detour.vehicle_id}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-slate-400 text-xs font-mono">
                  <Clock size={12} className="text-slate-500" />
                  <span>
                    {detour.started_at ? new Date(detour.started_at).toLocaleTimeString('uk-UA') : 'Щойно'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-slate-400">Причина: </span>
                  <strong className="text-rose-400 font-bold">{detour.reason}</strong>
                </div>
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-slate-200">
                  <strong className="text-amber-400 block mb-0.5">Направлено за схемою:</strong>
                  <span>{detour.new_path_description}</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  onClick={() => onDeactivate(detour.id, detour.vehicle_id)}
                  disabled={isDeactivatePending}
                  className="bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-4 py-1.5 rounded-lg border border-slate-700 hover:border-emerald-500 transition-all flex items-center space-x-1.5 text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Undo2 size={14} />
                  <span>Повернути на маршрут</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
