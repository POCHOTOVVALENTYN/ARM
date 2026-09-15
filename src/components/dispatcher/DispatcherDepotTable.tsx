import React from 'react'
import { Info, CheckCircle2, Wrench, Building2 } from 'lucide-react'
import { VehicleTelemetryRow } from '../../hooks/useDispatcherLiveLogic'

export interface DispatcherDepotTableProps {
  vehicles: VehicleTelemetryRow[]
  onOpenInspector: (v: VehicleTelemetryRow) => void
}

export const DispatcherDepotTable: React.FC<DispatcherDepotTableProps> = ({
  vehicles,
  onOpenInspector
}) => {
  if (vehicles.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Немає рухомого складу на території депо за обраними критеріями.
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs font-sans border-collapse table-fixed min-w-[800px]">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[22%]" />
          <col className="w-[22%]" />
          <col className="w-[18%]" />
          <col className="w-[20%]" />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-xs">
          <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
            <th className="p-3">Борт / Одиниця</th>
            <th className="p-3">Базування</th>
            <th className="p-3">Технічний стан / ТО</th>
            <th className="p-3">Модель ТЗ</th>
            <th className="p-3 text-right">Готовність</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {vehicles.map((v) => {
            const isMaintenance = (v.depot_status || '').toLowerCase().includes('то') || (v.depot_status || '').toLowerCase().includes('рем')
            const isReady = !isMaintenance

            return (
              <tr key={v.vehicle_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                  <button
                    type="button"
                    onClick={() => onOpenInspector(v)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs inline-flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
                    title="Діагностика резервного вагона"
                  >
                    <span>🏢 {v.vehicle_id}</span>
                    <Info className="w-3 h-3 text-slate-400" />
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center space-x-1 text-slate-800 dark:text-slate-200 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{v.depot_name || 'Трамвайне депо №1'}</span>
                  </div>
                </td>
                <td className="p-3">
                  {isMaintenance ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center space-x-1">
                      <Wrench className="w-3 h-3 text-amber-600" />
                      <span>{v.depot_status || 'Планове ТО-1'}</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{v.depot_status || 'Готовий до випуску'}</span>
                    </span>
                  )}
                </td>
                <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                  {v.model || 'Tatra T3R.P (Одіссей)'}
                </td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    isReady
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {isReady ? 'Гарячий Резерв' : 'В ремонті'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default DispatcherDepotTable
