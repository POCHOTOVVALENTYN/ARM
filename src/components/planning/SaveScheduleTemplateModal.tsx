import React, { useState } from 'react'
import { X, BookmarkPlus, Info } from 'lucide-react'
import { ActiveScheduleRoute } from '../../hooks/useActiveDutiesLogic'

interface SaveScheduleTemplateModalProps {
  item: ActiveScheduleRoute | null
  isOpen: boolean
  isPending: boolean
  onClose: () => void
  onSave: (name: string, description: string) => void
}

export const SaveScheduleTemplateModal: React.FC<SaveScheduleTemplateModalProps> = ({
  item,
  isOpen,
  isPending,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(item ? `Базовий робочий розклад №${item.route_number}` : '')
  const [description, setDescription] = useState('')

  if (!isOpen || !item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), description.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Зберегти конфігурацію нарядів у шаблон"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Зберегти розклад у шаблони
              </h3>
              <p className="text-[11px] text-slate-500">
                Маршрут №{item.route_number} ({item.duties_count} нарядів, {item.total_trips} рейсів)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl transition-colors cursor-pointer"
            aria-label="Закрити модальне вікно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="template-name" className="block font-extrabold text-slate-700 dark:text-slate-300">
              Назва шаблону:
            </label>
            <input
              id="template-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="напр. Базовий літній робочий день"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="template-desc" className="block font-extrabold text-slate-700 dark:text-slate-300">
              Опис та примітки Служби Руху:
            </label>
            <textarea
              id="template-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Вкажіть особливості застосування (будні дні, піковий випуск, погодні умови)..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200/60 dark:border-purple-800/40 flex items-start space-x-2 text-[11px] text-purple-900 dark:text-purple-300">
            <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <p>
              Шаблон зберігає повну топологічну структуру нарядів (кількість змін, інтервали, обідні пункти), дозволяючи у майбутньому в один клік розгорнути цей розклад у Конструкторі нарядів.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-black shadow-xs cursor-pointer transition-all active:scale-95"
            >
              {isPending ? 'Збереження...' : 'Зберегти шаблон'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SaveScheduleTemplateModal
