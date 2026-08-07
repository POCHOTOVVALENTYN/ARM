import React, { useState, useEffect } from 'react';
import { calculateSlackEffect, SlackPropagationResult } from '../../utils/scheduleEngine';
import { useScheduleStore } from '../../store/useScheduleStore';
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
  const { draftBlocks } = useScheduleStore();
  const allTrips = draftBlocks.flatMap(b => b.trips) || [];

  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [slackValue, setSlackValue] = useState<number>(4);
  const [plannedTurnaround, setPlannedTurnaround] = useState<number>(68); // mins
  const [result, setResult] = useState<SlackPropagationResult>(
    calculateSlackEffect(4, 68)
  );

  useEffect(() => {
    if (allTrips.length > 0 && !selectedTripId) {
      setSelectedTripId(allTrips[0].id);
    }
  }, [allTrips, selectedTripId]);

  const handleSlackChange = (val: number) => {
    setSlackValue(val);
    setResult(calculateSlackEffect(val, plannedTurnaround)); // 2 min reserve, 480 shift limit
  };

  const handleTurnaroundChange = (val: number) => {
    setPlannedTurnaround(val);
    setResult(calculateSlackEffect(slackValue, val));
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
        {/* Sliders and inputs */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-4">
          
          {/* Target Trip Dropdown */}
          <div>
            <label className="text-xs text-slate-300 font-semibold mb-1 block">
              Виберіть цільовий рейс:
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-300 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
              disabled={allTrips.length === 0}
            >
              {allTrips.map(t => (
                <option key={t.id} value={t.id}>
                  Рейс {t.id} ({t.departureTime} - {t.arrivalTime})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold flex justify-between">
              <span>Величина відтяжки (Δt_slack):</span>
              <span className="text-amber-400 font-bold">{slackValue} хв</span>
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
              <span>+1 хв</span>
              <span>+5 хв</span>
              <span>+10 хв</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-semibold flex justify-between">
              <span>Запланований час на кінцевій (T_turn):</span>
              <span className="text-amber-400 font-bold">{plannedTurnaround} хв</span>
            </label>
            <input
              type="range"
              min="0"
              max="120"
              value={plannedTurnaround}
              onChange={(e) => handleTurnaroundChange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          <button
            onClick={() => onApplySlack(slackValue, selectedTripId)}
            disabled={!selectedTripId}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl transition-all text-xs flex items-center justify-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Застосувати відтяжку {selectedTripId ? `до ${selectedTripId}` : ''}</span>
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
