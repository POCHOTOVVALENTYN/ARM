import React from 'react'
import { 
  FileText, 
  ShieldCheck, 
  User, 
  TramFront, 
  Clock, 
  FileSpreadsheet 
} from 'lucide-react'
import { SmartWaybillData } from '../../hooks/useSmartWaybillLogic'

interface SmartWaybillDocumentProps {
  waybill: SmartWaybillData
}

export const SmartWaybillDocument: React.FC<SmartWaybillDocumentProps> = ({ waybill }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden print:border-none print:shadow-none">
      {/* Шапка путівки */}
      <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">
                КП «Одесміськелектротранс» • Книжка та Табель Водія
              </h1>
              <p className="text-xs text-slate-400">
                Путівка #{waybill.waybill_id} • Маршрут №{waybill.route_id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs font-bold text-amber-400">
              Дата: {waybill.target_date}
            </span>
            <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-400 rounded-xl text-xs font-bold flex items-center">
              <ShieldCheck size={14} className="mr-1" /> ЕЦП Валідовано
            </span>
          </div>
        </div>

        {/* Інформаційні плашки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <User size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Водій</p>
              <p className="text-xs font-extrabold text-white">{waybill.driver.full_name}</p>
              <p className="text-[10px] text-blue-400 font-mono">Таб. №{waybill.driver.id} • Клас {waybill.driver.class_rank}</p>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TramFront size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Рухомий склад</p>
              <p className="text-xs font-extrabold text-white">Борт №{waybill.vehicle.id}</p>
              <p className="text-[10px] text-emerald-400 font-mono">{waybill.vehicle.model}</p>
            </div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Наряд / Графік</p>
              <p className="text-xs font-extrabold text-white">Наряд {waybill.duty_number}</p>
              <p className="text-[10px] text-amber-400 font-mono">Зміна: {waybill.summary.total_work_hours}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Порейсний похвилинний розклад зупинок */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
            <FileSpreadsheet size={15} className="text-blue-500" />
            <span>Порейсний похвилинний розклад усіх зупинок</span>
          </h3>
          <span className="text-xs font-mono font-bold text-slate-500">
            Усього рейсів: {waybill.trips.length}
          </span>
        </div>

        <div className="space-y-3">
          {waybill.trips.map((trip) => (
            <div key={trip.trip_number} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="font-extrabold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border">
                    Рейс #{trip.trip_number} ({trip.direction})
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {trip.start_station} → {trip.end_station}
                  </span>
                  {trip.is_zero && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded">
                      Нульовий
                    </span>
                  )}
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-bold">
                  План: {trip.plan_start} — {trip.plan_end}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2.5 border-b">№</th>
                      <th className="py-1.5 px-2.5 border-b">Назва зупинки</th>
                      <th className="py-1.5 px-2.5 border-b text-center">План прибуття</th>
                      <th className="py-1.5 px-2.5 border-b text-center">План відправлення</th>
                      <th className="py-1.5 px-2.5 border-b text-center">Тип точки</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {(trip.stops || []).map((st, sIdx) => (
                      <tr key={sIdx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 ${st.is_control_point ? 'bg-blue-50/40 dark:bg-blue-950/20 font-bold' : ''}`}>
                        <td className="py-1.5 px-2.5 font-mono text-slate-400">{sIdx + 1}</td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {st.stop_name || st.stop_id}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {st.arrival_time}
                        </td>
                        <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {st.departure_time}
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          {st.is_control_point ? (
                            <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.2 rounded">
                              Контрольна
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Проміжна</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Підвал путівки */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-300">Диспетчер випуску:</span>
          <span> Черговий по депо (ЕЦП валідовано)</span>
        </div>
        <div className="font-mono text-right text-[10px]">
          <p>АРМ «Розклади» КП «Одесміськелектротранс» • v2.5</p>
          <p>Сформовано: {new Date().toLocaleString('uk-UA')}</p>
        </div>
      </div>
    </div>
  )
}
