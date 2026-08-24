import React from 'react';
import { 
  X, 
  MapPin, 
  Gauge, 
  Compass, 
  Radio, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  RotateCcw, 
  Zap, 
  PhoneCall, 
  Wifi, 
  Snowflake, 
  Accessibility,
  Activity
} from 'lucide-react';
import { VehicleTelemetryRow } from '../views/DispatcherLiveView';

interface VehicleInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleTelemetryRow | null;
  onShortTurn?: (v: any) => void;
  onPacing?: (v: any) => void;
}

export const VehicleInspectorModal: React.FC<VehicleInspectorModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onShortTurn,
  onPacing
}) => {
  if (!isOpen || !vehicle) return null;

  const lat = vehicle.lat || 0;
  const lng = vehicle.lng || vehicle.lon || 0;
  const speed = vehicle.speed || 0;
  const heading = vehicle.heading || 0;
  const dev = vehicle.deviation_min || 0;
  const isDelay = dev > 0;
  const isTram = (vehicle.vehicle_type || 'TRAM').toUpperCase() === 'TRAM';
  const isTrolley = (vehicle.vehicle_type || 'TRAM').toUpperCase() === 'TROLLEYBUS';
  const isService = vehicle.is_service || vehicle.vehicle_type === 'SERVICE' || vehicle.route_id === 'SERVICE';
  const inDepot = vehicle.status === 'IN_DEPOT' || vehicle.route_id === 'DEPOT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Верхній градієнтний бейдж */}
        <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${
          isService 
            ? 'bg-purple-500/10' 
            : inDepot 
            ? 'bg-slate-500/10' 
            : isTram 
            ? 'bg-blue-500/10' 
            : 'bg-emerald-500/10'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs font-mono font-black ${
              isService 
                ? 'bg-purple-600 text-white' 
                : inDepot 
                ? 'bg-slate-700 text-white' 
                : isTram 
                ? 'bg-blue-600 text-white' 
                : 'bg-emerald-600 text-white'
            }`}>
              {isService ? '🛠️' : isTram ? '🚊' : '🚎'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  Борт №{vehicle.vehicle_id}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase font-mono tracking-wider ${
                  inDepot ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200' :
                  isService ? 'bg-purple-200 text-purple-900 dark:bg-purple-900/60 dark:text-purple-300' :
                  'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {inDepot ? 'У ДЕПО' : isService ? 'СПЕЦТЕХНІКА' : `МАРШРУТ №${vehicle.route_number || vehicle.route_id}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {vehicle.model || 'Пасажирський рухомий склад КП «ОМЕТ»'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Основний вміст діагностики */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* 1. Блок навігації та телеметрії */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Radio className="w-3.5 h-3.5 text-blue-600" />
              <span>Діагностика GPS-телеметрії (Wialon AVL Protocol)</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">Швидкість</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono flex items-center gap-1">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  {speed} <span className="text-[10px] font-normal text-slate-500">км/г</span>
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">Курс (Азимут)</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono flex items-center gap-1">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  {Math.round(heading)}°
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">Графіковість</span>
                <span className={`text-base font-black font-mono flex items-center gap-1 ${
                  Math.abs(dev) <= 2.0 ? 'text-emerald-700 dark:text-emerald-400' :
                  Math.abs(dev) <= 5.0 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'
                }`}>
                  <Clock className="w-4 h-4" />
                  {isDelay ? `+${dev.toFixed(1)} хв` : dev === 0 ? '0.0 хв' : `${dev.toFixed(1)} хв`}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 font-bold block">Наряд</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                  #{vehicle.duty_number || 1}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Координати та прив'язка до колії */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500">Точні гео-координати (WGS84):</span>
              <span className="font-mono font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-500">Джерело трекінгу:</span>
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Wialon Remote GPS Tracker
              </span>
            </div>
            {inDepot && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-500">Локація базування:</span>
                <span className="font-black text-purple-700 dark:text-purple-400">
                  🏢 {vehicle.depot_name || 'Депо КП «ОМЕТ»'}
                </span>
              </div>
            )}
          </div>

          {/* 3. Оснащення та сервіси для пасажирів */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Оснащення та доступність
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              <div className={`p-3 rounded-2xl border flex items-center space-x-2 ${
                vehicle.is_accessible 
                  ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300 font-black'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 font-medium'
              }`}>
                <Accessibility className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[11px]">{vehicle.is_accessible ? 'Пандус ♿' : 'Сходинки'}</span>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center space-x-2 ${
                vehicle.has_aircond 
                  ? 'bg-cyan-50/70 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-300 font-black'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 font-medium'
              }`}>
                <Snowflake className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="text-[11px]">{vehicle.has_aircond ? 'Кондиціонер ❄️' : 'Без конд.'}</span>
              </div>

              <div className={`p-3 rounded-2xl border flex items-center space-x-2 ${
                vehicle.has_wifi 
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-300 font-black'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 font-medium'
              }`}>
                <Wifi className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-[11px]">{vehicle.has_wifi ? 'Wi-Fi 📶' : 'Без Wi-Fi'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Нижня панель оперативних дій */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {!inDepot && !isService && onShortTurn && (
              <button
                onClick={() => {
                  onClose();
                  onShortTurn({
                    vehicle_id: vehicle.vehicle_id,
                    route_id: vehicle.route_id,
                    route_number: vehicle.route_number || vehicle.route_id,
                    duty_number: vehicle.duty_number || 1
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs cursor-pointer shadow-xs transition-all flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Оперативний розворот</span>
              </button>
            )}
            {!inDepot && !isService && onPacing && (
              <button
                onClick={() => {
                  onClose();
                  onPacing({
                    vehicle_id: vehicle.vehicle_id,
                    route_id: vehicle.route_id,
                    route_number: vehicle.route_number || vehicle.route_id,
                    duty_number: vehicle.duty_number || 1
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs cursor-pointer shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Регулювання темпу (Pacing)</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 cursor-pointer shadow-2xs"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleInspectorModal;
