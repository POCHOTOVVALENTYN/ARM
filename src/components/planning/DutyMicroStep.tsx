import React from 'react'
import {
  Clock,
  ArrowLeft,
  Copy,
  ArrowUp,
  ArrowDown,
  Coffee,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { IndividualDutyConfig } from '../../hooks/useDutyParametersBuilderLogic'

interface DutyMicroStepProps {
  dutyConfigs: IndividualDutyConfig[]
  dutiesCount: number
  driversShift1: number
  driversShift2: number
  countSplit: number
  totalDriversNeeded: number
  depotName: string
  depotJunctionStop: string
  designatedDpName: string
  oppositeTerminusName: string
  availableRouteStops: string[]
  isTram: boolean
  isProcessingTransaction: boolean
  onMoveDutyUp: (idx: number) => void
  onMoveDutyDown: (idx: number) => void
  onUpdateDutyField: <K extends keyof IndividualDutyConfig>(
    index: number,
    field: K,
    value: IndividualDutyConfig[K]
  ) => void
  onApplyFirstDutyToAll: () => void
  onBackToStep1: () => void
  onProceedToStep3: () => void
  onCalculateSchedule?: () => void
}

export const DutyMicroStep: React.FC<DutyMicroStepProps> = ({
  dutyConfigs,
  dutiesCount,
  driversShift1,
  driversShift2,
  countSplit,
  totalDriversNeeded,
  depotName,
  depotJunctionStop,
  designatedDpName,
  oppositeTerminusName,
  availableRouteStops,
  isTram,
  isProcessingTransaction,
  onMoveDutyUp,
  onMoveDutyDown,
  onUpdateDutyField,
  onApplyFirstDutyToAll,
  onBackToStep1,
  onProceedToStep3,
  onCalculateSchedule
}) => {
  return (
    <div className="space-y-6 font-sans">
      {/* 1. Сводна панель балансу водіїв та рухомого складу */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shrink-0">
            {dutiesCount}
          </div>
          <div>
            <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Випуск на лінію
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {dutiesCount} нарядів (вагонів)
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
            {driversShift1}
          </div>
          <div>
            <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
              1-а зміна (Ранок)
            </div>
            <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">
              {driversShift1} водіїв
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
            {driversShift2}
          </div>
          <div>
            <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
              2-а зміна (Вечір)
            </div>
            <div className="text-sm font-black text-blue-700 dark:text-blue-400">
              {driversShift2} водіїв
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black shrink-0">
            {totalDriversNeeded}
          </div>
          <div>
            <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Загальна потреба
            </div>
            <div className="text-sm font-black text-purple-700 dark:text-purple-400">
              {totalDriversNeeded} водіїв / добу
            </div>
          </div>
        </div>
      </div>

      {countSplit > 0 && (
        <div className="bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-purple-900 dark:text-purple-200">
          <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            У графіку є <strong>{countSplit} розривних нарядів (РОЗ)</strong>: кожному призначено 2 одиниці рухомого складу. Ротація вагонів завжди відбувається на Диспетчерському пункті — це фіксоване правило, не потребує вибору вузла.
          </span>
        </div>
      )}

      {/* 2. Детальна таблиця індивідуальних нарядів */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Етап 2: Конструктор параметрів нарядів ({dutiesCount})</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Змінюйте черговість виходу на лінію (кнопки ↑/↓), типи нарядів, станції старту, депо виїзду та ротацію
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onApplyFirstDutyToAll}
              className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
              title="Скопіювати станцію старту та пункт обіду першого наряду на всі інші"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>Застосувати параметри Наряду #1 до всіх</span>
            </button>

            <button
              type="button"
              onClick={onBackToStep1}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Змінити макро-параметри</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-sans font-bold text-center border-b border-slate-700">
                <th className="px-2 py-2.5 w-14">Порядок</th>
                <th className="px-3 py-2.5 w-14">№ нар.</th>
                <th className="px-3 py-2.5 w-36">Тип наряду</th>
                <th className="px-3 py-2.5 w-40">Депо виїзду 🏢</th>
                <th className="px-3 py-2.5 w-44">Станція початку роботи</th>
                <th className="px-3 py-2.5 w-40">Пункт обіду</th>
                <th className="px-2 py-2.5 w-24">Обід (хв)</th>
                <th className="px-3 py-2.5 w-48">Ротація вагонів (SPLIT)</th>
                <th className="px-3 py-2.5 w-44">Бортовий № (Рухомий склад)</th>
                <th className="px-3 py-2.5">Закріплений водій</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {dutyConfigs.map((duty, idx) => {
                const isSplit = duty.dutyType === 'SPLIT'
                const isPeak = duty.dutyType === 'PEAK'
                const isSingle = duty.dutyType === 'SINGLE'

                return (
                  <tr 
                    key={duty.dutyNumber}
                    className={`hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors ${
                      idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-800/20'
                    }`}
                  >
                    {/* Кнопки переміщення рядка вгору/вниз */}
                    <td className="px-1.5 py-2 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => onMoveDutyUp(idx)}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-600 dark:text-slate-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Перемістити наряд вгору"
                          aria-label={`Перемістити наряд #${duty.dutyNumber} вгору`}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveDutyDown(idx)}
                          disabled={idx === dutyConfigs.length - 1}
                          className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-600 dark:text-slate-400 hover:text-indigo-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                          title="Перемістити наряд вниз"
                          aria-label={`Перемістити наряд #${duty.dutyNumber} вниз`}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Номер наряду */}
                    <td className="px-3 py-2.5 text-center font-black text-slate-900 dark:text-white">
                      #{duty.dutyNumber}
                    </td>

                    {/* Тип наряду */}
                    <td className="px-2 py-2">
                      <select
                        value={duty.dutyType}
                        onChange={(e) => onUpdateDutyField(idx, 'dutyType', e.target.value as IndividualDutyConfig['dutyType'])}
                        className={`w-full px-2 py-1 rounded-lg text-xs font-black border cursor-pointer ${
                          isSplit
                            ? 'bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700'
                            : isPeak
                            ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                            : isSingle
                            ? 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                        }`}
                      >
                        <option value="DOUBLE">Двозмінний (ДВ)</option>
                        <option value="SINGLE">Однозмінний (ОД)</option>
                        <option value="SPLIT">Розривний з ТО (РОЗ)</option>
                        <option value="PEAK">Піковий (ПІК)</option>
                      </select>
                    </td>

                    {/* Депо виїзду (Мультидепо) */}
                    <td className="px-2 py-2">
                      {isTram ? (
                        <select
                          value={duty.depotName || depotName}
                          onChange={(e) => onUpdateDutyField(idx, 'depotName', e.target.value)}
                          className="w-full px-2 py-1 rounded-lg text-xs font-black border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                          aria-label={`Вибір депо виїзду для наряду #${duty.dutyNumber}`}
                        >
                          <option value="ТД-1">ТД-1 (Водопровідна)</option>
                          <option value="ТД-2">ТД-2 (Слобідка)</option>
                        </select>
                      ) : (
                        <div className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-[10px] text-slate-600 dark:text-slate-400">
                          <span>ТРД-1 (вул. Інглезі)</span>
                        </div>
                      )}
                    </td>

                    {/* Станція початку роботи — ЛИШЕ ДП або протилежна кінцева
                        станція. Довільна проміжна зупинка операційно
                        неможлива як точка виходу наряду на лінію. */}
                    <td className="px-2 py-2">
                      <select
                        value={duty.startStation === oppositeTerminusName ? oppositeTerminusName : designatedDpName}
                        onChange={(e) => onUpdateDutyField(idx, 'startStation', e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                        aria-label={`Станція початку роботи для наряду #${duty.dutyNumber}`}
                      >
                        <option value={designatedDpName}>ДП: {designatedDpName}</option>
                        <option value={oppositeTerminusName}>Кінцева Б: {oppositeTerminusName}</option>
                      </select>
                    </td>

                    {/* Пункт обіду — ЗАВЖДИ Диспетчерський пункт (ДП), не редагується.
                        Алгоритм надає обід виключно в момент прибуття на ДП
                        (transit_rules.py / transitRules.ts), тому довільна
                        точка обіду per-наряд суперечила б розрахунку. */}
                    <td className="px-2 py-2">
                      <div
                        className="w-full px-2 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-black text-amber-900 dark:text-amber-300 text-center truncate"
                        title="Обід завжди надається на Диспетчерському пункті — це обов'язкове правило, не редагується"
                      >
                        ДП ({designatedDpName})
                      </div>
                    </td>

                    {/* Тривалість обіду */}
                    <td className="px-2 py-2 text-center">
                      <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 px-2 py-1 rounded-lg text-amber-900 dark:text-amber-300 font-black">
                        <Coffee className="w-3 h-3 text-amber-600" />
                        <span>{duty.lunchDurationMin} хв</span>
                      </div>
                    </td>

                    {/* Ротація вагонів SPLIT — ЗАВЖДИ на Диспетчерському пункті (ДП),
                        ніколи на проміжному вузлі примикання лінії. Раніше тут був
                        випадаючий список зупинок — прибрано, бо алгоритм більше не
                        приймає інше місце ротації (див. transit_rules.py). */}
                    <td className="px-2 py-2">
                      {isSplit ? (
                        <div
                          className="w-full px-2 py-1 bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-black text-purple-900 dark:text-purple-300 text-center"
                          title="Ротація вагонів розривного наряду відбувається виключно на Диспетчерському пункті — це обов'язкове правило, не редагується"
                        >
                          ДП ({designatedDpName})
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-center block">—</span>
                      )}
                    </td>

                    {/* Бортовий номер (для РОЗ: 2 вагони) */}
                    <td className="px-2 py-2">
                      {isSplit ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 w-7 shrink-0">Зм 1:</span>
                            <input
                              type="text"
                              value={duty.assignedVehicleNum || ''}
                              placeholder="Вагон 1"
                              onChange={(e) => onUpdateDutyField(idx, 'assignedVehicleNum', e.target.value)}
                              className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 text-center"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 w-7 shrink-0">Зм 2:</span>
                            <input
                              type="text"
                              value={duty.assignedVehicleNum2 || ''}
                              placeholder="Вагон 2"
                              onChange={(e) => onUpdateDutyField(idx, 'assignedVehicleNum2', e.target.value)}
                              className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded text-xs font-mono font-bold text-slate-800 dark:text-slate-200 text-center"
                            />
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={duty.assignedVehicleNum || ''}
                          onChange={(e) => onUpdateDutyField(idx, 'assignedVehicleNum', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 text-center"
                        />
                      )}
                    </td>

                    {/* Закріплений водій (для РОЗ: водії змін) */}
                    <td className="px-2 py-2">
                      {isSplit ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Водій зм. 1"
                            value={duty.assignedDriverName || ''}
                            onChange={(e) => onUpdateDutyField(idx, 'assignedDriverName', e.target.value)}
                            className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-200"
                          />
                          <input
                            type="text"
                            placeholder="Водій зм. 2"
                            value={duty.assignedDriverName2 || ''}
                            onChange={(e) => onUpdateDutyField(idx, 'assignedDriverName2', e.target.value)}
                            className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={duty.assignedDriverName || ''}
                          onChange={(e) => onUpdateDutyField(idx, 'assignedDriverName', e.target.value)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200"
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Нижня панель дій розрахунку */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Параметри зберігаються в системі та передаються у розрахункове математичне ядро ОМЕТ.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onProceedToStep3}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center space-x-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Перейти до Кроку 3: Валідація КЗпП та баланс змін</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
