import React from 'react'
import { Copy } from 'lucide-react'

interface GtfsRealtimePanelProps {
  gtfsRealtime: unknown
  copiedFile: string | null
  onCopyToClipboard: (text: string, label: string) => void
}

export const GtfsRealtimePanel: React.FC<GtfsRealtimePanelProps> = ({
  gtfsRealtime,
  copiedFile,
  onCopyToClipboard
}) => {
  const jsonString = JSON.stringify(gtfsRealtime, null, 2)

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <h3 className="text-slate-900 font-extrabold text-base">Потік даних GTFS-Realtime (Live Telematics Stream):</h3>
          <p className="text-xs text-slate-500">Автоматична оновлюваність позицій вагонів та коефіцієнтів затримок</p>
        </div>
        <button
          onClick={() => onCopyToClipboard(jsonString, 'gtfs_rt')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>{copiedFile === 'gtfs_rt' ? 'Скопійовано!' : 'Скопіювати JSON'}</span>
        </button>
      </div>
      <pre className="bg-slate-950 text-emerald-400 p-5 rounded-2xl text-xs font-mono max-h-96 overflow-y-auto border border-slate-800">
        {jsonString}
      </pre>
    </div>
  )
}
