import React from 'react';
import { useScheduleStore } from '../store/useScheduleStore';
import { History, RotateCcw, RotateCw, Clock, ArrowLeft, Trash2, X, CheckCircle2 } from 'lucide-react';

interface HistoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestRevertConfirm: (targetIndex: number, actionLabel: string) => void;
  onRequestClearConfirm: () => void;
}

export const HistoryLogModal: React.FC<HistoryLogModalProps> = ({
  isOpen,
  onClose,
  onRequestRevertConfirm,
  onRequestClearConfirm,
}) => {
  const { historyStack, redoStack, undoLastAction, redoAction } = useScheduleStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-all animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white/90 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Журнал історії дій та скасувань
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Перегляд хронології редагування розкладу з можливістю точкового відкату
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={undoLastAction}
              disabled={historyStack.length === 0}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 transition-all ${
                historyStack.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Скасувати дію ({historyStack.length})</span>
            </button>

            <button
              onClick={redoAction}
              disabled={redoStack.length === 0}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center space-x-1.5 transition-all ${
                redoStack.length > 0
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Повернути дію ({redoStack.length})</span>
            </button>
          </div>

          {historyStack.length > 0 && (
            <button
              onClick={onRequestClearConfirm}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистити історію</span>
            </button>
          )}
        </div>

        {/* History Stack List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Стек виконаних дій ({historyStack.length})
          </h4>

          {historyStack.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Історія порожня</p>
              <p className="text-xs text-slate-500">
                Усі внесені редагування відсутні або зафіксовані в генеральному графіку.
              </p>
            </div>
          ) : (
            historyStack.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-black flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">
                      {item.label || `Пакетна модифікація розкладу #${idx + 1}`}
                    </h5>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{item.timestamp || 'Щойно'}</span>
                      <span>•</span>
                      <span>Блоків: {item.blocks.length} | Нарядів: {item.duties.length}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRequestRevertConfirm(idx, item.label || `Крок #${idx + 1}`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Відкотити сюди</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Close footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
