import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  Radio, 
  Send,
  Zap,
  ArrowRightLeft,
  MessageSquare
} from 'lucide-react';

export interface VehicleActionItem {
  vehicle_id: string;
  route_id: string;
  route_number?: string;
  duty_number?: number;
  driver_name?: string;
  speed?: number;
  deviation_min?: number;
  status?: string;
}

interface VehicleActionDropdownProps {
  vehicle: VehicleActionItem;
  onShortTurn: (vehicle: VehicleActionItem) => void;
  onPacing: (vehicle: VehicleActionItem) => void;
  onDetour: (vehicle: VehicleActionItem) => void;
  onPullIn: (vehicle: VehicleActionItem) => void;
  onSendMessage?: (vehicle: VehicleActionItem) => void;
}

export const VehicleActionDropdown: React.FC<VehicleActionDropdownProps> = ({
  vehicle,
  onShortTurn,
  onPacing,
  onDetour,
  onPullIn,
  onSendMessage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закриття при кліку поза межами
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs hover:border-blue-300 flex items-center space-x-1"
        title="Оперативні дії над бортом"
        aria-label="Оперативні дії"
      >
        <span className="text-[11px] font-bold px-1 text-slate-600 dark:text-slate-300">Дії</span>
        <MoreVertical className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/15 z-50 py-1.5 text-xs font-sans animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Заголовок меню */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-t-xl">
            <div className="font-mono font-black text-slate-900 dark:text-white flex items-center justify-between">
              <span>Борт №{vehicle.vehicle_id}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-[10px]">
                Маршрут №{vehicle.route_number || vehicle.route_id}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">
              Водій: {vehicle.driver_name || 'Черговий водій ОМЕТ'}
            </div>
          </div>

          {/* Пункти дій */}
          <div className="py-1">
            <button
              onClick={() => handleAction(() => onShortTurn(vehicle))}
              className="w-full px-3 py-2 text-left flex items-center space-x-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="block leading-tight">Оперативний розворот</span>
                <span className="text-[10px] text-amber-600/80 font-normal">Short-Turn до проміжного кільця</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(() => onPacing(vehicle))}
              className="w-full px-3 py-2 text-left flex items-center space-x-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold transition-colors cursor-pointer"
            >
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="block leading-tight">Регулювання темпу (Pacing)</span>
                <span className="text-[10px] text-blue-600/80 font-normal">Наказ: нагін або витримка на зупинці</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(() => onDetour(vehicle))}
              className="w-full px-3 py-2 text-left flex items-center space-x-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-900 dark:text-purple-300 font-bold transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="block leading-tight">Направити на об'їзд</span>
                <span className="text-[10px] text-purple-600/80 font-normal">Тимчасова зміна траси через ДТП</span>
              </div>
            </button>
          </div>

          <div className="py-1">
            {onSendMessage && (
              <button
                onClick={() => handleAction(() => onSendMessage(vehicle))}
                className="w-full px-3 py-2 text-left flex items-center space-x-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <span className="block leading-tight">Надіслати диспетчерське повідомлення</span>
                  <span className="text-[10px] text-slate-500 font-normal">Текстовий наказ на термінал водія</span>
                </div>
              </button>
            )}

            <button
              onClick={() => handleAction(() => onPullIn(vehicle))}
              className="w-full px-3 py-2 text-left flex items-center space-x-2.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <span className="block leading-tight">Зняти з лінії / Заїзд у депо</span>
                <span className="text-[10px] text-red-500/80 font-normal">Поломка / заміна на резервний борт</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
