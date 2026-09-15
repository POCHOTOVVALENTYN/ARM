import React from 'react'
import { Download, Trash2 } from 'lucide-react'

interface AdminBackupPanelProps {
  onTriggerExportBackup: () => void
  onTriggerResetSystem: () => void
}

export const AdminBackupPanel: React.FC<AdminBackupPanelProps> = ({
  onTriggerExportBackup,
  onTriggerResetSystem
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <span className="text-base">📦</span>
            <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-tight uppercase">
              РЕЗЕРВНЕ КОПІЮВАННЯ ТА СКИДАННЯ
            </h2>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Експортувати базу даних:
            </label>
            <p className="text-xs text-slate-500 leading-relaxed">
              Зберегти всі поточні графіки змін, випуск техніки на лінії та налаштування у файл JSON.
            </p>
            <button
              type="button"
              onClick={onTriggerExportBackup}
              className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Створити резервну копію (.json)</span>
            </button>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="block text-xs font-bold text-red-600">
              Скинути систему:
            </label>
            <p className="text-xs text-slate-500 leading-relaxed">
              Повне очищення кешу та налаштувань. Повертає систему до первинного дефолтного стану м. Одеси.
            </p>
            <button
              type="button"
              onClick={onTriggerResetSystem}
              className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Очистити всі дані системи</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Інтеграція Open Data</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Статичні GTFS-дані КП «Одесміськелектротранс» синхронізовані та готові для публікації для пасажирських сервісів (Google Maps, EasyWay, CityBus).
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
            <div>Версія: GTFS v2.0</div>
            <div>Оновлення: Щоденно о 04:00</div>
            <div>Статус: Валідовано без критичних зауважень</div>
          </div>
        </div>
      </div>
    </div>
  )
}
