import React from 'react'
import {
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Clock,
  Info
} from 'lucide-react'
import { VehicleTelemetryRow, StationItem } from '../../hooks/useDispatcherLiveLogic'
import { VehicleActionDropdown, VehicleActionItem } from './VehicleActionDropdown'
import { resolveVehicleStops } from './TelemetryMarkers'

export interface DispatcherPassengerTableProps {
  vehicles: VehicleTelemetryRow[]
  stations: StationItem[]
  onOpenInspector: (v: VehicleTelemetryRow) => void
  onOpenShortTurn: (v: VehicleActionItem) => void
  onOpenPacing: (v: VehicleActionItem) => void
  onOpenOrderModal: (v: VehicleActionItem) => void
}

export const DispatcherPassengerTable: React.FC<DispatcherPassengerTableProps> = ({
  vehicles,
  stations,
  onOpenInspector,
  onOpenShortTurn,
  onOpenPacing,
  onOpenOrderModal
}) => {
  if (vehicles.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Немає пасажирських одиниць за обраними фільтрами.
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-xs font-sans border-collapse table-fixed min-w-[900px]">
        <colgroup>
          <col className="w-[14%]" />
          <col className="w-[14%]" />
          <col className="w-[18%]" />
          <col className="w-[20%]" />
          <col className="w-[8%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 shadow-xs">
          <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
            <th className="p-3">Борт / Одиниця</th>
            <th className="p-3">Маршрут</th>
            <th className="p-3">Наряд / Водій</th>
            <th className="p-3">Геолокація / Зупинка</th>
            <th className="p-3 text-center">Швидкість</th>
            <th className="p-3 text-center">Відхилення</th>
            <th className="p-3 text-right">Оперативна дія</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {vehicles.map((v) => {
            const dev = v.deviation_min || 0
            const absDev = Math.abs(dev)
            const isLate = dev > 2.0
            const isEarly = dev < -2.0
            const isCritical = absDev > 5.0
            const isTram = (v.vehicle_type || 'TRAM').toUpperCase() === 'TRAM'

            const { passedStop, nextStop } = resolveVehicleStops(
              v.lat,
              v.lng || v.lon || 0,
              v.heading || 0,
              v.speed,
              stations as any
            )

            const actionItem: VehicleActionItem = {
              vehicle_id: v.vehicle_id,
              route_id: v.route_id,
              route_number: v.route_number,
              duty_number: v.duty_number,
              driver_name: v.driver_name,
              speed: v.speed,
              deviation_min: v.deviation_min,
              status: v.status
            }

            return (
              <tr
                key={v.vehicle_id}
                className={`transition-colors ${
                  isCritical
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/40'
                    : isLate
                    ? 'bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-100/40 dark:hover:bg-amber-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* 1. Борт / Інспектор */}
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onOpenInspector(v)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-slate-900 dark:text-white font-mono font-black text-xs inline-flex items-center space-x-1 cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shadow-2xs"
                      title="Відкрити карточку діагностики вагона"
                    >
                      <span>{isTram ? '🚋' : '🚎'} {v.vehicle_id}</span>
                      <Info className="w-3 h-3 text-slate-400" />
                    </button>
                    {v.has_active_detour && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse" title="Активний оперативний розворот">
                        РОЗВОРОТ
                      </span>
                    )}
                  </div>
                </td>

                {/* 2. Маршрут */}
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded font-mono font-black text-xs ${
                    isTram
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                  }`}>
                    {v.route_number ? `№${v.route_number}` : `Маршрут ${v.route_id}`}
                  </span>
                </td>

                {/* 3. Наряд / Водій */}
                <td className="p-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {v.driver_name || 'Не призначено'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Наряд: <strong className="text-slate-600 dark:text-slate-300">{v.duty_number || 'Б/Н'}</strong>
                    </div>
                  </div>
                </td>

                {/* 4. Геолокація */}
                <td className="p-3">
                  <div className="space-y-0.5 text-[11px] truncate">
                    <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{passedStop || v.current_station || 'м. Одеса'}</span>
                    </div>
                    {nextStop && (
                      <div className="text-[10px] text-slate-400 pl-4.5 truncate">
                        Наст: {nextStop}
                      </div>
                    )}
                  </div>
                </td>

                {/* 5. Швидкість */}
                <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                  {v.speed} км/г
                </td>

                {/* 6. Відхилення */}
                <td className="p-3 text-center font-mono">
                  <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md font-bold text-xs ${
                    isCritical
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : isLate
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : isEarly
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}>
                    {isLate ? (
                      <TrendingUp className="w-3 h-3 text-rose-600" />
                    ) : isEarly ? (
                      <TrendingDown className="w-3 h-3 text-blue-600" />
                    ) : null}
                    <span>
                      {dev > 0 ? `+${dev.toFixed(1)}` : dev.toFixed(1)} хв
                    </span>
                  </div>
                </td>

                {/* 7. Дії CAD/AVL */}
                <td className="p-3 text-right">
                  <div className="inline-flex items-center space-x-1 justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenShortTurn(actionItem)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Оперативний розворот (Short-Turn)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPacing(actionItem)}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Регулювальна відтяжка (Pacing)"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>

                    <VehicleActionDropdown
                      vehicle={actionItem}
                      onShortTurn={onOpenShortTurn}
                      onPacing={onOpenPacing}
                      onDetour={onOpenShortTurn}
                      onPullIn={onOpenOrderModal}
                      onSendMessage={onOpenOrderModal}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default DispatcherPassengerTable
