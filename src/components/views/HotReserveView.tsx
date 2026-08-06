import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Zap, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, FileText, Bus } from 'lucide-react';
import { MOCK_DEPOTS } from '../../data/mockData';

export const HotReserveView: React.FC = () => {
  const { draftDuties, executeHotReserveSwap } = useScheduleStore();
  const [brokenDutyId, setBrokenDutyId] = useState<string>(draftDuties[0]?.id || '');
  const [reserveDutyId, setReserveDutyId] = useState<string>(
    draftDuties.find((d) => d.id !== draftDuties[0]?.id)?.id || ''
  );
  const [incidentTime, setIncidentTime] = useState<string>('08:30');
  const [swapResult, setSwapResult] = useState<{
    success: boolean;
    message: string;
    regeneratedBooklets?: string[];
  } | null>(null);

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwapResult(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/incidents/hot-reserve/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reserve_vehicle_id: reserveDutyId,
          target_trip_id: brokenDutyId,
          reason: `Заміна по інциденту о ${incidentTime}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setSwapResult({
          success: false,
          message: errorData.detail || 'Помилка транзакції'
        });
        return;
      }

      const data = await response.json();
      setSwapResult({
        success: true,
        message: `Гарячий резерв активовано. Новий борт: ${data.new_vehicle_id}`,
        regeneratedBooklets: [data.new_vehicle_id, brokenDutyId]
      });
      
      // Якщо у нас є локальна функція для оновлення UI, можемо її викликати
      if (executeHotReserveSwap) {
          executeHotReserveSwap(brokenDutyId, reserveDutyId, incidentTime);
      }
    } catch (error) {
      setSwapResult({
        success: false,
        message: 'Помилка з\'єднання з сервером'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutalist-card bg-gray-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-600 text-white font-bold px-2.5 py-0.5 rounded text-xs">
              Майстер Аварій 5.1
            </span>
            <h2 className="text-base font-bold text-white">
              Оперативний Майстер «Гарячого Резерву» (Hot Reserve Emergency Swap)
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Атомарна Backend-транзакція: фіксація поломки вагона, перенаправлення майбутніх рейсів на резервний вагон депо та автогенерація нових Книжок водія
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs font-bold">
          <span className="bg-purple-900/60 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-700/60 flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Готовність Резерву: 100%</span>
          </span>
        </div>
      </div>

      {swapResult && (
        <div
          className={`brutalist-card p-4 rounded-2xl border-2 space-y-2 ${
            swapResult.success
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
              : 'bg-rose-50 border-rose-500 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold text-sm">
            {swapResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{swapResult.message}</span>
          </div>

          {swapResult.regeneratedBooklets && (
            <div className="text-xs font-mono text-gray-700 space-y-1 pt-1 border-t border-emerald-300">
              <span className="font-bold text-gray-900">Перегенеровано персональні Книжки водіїв:</span>
              <div className="flex space-x-2">
                {swapResult.regeneratedBooklets.map((b) => (
                  <span key={b} className="bg-white border border-gray-400 px-2 py-0.5 rounded font-bold">
                    📄 Booklet_{b}.pdf
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Swap Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="brutalist-card bg-white p-6 rounded-2xl space-y-5 lg:col-span-2">
          <h3 className="font-extrabold text-base text-gray-900 border-b-2 border-gray-900 pb-3 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <span>Параметри Аварійної Перекидки Рейсів:</span>
          </h3>

          <form onSubmit={handleExecuteSwap} className="space-y-4 font-sans text-xs">
            {/* Step 1: Select Broken Vehicle / Duty */}
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                1. Виберіть аварійний наряд (Поломка ТЗ / ДТП):
              </label>
              <select
                value={brokenDutyId}
                onChange={(e) => setBrokenDutyId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl p-3 font-mono font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
              >
                {draftDuties.map((d) => (
                  <option key={d.id} value={d.id}>
                    Наряд {d.id} — {d.driverName} (Зміна: {d.shiftStartTime} - {d.shiftEndTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Time of Incident */}
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                2. Час виникнення аварії (HH:mm):
              </label>
              <input
                type="time"
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl p-3 font-mono font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Step 3: Select Reserve Vehicle / Duty */}
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                3. Виберіть резервний вагон із депо (Hot Reserve):
              </label>
              <select
                value={reserveDutyId}
                onChange={(e) => setReserveDutyId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl p-3 font-mono font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
              >
                {draftDuties
                  .filter((d) => d.id !== brokenDutyId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      Резервний Наряд {d.id} — {d.driverName}
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm py-3.5 rounded-xl border-2 border-purple-800 shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all mt-4"
            >
              <Zap className="w-5 h-5" />
              <span>Виконати атомарну транзакцію Гарячого Резерву</span>
            </button>
          </form>
        </div>

        {/* Info Box */}
        <div className="brutalist-card bg-purple-950 text-white p-5 rounded-2xl space-y-4 lg:col-span-1">
          <h4 className="font-bold text-sm text-purple-300 border-b border-purple-800 pb-2 flex items-center space-x-2">
            <Bus className="w-4 h-4 text-purple-400" />
            <span>Алгоритм Hot Reserve Swap</span>
          </h4>

          <ul className="space-y-2 text-xs text-purple-200 list-disc list-inside">
            <li>Зламаний вагон зупиняє поточний рейс та направляється у Депо-Аварія.</li>
            <li>Усі майбутні рейси після часу {incidentTime} передаються резервному вагону.</li>
            <li>Глобальна сітка розкладу зберігається без руйнування інтервалу.</li>
            <li>Автоматично створюється оновлений комплект документів для кабіни водія.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
