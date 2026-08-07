import React, { useState, useEffect, useRef } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { MapPin, Play, Pause, RotateCcw, Bus, Zap, Info, Clock, AlertCircle, Clock3, Sliders, CheckCircle2 } from 'lucide-react';
import { useStationStore } from '../../store/useStationStore';
import { IncidentDirectory } from '../dispatcher/IncidentDirectory';
import { LiveVehicleCanvas } from './LiveVehicleCanvas';
import { calculateElectrobusBattery } from '../../utils/scheduleEngine';

export const LiveMapView: React.FC = () => {
  const stations = useStationStore(state => state.stations);
  const { liveSchedule, validationWarnings, updateTripDeparture } = useScheduleStore();
  
  const liveBlocks = liveSchedule?.current_blocks || [];
  const [simTimeMin, setSimTimeMin] = useState<number>(450); // 07:30 default
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Стан для Quick Slack Modal (Інтерактивна відтяжка на карті)
  const [slackModal, setSlackModal] = useState<{
    isOpen: boolean;
    blockId: string;
    tripId: string;
    vehicleNum: string;
    routeName: string;
    slackMinutes: number;
  }>({
    isOpen: false,
    blockId: '',
    tripId: '',
    vehicleNum: '',
    routeName: '',
    slackMinutes: 5,
  });

  const [slackSuccessMsg, setSlackSuccessMsg] = useState<string | null>(null);

  // Підписуємося ТІЛЬКИ на телеметрію вибраного вагона
  const selectedVehicleTelemetry = useScheduleStore(state => {
    if (!selectedVehicle) return null;
    const vNum = selectedVehicle.vehicleNumber?.split(' ')[0];
    const telemetryObj = state.telemetry || {};
    const key = Object.keys(telemetryObj).find(id => id.includes(vNum));
    return key ? telemetryObj[key] : null;
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current) {
        setMapDimensions({
          width: mapContainerRef.current.clientWidth,
          height: mapContainerRef.current.clientHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const projectPoint = (lat: number, lon: number) => {
    const scaleX = mapDimensions.width / 800;
    const scaleY = mapDimensions.height / 380;
    const x = ((lon - 30.72) * 20000) * scaleX; 
    const y = (380 - (lat - 46.47) * 20000) * scaleY;
    return { x, y };
  };

  // Симуляційний таймер
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSimTimeMin((prev) => (prev >= 1320 ? 300 : prev + 1 * speedMultiplier));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let clickedBlock: any = null;
    const currentTelemetry = useScheduleStore.getState().telemetry || {};

    Object.entries(currentTelemetry).forEach(([id, vehicle]: [string, any]) => {
      const { x, y } = projectPoint(vehicle.lat, vehicle.lon);
      const dx = clickX - x;
      const dy = clickY - y;
      
      if (Math.sqrt(dx * dx + dy * dy) <= 18) {
        const block = liveBlocks.find((b: any) => {
           const vNum = b.vehicleNumber.split(' ')[0];
           return id.includes(vNum);
        });
        if (block) {
          clickedBlock = block;
        }
      }
    });

    setSelectedVehicle(clickedBlock);
  };

  const openSlackModal = (block: any) => {
    const activeTrip = block.trips && block.trips.length > 0 ? block.trips[0] : null;
    setSlackModal({
      isOpen: true,
      blockId: block.id,
      tripId: activeTrip ? activeTrip.id : 'trip_1',
      vehicleNum: block.vehicleNumber,
      routeName: block.routeId,
      slackMinutes: 5,
    });
  };

  const handleApplySlack = async () => {
    if (!slackModal.blockId) return;
    try {
      if (updateTripDeparture) {
        await updateTripDeparture(slackModal.blockId, slackModal.tripId, simTimeMin, slackModal.slackMinutes);
      }
      setSlackSuccessMsg(`Відтяжку +${slackModal.slackMinutes} хв успішно застосовано до ТЗ ${slackModal.vehicleNum}!`);
      setTimeout(() => setSlackSuccessMsg(null), 4000);
      setSlackModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      console.error("Error applying slack on map:", err);
    }
  };

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const MOCK_POSITIONS = [
    { name: 'Старосінна площа', lat: 46.4682, lng: 30.7411, isHub: true },
    { name: 'Залізничний вокзал', lat: 46.4671, lng: 30.7405, isHub: false },
    { name: 'Тираспольська площа', lat: 46.4828, lng: 30.7315, isHub: true },
    { name: 'Застава-2', lat: 46.4712, lng: 30.7011, isHub: false },
    { name: 'Пересипський міст', lat: 46.4952, lng: 30.7322, isHub: false },
    { name: 'вул. Паустовського', lat: 46.5821, lng: 30.7912, isHub: true },
    { name: '11-та ст. Люстдорфської дороги', lat: 46.3812, lng: 30.7489, isHub: true },
  ];

  const activeVehiclesCount = liveBlocks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutalist-card bg-gray-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500 text-gray-900 font-bold px-2 py-0.5 rounded text-xs">
              Диспетчерська Карта v3.5
            </span>
            <h2 className="text-base font-bold text-white">
              Інтерактивна Карта Руху ТЗ з Модулем Відтяжок (Slack Manager)
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Моніторинг транспорту в реальному часі, клік по ТЗ/зупинках для оперативної відтяжки розкладу та контроль електробусів
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs font-bold">
          <span className="bg-emerald-900/60 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700/60 flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Активних ТЗ: {activeVehiclesCount}</span>
          </span>
        </div>
      </div>

      {/* Slack Success Notification */}
      {slackSuccessMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-600 text-emerald-900 p-3.5 rounded-xl font-bold text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{slackSuccessMsg}</span>
        </div>
      )}

      {/* Simulation Time Control Bar */}
      <div className="brutalist-card bg-white p-4 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2.5 rounded-xl font-bold text-white border-2 border-gray-900 shadow-xs flex items-center space-x-1.5 cursor-pointer text-xs ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Пауза' : 'Запустити симуляцію'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setSimTimeMin(450);
              }}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 border-2 border-gray-900 rounded-xl text-xs font-bold text-gray-800 cursor-pointer"
              title="Скинути до 07:30"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl border border-gray-300 text-xs font-bold font-mono">
              {[1, 5, 10, 30].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeedMultiplier(s)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                    speedMultiplier === s ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span className="text-xl font-extrabold text-gray-900 bg-gray-100 px-3 py-1 rounded-xl border-2 border-gray-900">
              {formatMins(simTimeMin)}
            </span>
          </div>
        </div>

        {/* Time Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={300}
            max={1320}
            value={simTimeMin}
            onChange={(e) => setSimTimeMin(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-gray-500">
            <span>05:00 (Виїзд)</span>
            <span>08:00 (Ранковий пік)</span>
            <span>12:00 (Обідній проміжок)</span>
            <span>17:00 (Вечірній пік)</span>
            <span>22:00 (Заходження)</span>
          </div>
        </div>
      </div>

      {/* Validation Warnings */}
      {validationWarnings && validationWarnings.length > 0 && (
        <div className="bg-red-50 border-2 border-red-900 p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(127,29,29,1)] space-y-2 brutalist-card">
          <div className="flex items-center space-x-2 text-red-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Системні попередження (Transit Solver)</span>
          </div>
          <ul className="list-disc pl-5 text-xs text-red-700 space-y-1 font-mono">
            {validationWarnings.map((warning: string, idx: number) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Map Canvas Visual Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="brutalist-card bg-slate-950 p-4 rounded-2xl lg:col-span-3 space-y-3 relative overflow-hidden min-h-[450px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs pointer-events-none">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">
                Геопросторова схема міської мережі КП «ОМЕТ» (Одеса)
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              Клікніть на ТЗ або зупинку для відтяжки
            </span>
          </div>

          <div 
            ref={mapContainerRef} 
            onClick={handleMapClick}
            className="relative w-full h-[380px] bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer"
          >
            <svg viewBox="0 0 800 380" className="w-full h-full select-none">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="380" fill="url(#grid)" />

              {/* Tracks */}
              <path d="M 120,320 L 250,220 L 400,180 L 550,140 L 700,80" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
              <path d="M 250,220 L 320,120 L 450,90 L 650,60" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6,4" />
              <path d="M 180,340 L 350,280 L 500,240 L 680,200" fill="none" stroke="#10b981" strokeWidth="3" />

              {/* Station Markers */}
              {MOCK_POSITIONS.map((pos, idx) => {
                const x = 120 + idx * 95;
                const y = 320 - idx * 38;
                return (
                  <g key={idx}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={pos.isHub ? "8" : "5"} 
                      fill={pos.isHub ? "#f59e0b" : "#0f172a"} 
                      stroke={pos.isHub ? "#ffffff" : "#f59e0b"} 
                      strokeWidth="2.5" 
                    />
                    <text x={x} y={y + 18} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontWeight="bold">
                      {pos.name} {pos.isHub ? '(Вузол)' : ''}
                    </text>
                  </g>
                );
              })}
            </svg>

            <LiveVehicleCanvas
              width={mapDimensions.width}
              height={mapDimensions.height}
              projectPoint={projectPoint}
              selectedVehicleId={selectedVehicle?.vehicleNumber.split(' ')[0]}
            />
          </div>
        </div>

        <div className="flex flex-col space-y-6 lg:col-span-1">
          {/* Selected Vehicle Info Card */}
          <div className="brutalist-card bg-white p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-gray-900 border-b pb-2 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Bus className="w-4 h-4 text-indigo-600" />
                <span>Інформація про ТЗ</span>
              </span>
              {selectedVehicle && (
                <button
                  onClick={() => openSlackModal(selectedVehicle)}
                  className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-2 py-1 rounded text-[11px] font-extrabold flex items-center space-x-1 cursor-pointer"
                  title="Застосувати оперативну відтяжку"
                >
                  <Clock3 className="w-3.5 h-3.5" />
                  <span>Відтяжка</span>
                </button>
              )}
            </h3>

            {selectedVehicle ? (
              <div className="space-y-3 font-mono text-xs">
                {(() => {
                  const status = selectedVehicleTelemetry ? selectedVehicleTelemetry.status : null;
                  const isReserve = status === 'MODIFIED_RESERVE' || status === 'HOT_RESERVE';
                  const isElectrobus = selectedVehicle.type === 'electrobus';

                  return (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                      <span className="text-indigo-600 font-bold block text-[10px]">Бортовий номер:</span>
                      <div className="flex items-center justify-between">
                        <strong className="text-indigo-950 text-sm">{selectedVehicle.vehicleNumber}</strong>
                        {isElectrobus && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-amber-300" />
                            <span>Електробус</span>
                          </span>
                        )}
                        {isReserve && (
                          <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center space-x-1">
                            <Zap className="w-3 h-3" />
                            <span>РЕЗЕРВ</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="p-3 bg-gray-50 border border-gray-300 rounded-xl space-y-1">
                  <span className="text-gray-500 block text-[10px]">Прикріплений маршрут:</span>
                  <strong className="text-gray-900 text-sm">Маршрут №{selectedVehicle.routeId}</strong>
                </div>

                {/* Electrobus Battery Status Panel */}
                {selectedVehicle.type === 'electrobus' && (() => {
                  const battRes = calculateElectrobusBattery(selectedVehicle, 12.4, 15, 20);
                  return (
                    <div className={`p-3 rounded-xl border space-y-1.5 ${
                      battRes.isBatteryLow ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className={battRes.isBatteryLow ? 'text-rose-700' : 'text-emerald-800'}>
                          Заряд акумулятора (SoC):
                        </span>
                        <span className={battRes.isBatteryLow ? 'text-rose-900 font-extrabold' : 'text-emerald-900'}>
                          {battRes.endSoC}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            battRes.isBatteryLow ? 'bg-rose-600' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${battRes.endSoC}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-600 pt-1 border-t border-gray-200/60">
                        <span>Витрата: {battRes.consumedkWh} кВт·год</span>
                        <span>Необхідна зарядка: {battRes.requiredChargingMin} хв</span>
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const speed = selectedVehicleTelemetry ? selectedVehicleTelemetry.speed : null;
                  return (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 flex justify-between items-center">
                      <div>
                        <span className="text-blue-600 block text-[10px]">Поточна швидкість:</span>
                        <strong className="text-blue-900 text-sm">
                          {speed !== null ? `${speed} км/год` : 'Очікування даних...'}
                        </strong>
                      </div>
                      {speed !== null && speed > 0 && (
                        <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                      )}
                    </div>
                  );
                })()}

                <div className="p-3 bg-gray-50 border border-gray-300 rounded-xl space-y-1">
                  <span className="text-gray-500 block text-[10px]">Вихід / Повернення депо:</span>
                  <strong className="text-amber-800 text-sm">
                    {selectedVehicle.depotExitTime} - {selectedVehicle.depotReturnTime}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500 font-sans space-y-1">
                <Info className="w-5 h-5 mx-auto text-gray-400" />
                <p>Натисніть на маркер ТЗ на карті, щоб отримати телеметрію та дані відтяжки.</p>
              </div>
            )}
          </div>

          <IncidentDirectory />
        </div>
      </div>

      {/* Quick Slack Modal for Map */}
      {slackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-gray-900 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Clock3 className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-gray-900 text-base">
                  Оперативна відтяжка ТЗ ({slackModal.vehicleNum})
                </h3>
              </div>
              <button
                onClick={() => setSlackModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Вкажіть величину затримки/відтяжки у хвилинах. Система автоматично перерахує каскад наступних рейсів ТЗ.
            </p>

            <div className="space-y-3 font-mono">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Величина відтяжки (хвилини):
                </label>
                <div className="flex items-center space-x-2">
                  {[2, 5, 10, 15].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSlackModal(prev => ({ ...prev, slackMinutes: m }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                        slackModal.slackMinutes === m 
                          ? 'bg-amber-500 text-gray-900 border-amber-600' 
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      +{m} хв
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={slackModal.slackMinutes}
                  onChange={(e) => setSlackModal(prev => ({ ...prev, slackMinutes: Number(e.target.value) || 0 }))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t">
              <button
                onClick={() => setSlackModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs"
              >
                Скасувати
              </button>
              <button
                onClick={handleApplySlack}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-extrabold rounded-xl shadow-xs text-xs"
              >
                Застосувати відтяжку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
