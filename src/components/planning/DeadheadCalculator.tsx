import React from 'react'
import { Sliders, Sparkles, CheckCircle2 } from 'lucide-react'
import { SingleCalculationResult } from '../../types/deadhead'

interface DeadheadCalculatorProps {
  calcDepotId: string
  calcTerminal: string
  calcType: string
  calcResult: SingleCalculationResult | null
  isCalculating: boolean
  terminalOptions: string[]
  onDepotChange: (id: string) => void
  onTerminalChange: (term: string) => void
  onTypeChange: (type: string) => void
  onCalculate: () => void
}

export const DeadheadCalculator: React.FC<DeadheadCalculatorProps> = ({
  calcDepotId,
  calcTerminal,
  calcType,
  calcResult,
  isCalculating,
  terminalOptions,
  onDepotChange,
  onTerminalChange,
  onTypeChange,
  onCalculate
}) => {
  const handleDepotSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    onDepotChange(val)
    if (val === 'depot_3') {
      onTypeChange('TROLLEYBUS')
    } else {
      onTypeChange('TRAM')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans" role="region" aria-label="Калькулятор нульового рейсу">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <span>Параметри нульового рейсу</span>
        </h3>

        <div>
          <label htmlFor="calc-depot-select" className="block text-xs font-semibold text-slate-400 mb-1">
            Виберіть депо відправлення/прибуття:
          </label>
          <select
            id="calc-depot-select"
            value={calcDepotId}
            onChange={handleDepotSelect}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            aria-label="Депо відправлення або прибуття"
          >
            <option value="depot_1">ТД-1: Трамвайне депо №1 (вул. Водопровідна, 1)</option>
            <option value="depot_2">ТД-2: Трамвайне депо №2 (вул. Академіка Воробйова, 33)</option>
            <option value="depot_3">ТрД: Тролейбусне депо №1 (вул. Інглезі, 17)</option>
          </select>
        </div>

        <div>
          <label htmlFor="calc-terminal-select" className="block text-xs font-semibold text-slate-400 mb-1">
            Виберіть кінцевий пункт Одеси:
          </label>
          <select
            id="calc-terminal-select"
            value={calcTerminal}
            onChange={(e) => onTerminalChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            aria-label="Кінцевий пункт"
          >
            {terminalOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400 mb-1">
            Тип рухомого складу:
          </span>
          <div className="flex items-center gap-3" role="radiogroup" aria-label="Тип транспорту для розрахунку">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="transport_type_calc"
                value="TRAM"
                checked={calcType === 'TRAM'}
                onChange={() => onTypeChange('TRAM')}
                disabled={calcDepotId === 'depot_3'}
                className="text-amber-500 focus:ring-0"
              />
              <span>Трамвай (швидкість ~18.5 км/год)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="transport_type_calc"
                value="TROLLEYBUS"
                checked={calcType === 'TROLLEYBUS'}
                onChange={() => onTypeChange('TROLLEYBUS')}
                className="text-blue-500 focus:ring-0"
              />
              <span>Тролейбус (~21.0 км/год)</span>
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={onCalculate}
          disabled={isCalculating}
          className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-950/40 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"
          aria-label="Розрахувати нульовий рейс"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isCalculating ? 'Виконується розрахунок...' : 'Розрахувати нульовий рейс'}</span>
        </button>
      </div>

      {/* Результат розрахунку */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Результат топологічного розрахунку</span>
          </h3>

          {calcResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Дистанція рейсу</span>
                  <span className="text-3xl font-black text-amber-400 tracking-tight">{calcResult.distance_km} км</span>
                </div>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Нормативний час</span>
                  <span className="text-3xl font-black text-emerald-400 tracking-tight">{calcResult.duration_min} хв</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs text-slate-400">
                  Вузол примикання до мережі: <strong className="text-slate-100">{calcResult.junction_stop}</strong>
                </div>
                <div className="text-xs text-slate-400">
                  Топологічний статус: <span className="text-emerald-400 font-semibold">{calcResult.is_exact_topological ? 'Точний прописаний маршрут' : 'Розрахований математичний коридор'}</span>
                </div>
                <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
                  Коридор слідування:
                  <p className="text-slate-200 font-mono mt-1 text-[11px] leading-relaxed">
                    {calcResult.path_description}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Виберіть депо та станцію зліва і натисніть «Розрахувати нульовий рейс» для відображення детальної топології.
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800/80">
          КП «Одесміськелектротранс» • Служба Руху та Організації Перевезень
        </div>
      </div>
    </div>
  )
}
