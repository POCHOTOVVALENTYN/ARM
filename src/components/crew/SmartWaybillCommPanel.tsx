import React from 'react'
import { 
  Radio, 
  AlertTriangle, 
  Zap, 
  TramFront, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  Send, 
  Check 
} from 'lucide-react'
import { DirectiveItem } from '../../hooks/useSmartWaybillLogic'

interface SmartWaybillCommPanelProps {
  vehicleId: string | number
  directives: DirectiveItem[]
  customAlertMsg: string
  isAlertPending: boolean
  isAckPending: boolean
  onSendQuickAlert: (alertType: string, label: string) => void
  onSendCustomAlert: (e: React.FormEvent) => void
  onCustomAlertMsgChange: (val: string) => void
  onAcknowledgeDirective: (id: number) => void
}

export const SmartWaybillCommPanel: React.FC<SmartWaybillCommPanelProps> = ({
  vehicleId,
  directives,
  customAlertMsg,
  isAlertPending,
  isAckPending,
  onSendQuickAlert,
  onSendCustomAlert,
  onCustomAlertMsgChange,
  onAcknowledgeDirective
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
      {/* Ліва колонка: Швидкі сигнали тривоги */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Radio className="text-rose-600 animate-pulse" size={18} />
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
              Швидкі сигнали диспетчеру (В один клік)
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400">Борт #{vehicleId}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onSendQuickAlert('ACCIDENT_TRACK', 'ДТП / перешкода на колії')}
            disabled={isAlertPending}
            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
          >
            <AlertTriangle size={16} />
            <span>🛑 ДТП на колії</span>
          </button>

          <button
            type="button"
            onClick={() => onSendQuickAlert('POWER_OUTAGE', 'Втрата напруги в контактній мережі')}
            disabled={isAlertPending}
            className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1 border border-amber-200 dark:border-amber-900 transition-all cursor-pointer"
          >
            <Zap size={16} />
            <span>⚡ Немає струму</span>
          </button>

          <button
            type="button"
            onClick={() => onSendQuickAlert('VEHICLE_BREAKDOWN', 'Технічна несправність вагона')}
            disabled={isAlertPending}
            className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1 border border-orange-200 dark:border-orange-900 transition-all cursor-pointer"
          >
            <TramFront size={16} />
            <span>🔧 Поломка</span>
          </button>

          <button
            type="button"
            onClick={() => onSendQuickAlert('MEDICAL_EMERGENCY', 'Потрібна швидка / хворий пасажир')}
            disabled={isAlertPending}
            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1 border border-red-200 dark:border-red-900 transition-all cursor-pointer"
          >
            <AlertCircle size={16} />
            <span>🚑 Хворий пасажир</span>
          </button>

          <button
            type="button"
            onClick={() => onSendQuickAlert('TRAFFIC_LIGHT_DELAY', 'Затримка на світлофорі / затор')}
            disabled={isAlertPending}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Clock size={16} />
            <span>🚦 Затор/Світлофор</span>
          </button>

          <button
            type="button"
            onClick={() => onSendQuickAlert('CUSTOM', 'Потрібна консультація диспетчера')}
            disabled={isAlertPending}
            className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 rounded-xl font-bold text-xs flex flex-col items-center text-center gap-1 border border-blue-200 dark:border-blue-900 transition-all cursor-pointer"
          >
            <MessageSquare size={16} />
            <span>💬 Виклик ЦД</span>
          </button>
        </div>

        {/* Довільне повідомлення */}
        <form onSubmit={onSendCustomAlert} className="flex gap-2 pt-1">
          <input
            type="text"
            value={customAlertMsg}
            onChange={(e) => onCustomAlertMsgChange(e.target.value)}
            placeholder="Повідомлення диспетчеру..."
            aria-label="Текст повідомлення диспетчеру"
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!customAlertMsg.trim() || isAlertPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 disabled:opacity-50 cursor-pointer"
          >
            <Send size={12} />
            <span>Надіслати</span>
          </button>
        </form>
      </div>

      {/* Права колонка: Накази диспетчера */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
            <div className="flex items-center space-x-2">
              <MessageSquare className="text-blue-600" size={18} />
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
                Вказівки диспетчера маршруту
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
              {directives.length} наказів
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {directives.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                Немає активних вказівок від диспетчера. Слідуйте за штатним розкладом.
              </div>
            ) : (
              directives.map((dir) => (
                <div
                  key={dir.id}
                  className={`p-2.5 rounded-xl border flex items-start justify-between gap-2.5 ${
                    dir.is_acknowledged
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                        {dir.directive_type}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {dir.created_at ? new Date(dir.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold">{dir.message}</p>
                  </div>

                  <div>
                    {dir.is_acknowledged ? (
                      <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <Check size={12} className="mr-1" /> Прийнято
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAcknowledgeDirective(dir.id)}
                        disabled={isAckPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <Check size={12} />
                        <span>Прийняти</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Рекомендація темпу */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-2.5 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                Статус темпу (Pacing)
              </span>
              <p className="text-xs font-extrabold text-emerald-950 dark:text-emerald-100">
                🟢 Рух у графіку. Рекомендована швидкість: 16–18 км/год
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
