import React from 'react'
import { MapPin, Info, PhoneCall } from 'lucide-react'
import { VehicleTelemetryRow, StationItem } from '../../hooks/useDispatcherLiveLogic'
import { resolveVehicleStops } from './TelemetryMarkers'

export interface DispatcherServiceTableProps {
  vehicles: VehicleTelemetryRow[]
  stations: StationItem[]
  onOpenInspector: (v: VehicleTelemetryRow) => void
}

export const DispatcherServiceTable: React.FC<DispatcherServiceTableProps> = ({
  vehicles,
  stations,
  onOpenInspector
}) => {
  if (vehicles.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Спецтехніки за обраними фільтрами не знайдено.
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs font-sans border-collapse table-fixed min-w-[800px]">
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[20%]" />
          <col className="w-[18%]" />
          <col className="w-[22%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-xs">
          <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
            <th className="p-3">Спецборт / Одиниця</th>
            <th className="p-3">Служба / Підрозділ</th>
            <th className="p-3">Екіпаж / Бригадир</th>
            <th className="p-3">Поточна локація</th>
            <th className="p-3 text-center">Швидкість</th>
            <th className="p-3 text-right">Зв'язок</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {vehicles.map((v) => {
            const { passedStop } = resolveVehicleStops(
              v.lat,
              v.lng || v.lon || 0,
              v.heading || 0,
              v.speed,
              stations as any
            )

            return (
              <tr key={v.vehicle_id} className="hover:bg-purple-50/40 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-3 font-mono font-black text-slate-900 dark:text-white">
                  <button
                    type="button"
                    onClick={() => onOpenInspector(v)}
                    className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs inline-flex items-center space-x-1 cursor-pointer transition-all shadow-2xs"
                    title="Діагностика спецборта"
                  >
                    <span>🛠️ {v.vehicle_id}</span>
                    <Info className="w-3 h-3 text-purple-600 opacity-80" />
                  </button>
                </td>
                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                  {v.service_department || 'Служба енергогосподарства (КМ)'}
                </td>
                <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                  {v.driver_name || 'Чергова аварійна бригада'}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">{passedStop || 'м. Одеса'}</span>
                  </div>
                </td>
                <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                  {v.speed} км/г
                </td>
                <td className="p-3 text-right">
                  <button
                    type="button"
                    onClick={() => alert(`Виклик чергового диспетчера для борта ${v.vehicle_id}`)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Зв'язатися з екіпажем"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-purple-600" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default DispatcherServiceTable
