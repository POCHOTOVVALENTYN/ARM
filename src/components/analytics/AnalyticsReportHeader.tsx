import React from 'react'
import { FileSpreadsheet, Calendar, Download, Printer } from 'lucide-react'

export interface AnalyticsReportHeaderProps {
  targetDate: string
  hasData: boolean
  onDateChange: (date: string) => void
  onExportCSV: () => void
  onPrint: () => void
}

export const AnalyticsReportHeader: React.FC<AnalyticsReportHeaderProps> = ({
  targetDate,
  hasData,
  onDateChange,
  onExportCSV,
  onPrint
}) => {
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value)
  }

  return (
    <div className="print:hidden space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase tracking-wider">
                Аналітика Руху
              </span>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Звітність регулярності руху та інцидентів (On-Time Performance)
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Автоматичний розрахунок виконання графіків руху за даними проходження зупинок і телеметрії
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={targetDate}
              onChange={handleDateInputChange}
              aria-label="Вибір дати аналітичного звіту"
              className="bg-transparent border-0 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-0 p-0 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={onExportCSV}
            disabled={!hasData}
            aria-label="Експортувати звіт у форматі CSV"
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Експорт CSV</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            aria-label="Роздрукувати аналітичний звіт"
            className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Друк A4</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsReportHeader
