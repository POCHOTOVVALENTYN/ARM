import React, { useState, useEffect } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Zap, AlertTriangle, CheckCircle2, ShieldAlert, Bus } from 'lucide-react';

export const HotReserveView: React.FC = () => {
  const { draftBlocks, executeHotReserveSwap } = useScheduleStore();
  
  const [brokenBlockId, setBrokenBlockId] = useState<string>(draftBlocks[0]?.id || '');
  const [targetTripId, setTargetTripId] = useState<string>('');
  const [reserveBlockId, setReserveBlockId] = useState<string>(
    draftBlocks.find((b) => b.id !== brokenBlockId)?.id || ''
  );
  
  const [incidentTime, setIncidentTime] = useState<string>('08:30');
  const [swapResult, setSwapResult] = useState<{
    success: boolean;
    message: string;
    regeneratedBooklets?: string[];
  } | null>(null);

  // Sync available trips and reserve blocks when brokenBlockId changes
  useEffect(() => {
    const block = draftBlocks.find(b => b.id === brokenBlockId);
    if (block && block.trips.length > 0) {
       // Only reset if current targetTripId is not in the new block's trips
       if (!block.trips.find(t => t.id === targetTripId)) {
           setTargetTripId(block.trips[0].id);
       }
    } else {
       setTargetTripId('');
    }
    
    // Ensure reserve block is not the same as broken block
    if (reserveBlockId === brokenBlockId) {
       const newReserve = draftBlocks.find(b => b.id !== brokenBlockId);
       setReserveBlockId(newReserve?.id || '');
    }
  }, [brokenBlockId, draftBlocks, targetTripId, reserveBlockId]);

  const selectedBrokenBlock = draftBlocks.find(b => b.id === brokenBlockId);
  const availableTrips = selectedBrokenBlock?.trips || [];

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwapResult(null);
    
    if (!brokenBlockId || !targetTripId || !reserveBlockId) {
      setSwapResult({ success: false, message: 'Оберіть всі обов\'язкові параметри (Аварійний вагон, Рейс та Резервний вагон).' });
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/incidents/hot-reserve/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reserve_vehicle_id: reserveBlockId,
          target_trip_id: targetTripId,
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
        regeneratedBooklets: [data.new_vehicle_id, brokenBlockId]
      });
      
      if (executeHotReserveSwap) {
          executeHotReserveSwap(brokenBlockId, reserveBlockId, incidentTime);
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
            {/* Step 1: Select Broken Vehicle */}
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                1. Виберіть аварійний вагон (Поломка ТЗ / ДТП):
              </label>
              <select
                value={brokenBlockId}
                onChange={(e) => setBrokenBlockId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl p-3 font-mono font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                disabled={draftBlocks.length === 0}
              >
                {draftBlocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    Борт {b.vehicleNumber} (Блок: {b.id}) — {b.trips.length} рейсів
                  </option>
                ))}
              </select>
            </div>
            
            {/* Step 1.5: Select Target Trip */}
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                Рейс, з якого почнеться заміна:
              </label>
              <select
                value={targetTripId}
                onChange={(e) => setTargetTripId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl p-3 font-mono font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                disabled={availableTrips.length === 0}
              >
                {availableTrips.map((t) => (
                  <option key={t.id} value={t.id}>
                    Рейс {t.id} ({t.departureTime} - {t.arrivalTime})
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

            {/* Step 3: Select Reserve Vehicle */}
            <div>
              <label className="font-bold text-gray-900 block mb-1">
                3. Виберіть резервний вагон із депо (Hot Reserve):
              </label>
              <select
                value={reserveBlockId}
                onChange={(e) => setReserveBlockId(e.target.value)}
                className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl p-3 font-mono font-bold text-gray-900 focus:ring-2 focus:ring-purple-500"
                disabled={draftBlocks.length <= 1}
              >
                {draftBlocks
                  .filter((b) => b.id !== brokenBlockId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      Резервний Борт {b.vehicleNumber} (Блок: {b.id})
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={draftBlocks.length <= 1 || !targetTripId}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm py-3.5 rounded-xl border-2 border-purple-800 shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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

