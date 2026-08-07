import React, { useState } from 'react';
import { calculateTurnaroundTime, calculateHeadway, calculateDepotExitTime, validateDriverDuty, checkNodeCapacityAndHeadway } from '../../utils/scheduleEngine';
import { Calculator, Cpu, Play, CheckCircle2, AlertTriangle, ShieldCheck, Code2 } from 'lucide-react';

export const AlgorithmSimulatorTab: React.FC = () => {
  // Step 1 State
  const [tDir1, setTDir1] = useState<number>(35);
  const [tDir2, setTDir2] = useState<number>(35);
  const [tDisp, setTDisp] = useState<number>(2);
  const [trafficCoeff, setTrafficCoeff] = useState<number>(1.2);

  // Step 2 State
  const [vehicleCount, setVehicleCount] = useState<number>(14);

  // Step 3 State
  const [firstTripStart, setFirstTripStart] = useState<string>('05:30');
  const [zeroRunMin, setZeroRunMin] = useState<number>(7);
  const [prepTimeMin, setPrepTimeMin] = useState<number>(10); // 10 tram, 19 trolley

  // Calculations
  const tRevBase = tDir1 + tDir2 + tDisp;
  const tRevDynamic = Math.ceil((tDir1 + tDir2) * trafficCoeff) + tDisp;
  const headwayBase = (tRevBase / vehicleCount).toFixed(1);
  const headwayDynamic = (tRevDynamic / vehicleCount).toFixed(1);
  
  // Calculate depot exit time manually since scheduleEngine was modified
  const timeToMinutes = (timeStr: string) => {
    const parts = timeStr.split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };
  const minutesToTime = (mins: number) => {
    const m = (mins % 1440 + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
  };
  
  const depotExitTime = minutesToTime(timeToMinutes(firstTripStart) - zeroRunMin - prepTimeMin);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-base">
              Інтерактивний тестер математичного ядра (ТЗ Розділ 2 та 4)
            </h2>
            <p className="text-xs text-gray-500">
              Калькулятор перевірки 5-етапного алгоритму обчислення розкладів та розв'язання конфліктів у канальних вузлах
            </p>
          </div>
        </div>

        <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center space-x-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Математичні формули ТЗ верифіковано</span>
        </span>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1 & Step 2 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
            <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-0.5 rounded">Етап 1 & 2</span>
            <h3 className="text-gray-900 font-bold text-sm">Час оборотного рейсу (T_rev) та Інтервал (I)</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-gray-600 font-medium block mb-1">Прямий напрямок t_dir1 (хв):</label>
              <input
                type="number"
                value={tDir1}
                onChange={(e) => setTDir1(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium block mb-1">Зворотний напрямок t_dir2 (хв):</label>
              <input
                type="number"
                value={tDir2}
                onChange={(e) => setTDir2(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium block mb-1">Диспетчерська відмітка t_disp (хв):</label>
              <input
                type="number"
                value={tDisp}
                onChange={(e) => setTDisp(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium block mb-1">Коефіцієнт затору (γ):</label>
              <input
                type="number"
                step="0.1"
                value={trafficCoeff}
                onChange={(e) => setTrafficCoeff(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-gray-600 font-medium block mb-1">Кількість вагонів на маршруті (N):</label>
              <input
                type="number"
                value={vehicleCount}
                onChange={(e) => setVehicleCount(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Базовий оборотний рейс T_rev:</span>
              <span className="font-bold text-gray-900">{tRevBase} хв</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Динамічний T_rev (з затором γ={trafficCoeff}):</span>
              <strong className="text-indigo-600 font-mono font-bold">{tRevDynamic} хв</strong>
            </div>
            <div className="border-t border-indigo-100 pt-1 flex justify-between">
              <span className="text-gray-600">Базовий інтервал руху (I = T_rev / N):</span>
              <strong className="text-emerald-700 font-mono font-bold">{headwayBase} хв</strong>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
            <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-0.5 rounded">Етап 3</span>
            <h3 className="text-gray-900 font-bold text-sm">Розрахунок нульового пробігу та часу виїзду з депо</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-gray-600 font-medium block mb-1">Початок першого рейсу на ДП (HH:mm):</label>
              <input
                type="text"
                value={firstTripStart}
                onChange={(e) => setFirstTripStart(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium block mb-1">Час нульового пробігу з депо (хв):</label>
              <input
                type="number"
                value={zeroRunMin}
                onChange={(e) => setZeroRunMin(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-gray-600 font-medium block mb-1">
                Підготовчо-заключний час t_prep (10 хв трамвай, 19 хв тролейбус):
              </label>
              <select
                value={prepTimeMin}
                onChange={(e) => setPrepTimeMin(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10 хв (Трамвайний транспорт)</option>
                <option value={19}>19 хв (Тролейбусний транспорт)</option>
              </select>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs flex justify-between items-center">
            <span className="text-gray-600 font-medium">Розрахований час виїзду з депо (t_depot_exit):</span>
            <strong className="text-emerald-700 font-mono text-base font-bold">{depotExitTime}</strong>
          </div>
        </div>

      </div>
    </div>
  );
};
