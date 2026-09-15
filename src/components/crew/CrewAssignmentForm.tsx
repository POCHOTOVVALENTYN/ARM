import React from 'react'
import { TramFront, Users } from 'lucide-react'
import { AvailableDuty } from '../../hooks/useWaybillQueries'

interface CrewAssignmentFormProps {
  selectedDutyObject: AvailableDuty | undefined
  selectedDuty: number | null
  vehicleId: string
  driverName: string
  isPending: boolean
  onVehicleIdChange: (val: string) => void
  onDriverNameChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export const CrewAssignmentForm: React.FC<CrewAssignmentFormProps> = ({
  selectedDutyObject,
  selectedDuty,
  vehicleId,
  driverName,
  isPending,
  onVehicleIdChange,
  onDriverNameChange,
  onSubmit
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col h-fit">
      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center border-b border-slate-100 dark:border-slate-800 pb-3 text-sm">
        <TramFront className="mr-2 text-emerald-600 dark:text-emerald-400" size={18} />
        <span>Оформлення Е-Путівки</span>
      </h3>

      {!selectedDuty ? (
        <div className="text-center py-8 text-slate-400">
          <Users size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="text-xs">Оберіть вільний наряд зі списку ліворуч для оформлення путівки.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3.5">
          <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800">
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase block mb-0.5">
              Вибрано наряд
            </span>
            <span className="text-base font-black text-blue-900 dark:text-blue-200 font-mono">
              № {selectedDutyObject?.number || selectedDuty}
            </span>
          </div>

          <div>
            <label 
              htmlFor="vehicle-id-input"
              className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase"
            >
              Бортовий номер вагона
            </label>
            <input 
              id="vehicle-id-input"
              type="text" 
              value={vehicleId} 
              onChange={(e) => onVehicleIdChange(e.target.value)} 
              placeholder="Напр. 3014"
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-1.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden text-xs font-bold font-mono" 
              required 
            />
          </div>

          <div>
            <label 
              htmlFor="driver-name-input"
              className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase"
            >
              Табельний або ПІБ Водія
            </label>
            <input 
              id="driver-name-input"
              type="text" 
              value={driverName} 
              onChange={(e) => onDriverNameChange(e.target.value)} 
              placeholder="Напр. Сидоренко В.В."
              className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-1.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden text-xs font-bold" 
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 shadow-xs cursor-pointer text-xs"
          >
            {isPending ? 'Завантаження в Redis...' : 'Видати путівку на лінію'}
          </button>
        </form>
      )}
    </div>
  )
}
