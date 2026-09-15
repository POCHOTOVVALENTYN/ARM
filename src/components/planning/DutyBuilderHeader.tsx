import React, { useMemo } from 'react'
import {
  Settings2,
  FolderOpen,
  Save,
  CheckCircle2,
  Radio,
  X
} from 'lucide-react'
import { CalculatedSummary } from '../../hooks/useDutyParametersBuilderLogic'
import { ODESSA_SHARED_CORRIDORS } from '../../constants/odessaCorridors'

interface DutyBuilderHeaderProps {
  currentStep: 1 | 2 | 3
  dutiesCount: number
  draftsCount: number
  lastCalculatedSummary: CalculatedSummary | null
  onStepChange: (step: 1 | 2 | 3) => void
  onOpenDraftsList: () => void
  onOpenSaveDraft: () => void
  onDismissCalculatedSummary?: () => void
  onNavigateToInterline?: () => void
}

export const DutyBuilderHeader: React.FC<DutyBuilderHeaderProps> = ({
  currentStep,
  dutiesCount,
  draftsCount,
  lastCalculatedSummary,
  onStepChange,
  onOpenDraftsList,
  onOpenSaveDraft,
  onDismissCalculatedSummary,
  onNavigateToInterline
}) => {
  // Визначаємо, чи має маршрут спільні коридори з іншими маршрутами КП «ОМЕТ»
  const sharedCorridorInfo = useMemo(() => {
    if (!lastCalculatedSummary) return null
    const rNum = String(lastCalculatedSummary.routeNumber).trim()
    const isTram = !rNum.startsWith('Tr')
    const cleanNum = rNum.replace('Tr', '').trim()
    const targetType = isTram ? 'tram' : 'trolleybus'

    const matched = ODESSA_SHARED_CORRIDORS.find(c => 
      c.transportType === targetType && c.routeNumbers.includes(cleanNum)
    )
    if (!matched) return null

    const others = matched.routeNumbers.filter(num => num !== cleanNum)
    if (others.length === 0) return null

    return {
      corridorName: matched.name,
      otherRoutes: others.map(o => (isTram ? `Трамвай №${o}` : `Тролейбус №${o}`)),
      minHeadwayMin: matched.minHeadwayMin
    }
  }, [lastCalculatedSummary])

  return (
    <div className="space-y-4">
      {/* 1. Верхній банер покрокового майстра */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
            <Settings2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <span>Конструктор нарядів</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-800">
                СЛУЖБА РУХУ
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Сценарне формування графіка: вибір параметрів ➔ мікро-коригування нарядів ➔ валідація КЗпП та розрахунок
            </p>
          </div>
        </div>

        {/* Єдиний горизонтальний блок: перемикач кроків + дії з шаблонами.
            Усі 5 елементів мають однакову висоту (h-9), однаковий радіус
            (rounded-xl) та однаковий типографічний стиль (text-xs font-black),
            щоб виглядати як один синхронізований інструментальний блок. */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => onStepChange(1)}
            className={`h-9 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs font-black whitespace-nowrap ${
              currentStep === 1
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>1. Макро-параметри</span>
          </button>
          <button
            type="button"
            onClick={() => onStepChange(2)}
            className={`h-9 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs font-black whitespace-nowrap ${
              currentStep === 2
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>2. Наряди ({dutiesCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onStepChange(3)}
            className={`h-9 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs font-black whitespace-nowrap ${
              currentStep === 3
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>3. Валідація КЗпП</span>
          </button>

          <div className="w-px self-stretch bg-slate-300 dark:bg-slate-600 mx-0.5" aria-hidden="true" />

          <button
            type="button"
            onClick={onOpenDraftsList}
            className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs font-black whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
            title="Переглянути та завантажити збережені шаблони нарядів"
            aria-label={`Шаблони нарядів (${draftsCount})`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Шаблони нарядів ({draftsCount})</span>
          </button>

          <button
            type="button"
            onClick={onOpenSaveDraft}
            className="h-9 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-xs font-black whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
            title="Зберегти поточну конфігурацію як шаблон наряду"
            aria-label="Зберегти шаблон наряду"
          >
            <Save className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Зберегти шаблон наряду</span>
          </button>
        </div>
      </div>

      {/* 2. Інформаційний банер успішного розрахунку з можливістю закриття та автозникненням */}
      {lastCalculatedSummary && (
        <div 
          className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 p-4 rounded-3xl text-emerald-900 dark:text-emerald-200 shadow-2xs animate-fade-in flex items-center justify-between gap-3 transition-all"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider">
                  Розклад маршруту №{lastCalculatedSummary.routeNumber} успішно розраховано та зафіксовано в БД
                </h3>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                  ({lastCalculatedSummary.calculatedAt})
                </span>
              </div>
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mt-0.5">
                Випуск: <strong>{lastCalculatedSummary.dutiesCount} нарядів</strong> | Інтервал руху: <strong>{lastCalculatedSummary.headwayMin} хв</strong> | Час обороту: <strong>{lastCalculatedSummary.roundTripMin} хв</strong> | Всього рейсів: <strong>{lastCalculatedSummary.totalTrips}</strong> | Потреба змін: <strong>{lastCalculatedSummary.totalShifts}</strong>.
              </p>
            </div>
          </div>

          {onDismissCalculatedSummary && (
            <button
              type="button"
              onClick={onDismissCalculatedSummary}
              className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Закрити повідомлення"
              aria-label="Закрити повідомлення про успішний розрахунок"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 3. НАГАДУВАННЯ: Необхідність синхронізації інтервалів для маршрутів зі спільними зупинками */}
      {lastCalculatedSummary && sharedCorridorInfo && (
        <div 
          className="bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 p-4 rounded-3xl text-purple-900 dark:text-purple-200 shadow-2xs animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
          role="region"
          aria-label="Нагадування про синхронізацію інтервалів"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-purple-600/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                  Рекомендація Служби Руху
                </span>
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 dark:text-purple-100">
                  {sharedCorridorInfo.corridorName}
                </h4>
              </div>
              <p className="text-xs font-medium text-purple-900 dark:text-purple-200 mt-1">
                Маршрут №{lastCalculatedSummary.routeNumber} має спільні ділянки з <strong>{sharedCorridorInfo.otherRoutes.join(', ')}</strong>. Необхідно провести координацію виходів та інтервалів для усунення «паровозиків».
              </p>
            </div>
          </div>

          {onNavigateToInterline && (
            <button
              type="button"
              onClick={onNavigateToInterline}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Перейти до «Зв'язок»</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default DutyBuilderHeader
