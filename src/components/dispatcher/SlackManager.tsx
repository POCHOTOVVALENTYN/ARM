import React, { useState } from 'react';
import { calculateSlackEffect, SlackPropagationResult } from '../../utils/scheduleEngine';
import { AlertOctagon, CheckCircle, Clock, FastForward, Play, RefreshCw, ShieldAlert, Sliders } from 'lucide-react';

interface SlackManagerProps {
  onApplySlack: (slackMin: number, tripId: string) => void;
  onTruncateTrip: () => void;
  onReserveVehicle: () => void;
}

export const SlackManager: React.FC<SlackManagerProps> = ({
  onApplySlack,
  onTruncateTrip,
  onReserveVehicle
}) => {
  const [slackValue, setSlackValue] = useState<number>(4);
  const [plannedTurnaround, setPlannedTurnaround] = useState<number>(68); // mins
  const [result, setResult] = useState<SlackPropagationResult>(
    calculateSlackEffect(4, 68, 2, 480)
  );

  const handleSlackChange = (val: number) => {
    setSlackValue(val);
    setResult(calculateSlackEffect(val, plannedTurnaround, 2, 480));
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm sm:text-base">
              Віджет «Slack Manager» (Введення відтяжки)
            </h3>
            <p className="text-xs text-slate-400">
              Симуляція оперативного затору / затримки біля світлофора (від 1 до 10 хвилин)
            </p>
          </div>
        </div>

        <span className="bg-amber-500/20 text-amber-300 font-mono font-bold text-xs px-2.5 py-1 rounded border border-amber-500/30">
          Δt = +{slackValue} хв
        </span>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slider input */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="text-xs text-slate-300 font-semibold flex justify-between">
            <span>Величина відтяжки / затримки (Δt_slack):</span>
            <span className="text-amber-400 font-bold">{slackValue} хвилин</span>
          </label>

          <input
            type="range"
            min="1"
            max="10"
            value={slackValue}
            onChange={(e) => handleSlackChange(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>+1 хв (Легка)</span>
            <span>+5 хв (Затор)</span>
            <span>+10 хв (ДТП / Макс)</span>
          </div>

          <button
            onClick={() => onApplySlack(slackValue, 'trip_301_1')}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition-all text-xs flex items-center justify-center space-x-2 shadow-md"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Застосувати відтяжку до Наряду №301</span>
          </button>
        </div>

        {/* Dynamic Mathematical Outcome Display */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">
              Сценарій розповсюдження затримки (Розділ 4.1):
            </span>

            {result.scenario === 'full_absorption' && (
              <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs space-y-1">
                <div className="text-emerald-400 font-bold flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>1. Повне поглинання затримки</span>
                </div>
                <p className="text-slate-300">{result.message}</p>
              </div>
            )}

            {result.scenario === 'partial_propagation' && (
              <div className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs space-y-1">
                <div className="text-amber-400 font-bold flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>2. Часткове поширення на наступний рейс (+{result.nextTripDelayMin} хв)</span>
                </div>
                <p className="text-slate-300">{result.message}</p>
              </div>
            )}

            {result.scenario === 'emergency_shift_overflow' && (
              <div className="mt-2 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-xs space-y-1 animate-pulse">
                <div className="text-rose-400 font-bold flex items-center space-x-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  <span>3. Аварійний зсув (Порушення зміни водія!)</span>
                </div>
                <p className="text-slate-300">{result.message}</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <strong className="text-slate-200">Рекомендована дія:</strong> {result.recommendedAction}
          </div>
        </div>
      </div>

      {/* Quick Dispatcher Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={onTruncateTrip}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-slate-200 hover:text-white font-medium p-3 rounded-xl transition-all text-xs flex items-center space-x-2"
        >
          <FastForward className="w-4 h-4 text-amber-400" />
          <div className="text-left">
            <div className="font-bold">Скоротити рейс («Змінений напрямок»)</div>
            <div className="text-[10px] text-slate-400">Оперативний заїзд через комендантську годину</div>
          </div>
        </button>

        <button
          onClick={onReserveVehicle}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/40 text-slate-200 hover:text-white font-medium p-3 rounded-xl transition-all text-xs flex items-center space-x-2"
        >
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <div className="text-left">
            <div className="font-bold">Поставити в «Гарячий резерв»</div>
            <div className="text-[10px] text-slate-400">Фіксація ТЗ на кінцевій ДП за викликом</div>
          </div>
        </button>
      </div>
    </div>
  );
};
