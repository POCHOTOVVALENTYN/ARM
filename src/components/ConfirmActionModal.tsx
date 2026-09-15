import React, { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Trash2, Zap, Download, X, ListCheck, ShieldAlert, Loader2 } from 'lucide-react'

export interface ConfirmModalConfig {
  isOpen: boolean
  title: string
  description: string
  badgeText?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'success' | 'info'
  icon?: 'trash' | 'check' | 'warning' | 'zap' | 'download'
  changesList?: string[]
  conflictsCount?: number
  onConfirm: () => Promise<void> | void
  onCancel: () => void
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, isSubmitting])

  const handleConfirmClick = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/30',
          badgeText: badgeText || 'Критична дія',
          badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/30',
          badgeText: badgeText || 'Попередження',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        }
      case 'success':
        return {
          iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30',
          badgeText: badgeText || 'Публікація розкладу',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        }
      case 'info':
      default:
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30',
          badgeText: badgeText || 'Системна дія',
          badgeClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        }
    }
  }

  const renderIcon = () => {
    switch (icon) {
      case 'trash':
        return <Trash2 className="w-7 h-7" />
      case 'check':
        return <CheckCircle2 className="w-7 h-7" />
      case 'zap':
        return <Zap className="w-7 h-7" />
      case 'download':
        return <Download className="w-7 h-7" />
      case 'warning':
      default:
        return <AlertTriangle className="w-7 h-7" />
    }
  }

  const styles = getVariantStyles()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-all duration-300 ease-out animate-in fade-in"
    >
      {/* Overlay Backdrop Click */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col p-6 space-y-5 transform transition-all duration-300 ease-out scale-100 animate-in zoom-in-95 overflow-hidden">
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
              <h3 id="confirm-modal-title" className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Закрити модальне вікно"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description Body */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 overflow-y-auto">
          <p>{description}</p>

          {/* Validation Metrics Status if applicable */}
          {variant === 'success' && (
            <div className="flex items-center justify-between text-[11px] font-bold p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Відповідність КЗпП України</span>
              </span>
              <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                Перевірено (0 зауважень)
              </span>
            </div>
          )}

          {conflictsCount > 0 && (
            <div className="flex items-center justify-between text-[11px] font-bold p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
              <span className="flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Увага! Виявлено конфлікти</span>
              </span>
              <span className="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2 py-0.5 rounded-md">
                {conflictsCount} конфліктів
              </span>
            </div>
          )}
        </div>

        {/* Display specific changes list if provided */}
        {changesList && changesList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <ListCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Склад внесення змін в чернетці ({changesList.length}):</span>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs font-mono">
              {changesList.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            tabIndex={0}
            className={`px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirmClick}
            disabled={isSubmitting}
            tabIndex={0}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-sm transition-all flex items-center space-x-1.5 ${styles.confirmBtn} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Обробка...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmActionModal

