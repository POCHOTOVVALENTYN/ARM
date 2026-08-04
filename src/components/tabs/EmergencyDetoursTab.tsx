import React, { useState } from 'react';
import { MOCK_EMERGENCY_TEMPLATES } from '../../data/mockData';
import { AlertTriangle, CheckCircle, Flame, Navigation, ShieldAlert, Zap } from 'lucide-react';

export const EmergencyDetoursTab: React.FC = () => {
  const [activeDetourId, setActiveDetourId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-[0_8px_30px_rgba(37,99,235,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-base">
              Модуль аварійних схем руху та об'їздів (Emergency Detour Library)
            </h2>
            <p className="text-xs text-slate-500">
              Готові шаблони альтернативних трасувань у разі виникнення ДТП, повалення дерев чи обриву контактної мережі
            </p>
          </div>
        </div>

        {activeDetourId && (
          <div className="bg-rose-500/20 border border-rose-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-300 animate-pulse flex items-center space-x-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>АКТИВОВАНО АВАРІЙНУ СХЕМУ ДЕТУРУ!</span>
          </div>
        )}
      </div>

      {/* Emergency Templates Grid */}
      <div className="grid grid-cols-1 gap-4">
        {MOCK_EMERGENCY_TEMPLATES.map((tmpl) => {
          const isActivated = activeDetourId === tmpl.id;

          return (
            <div
              key={tmpl.id}
              className={`bg-slate-950 border rounded-2xl p-5 space-y-3 transition-all shadow-xl ${
                isActivated ? 'border-rose-500 bg-rose-950/20' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">{tmpl.title}</h3>
                    <p className="text-xs text-slate-400">Причина: {tmpl.cause}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Зачеплені маршрути:</span>
                  {tmpl.affectedRouteIds.map((rId) => (
                    <span
                      key={rId}
                      className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded text-xs font-bold"
                    >
                      Маршрут {rId}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detour Description */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <strong className="text-amber-400 font-semibold block">Схема оперативної зміни напрямку руху:</strong>
                <p>{tmpl.detourDescription}</p>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setActiveDetourId(isActivated ? null : tmpl.id)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md ${
                    isActivated
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {isActivated ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Відновити стандартну схему руху</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Перевести вагони на аварійну схему (в 1 клік)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
