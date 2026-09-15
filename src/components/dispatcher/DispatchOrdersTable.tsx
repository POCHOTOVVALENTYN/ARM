import React from 'react'
import {
  RotateCcw,
  Clock,
  Zap,
  Bus,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import type { DispatchOrder } from '../../hooks/useDispatchOrdersJournalLogic'

interface DispatchOrdersTableProps {
  orders: DispatchOrder[]
  onCompleteOrder: (orderId: number) => Promise<void>
  onCancelOrder: (orderId: number) => Promise<void>
}

const getOrderTypeBadge = (type: string): React.ReactNode => {
  if (type === 'SHORT_TURN') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-extrabold text-[11px]">
        <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Скорочення рейсу (Розворот)</span>
      </span>
    )
  }

  if (type === 'PACING') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-extrabold text-[11px]">
        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>Регулювання темпу (Відстій)</span>
      </span>
    )
  }

  if (type === 'CAR_SWAP') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold text-[11px]">
        <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Підміна / Випуск резерву</span>
      </span>
    )
  }

  if (type === 'PULL_IN') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-extrabold text-[11px]">
        <Bus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span>Схід у депо (Pull-In)</span>
      </span>
    )
  }

  if (type === 'DETOUR') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-extrabold text-[11px]">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Об'їзд / Перенаправлення</span>
      </span>
    )
  }

  if (type === 'SERVICE_CALL') {
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-extrabold text-[11px]">
        <PhoneCall className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        <span>Спецтехніка (КМ/Колія)</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
      {type}
    </span>
  )
}

export const DispatchOrdersTable: React.FC<DispatchOrdersTableProps> = ({
  orders,
  onCompleteOrder,
  onCancelOrder
}) => {
  return (
    <div className="space-y-4">
      {/* Офіційна шапка КП ОМЕТ (тільки друк) */}
      <div className="hidden print:block mb-6 text-center border-b-2 border-slate-800 pb-4">
        <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
          Комунальне підприємство «Одесміськелектротранс»
        </h2>
        <h3 className="text-sm font-bold text-slate-700 uppercase mt-0.5">
          Служба руху • Відділ оперативного регулювання руху (Центральна диспетчерська)
        </h3>
        <h1 className="text-lg font-black text-slate-950 uppercase mt-2">
          Журнал диспетчерських розпоряджень та оперативних вказівок
        </h1>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Дата формування: {new Date().toLocaleDateString('uk-UA')} {new Date().toLocaleTimeString('uk-UA')} | 
          Кількість зареєстрованих наказів: {orders.length}
        </p>
      </div>

      {/* Таблиця журналу розпоряджень */}
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden print:border-none print:shadow-none"
        role="region"
        aria-label="Таблиця диспетчерських розпоряджень"
      >
        <div className="overflow-x-auto max-h-[calc(100vh-270px)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px] print:bg-slate-100 print:text-black">
              <tr>
                <th className="p-3">№ Наказу</th>
                <th className="p-3">Час видачі</th>
                <th className="p-3">Маршрут / Борт / Наряд</th>
                <th className="p-3">Тип заходу</th>
                <th className="p-3">Локація / Кільце</th>
                <th className="p-3">Причина та зміст розпорядження</th>
                <th className="p-3">Диспетчер ЦД</th>
                <th className="p-3">Статус</th>
                <th className="p-3 text-right print:hidden">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    За обраними критеріями розпоряджень не знайдено.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const createdAt = new Date(order.created_at)
                  const timeStr = createdAt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  const dateStr = createdAt.toLocaleDateString('uk-UA')

                  const handleComplete = () => {
                    void onCompleteOrder(order.id)
                  }

                  const handleCancel = () => {
                    void onCancelOrder(order.id)
                  }

                  return (
                    <tr 
                      key={order.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors print:hover:bg-transparent"
                    >
                      {/* 1. Номер наказу */}
                      <td className="p-3 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs">
                          {order.order_number}
                        </span>
                      </td>

                      {/* 2. Час видачі */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {timeStr}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {dateStr}
                        </div>
                      </td>

                      {/* 3. Маршрут / Борт / Наряд */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-blue-800">
                            {order.transport_type === 'TROLLEYBUS' ? '🚎' : '🚊'} №{order.route_number}
                          </span>
                          {order.vehicle_id && (
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                              Вг-{order.vehicle_id}
                            </span>
                          )}
                          {order.duty_number && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              (#{order.duty_number})
                            </span>
                          )}
                        </div>
                        {order.driver_name && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]" title={order.driver_name}>
                            👤 {order.driver_name}
                          </div>
                        )}
                      </td>

                      {/* 4. Тип заходу */}
                      <td className="p-3 whitespace-nowrap">
                        {getOrderTypeBadge(order.order_type)}
                      </td>

                      {/* 5. Локація / Кільце */}
                      <td className="p-3 text-slate-800 dark:text-slate-200 font-bold text-xs whitespace-nowrap">
                        {order.target_location || 'За трасою маршруту'}
                        {order.duration_min && (
                          <span className="block text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            ⏱️ {order.duration_min} хв відстою
                          </span>
                        )}
                      </td>

                      {/* 6. Причина та зміст розпорядження */}
                      <td className="p-3 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-1" title={order.reason}>
                          ⚠️ {order.reason}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2" title={order.description}>
                          {order.description}
                        </div>
                      </td>

                      {/* 7. Диспетчер ЦД */}
                      <td className="p-3 text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap font-medium">
                        {order.dispatcher_name}
                      </td>

                      {/* 8. Статус */}
                      <td className="p-3 whitespace-nowrap">
                        {order.status === 'ACTIVE' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider inline-flex items-center space-x-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>В процесі</span>
                          </span>
                        ) : order.status === 'COMPLETED' ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Виконано</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[11px] inline-flex items-center space-x-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Скасовано</span>
                          </span>
                        )}
                      </td>

                      {/* 9. Дії */}
                      <td className="p-3 text-right whitespace-nowrap print:hidden">
                        {order.status === 'ACTIVE' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={handleComplete}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] cursor-pointer transition-colors inline-flex items-center space-x-1 shadow-2xs"
                              title="Позначити розпорядження як виконане"
                              aria-label={`Позначити наказ №${order.order_number} як виконане`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Виконано</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancel}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950 font-bold text-[11px] cursor-pointer transition-colors"
                              title="Скасувати розпорядження"
                              aria-label={`Скасувати наказ №${order.order_number}`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">
                            {order.completed_at ? new Date(order.completed_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Офіційний підвал для підписів при друці */}
      <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-800 text-xs font-sans">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <p className="font-bold text-slate-900">
              Черговий старший диспетчер ЦД:
            </p>
            <div className="mt-8 border-b border-slate-800 flex justify-between text-[11px] text-slate-600">
              <span>(підпис)</span>
              <span>(ПІБ, табельний №)</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-900">
              Начальник служби руху КП «ОМЕТ»:
            </p>
            <div className="mt-8 border-b border-slate-800 flex justify-between text-[11px] text-slate-600">
              <span>(підпис)</span>
              <span>(ПІБ)</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-8">
          Електронний підпис згенеровано автоматизованою системою диспетчеризації КП «Одесміськелектротранс»
        </p>
      </div>
    </div>
  )
}
