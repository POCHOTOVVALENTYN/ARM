import React, { useId, useState } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
  panelClassName?: string
}

/**
 * Перший переюзаний, доступний Tooltip у проєкті. Показується по наведенню
 * миші та по клавіатурному фокусу (Tab), закривається по Escape.
 * Раніше в проєкті використовувався лише нативний атрибут `title` — цей
 * компонент дає керовану позицію, стилізацію та aria-зв'язок з елементом.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children, className, panelClassName }) => {
  const tooltipId = useId()
  const [visible, setVisible] = useState(false)

  return (
    <div
      className={`relative inline-flex ${className || ''}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setVisible(false)
      }}
    >
      <div tabIndex={0} aria-describedby={visible ? tooltipId : undefined} className="inline-flex outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
        {children}
      </div>
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 min-w-[180px] max-w-[280px] px-2.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-[10px] leading-snug font-sans shadow-lg pointer-events-none whitespace-normal ${panelClassName || ''}`}
        >
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
        </div>
      )}
    </div>
  )
}
