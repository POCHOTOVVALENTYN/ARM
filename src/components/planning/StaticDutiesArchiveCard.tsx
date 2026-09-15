import React from 'react'
import {
  Calendar,
  Bus,
  FileSpreadsheet,
  ArrowRight,
  Trash2,
  Clock,
  MapPin
} from 'lucide-react'
import { ArchiveRegistryItem } from '../../hooks/useStaticDutiesArchiveLogic'

interface StaticDutiesArchiveCardProps {
  item: ArchiveRegistryItem
  onOpenInMatrix: (item: ArchiveRegistryItem) => void
  onOpenActivationModal: (item: ArchiveRegistryItem) => void
  onExportCsv: (item: ArchiveRegistryItem) => void
  onDeleteArchive: (id: string, routeId: string) => void
}

export const StaticDutiesArchiveCard: React.FC<StaticDutiesArchiveCardProps> = ({
  item,
  onOpenInMatrix,
  onOpenActivationModal,
  onExportCsv,
  onDeleteArchive
}) => {
  const isTrolley = item.transportType?.toLowerCase().includes('тролейбус')

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between font-sans"
      role="article"
      aria-label={`Архівний розклад маршруту №${item.routeNumber || item.routeId}`}
    >
      <div className="space-y-3">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
              isTrolley
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>{isTrolley ? 'Тролейбус' : 'Трамвай'} №{item.routeNumber || item.routeId}</span>
          </span>

          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{item.savedAt}</span>
          </span>
        </div>

        {/* Route Name & Version */}
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
            {item.routeName}
          </h3>
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
            {item.scheduleType}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>Депо: <strong>{item.depotName || 'ТД-1'}</strong></span>
          </div>
        </div>

        {/* Key Metrics Chips */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center text-xs">
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Нарядів</div>
            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {item.dutiesCount}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Рейсів</div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {item.totalTrips}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Пробіг</div>
            <div className="text-sm font-black text-slate-800 dark:text-slate-200 font-mono">
              {item.totalWagonKm} км
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => onExportCsv(item)}
            title="Експорт в Excel (.csv)"
            className="p-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition-all cursor-pointer"
            tabIndex={0}
            aria-label={`Експорт розкладу №${item.routeId} у файл CSV`}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteArchive(item.id, item.routeNumber || item.routeId)}
            title="Видалити з архіву"
            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-all cursor-pointer"
            tabIndex={0}
            aria-label={`Видалити розклад #${item.id} з архіву`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onOpenInMatrix(item)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1"
            tabIndex={0}
            aria-label={`Відкрити шахівницю для розкладу №${item.routeNumber}`}
          >
            <span>Шахівниця</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onOpenActivationModal(item)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
            tabIndex={0}
            aria-label={`Запланувати введення розкладу №${item.routeNumber} за Сценарієм 1`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Ввести в дію</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaticDutiesArchiveCard
