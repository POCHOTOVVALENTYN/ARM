import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Trash2, Zap, Download, X, ListCheck, ShieldAlert, History } from 'lucide-react';

export interface ConfirmModalConfig {
  isOpen: boolean;
  title: string;
  description: string;
  badgeText?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  icon?: 'trash' | 'check' | 'warning' | 'zap' | 'download';
  changesList?: string[];
  conflictsCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmModalConfig> = ({
  isOpen,
  title,
  description,
  badgeText,
  confirmText = 'Підтвердити',
  cancelText = 'Скасувати',
  variant = 'info',
  icon = 'warning',
  changesList,
  conflictsCount = 0,
  onConfirm,
  onCancel,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 text-rose-600 border-rose-200',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30',
          badgeText: badgeText || 'Критична дія',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/30',
          badgeText: badgeText || 'Попередження',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30',
          badgeText: badgeText || 'Публікація розкладу',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30',
          badgeText: badgeText || 'Системна дія',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        };
    }
  };

  const renderIcon = () => {
    switch (icon) {
      case 'trash':
        return <Trash2 className="w-7 h-7" />;
      case 'check':
        return <CheckCircle2 className="w-7 h-7" />;
      case 'zap':
        return <Zap className="w-7 h-7" />;
      case 'download':
        return <Download className="w-7 h-7" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-7 h-7" />;
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in">
      {/* Overlay Backdrop Click */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Modal Container */}
      <div className="relative bg-white border border-slate-200 shadow-2xl rounded-3xl max-w-lg w-full p-6 space-y-5 transform transition-all duration-300 ease-out scale-100 animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div className={`p-3.5 rounded-2xl border shadow-2xs ${styles.iconBg}`}>
              {renderIcon()}
            </div>
            <div>
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${styles.badgeClass}`}>
                {styles.badgeText}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-1">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description Body */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 leading-relaxed space-y-3">
          <p>{description}</p>

          {/* Validation Metrics Status if applicable */}
          {variant === 'success' && (
            <div className="flex items-center justify-between text-[11px] font-bold p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="flex items-center space-x-1.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Відповідність КЗпП України</span>
              </span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Перевірено (0 зауважень)
              </span>
            </div>
          )}

          {conflictsCount > 0 && (
            <div className="flex items-center justify-between text-[11px] font-bold p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <span className="flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Увага! Виявлено конфлікти</span>
              </span>
              <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                {conflictsCount} конфліктів
              </span>
            </div>
          )}
        </div>

        {/* Display specific changes list if provided */}
        {changesList && changesList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <ListCheck className="w-4 h-4 text-blue-600" />
                <span>Склад внесення змін в чернетці ({changesList.length}):</span>
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs font-mono">
              {changesList.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center space-x-1.5 ${styles.confirmBtn}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

