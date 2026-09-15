import React from 'react'
import { MapPin } from 'lucide-react'
import { DepartureItem, DirectionType } from '../../hooks/useControlPointsTripsLogic'

interface ControlPointsHourlyGridProps {
  selectedDirection: DirectionType
  stationAName: string
  stationBName: string
  departuresStationA: DepartureItem[]
  departuresStationB: DepartureItem[]
  hours: number[]
  getDeparturesForHour: (list: DepartureItem[], hour: number) => DepartureItem[]
}

export const ControlPointsHourlyGrid: React.FC<ControlPointsHourlyGridProps> = ({
  selectedDirection,
  stationAName,
  stationBName,
  departuresStationA,
  departuresStationB,
  hours,
  getDeparturesForHour
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
      {/* Станція А */}
      {(selectedDirection === 'both' || selectedDirection === 'direct') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                Відправлення: {stationAName || 'Станція А'}
              </h3>
            </div>
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
              Всього: {departuresStationA.length} рейсів
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {hours.map((hr) => {
              const trips = getDeparturesForHour(departuresStationA, hr)
              return (
                <div key={hr} className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-14 text-center font-mono font-black text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1.5 rounded-lg shrink-0">
                    {hr.toString().padStart(2, '0')}:00
                  </div>

                  <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                    {trips.length > 0 ? (
                      trips.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                          title={`Наряд #${t.dutyNumber}, Круг ${t.roundNumber}`}
                        >
                          <span className="text-indigo-600 dark:text-indigo-400 font-black">{t.time.split(':')[1]}</span>
                          <span className="text-[10px] text-slate-400 font-sans">н{t.dutyNumber}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-700 italic py-1">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Станція Б */}
      {(selectedDirection === 'both' || selectedDirection === 'reverse') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                Відправлення: {stationBName || 'Станція Б'}
              </h3>
            </div>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              Всього: {departuresStationB.length} рейсів
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {hours.map((hr) => {
              const trips = getDeparturesForHour(departuresStationB, hr)
              return (
                <div key={hr} className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="w-14 text-center font-mono font-black text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 py-1.5 rounded-lg shrink-0">
                    {hr.toString().padStart(2, '0')}:00
                  </div>

                  <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                    {trips.length > 0 ? (
                      trips.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
                          title={`Наряд #${t.dutyNumber}, Круг ${t.roundNumber}`}
                        >
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">{t.time.split(':')[1]}</span>
                          <span className="text-[10px] text-slate-400 font-sans">н{t.dutyNumber}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-300 dark:text-slate-700 italic py-1">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
