import React, { useState } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { RouteTravelMatrix } from '../routes/RouteTravelMatrix';
import { Route } from '../../types';
import { Settings, RefreshCw, Zap, Save, Calendar, Clock } from 'lucide-react';

export const OperationalScheduleGenerator: React.FC = () => {
  const { routes, updateSegmentTime, validationErrors, clearValidationError } = useRouteStore();
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState<string>('base');

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  const handleGenerateSchedule = () => {
    alert(`Фактичний (оперативний) розклад для маршруту ${selectedRoute?.number} успішно згенеровано на основі поточної матриці!`);
  };

  const handleSaveTemplate = () => {
    alert(`Шаблон матриці збережено як "${activeTemplate}"!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Генератор оперативних розкладів
              </h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Налаштування матриць часу ходу та генерація фактичних розкладів руху.
            </p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-slate-700 mb-1">Виберіть маршрут</label>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-medium"
          >
            <option value="">-- Оберіть маршрут --</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                [{r.type === 'tram' ? 'Тр' : 'Тб'}] {r.number} - {r.name}
              </option>
            ))}
          </select>
        </div>

        {selectedRoute && (
          <div className="flex-1 w-full">
            <label className="block text-xs font-bold text-slate-700 mb-1">Шаблон матриці</label>
            <div className="flex space-x-2">
              <select
                value={activeTemplate}
                onChange={(e) => setActiveTemplate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-medium"
              >
                <option value="base">Базова (Паспортна)</option>
                <option value="peak">Пікова (Затори)</option>
                <option value="weekend">Вихідного дня (Вільний рух)</option>
                <option value="night">Нічна</option>
              </select>
              <button
                onClick={handleSaveTemplate}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-xs flex items-center shrink-0"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Зберегти
              </button>
            </div>
          </div>
        )}

        {selectedRoute && (
          <button
            onClick={handleGenerateSchedule}
            className="bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center shrink-0 w-full md:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Згенерувати розклад
          </button>
        )}
      </div>

      {/* Matrix */}
      {selectedRoute ? (
        <div className="mt-6">
          <RouteTravelMatrix
            route={selectedRoute}
            validationErrors={validationErrors}
            onUpdateSegmentTime={updateSegmentTime}
            onClearValidationError={clearValidationError}
            onOpenPassport={() => {}} // Disabled in this view
          />
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-500">
          <Clock className="w-12 h-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Оберіть маршрут</h3>
          <p className="text-sm mt-1 max-w-md text-center">
            Для редагування матриці часу ходу та генерації оперативного розкладу оберіть потрібний маршрут з випадаючого списку вище.
          </p>
        </div>
      )}
    </div>
  );
};
