import React from 'react'
import {
  Save,
  FolderOpen,
  X,
  Trash2
} from 'lucide-react'
import { DutyTemplate } from '../../hooks/useDutyParametersBuilderLogic'

interface DutyDraftModalsProps {
  isSaveDraftOpen: boolean
  isDraftsListOpen: boolean
  draftNameInput: string
  dutyDrafts: DutyTemplate[]
  onDraftNameInputChange: (val: string) => void
  onSaveDraftConfirm: () => void
  onCloseSaveDraft: () => void
  onLoadDraft: (draft: DutyTemplate) => void
  onDeleteDraft: (id: string, name: string) => void
  onCloseDraftsList: () => void
}

export const DutyDraftModals: React.FC<DutyDraftModalsProps> = ({
  isSaveDraftOpen,
  isDraftsListOpen,
  draftNameInput,
  dutyDrafts,
  onDraftNameInputChange,
  onSaveDraftConfirm,
  onCloseSaveDraft,
  onLoadDraft,
  onDeleteDraft,
  onCloseDraftsList
}) => {
  return (
    <>
      {/* Модальне вікно збереження шаблону наряду */}
      {isSaveDraftOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-template-title"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Save className="w-5 h-5 text-indigo-600" />
                <h3 id="save-template-title" className="text-sm font-black text-slate-900 dark:text-white uppercase">
                  Збереження шаблону нарядів
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseSaveDraft}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Закрити вікно збереження шаблону"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="template-name-input" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Назва шаблону:
              </label>
              <input
                id="template-name-input"
                type="text"
                value={draftNameInput}
                onChange={(e) => onDraftNameInputChange(e.target.value)}
                placeholder="наприклад: Маршрут №7 (Осінь 2026, 16 нарядів)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onCloseSaveDraft}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={onSaveDraftConfirm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                Зберегти шаблон наряду
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно перегляду збережених шаблонів нарядів */}
      {isDraftsListOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
          role="dialog"
          aria-modal="true"
          aria-labelledby="templates-list-title"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                <h3 id="templates-list-title" className="text-sm font-black text-slate-900 dark:text-white uppercase">
                  Збережені шаблони нарядів ({dutyDrafts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseDraftsList}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Закрити список шаблонів"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {dutyDrafts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Збережених шаблонів нарядів поки немає. Збережіть поточні налаштування кнопкою «Зберегти шаблон наряду».
                </div>
              ) : (
                dutyDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-indigo-300 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {draft.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {draft.dutiesCount} нарядів
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {draft.routeName} | {draft.scheduleType} | Збережено: {draft.updatedAt}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => onLoadDraft(draft)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
                      >
                        Завантажити
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDraft(draft.id, draft.name)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                        title="Видалити шаблон наряду"
                        aria-label={`Видалити шаблон ${draft.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onCloseDraftsList}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
