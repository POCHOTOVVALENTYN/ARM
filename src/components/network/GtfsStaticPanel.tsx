import React from 'react'
import { FileCode, CheckCircle2, Copy, Download } from 'lucide-react'

interface GtfsStaticPanelProps {
  gtfsStatic: Record<string, string>
  copiedFile: string | null
  onCopyToClipboard: (text: string, label: string) => void
}

export const GtfsStaticPanel: React.FC<GtfsStaticPanelProps> = ({
  gtfsStatic,
  copiedFile,
  onCopyToClipboard
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-slate-900 font-extrabold text-sm">Згенеровані специфікаційні файли GTFS Static Specification:</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(gtfsStatic).map(([filename, content]) => (
          <div key={filename} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-mono font-bold text-indigo-600 text-sm flex items-center space-x-2">
                  <FileCode className="w-4 h-4" />
                  <span>{filename}</span>
                </span>
                <button
                  onClick={() => onCopyToClipboard(content, filename)}
                  className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer"
                  title="Скопіювати у буфер"
                  aria-label={`Скопіювати файл ${filename}`}
                >
                  {copiedFile === filename ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="mt-3 bg-slate-50 border border-slate-100 p-3 rounded-xl text-[11px] font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre">
                {content}
              </pre>
            </div>
            <button
              onClick={() => onCopyToClipboard(content, filename)}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{copiedFile === filename ? 'Скопійовано!' : 'Завантажити / Скопіювати'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
