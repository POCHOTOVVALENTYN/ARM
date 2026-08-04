import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (jsonStr: string) => { success: boolean; count?: number; error?: string };
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [jsonContent, setJsonContent] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setJsonContent(result || '');
      setFeedback(null);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!jsonContent.trim()) {
      setFeedback({ success: false, msg: 'Будь ласка, завантажте файл або вставте JSON код!' });
      return;
    }

    const res = onImport(jsonContent);
    if (res.success) {
      setFeedback({
        success: true,
        msg: `Успішно імпортовано та оновлено ${res.count || 1} маршрут(ів)!`,
      });
      setTimeout(() => {
        onClose();
        setJsonContent('');
        setFeedback(null);
      }, 1200);
    } else {
      setFeedback({
        success: false,
        msg: res.error || 'Не вдалося імпортувати JSON файл.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border-2 border-gray-900 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gray-900 text-white p-5 flex items-center justify-between border-b-2 border-gray-900">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Імпорт конфігурації маршрутів (JSON)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {feedback && (
            <div
              className={`p-3 rounded-lg border flex items-center space-x-2 font-bold ${
                feedback.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* File Picker */}
          <div>
            <label className="font-bold text-gray-800 block mb-1">
              Завантажити файл .json з комп'ютера:
            </label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="w-full text-xs text-gray-600 border border-gray-300 rounded-lg p-2 bg-gray-50 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
            />
          </div>

          {/* Or Paste Raw JSON */}
          <div>
            <label className="font-bold text-gray-800 block mb-1">
              Або вставте скопійований JSON вміст нижче:
            </label>
            <textarea
              rows={8}
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                setFeedback(null);
              }}
              placeholder='[\n  {\n    "number": "3",\n    "name": "Старосінна площа...",\n    "type": "tram",\n    "segments": [...]\n  }\n]'
              className="w-full bg-gray-900 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-4 py-2 rounded-lg font-bold text-xs cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={handleApplyImport}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-5 py-2 rounded-lg font-bold text-xs shadow-xs flex items-center space-x-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Імпортувати в систему</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
