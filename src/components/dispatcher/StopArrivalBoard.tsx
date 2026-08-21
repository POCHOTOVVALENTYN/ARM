import React, { useState, useEffect } from 'react';
import { Clock, Radio, Calendar, Timer, Wifi, Wind, Accessibility, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface EasyWayRouteArrival {
  id: number;
  title: string;
  directionTitle: string;
  transportName: string;
  transportKey: string;
  timeLeft: string;
  timeLeftFormatted: string;
  timeSource: 'gps' | 'schedule' | 'interval' | string;
  bortNumber?: string;
  handicapped?: boolean;
  wifi?: boolean;
  aircond?: boolean;
}

interface StopInfoResponse {
  id: number;
  title: string;
  lat: number;
  lng: number;
  routes: EasyWayRouteArrival[];
}

interface StopArrivalBoardProps {
  stopId: string | number;
  stopName: string;
}

export const StopArrivalBoard: React.FC<StopArrivalBoardProps> = ({ stopId, stopName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stopData, setStopData] = useState<StopInfoResponse | null>(null);

  const fetchEta = async () => {
    setLoading(true);
    setError(null);
    try {
      // Використовуємо реальний або тестовий ID зупинки Одеси в EasyWay (наприклад 6026 або 2688)
      const cleanId = String(stopId).replace(/^ew_\w+_\w+_/, '');
      const queryId = !isNaN(Number(cleanId)) && Number(cleanId) > 10 ? cleanId : '6026';
      
      const res = await axios.get<StopInfoResponse>(`/api/easyway/stop/${queryId}/info`);
      if (res.data && res.data.title) {
        setStopData(res.data);
      } else {
        setStopData(null);
      }
    } catch (err) {
      console.error('Failed to load EasyWay ETA:', err);
      setError('Не вдалося завантажити прогноз EasyWay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEta();
  }, [stopId]);

  return (
    <div className="w-72 max-w-sm p-1 font-sans text-slate-800 dark:text-slate-100 select-none">
      {/* Шапка зупинки */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
        <div className="truncate">
          <div className="text-[13px] font-black tracking-tight text-slate-900 dark:text-white truncate">
            🚏 {stopData?.title || stopName}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Онлайн-табло EasyWay v1.2
          </div>
        </div>
        <button
          onClick={fetchEta}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer active:scale-95 transition-all"
          title="Оновити прогноз"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Стан завантаження */}
      {loading && !stopData && (
        <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span>Отримання супутникових даних...</span>
        </div>
      )}

      {/* Помилка */}
      {error && !loading && (
        <div className="py-2 px-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Список рейсів */}
      {stopData && (
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {(!stopData.routes || stopData.routes.length === 0) ? (
            <div className="py-3 text-center text-xs text-slate-400">
              Немає активних рейсів у найближчий час
            </div>
          ) : (
            stopData.routes.map((item, idx) => {
              const isGps = item.timeSource === 'gps';
              const isSchedule = item.timeSource === 'schedule';
              const isTrolley = item.transportKey === 'trol';
              const isTram = item.transportKey === 'tram';

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between hover:border-blue-400 transition-all"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {/* Номер маршруту */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-2xs ${
                      isTram ? 'bg-red-600' : isTrolley ? 'bg-emerald-600' : 'bg-blue-600'
                    }`}>
                      {item.title}
                    </div>

                    {/* Напрямок та джерело */}
                    <div className="truncate">
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                        {item.directionTitle}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-medium">
                        {isGps && (
                          <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                            <Radio className="w-2.5 h-2.5 mr-0.5 animate-pulse" />
                            GPS
                          </span>
                        )}
                        {isSchedule && (
                          <span className="flex items-center text-blue-600 dark:text-blue-400">
                            <Calendar className="w-2.5 h-2.5 mr-0.5" />
                            Розклад
                          </span>
                        )}
                        {!isGps && !isSchedule && (
                          <span className="flex items-center text-amber-600">
                            <Timer className="w-2.5 h-2.5 mr-0.5" />
                            Інтервал
                          </span>
                        )}

                        {item.bortNumber && (
                          <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded text-[8px] text-slate-700 dark:text-slate-300">
                            №{item.bortNumber}
                          </span>
                        )}
                        {item.handicapped && (
                          <span title="Низькопідлоговий">
                            <Accessibility className="w-2.5 h-2.5 text-blue-500" />
                          </span>
                        )}
                        {item.wifi && (
                          <span title="Wi-Fi">
                            <Wifi className="w-2.5 h-2.5 text-emerald-500" />
                          </span>
                        )}
                        {item.aircond && (
                          <span title="Кондиціонер">
                            <Wind className="w-2.5 h-2.5 text-cyan-500" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Час прибуття */}
                  <div className="text-right shrink-0 ml-2">
                    <div className={`text-xs font-black font-mono ${
                      isGps ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {item.timeLeftFormatted}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Пояснення позначок */}
      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
        <span>Джерела: GPS / Розклад</span>
        <span className="text-emerald-600 font-bold">● Wialon & EasyWay Live</span>
      </div>
    </div>
  );
};
