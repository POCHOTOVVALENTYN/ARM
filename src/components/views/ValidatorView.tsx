import React from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { ShieldAlert, Users, CheckCircle2, AlertTriangle, Layers, Clock, Zap } from 'lucide-react';
import { useControlPointStore } from '../../store/useControlPointStore';

export const ValidatorView: React.FC = () => {
  const { conflicts, liveDuties } = useScheduleStore();
  const { controlPoints } = useControlPointStore();

  const violatingDuties = liveDuties.filter((d) => d.isViolating10hLimit);
  const nonLunchDuties = liveDuties.filter((d) => !d.isLunchCompliant);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutalist-card bg-gray-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-rose-600 text-white font-bold px-2.5 py-0.5 rounded text-xs">
              Модуль Валідації 2.3
            </span>
            <h2 className="text-base font-bold text-white">
              Автоматичний Валідатор КЗпП України та Канальної Місткості Вузлів
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Перевірка 10-годинного ліміту зміни з урахуванням t_prep, нормативу обідньої перерви (4h - 5h) та захист від конфліктів "паровозності" у суміщених коліях
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold">
          <span className="bg-gray-800 text-rose-400 px-3 py-1.5 rounded-lg border border-gray-700">
            Виявлено конфліктів: {conflicts.length + violatingDuties.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Labor Code (КЗпП) Driver Duty Compliance */}
        <div className="brutalist-card bg-white p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-gray-900">
                1. Перевірка КЗпП (10-годинний ліміт + підготовчий час)
              </h3>
            </div>
            <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded font-bold">
              Норма 600 хв
            </span>
          </div>

          <p className="text-xs text-gray-600">
            Законодавча вимога: Тривалість зміни водія не може перевищувати 10 годин (600 хвилин) з урахуванням t_prep (10 хв трамвай, 19 хв тролейбус) та обов'язкового обіду.
          </p>

          <div className="space-y-2 font-mono text-xs max-h-[350px] overflow-y-auto">
            {liveDuties.map((duty) => {
              const isViolating = duty.isViolating10hLimit;
              return (
                <div
                  key={duty.id}
                  className={`p-3 rounded-xl border-2 flex items-center justify-between ${
                    isViolating
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold">{duty.driverName}</span>
                      <span className="text-[10px] font-mono bg-gray-900 text-white px-2 py-0.5 rounded">
                        {duty.id}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-600 font-sans block mt-0.5">
                      Зміна: {duty.shiftStartTime} - {duty.shiftEndTime} ({duty.totalShiftMin} хв)
                    </span>
                  </div>

                  <div className="text-right">
                    {isViolating ? (
                      <span className="bg-rose-600 text-white font-bold text-[10px] px-2 py-1 rounded flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Перевищення (+{duty.totalShiftMin - 600} хв)</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-1 rounded flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>КЗпП Дотримано</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Node Track Channel & Safety Headway Validator */}
        <div className="brutalist-card bg-white p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b-2 border-gray-900 pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-gray-900">
                2. Канальна Модель Вузлів (Захист від конфліктів)
              </h3>
            </div>
            <span className="text-xs font-mono bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded font-bold">
              h_min = 2.0 хв
            </span>
          </div>

          <p className="text-xs text-gray-600">
            Алгоритм аналізує призначення колій (assigned_track) та напрямок рух (direction_vector), виключаючи хибні спрацювання на багатоколійних вузлах.
          </p>

          <div className="space-y-3">
            {controlPoints.map((hub) => (
              <div
                key={hub.id}
                className="bg-gray-50 border-2 border-gray-300 p-3.5 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                  <span className="font-bold text-gray-900">{hub.name}</span>
                  <span className="text-[11px] font-mono text-indigo-700 font-bold">
                    Колій: {hub.availableTracksCount} • Порог h = {hub.minHeadwayMin} хв
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  {hub.channels.map((ch) => (
                    <div
                      key={ch.trackId}
                      className="bg-white border border-gray-200 p-2 rounded flex items-center justify-between"
                    >
                      <span className="font-bold text-gray-800">{ch.name}</span>
                      <span className="text-emerald-700 font-bold">
                        Місткість: {ch.maxCapacity} ваг / Норма OK
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
