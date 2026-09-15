import React from 'react'
import { ShieldAlert, Check } from 'lucide-react'
import { DirectiveItem } from '../../hooks/useSmartWaybillLogic'

interface DriverTerminalDirectiveAlertProps {
  unacknowledgedDirectives: DirectiveItem[]
  isAckPending: boolean
  onAcknowledge: (id: number) => void
}

export const DriverTerminalDirectiveAlert: React.FC<DriverTerminalDirectiveAlertProps> = ({
  unacknowledgedDirectives,
  isAckPending,
  onAcknowledge
}) => {
  if (unacknowledgedDirectives.length === 0) return null

  const directive = unacknowledgedDirectives[0]

  return (
    <div className="p-4 md:p-5 rounded-3xl bg-amber-500/20 border-2 border-amber-500 text-amber-200 space-y-3 shadow-xl animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <h3 className="text-base font-black text-white">
              📢 НАКАЗ ЧЕРГОВОГО ДИСПЕТЧЕРА ({directive.directive_type})
            </h3>
            <p className="text-xs text-amber-300">
              Отримано щойно • Служба руху КП «Одесміськелектротранс»
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase">
          Потрібно підтвердження
        </span>
      </div>

      <div className="text-sm font-black bg-black/40 p-3.5 rounded-2xl border border-amber-500/40 text-white leading-relaxed">
        «{directive.message}»
      </div>

      <button
        onClick={() => onAcknowledge(directive.id)}
        disabled={isAckPending}
        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-lg active:scale-98"
      >
        <Check className="w-6 h-6" />
        <span>{isAckPending ? 'Підтвердження...' : '✅ ПРИЙНЯТО ДО ВИКОНАННЯ'}</span>
      </button>
    </div>
  )
}
