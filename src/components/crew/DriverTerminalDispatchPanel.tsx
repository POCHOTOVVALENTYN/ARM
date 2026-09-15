import React from 'react'
import { 
  Zap, 
  Car, 
  Wrench, 
  Clock, 
  ShieldAlert 
} from 'lucide-react'

interface DriverTerminalDispatchPanelProps {
  isNightMode: boolean
  onSendQuickAlert: (alertType: string, message: string) => void
  onOpenSosModal: () => void
}

export const DriverTerminalDispatchPanel: React.FC<DriverTerminalDispatchPanelProps> = ({
  isNightMode,
  onSendQuickAlert,
  onOpenSosModal
}) => {
  return (
    <div className="space-y-4">
      {/* Швидкі кнопки ситуацій на лінії */}
      <div className={`p-5 rounded-3xl border space-y-3 ${
        isNightMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
          Швидкі сповіщення про нештатні ситуації (1-Tap до ЦД)
        </h3>
        <p className="text-xs text-slate-400">
          Натисніть кнопку для негайної передачі статусу до центральної диспетчерської без голосового виклику:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onSendQuickAlert('POWER_OUTAGE', 'Знеструмлення контактної мережі')}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 font-black text-sm flex items-center space-x-3 cursor-pointer transition-all active:scale-98"
          >
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
            <span>⚡ Знеструмлення контактної мережі</span>
          </button>

          <button
            onClick={() => onSendQuickAlert('ACCIDENT_TRACK', 'ДТП на коліях / блокування руху')}
            className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 font-black text-sm flex items-center space-x-3 cursor-pointer transition-all active:scale-98"
          >
            <Car className="w-5 h-5 text-rose-400 shrink-0" />
            <span>🚗 ДТП на коліях / блокування габариту</span>
          </button>

          <button
            onClick={() => onSendQuickAlert('VEHICLE_BREAKDOWN', 'Технічна несправність вагона')}
            className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-300 font-black text-sm flex items-center space-x-3 cursor-pointer transition-all active:scale-98"
          >
            <Wrench className="w-5 h-5 text-orange-400 shrink-0" />
            <span>🔧 Технічна несправність вагона</span>
          </button>

          <button
            onClick={() => onSendQuickAlert('TRAFFIC_LIGHT_DELAY', 'Скупчення транспорту / затор')}
            className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 font-black text-sm flex items-center space-x-3 cursor-pointer transition-all active:scale-98"
          >
            <Clock className="w-5 h-5 text-blue-400 shrink-0" />
            <span>⚠️ Затор / Затримка на перехресті</span>
          </button>
        </div>
      </div>

      {/* ВЕЛИКА ЧЕРВОНА ТРИВОЖНА КНОПКА SOS */}
      <div className="p-6 rounded-3xl bg-rose-950/40 border-2 border-rose-600/80 space-y-4 text-center shadow-2xl">
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span>Кнопка Екстреного Виклику SOS</span>
          </h3>
          <p className="text-xs text-rose-300 font-medium">
            Використовується виключно у випадках загрози життю, пожежі або термінової зупинки лінії!
          </p>
        </div>

        <button
          onClick={onOpenSosModal}
          className="w-full max-w-lg mx-auto py-5 px-8 rounded-3xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xl flex items-center justify-center space-x-3 shadow-2xl shadow-rose-600/50 cursor-pointer transition-all border-2 border-rose-400"
        >
          <ShieldAlert className="w-8 h-8" />
          <span>🚨 ЕКСТРЕНИЙ СИГНАЛ SOS</span>
        </button>
      </div>
    </div>
  )
}
