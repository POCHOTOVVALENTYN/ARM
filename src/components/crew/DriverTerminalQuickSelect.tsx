import React from 'react'
import { RefreshCw } from 'lucide-react'

interface DriverTerminalQuickSelectProps {
  vehicleId: string
  popularVehicles: string[]
  isNightMode: boolean
  isCustomInputOpen: boolean
  customVehicleInput: string
  isLoading: boolean
  onSelectVehicle: (id: string) => void
  onOpenCustomInput: (open: boolean) => void
  onCustomVehicleInputChange: (val: string) => void
  onCustomVehicleSubmit: (e: React.FormEvent) => void
  onRefresh: () => void
}

export const DriverTerminalQuickSelect: React.FC<DriverTerminalQuickSelectProps> = ({
  vehicleId,
  popularVehicles,
  isNightMode,
  isCustomInputOpen,
  customVehicleInput,
  isLoading,
  onSelectVehicle,
  onOpenCustomInput,
  onCustomVehicleInputChange,
  onCustomVehicleSubmit,
  onRefresh
}) => {
  return (
    <div className={`px-4 py-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs font-bold ${
      isNightMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center space-x-2">
        <span className="text-slate-400 font-mono text-[11px]">Швидкий вибір борта:</span>
        <div className="flex flex-wrap gap-1.5">
          {popularVehicles.map((vId) => (
            <button
              key={vId}
              onClick={() => onSelectVehicle(vId)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                vehicleId === vId
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : isNightMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              #{vId}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {!isCustomInputOpen ? (
          <button
            onClick={() => onOpenCustomInput(true)}
            className="text-blue-400 hover:text-blue-300 underline text-[11px] cursor-pointer"
          >
            + Інший борт
          </button>
        ) : (
          <form onSubmit={onCustomVehicleSubmit} className="flex items-center space-x-1">
            <input
              type="text"
              placeholder="Борт..."
              value={customVehicleInput}
              onChange={(e) => onCustomVehicleInputChange(e.target.value)}
              className="w-20 px-2 py-0.5 text-xs rounded bg-slate-800 border border-slate-700 text-white font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs cursor-pointer"
            >
              OK
            </button>
          </form>
        )}

        <button
          onClick={onRefresh}
          className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer transition-colors"
          title="Оновити путівку"
          aria-label="Оновити путівку терміналу"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  )
}
