import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, ShieldAlert, Volume2, X } from 'lucide-react';
import { useAlertStore } from '../../store/useAlertStore';

export const AirRaidBanner: React.FC = () => {
  const { isAirRaidActive, airRaidStartedAt, airRaidCity, toggleAirRaid } = useAlertStore();
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Скидаємо приховання, коли тривога стає активною знову
  useEffect(() => {
    if (isAirRaidActive) {
      setIsDismissed(false);
    }
  }, [isAirRaidActive]);

  // Підрахунок тривалості тривоги
  useEffect(() => {
    if (!isAirRaidActive) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = airRaidStartedAt ? new Date(airRaidStartedAt).getTime() : Date.now();
    
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isAirRaidActive, airRaidStartedAt]);

  if (!isAirRaidActive || isDismissed) {
    return null;
  }

  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${hrs > 0 ? `${pad(hrs)}:` : ''}${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-[94%] max-w-4xl animate-bounce-short select-none font-sans">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-2xl border-2 border-red-400/60 p-2.5 sm:px-4 sm:py-3 flex items-center justify-between backdrop-blur-md">
        
        {/* Декоративний пульсуючий ефект фону */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl blur-xs opacity-40 animate-pulse pointer-events-none" />

        {/* Ліва частина: Іконка + Текст + Таймер */}
        <div className="relative flex items-center space-x-3 z-10 truncate">
          <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 animate-pulse shadow-inner">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>

          <div className="truncate">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-300 animate-ping" />
              <span className="font-black tracking-wide text-xs sm:text-sm uppercase drop-shadow-xs">
                🚨 Повітряна тривога в {airRaidCity}
              </span>
            </div>
            
            <div className="text-[11px] text-red-100 flex items-center space-x-2 mt-0.5 font-medium">
              <span>Тривалість:</span>
              <span className="font-mono font-black text-yellow-300 text-xs bg-red-950/50 px-1.5 py-0.2 rounded border border-red-400/40">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
          </div>
        </div>

        {/* Права частина: Кнопка закриття банера (приховати з екрану) */}
        <div className="relative flex items-center space-x-2 z-10 shrink-0 ml-2">
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-xl bg-red-900/60 hover:bg-red-950 border border-red-400/40 text-red-200 hover:text-white cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
            title="Приховати сповіщення на карті"
            aria-label="Приховати сповіщення"
          >
            <span className="text-[10px] font-medium hidden sm:inline">Приховати</span>
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
