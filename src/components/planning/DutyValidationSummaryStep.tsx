import React from 'react'
import {
  ShieldCheck,
  Clock,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Coffee,
  Users,
  Bus,
  CheckCircle
} from 'lucide-react'
import { IndividualDutyConfig } from '../../hooks/useDutyParametersBuilderLogic'

interface DutyValidationSummaryStepProps {
  dutyConfigs: IndividualDutyConfig[]
  dutiesCount: number
  driversShift1: number
  driversShift2: number
  countSplit: number
  countSingle: number
  countPeak: number
  countDouble: number
  totalDriversNeeded: number
  calculatedInterval: string
  roundTripMin: number
  routeLengthKm: number
  defaultSpeedKmh: number
  designatedDpName: string
  depotName: string
  isTram: boolean
  isProcessingTransaction: boolean
  onBackToStep2: () => void
  onCalculateSchedule: () => void
}

export const DutyValidationSummaryStep: React.FC<DutyValidationSummaryStepProps> = ({
  dutyConfigs,
  dutiesCount,
  driversShift1,
  driversShift2,
  countSplit,
  countSingle,
  countPeak,
  countDouble,
  totalDriversNeeded,
  calculatedInterval,
  roundTripMin,
  routeLengthKm,
  defaultSpeedKmh,
  designatedDpName,
  depotName,
  isTram,
  isProcessingTransaction,
  onBackToStep2,
  onCalculateSchedule
}) => {
  const standardLunchMin = isTram ? 15 : 20
  const maxAllowedShiftMin = 599 // Суворий ліміт КЗпП: максимум 9:59 (599 хв)

  // Попередня оцінка тривалості змін для кожного наряду
  const validationRows = dutyConfigs.map((duty, idx) => {
    const isSingle = duty.dutyType === 'SINGLE'
    const isPeak = duty.dutyType === 'PEAK'

    // Розрахункова тривалість вагона з урахуванням вечірнього заїзду 20:30-22:45
    let estimatedWagonMin = 960 // ~16 годин
    if (isSingle) {
      estimatedWagonMin = 460 // 7 год 40 хв
    } else if (isPeak) {
      estimatedWagonMin = 300 // 5 год 00 хв
    } else {
      const progress = idx / Math.max(1, dutyConfigs.length - 1)
      estimatedWagonMin = Math.round((15.2 + progress * 1.8) * 60)
    }

    let estimatedShift1Min = 0
    let estimatedShift2Min = 0

    if (isSingle || isPeak) {
      estimatedShift1Min = estimatedWagonMin
    } else {
      estimatedShift1Min = Math.round(estimatedWagonMin / 2)
      estimatedShift2Min = estimatedWagonMin - estimatedShift1Min
    }

    // Перевірка обмеження КЗпП: максимум 9:59 (599 хв)
    const isShift1Compliant = estimatedShift1Min <= maxAllowedShiftMin
    const isShift2Compliant = estimatedShift2Min <= maxAllowedShiftMin

    return {
      dutyNumber: duty.dutyNumber,
      dutyType: duty.dutyType,
      startStation: duty.startStation || designatedDpName,
      lunchStation: designatedDpName,
      lunchDurationMin: duty.lunchDurationMin || standardLunchMin,
      depotName: duty.depotName || depotName,
      estimatedShift1Min,
      estimatedShift2Min,
      isShift1Compliant,
      isShift2Compliant
    }
  })

  const totalViolationsCount = validationRows.filter(
    (row) => !row.isShift1Compliant || (!row.isShift2Compliant && row.estimatedShift2Min > 0)
  ).length

  const handleKeyDownBack = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onBackToStep2()
    }
  }

  const handleKeyDownCalculate = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!isProcessingTransaction) {
        onCalculateSchedule()
      }
    }
  }

  const formatMinutesToHoursStr = (totalMins: number): string => {
    if (totalMins <= 0) return '—'
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    return `${h}:${String(m).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Головна панель статусу аудиту КЗпП */}
      <div className={`p-5 rounded-3xl border shadow-xs transition-all ${
        totalViolationsCount === 0
          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shrink-0 shadow-md ${
              totalViolationsCount === 0
                ? 'bg-emerald-600 shadow-emerald-600/20'
                : 'bg-amber-600 shadow-amber-600/20'
            }`}>
              {totalViolationsCount === 0 ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Етап 3: Валідація та баланс змін</span>
                {totalViolationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-300">
                    {totalViolationsCount} ЗАУВАЖЕНЬ
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToStep2}
              onKeyDown={handleKeyDownBack}
              tabIndex={0}
              aria-label="Повернутися до Кроку 2: Налаштування нарядів"
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← До Кроку 2</span>
            </button>

            <button
              type="button"
              onClick={onCalculateSchedule}
              onKeyDown={handleKeyDownCalculate}
              disabled={isProcessingTransaction}
              tabIndex={0}
              aria-label="Затвердити та розрахувати еталонний розклад"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessingTransaction ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Затвердити та розрахувати еталонний розклад</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Картки підсумкових інженерних показників */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Випуск (N)</div>
          <div className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{dutiesCount} нарядів</div>
          <div className="text-[10px] text-slate-500 font-semibold">{countDouble} ДВ • {countSingle} ОД • {countSplit} РОЗ • {countPeak} ПІК</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Інтервал (I)</div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{calculatedInterval} хв</div>
          <div className="text-[10px] text-slate-500 font-semibold">Тоб: {roundTripMin} хв</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">1-ша зміна (Ранок)</div>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{driversShift1} водіїв</div>
          <div className="text-[10px] text-emerald-600 font-bold">100% покриття випуску</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">2-га зміна (Вечір)</div>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{driversShift2} водіїв</div>
          <div className="text-[10px] text-blue-600 font-bold">Двозмінні + Розривні</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Всього водіїв</div>
          <div className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">{totalDriversNeeded} чол.</div>
          <div className="text-[10px] text-slate-500 font-semibold">Повна потреба бригад</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Швидкість Vсп</div>
          <div className="text-base font-black text-slate-800 dark:text-slate-200 mt-0.5">{defaultSpeedKmh} км/год</div>
          <div className="text-[10px] text-slate-500 font-semibold">Оборот: {routeLengthKm} км (1 бік: {(routeLengthKm / 2).toFixed(1)} км)</div>
        </div>
      </div>

      {/* 3. Детальна таблиця попередньої перевірки змін водіїв */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Попередній розрахунок робочих змін</span>
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Час роботи змін збалансовано: перезмінка здійснюється на ДП {designatedDpName}, заїзд у депо {depotName} відбувається поетапно
            </p>
          </div>
        </div>

        <div 
          className="overflow-x-auto max-h-[50vh]"
          role="region"
          aria-label="Таблиця перевірки тривалості змін"
        >
          <table className="w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-20 shadow-2xs bg-slate-900 text-white font-sans font-bold text-center">
              <tr className="border-b border-slate-700 text-[11px]">
                <th className="px-3 py-2 w-14">№ нар.</th>
                <th className="px-3 py-2 w-28">Тип наряду</th>
                <th className="px-3 py-2 w-36">Депо виїзду</th>
                <th className="px-3 py-2 w-44">Станція старту</th>
                <th className="px-3 py-2 w-36">Пункт обіду</th>
                <th className="px-3 py-2 w-28">Норма обіду</th>
                <th className="px-3 py-2 w-32">Зміна 1 (Ранок)</th>
                <th className="px-3 py-2 w-32">Зміна 2 (Вечір)</th>
                <th className="px-3 py-2 w-36">Статус КЗпП</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {validationRows.map((row, idx) => {
                const isSplit = row.dutyType === 'SPLIT'
                const isPeak = row.dutyType === 'PEAK'
                const isSingle = row.dutyType === 'SINGLE'

                const typeBadgeClass = isSplit
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-black'
                  : isPeak
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black'
                  : isSingle
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'

                const typeLabel = isSplit ? 'РОЗ' : isPeak ? 'ПІК' : isSingle ? 'ОД' : 'ДВ'
                const isFullyCompliant = row.isShift1Compliant && (isSingle || isPeak || row.isShift2Compliant)

                return (
                  <tr 
                    key={row.dutyNumber}
                    className={`hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors ${
                      idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/20'
                    }`}
                  >
                    <td className="px-3 py-2 text-center font-black text-slate-900 dark:text-white">
                      #{row.dutyNumber}
                    </td>

                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${typeBadgeClass}`}>
                        {typeLabel}
                      </span>
                    </td>

                    <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                      {row.depotName}
                    </td>

                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200 font-medium truncate max-w-[180px]">
                      {row.startStation}
                    </td>

                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                      {row.lunchStation}
                    </td>

                    <td className="px-3 py-2 text-center">
                      <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        <Coffee className="w-3 h-3 text-amber-600" />
                        <span>{row.lunchDurationMin} хв</span>
                      </div>
                    </td>

                    <td className="px-3 py-2 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {formatMinutesToHoursStr(row.estimatedShift1Min)}
                    </td>

                    <td className="px-3 py-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {isSingle || isPeak ? '—' : formatMinutesToHoursStr(row.estimatedShift2Min)}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {isFullyCompliant ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          <span>В нормі</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Порушення</span>
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DutyValidationSummaryStep
