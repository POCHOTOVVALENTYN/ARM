import React from 'react'
import {
  FileText,
  Plus,
  Printer,
  FileSpreadsheet,
  Search,
  RotateCcw,
  Clock,
  Zap,
  Bus,
  AlertTriangle,
  Calendar,
  CheckCircle2
} from 'lucide-react'
import { Route } from '../../types'
import { DispatchStats } from '../../hooks/useDispatchOrdersJournalLogic'

export interface DispatchOrdersToolbarProps {
  routes: Route[]
  stats: DispatchStats | null
  selectedDate: string
  selectedRoute: string
  selectedType: string
  selectedStatus: string
  searchQuery: string
  onOpenCreateModal: () => void
  onDateChange: (date: string) => void
  onRouteChange: (route: string) => void
  onTypeChange: (type: string) => void
  onStatusChange: (status: string) => void
  onSearchChange: (query: string) => void
  onPrint: () => void
  onExportCSV: () => void
}

export const DispatchOrdersToolbar: React.FC<DispatchOrdersToolbarProps> = ({
  routes,
  stats,
  selectedDate,
  selectedRoute,
  selectedType,
  selectedStatus,
  searchQuery,
  onOpenCreateModal,
  onDateChange,
  onRouteChange,
  onTypeChange,
  onStatusChange,
  onSearchChange,
  onPrint,
  onExportCSV
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 space-y-3 print:hidden font-sans">
      {/* 1. Верхній рядок: Заголовок та кнопка створення наказу */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white">
              Журнал оперативних розпоряджень диспетчера
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Фіксація наказів на скорочення рейсів, відстої, підміну та заїзди в депо
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Видати наказ</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            aria-label="Експортувати журнал у CSV"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            aria-label="Роздрукувати офіційний бланк"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Друк бланку</span>
          </button>
        </div>
      </div>

      {/* 2. Компактні чіпи-лічильники CAD/AVL */}
      {stats && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-mono">
          <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 shrink-0">
            <span>Всього сьогодні:</span>
            <strong className="text-slate-900 dark:text-white">{stats.total_today}</strong>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center space-x-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>В процесі:</span>
            <strong>{stats.active_count}</strong>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 flex items-center space-x-1.5 shrink-0">
            <RotateCcw className="w-3 h-3 text-blue-500" />
            <span>Розвороти:</span>
            <strong>{stats.short_turns_count}</strong>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 flex items-center space-x-1.5 shrink-0">
            <Clock className="w-3 h-3 text-indigo-500" />
            <span>Відстої:</span>
            <strong>{stats.pacing_count}</strong>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5 shrink-0">
            <Zap className="w-3 h-3 text-emerald-500" />
            <span>Підміна:</span>
            <strong>{stats.service_calls_count}</strong>
          </div>
        </div>
      )}

      {/* 3. Панель швидких фільтрів та пошуку */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-1">
        <div>
          <select
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            aria-label="Фільтр дати"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Сьогодні</option>
            <option value="yesterday">Вчора</option>
            <option value="ALL">Всі дати</option>
          </select>
        </div>

        <div>
          <select
            value={selectedRoute}
            onChange={(e) => onRouteChange(e.target.value)}
            aria-label="Фільтр маршруту"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Всі маршрути</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.type === 'trolleybus' ? 'Тр' : 'Тр-й'} №{r.number || r.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            aria-label="Фільтр типу заходу"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Всі типи заходів</option>
            <option value="SHORT_TURN">Скорочення (Розворот)</option>
            <option value="PACING">Регулювання (Відстій)</option>
            <option value="CAR_SWAP">Підміна вагона</option>
            <option value="PULL_IN">Схід у депо</option>
            <option value="DETOUR">Об'їзд / Перенаправлення</option>
            <option value="SERVICE_CALL">Спецтехніка</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Фільтр статусу розпорядження"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Всі статуси</option>
            <option value="ACTIVE">В процесі (ACTIVE)</option>
            <option value="COMPLETED">Виконано (COMPLETED)</option>
            <option value="CANCELLED">Скасовано (CANCELLED)</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Пошук борта, причини..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Пошук розпорядження"
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

export default DispatchOrdersToolbar
