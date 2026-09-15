import React, { useEffect, Suspense, lazy } from 'react'
import { X } from 'lucide-react'
import { ViewLoadingFallback } from './ViewLoadingFallback'

const AnalyticsReportView = lazy(() => import('./views/AnalyticsReportView').then((m) => ({ default: m.AnalyticsReportView })))

export interface AnalyticalReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AnalyticalReportModal: React.FC<AnalyticalReportModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = () => {
    onClose()
  }

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-950/80 z-[9999] flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm transition-opacity font-sans"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-analytics-title"
    >
      <div 
        className="bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={handleModalContentClick}
      >
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex justify-between items-center shrink-0">
          <span id="modal-analytics-title" className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            КП «ОМЕТ» • Аналітичний Звіт Регулярності Руху (OTP)
          </span>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Закрити звіт"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Suspense fallback={<ViewLoadingFallback />}>
            <AnalyticsReportView />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default AnalyticalReportModal
