import React from 'react'
import { AlertOctagon, Sparkles, Zap } from 'lucide-react'
import { EmergencyTemplate } from '../../store/useConfigStore'

interface EmergencyDetoursFormProps {
  vehicleId: string
  routeId: string
  reason: string
  newPath: string
  isPending: boolean
  emergencyTemplates: EmergencyTemplate[]
  onVehicleIdChange: (val: string) => void
  onRouteIdChange: (val: string) => void
  onReasonChange: (val: string) => void
  onNewPathChange: (val: string) => void
  onApplyTemplate: (tmpl: EmergencyTemplate) => void
  onSubmit: (e: React.FormEvent) => void
}

export const EmergencyDetoursForm: React.FC<EmergencyDetoursFormProps> = ({
  vehicleId,
  routeId,
  reason,
  newPath,
  isPending,
  emergencyTemplates,
  onVehicleIdChange,
  onRouteIdChange,
  onReasonChange,
  onNewPathChange,
  onApplyTemplate,
  onSubmit
}) => {
  return (
    <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
      <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <AlertOctagon className="text-amber-400" size={18} />
          <span>Нове оперативне перемикання</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Форма диспетчера</span>
      </div>

      {/* Швидкі шаблони НС */}
      {emergencyTemplates && emergencyTemplates.length > 0 && (
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center">
            <Sparkles size={12} className="mr-1 text-amber-400" />
            Швидкі шаблони аварійних трасувань:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {emergencyTemplates.slice(0, 3).map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onApplyTemplate(tmpl)}
                className="px-2.5 py-1 bg-slate-700/80 hover:bg-slate-600 border border-slate-600 rounded-lg text-xs font-bold text-slate-200 transition-all text-left cursor-pointer"
              >
                {tmpl.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label 
              htmlFor="vehicle-id-detour"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Бортовий № ТЗ
            </label>
            <input 
              id="vehicle-id-detour"
              type="text"
              value={vehicleId} 
              onChange={(e) => onVehicleIdChange(e.target.value)} 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-hidden" 
              placeholder="Напр. 3012" 
            />
          </div>

          <div>
            <label 
              htmlFor="route-id-detour"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Маршрут
            </label>
            <input 
              id="route-id-detour"
              type="text"
              value={routeId} 
              onChange={(e) => onRouteIdChange(e.target.value)} 
              required 
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-hidden" 
              placeholder="Напр. Т-28" 
            />
          </div>
        </div>

        <div>
          <label 
            htmlFor="reason-detour"
            className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            Причина перемикання
          </label>
          <input 
            id="reason-detour"
            type="text"
            value={reason} 
            onChange={(e) => onReasonChange(e.target.value)} 
            required 
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-hidden" 
            placeholder="ДТП сторонніх авто на коліях, обрив КС тощо" 
          />
        </div>

        <div>
          <label 
            htmlFor="new-path-detour"
            className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            Опис нового напрямку / схема об'їзду
          </label>
          <textarea 
            id="new-path-detour"
            value={newPath} 
            onChange={(e) => onNewPathChange(e.target.value)} 
            required 
            rows={3}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none outline-hidden" 
            placeholder="До Залізничного вокзалу замість Куликового поля через Тираспольську пл...." 
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending} 
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-3 rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
        >
          <Zap size={16} />
          <span>{isPending ? 'Активація...' : 'Активувати схему об\'їзду'}</span>
        </button>
      </form>
    </div>
  )
}
