import React from 'react'
import { ShieldAlert } from 'lucide-react'

interface DriverTerminalSosModalProps {
  isOpen: boolean
  vehicleId: string
  isSosPending: boolean
  onClose: () => void
  onConfirmSos: () => void
}

export const DriverTerminalSosModal: React.FC<DriverTerminalSosModalProps> = ({
  isOpen,
  vehicleId,
  isSosPending,
  onClose,
  onConfirmSos
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/40 animate-ping">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white">
            Підтвердіть передачу сигналу SOS!
          </h3>
          <p className="text-xs text-rose-300 leading-relaxed font-medium">
            Сигнал тривоги та точні координати вагона #{vehicleId} будуть миттєво передані до Центральної диспетчерської КП «Одесміськелектротранс» з увімкненням аудіо-сирени тривоги.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
          >
            Скасувати
          </button>

          <button
            onClick={onConfirmSos}
            disabled={isSosPending}
            className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-lg shadow-rose-600/40 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSosPending ? 'Передача...' : '🚨 ПІДТВЕРДИТИ SOS'}
          </button>
        </div>
      </div>
    </div>
  )
}
