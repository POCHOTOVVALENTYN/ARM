import React from 'react'
import { Bus, User, Clock, ShieldCheck } from 'lucide-react'
import { SmartWaybillData } from '../../hooks/useSmartWaybillLogic'

interface DriverTerminalWaybillPanelProps {
  waybill: SmartWaybillData | undefined
  vehicleId: string
  tripsCount: number
  currentTripIdx: number
  isNightMode: boolean
}

export const DriverTerminalWaybillPanel: React.FC<DriverTerminalWaybillPanelProps> = ({
  waybill,
  vehicleId,
  tripsCount,
  currentTripIdx,
  isNightMode
}) => {
  return (
    <div className="space-y-4">
      <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
        isNightMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Шапка офіційного бланка КП «ОМЕТ» */}
        <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase text-blue-400 tracking-wider">
              Служба руху КП «Одесміськелектротранс»
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
              Електронний дорожній лист (Шляховий лист)
            </h2>
          </div>
          <div className="text-right font-mono">
            <div className="text-sm font-black text-emerald-400">
              № {waybill?.waybill_id || '004020'}
            </div>
            <div className="text-xs text-slate-400 font-bold">
              Дата: {waybill?.target_date || new Date().toISOString().slice(0, 10)}
            </div>
          </div>
        </div>

        {/* Таблиця параметрів */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
          {/* Картка рухомого складу */}
          <div className="p-4 rounded-2xl bg-black/30 border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-black uppercase text-slate-400 flex items-center space-x-1.5">
              <Bus className="w-4 h-4 text-blue-400" />
              <span>Рухомий склад (Вагон / Машина):</span>
            </div>
            <div className="space-y-1 text-sm font-bold">
              <div>Бортовий номер: <strong className="text-white font-mono">#{waybill?.vehicle?.id || vehicleId}</strong></div>
              <div>Модель: <span className="text-slate-300">{waybill?.vehicle?.model || 'Tatra T3'}</span></div>
              <div>Тип: <span className="text-slate-300">{waybill?.vehicle?.type === 'trolleybus' ? 'Тролейбус' : 'Трамвай'}</span></div>
              <div>Закріплене депо: <span className="text-slate-300">Трамвайне депо №1 (вул. Водопровідна)</span></div>
            </div>
          </div>

          {/* Картка водія */}
          <div className="p-4 rounded-2xl bg-black/30 border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-black uppercase text-slate-400 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Водій електротранспорту:</span>
            </div>
            <div className="space-y-1 text-sm font-bold">
              <div>ПІБ: <strong className="text-white">{waybill?.driver?.full_name || 'Ковальчук Василь Іванович'}</strong></div>
              <div>Табельний номер: <span className="font-mono text-slate-300">#{waybill?.driver?.id || 'Т-1001'}</span></div>
              <div>Клас кваліфікації: <span className="text-slate-300">{waybill?.driver?.class_rank || 1}-й клас</span></div>
              <div>Медичний огляд: <span className="text-emerald-400 font-bold">✓ Пройдено (Норма)</span></div>
            </div>
          </div>

          {/* Наряд та режим роботи */}
          <div className="p-4 rounded-2xl bg-black/30 border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-black uppercase text-slate-400 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Наряд та графік зміни:</span>
            </div>
            <div className="space-y-1 text-sm font-bold">
              <div>Наряд №: <strong className="text-white font-mono">{waybill?.duty_number || '7-01'}</strong></div>
              <div>Маршрут: <span className="text-blue-400 font-mono font-black">№{waybill?.route_id || '18'}</span></div>
              <div>Режим зміни: <span className="text-slate-300">Двозмінний (8 год 00 хв)</span></div>
              <div>Плановий обід: <span className="text-amber-400">12:15 - 12:35 (ДП «Куликове поле»)</span></div>
            </div>
          </div>

          {/* Показники виконання */}
          <div className="p-4 rounded-2xl bg-black/30 border border-slate-800 space-y-2.5">
            <div className="text-[11px] font-black uppercase text-slate-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Показники виконання:</span>
            </div>
            <div className="space-y-1 text-sm font-bold">
              <div>Заплановано рейсів: <strong className="text-white font-mono">{tripsCount}</strong></div>
              <div>Виконано рейсів: <span className="text-emerald-400 font-mono">{currentTripIdx}</span></div>
              <div>Плановий пробіг: <span className="text-slate-300">96.8 км</span></div>
              <div>Статус путівки: <span className="text-emerald-400 uppercase font-black">АКТИВНА (ДІЮЧА)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
