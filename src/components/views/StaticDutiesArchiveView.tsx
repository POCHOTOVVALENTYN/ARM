import React from 'react';
import { Archive } from 'lucide-react';

export const StaticDutiesArchiveView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Архів статичних нарядів
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Перегляд та аналітика затверджених планів випуску (історичні дані).
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white p-12 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-gray-500 space-y-4">
        <Archive className="w-12 h-12 text-gray-400" />
        <h3 className="text-lg font-bold text-gray-900">Розділ у розробці</h3>
        <p className="text-sm text-center max-w-md">
          У майбутньому тут буде знаходитись функціонал для перегляду та аналізу вже виконаних (затверджених) статичних нарядів та планів випуску рухомого складу.
        </p>
      </div>
    </div>
  );
};
