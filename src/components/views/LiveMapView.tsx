import React, { useState, useEffect, useRef } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { MapPin, Play, Pause, RotateCcw, Bus, Zap, Info, Clock, AlertCircle } from 'lucide-react';
import { useStationStore } from '../../store/useStationStore';
import { IncidentDirectory } from '../dispatcher/IncidentDirectory';
import { LiveVehicleCanvas } from './LiveVehicleCanvas';

export const LiveMapView: React.FC = () => {
  const stations = useStationStore(state => state.stations);
  const { liveSchedule, telemetry, validationWarnings } = useScheduleStore();
  const liveBlocks = liveSchedule?.current_blocks || [];
  const [simTimeMin, setSimTimeMin] = useState<number>(450); // 07:30 default
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

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

  // Приклад проекції для накладання Canvas поверх існуючої SVG
  // Оскільки SVG має розмір 800x380 (viewBox), нам потрібно масштабувати його до реальних розмірів контейнера.
  const projectPoint = (lat: number, lon: number) => {
    // В реальності тут буде d3.geoMercator або аналог. 
    // Для демо використаємо просте лінійне відображення.
    // Координати в SVG для першої та останньої станцій (у нас від 46.4829, 30.7358).
    // Поки просто повертаємо фейкову позицію, що залежить від lon/lat.
    
    // Щоб Canvas співпадав зі стилізованою SVG, використовуємо ті самі співвідношення
    // Але оскільки SVG розтягується, ми повинні враховувати mapDimensions.width / 800 та mapDimensions.height / 380
    
    const scaleX = mapDimensions.width / 800;
    const scaleY = mapDimensions.height / 380;
    
    // Імітація розташування на маршруті (спрощено)
    // У реальному додатку ви б розраховували точні X, Y на основі geo координат
    const x = ((lon - 30.72) * 20000) * scaleX; 
    const y = (380 - (lat - 46.47) * 20000) * scaleY;
    
    return { x, y };
  };

  // Simulation timer
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

    Object.entries(telemetry).forEach(([id, vehicle]) => {
      const { x, y } = projectPoint(vehicle.lat, vehicle.lon);
      const dx = clickX - x;
      const dy = clickY - y;
      
      // Радіус кліку ~15px
      if (Math.sqrt(dx * dx + dy * dy) <= 15) {
        // Знаходимо відповідний блок з liveBlocks
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

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Mock lat/lng positions for key Odessa locations
  const MOCK_POSITIONS = [
    { name: 'Старосінна площа', lat: 46.4682, lng: 30.7411 },
    { name: 'Вокзал (Привокзальна площа)', lat: 46.4671, lng: 30.7405 },
    { name: 'Тираспольська площа', lat: 46.4828, lng: 30.7315 },
    { name: 'Застава-2', lat: 46.4712, lng: 30.7011 },
    { name: 'Пересипський міст', lat: 46.4952, lng: 30.7322 },
    { name: 'вул. Паустовського', lat: 46.5821, lng: 30.7912 },
    { name: 'Люстдорф (16-та ст. В.Фонтану)', lat: 46.3812, lng: 30.7489 },
  ];

  const activeVehiclesCount = liveBlocks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutalist-card bg-gray-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500 text-gray-900 font-bold px-2 py-0.5 rounded text-xs">
              Модуль Диспетчера 3.4
            </span>
            <h2 className="text-base font-bold text-white">
              Інтерактивна Карта Руху ТЗ КП «ОМЕТ» (GTFS Shapes & GPS Interpolation)
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Синхронізація позиціонування трамваїв та тролейбусів у реальному часі відносно часового повзунка симуляції
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs font-bold">
          <span className="bg-emerald-900/60 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-700/60 flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Активних ТЗ: {activeVehiclesCount}</span>
          </span>
        </div>
      </div>

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
            <span>05:00 (Початок)</span>
            <span>08:00 (Ранковий пік)</span>
            <span>12:00 (Міжпік)</span>
            <span>17:00 (Вечірній пік)</span>
            <span>22:00 (Завершення)</span>
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
        {/* Map Representation Container */}
        <div className="brutalist-card bg-slate-950 p-4 rounded-2xl lg:col-span-3 space-y-3 relative overflow-hidden min-h-[450px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs pointer-events-none">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">
                Геопросторова схема міської мережі КП «ОМЕТ» (Одеса)
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              Координати: 46.4829° N, 30.7358° E
            </span>
          </div>

          {/* Graphical Map Representation SVG */}
          <div 
            ref={mapContainerRef} 
            onClick={handleMapClick}
            className="relative w-full h-[380px] bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden cursor-pointer"
          >
            <svg viewBox="0 0 800 380" className="w-full h-full select-none">
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="800" height="380" fill="url(#grid)" />

              {/* Tram Line Track Paths */}
              {/* Route T3 Track Path */}
              <path
                d="M 120,320 L 250,220 L 400,180 L 550,140 L 700,80"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Route T7 Track Path */}
              <path
                d="M 250,220 L 320,120 L 450,90 L 650,60"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeDasharray="6,4"
              />

              {/* Route Tr3 Trolleybus Path */}
              <path
                d="M 180,340 L 350,280 L 500,240 L 680,200"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />

              {/* Stations Markers */}
              {MOCK_POSITIONS.map((pos, idx) => {
                const x = 120 + idx * 95;
                const y = 320 - idx * 38;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
                    <text x={x} y={y + 18} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontWeight="bold">
                      {pos.name}
                    </text>
                  </g>
                );
              })}

              {/* Canvas Overlay for live vehicles */}
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
            <h3 className="font-bold text-sm text-gray-900 border-b pb-2 flex items-center space-x-2">
              <Bus className="w-4 h-4 text-indigo-600" />
            <span>Інформація про ТЗ</span>
          </h3>

          {selectedVehicle ? (
            <div className="space-y-3 font-mono text-xs">
              {(() => {
                const vNum = selectedVehicle.vehicleNumber.split(' ')[0];
                const telemetryEntry = Object.entries(telemetry).find(([id]) => id.includes(vNum));
                const status = telemetryEntry ? telemetryEntry[1].status : null;
                const isReserve = status === 'MODIFIED_RESERVE' || status === 'HOT_RESERVE';

                return (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                    <span className="text-indigo-600 font-bold block text-[10px]">Бортовий номер:</span>
                    <div className="flex items-center justify-between">
                      <strong className="text-indigo-950 text-sm">{selectedVehicle.vehicleNumber}</strong>
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

              {(() => {
                const vNum = selectedVehicle.vehicleNumber.split(' ')[0];
                const telemetryEntry = Object.entries(telemetry).find(([id]) => id.includes(vNum));
                const speed = telemetryEntry ? telemetryEntry[1].speed : null;
                
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

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-emerald-700 block text-[10px]">Виконано рейсів:</span>
                <strong className="text-emerald-950 text-sm">{selectedVehicle.trips.length} рейсів</strong>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-500 font-sans space-y-1">
              <Info className="w-5 h-5 mx-auto text-gray-400" />
              <p>Натисніть на маркер ТЗ на карті, щоб отримати телеметрію та дані наряду.</p>
            </div>
          )}
          </div>

          <IncidentDirectory />
        </div>
      </div>
    </div>
  );
};
