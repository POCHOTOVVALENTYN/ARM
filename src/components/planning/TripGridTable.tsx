import React from 'react'
import { Edit3, AlertTriangle, CheckCircle2, Radio, GitCompare } from 'lucide-react'
import { Route, MasterGridRow, SummaryPassport } from '../../types'
import { TripGridViewMode, HeadwayAuditInfo } from '../../hooks/useTripGridLogic'
import { DetailedRouteOverlap } from '../../constants/odessaCorridors'
import { TripGridLegendBar } from './TripGridLegendBar'
import { Tooltip } from '../common/Tooltip'

interface TripGridTableProps {
  currentRoute: Route
  passport: SummaryPassport
  currentDepotName: string
  currentDepotJunctionStop: string
  filteredRows: MasterGridRow[]
  roundIndices: number[]
  viewMode: TripGridViewMode
  headwayMap: Map<string, HeadwayAuditInfo>
  sharedCorridors?: DetailedRouteOverlap[]
  onNavigateToInterline?: () => void
  onStartEditCell: (
    dutyNumber: string,
    roundNumber: number,
    stationKey: 'departure_station_a' | 'departure_station_b',
    currentTime: string,
    stationName: string
  ) => void
}

export const TripGridTable: React.FC<TripGridTableProps> = ({
  currentRoute,
  passport,
  currentDepotName,
  currentDepotJunctionStop,
  filteredRows,
  roundIndices,
  viewMode,
  headwayMap,
  sharedCorridors,
  onNavigateToInterline,
  onStartEditCell
}) => {
  const stationAName = passport.station_a_name || 'ст. А'
  const stationBName = passport.station_b_name || 'ст. Б'

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:shadow-none print:border-none print:p-0 font-sans">
      {/* Офіційна шапка паспорта */}
      <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              КП «Одесміськелектротранс» • Служба Руху
            </span>
            <span className="text-xs text-slate-500 font-bold">
              Період дії: {passport.schedule_period}
            </span>
          </div>
          <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white mt-1">
            Зведена таблиця рейсів маршруту №{currentRoute.number} ({currentRoute.name})
          </h2>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Тип графіку: <strong>{passport.schedule_type}</strong> | Диспетчерський пункт (ДП): <strong>{passport.designated_dp_name}</strong> | Базове депо: <strong>{currentDepotName}</strong>
          </p>
        </div>

        <div className="text-right shrink-0 print:hidden flex items-center gap-2">
          {viewMode === 'HEADWAYS' ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              ⚡ РЕЖИМ КОНТРОЛЮ ІНТЕРВАЛІВ (ХВ)
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ● ЕТАЛОННИЙ РОЗКЛАД ЗАТВЕРДЖЕНО
            </span>
          )}
        </div>
      </div>

      {/* Суміщені зв'язки маршруту (Interline Corridor Banner) */}
      {sharedCorridors && sharedCorridors.length > 0 && (
        <div className="mb-5 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-2xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-purple-950 dark:text-purple-200">
                  Суміщені ділянки та міжмаршрутні зв'язки («Зв'язок» КП «ОМЕТ»):
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                  {sharedCorridors.length} {sharedCorridors.length === 1 ? "зв'язаний маршрут" : "зв'язаних маршрути"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {sharedCorridors.map((c) => (
                  <div
                    key={`corridor_${c.targetRouteId}`}
                    className="inline-flex items-center space-x-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-[11px]"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: c.targetRouteColor || '#9333ea' }}
                    />
                    <span className="font-black text-slate-900 dark:text-white">№{c.targetRouteNumber}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      ({c.sharedStopsCount} спільн. зуп.: {c.startStop} ➔ {c.endStop})
                    </span>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                      h(min)={c.minHeadwayMin}хв
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {onNavigateToInterline && (
            <button
              type="button"
              onClick={onNavigateToInterline}
              tabIndex={0}
              aria-label="Відкрити вкладку «Зв'язок» для похвилинної синхронізації та усунення скупчень"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Аналіз стрічки вузла</span>
            </button>
          )}
        </div>
      )}

      {/* Паспортні показники */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 mb-6 text-center text-xs">
        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Нарядів (N)</div>
          <div className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{passport.duties_count}</div>
        </div>

        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Інтервал (I)</div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{passport.headway_min} хв</div>
        </div>

        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Час обороту (Tоб)</div>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{passport.round_trip_min} хв</div>
        </div>

        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Довжина (L)</div>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{passport.route_length_km} км</div>
        </div>

        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Швидкість (Vсп)</div>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{passport.operating_speed_kmh} км/год</div>
        </div>

        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Вагоно-годин</div>
          <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{passport.total_wagon_hours}</div>
        </div>

        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Вагоно-км</div>
          <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{passport.total_wagon_km}</div>
        </div>

        <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-bold text-slate-400 uppercase">Рейсів / Змін</div>
          <div className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">{passport.total_trips} / {passport.total_shifts}</div>
        </div>
      </div>

      {/* Master Matrix Table */}
      <div 
        className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[70vh]"
        role="region"
        aria-label="Зведена таблиця рейсів"
      >
        <table className="w-full text-[11px] text-left border-collapse font-mono relative">
          <thead className="sticky top-0 z-30 shadow-xs">
            <tr className="bg-slate-900 text-white font-sans font-bold text-center border-b border-slate-700">
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-14 sticky left-0 z-40 bg-slate-900">№ нар.</th>
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-14 sticky left-[56px] z-40 bg-slate-900">Тип</th>
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-20 sticky left-[112px] z-40 bg-slate-900">Депо</th>
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-32 sticky left-[192px] z-40 bg-slate-900">Станція виходу</th>
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-14">Явка</th>
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-14">Вихід депо</th>
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-14">Приб. ДП</th>
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-14">Відхід 1-го</th>

              {/* Round Trip Columns 1..M */}
              {roundIndices.map((rNum) => (
                <th key={rNum} colSpan={2} className="px-2 py-1 border-r border-slate-700 bg-slate-800 text-[10px]">
                  Круг {rNum}
                </th>
              ))}

              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-14">Захід депо</th>
              <th rowSpan={2} className="px-2 py-2 border-r border-slate-700 w-20">Час вагона</th>
              <th colSpan={2} className="px-2 py-1 bg-slate-800 text-[10px]">Робота бригад</th>
            </tr>

            <tr className="bg-slate-800 text-slate-300 font-sans font-semibold text-[10px] text-center border-b border-slate-700">
              {roundIndices.map((rNum) => (
                <React.Fragment key={`sub_${rNum}`}>
                  <th className="px-1 py-1 border-r border-slate-700 font-mono text-[9px] bg-slate-800/80 truncate max-w-[75px]" title={stationAName}>
                    {stationAName.slice(0, 8)}
                  </th>
                  <th className="px-1 py-1 border-r border-slate-700 font-mono text-[9px] bg-slate-800/40 truncate max-w-[75px]" title={stationBName}>
                    {stationBName.slice(0, 8)}
                  </th>
                </React.Fragment>
              ))}
              <th className="px-2 py-1 border-r border-slate-700 font-mono text-[9px]">І зміна</th>
              <th className="px-2 py-1 font-mono text-[9px]">ІІ зміна</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {filteredRows.map((row, idx) => {
              const isSplit = row.duty_type === 'SPLIT'
              const isSingle = row.duty_type === 'SINGLE'
              const isPeak = row.duty_type === 'PEAK'

              const typeBadgeClass = isSplit
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-black'
                : isPeak
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black'
                : isSingle
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'

              const typeCode = isSplit ? 'РОЗ' : isPeak ? 'ПІК' : isSingle ? 'ОД' : 'ДВ'
              const stickyBg = idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800'

              return (
                <tr 
                  key={row.duty_number}
                  className={`hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors ${
                    idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/30'
                  }`}
                >
                  {/* Duty Number (Sticky Col 1) */}
                  <td className={`px-2 py-2 text-center font-black font-sans text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800 sticky left-0 z-20 ${stickyBg}`}>
                    {row.duty_number}
                  </td>

                  {/* Duty Type Badge (Sticky Col 2) */}
                  <td className={`px-1.5 py-2 text-center border-r border-slate-200 dark:border-slate-800 sticky left-[56px] z-20 ${stickyBg}`}>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${typeBadgeClass}`}>
                      {typeCode}
                    </span>
                  </td>

                  {/* Depot Badge & Zero Run (Sticky Col 3) */}
                  <td className={`px-2 py-2 text-center border-r border-slate-200 dark:border-slate-800 sticky left-[112px] z-20 ${stickyBg}`}>
                    <div className="flex flex-col items-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        row.depot_name?.includes('ТД-1')
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : row.depot_name?.includes('ТД-2')
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {row.depot_name || currentDepotName}
                      </span>
                      {row.zero_run_min !== undefined && row.zero_run_min > 0 && (
                        <span className="text-[8px] text-slate-400 font-mono mt-0.5">
                          {row.zero_run_min}хв ({row.zero_run_km || 0}км)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Start Location (Sticky Col 4) */}
                  <td className={`px-2 py-2 font-sans text-[10px] font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 truncate max-w-[130px] sticky left-[192px] z-20 ${stickyBg}`}>
                    {row.start_location}
                  </td>

                  {/* Driver Arrival Time */}
                  <td className="px-1.5 py-2 text-center text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                    {row.driver_arrival_time}
                  </td>

                  {/* Pullout Time */}
                  <td className="px-1.5 py-2 text-center font-bold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">
                    {row.pullout_time}
                  </td>

                  {/* DP Arrival Time */}
                  <td className="px-1.5 py-2 text-center text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                    {row.dp_arrival_time}
                  </td>

                  {/* 1st Departure Time */}
                  <td className="px-1.5 py-2 text-center font-black text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800">
                    {row.first_departure_time}
                  </td>

                  {/* Round Trips */}
                  {roundIndices.map((rNum) => {
                    const roundData = row.rounds?.find((r) => r.round_number === rNum)
                    if (!roundData) {
                      return (
                        <React.Fragment key={`cell_${rNum}`}>
                          <td className="px-1 py-1.5 text-center text-slate-300 dark:text-slate-700 border-r border-slate-200 dark:border-slate-800">—</td>
                          <td className="px-1 py-1.5 text-center text-slate-300 dark:text-slate-700 border-r border-slate-200 dark:border-slate-800">—</td>
                        </React.Fragment>
                      )
                    }

                    const hasLunch = roundData.note && roundData.note.includes('О-')
                    const hasRotation = roundData.note && roundData.note.includes('РОТ')
                    const hasShiftChange = roundData.note && roundData.note.includes('ЗМ')

                    // Headway info for Station A and B
                    const headwayA = headwayMap.get(`${rNum}_departure_station_a_${row.duty_number}`)
                    const headwayB = headwayMap.get(`${rNum}_departure_station_b_${row.duty_number}`)

                    return (
                      <React.Fragment key={`cell_${rNum}`}>
                        {/* Departure Station A */}
                        <td 
                          onClick={() => {
                            if (roundData.departure_station_a && roundData.departure_station_a !== '—') {
                              onStartEditCell(row.duty_number, rNum, 'departure_station_a', roundData.departure_station_a, stationAName)
                            }
                          }}
                          className={`px-1 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors group relative ${
                            hasLunch ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-black' : ''
                          }`}
                          title="Клікніть для редагування часу рейсу"
                          tabIndex={0}
                          aria-label={`Редагувати відправлення наряд ${row.duty_number}, круг ${rNum}, ${stationAName}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              onStartEditCell(row.duty_number, rNum, 'departure_station_a', roundData.departure_station_a, stationAName)
                            }
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex items-center space-x-0.5">
                              <span>{roundData.departure_station_a}</span>
                              <Edit3 className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Headway mode badge */}
                            {viewMode === 'HEADWAYS' && headwayA && (
                              <div className="mt-0.5">
                                {headwayA.status === 'CLUMPING' ? (
                                  <span className="px-1 py-0.2 rounded text-[8px] bg-rose-600 text-white font-mono font-black" title="Скупчення (паровоз) <= 2хв">
                                    ⚠️ {headwayA.headwayMin}хв
                                  </span>
                                ) : headwayA.status === 'GAP' ? (
                                  <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500 text-white font-mono font-black" title="Розрив інтервалу">
                                    ⚠️ {headwayA.headwayMin}хв
                                  </span>
                                ) : (
                                  <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold">
                                    {headwayA.headwayMin}хв
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Operational tag notes */}
                            {roundData.note && (
                              <Tooltip
                                content={
                                  roundData.lunch_break ? (
                                    <div className="space-y-0.5">
                                      <div className="font-black">Обід на ДП ({roundData.lunch_break.location})</div>
                                      <div>{roundData.lunch_break.start} — {roundData.lunch_break.end} ({roundData.lunch_break.duration_min} хв)</div>
                                      <div>Явка водія: {row.driver_arrival_time}</div>
                                      {roundData.lunch_break.is_overtime && (
                                        <div className="text-amber-300">Понаднормово: +{roundData.lunch_break.overtime_min} хв (додано до зміни, {roundData.lunch_break.is_paid_break ? 'оплачується' : 'неоплачувано'})</div>
                                      )}
                                    </div>
                                  ) : hasRotation ? (
                                    <div>Ротація вагонів розривного наряду — виключно на Диспетчерському пункті ({stationAName}).</div>
                                  ) : hasShiftChange ? (
                                    <div>Перезмінка водіїв на Диспетчерському пункті ({stationAName}), прибуття {roundData.arrival_station_a}.</div>
                                  ) : (
                                    <div>{roundData.note}</div>
                                  )
                                }
                              >
                                <span className={`text-[8px] px-1 rounded font-sans leading-tight mt-0.5 cursor-help ${
                                  hasLunch ? 'bg-amber-500 text-white font-black' : hasRotation ? 'bg-purple-600 text-white font-black' : hasShiftChange ? 'bg-blue-600 text-white font-black' : 'bg-slate-600 text-white'
                                }`}>
                                  {roundData.note.replace(/[\[\]]/g, '')}
                                </span>
                              </Tooltip>
                            )}
                          </div>
                        </td>

                        {/* Departure Station B */}
                        <td 
                          onClick={() => {
                            if (roundData.departure_station_b && roundData.departure_station_b !== '—') {
                              onStartEditCell(row.duty_number, rNum, 'departure_station_b', roundData.departure_station_b, stationBName)
                            }
                          }}
                          className="px-1 py-1.5 text-center border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors group relative"
                          title="Клікніть для редагування часу рейсу"
                          tabIndex={0}
                          aria-label={`Редагувати відправлення наряд ${row.duty_number}, круг ${rNum}, ${stationBName}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              onStartEditCell(row.duty_number, rNum, 'departure_station_b', roundData.departure_station_b, stationBName)
                            }
                          }}
                        >
                          <div className="flex flex-col items-center">
                            <div className="flex items-center space-x-0.5">
                              <span>{roundData.departure_station_b}</span>
                              <Edit3 className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            {/* Headway mode badge */}
                            {viewMode === 'HEADWAYS' && headwayB && (
                              <div className="mt-0.5">
                                {headwayB.status === 'CLUMPING' ? (
                                  <span className="px-1 py-0.2 rounded text-[8px] bg-rose-600 text-white font-mono font-black" title="Скупчення (паровоз) <= 2хв">
                                    ⚠️ {headwayB.headwayMin}хв
                                  </span>
                                ) : headwayB.status === 'GAP' ? (
                                  <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500 text-white font-mono font-black" title="Розрив інтервалу">
                                    ⚠️ {headwayB.headwayMin}хв
                                  </span>
                                ) : (
                                  <span className="px-1 py-0.2 rounded text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold">
                                    {headwayB.headwayMin}хв
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </React.Fragment>
                    )
                  })}

                  {/* Pullin Time */}
                  <td className="px-1.5 py-2 text-center font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                    {row.pullin_time}
                  </td>

                  {/* Total Work Hours */}
                  <td className="px-2 py-2 text-center font-bold font-sans text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                    {row.total_work_hours_str}
                  </td>

                  {/* Shift 1 Hours */}
                  <td className="px-2 py-2 text-center font-sans text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                    {row.shift1_hours_str}
                  </td>

                  {/* Shift 2 Hours */}
                  <td className="px-2 py-2 text-center font-sans text-slate-700 dark:text-slate-300">
                    {row.shift2_hours_str}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Панель умовних позначень (LegendBar) */}
      <TripGridLegendBar />

      <div className="text-xs">
        {/* Офіційні підписи для друку */}
        <div className="hidden print:flex justify-between items-center mt-12 pt-6 border-t border-slate-400 text-xs font-serif">
          <div>
            <p>Розклад склав: _____________________ / Інженер Служби Руху /</p>
          </div>
          <div>
            <p>Затверджую: _____________________ / Начальник Служби Руху КП «ОМЕТ» /</p>
          </div>
        </div>
      </div>
    </div>
  )
}
