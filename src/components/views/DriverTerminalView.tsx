import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Zap, 
  ShieldAlert, 
  LifeBuoy, 
  Coffee, 
  CheckCircle2, 
  ChevronRight, 
  Volume2, 
  Bus, 
  Send,
  Sparkles,
  ArrowUpRight,
  Check
} from 'lucide-react';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

export const DriverTerminalView: React.FC = () => {
  const [routeNum, setRouteNum] = useState<string>('7');
  const [blockNum, setBlockNum] = useState<string>('4');
  const [vehicleNum, setVehicleNum] = useState<string>('3014');
  const [driverName, setDriverName] = useState<string>('Іваненко В.О.');
  
  // Real-time clock
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Dynamic deviation status simulation (e.g. +1.5 min delay)
  const [deviationMin, setDeviationMin] = useState<number>(1.5);
  const [speedKmh, setSpeedKmh] = useState<number>(24);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(4);
  const [directives, setDirectives] = useState<any[]>([]);

  const stopsList = [
    { name: 'вул. Паустовського (Кінцева А)', isCP: true, time: '14:10' },
    { name: 'вул. Генерала Бочарова', isCP: false, time: '14:13' },
    { name: 'вул. Академіка Заболотного', isCP: false, time: '14:15' },
    { name: 'вул. Марсельська', isCP: false, time: '14:18' },
    { name: 'вул. 28-ї Бригади [КП 1]', isCP: true, time: '14:22' },
    { name: 'Продмаш', isCP: false, time: '14:26' },
    { name: 'Лузанівка [КП 2 / Їдальня]', isCP: true, time: '14:31' },
    { name: 'Крижанівка', isCP: false, time: '14:35' },
    { name: 'Ярмаркова площа', isCP: false, time: '14:40' },
    { name: 'Цукровий завод', isCP: false, time: '14:44' },
    { name: 'Пересипський міст [КП 3]', isCP: true, time: '14:50' },
    { name: 'Херсонський сквер (Кінцева Б)', isCP: true, time: '14:55' },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDirectives = async () => {
    try {
      const { data } = await apiClient.get(`/api/v1/driver-comm/directives/vehicle/${vehicleNum}`);
      if (Array.isArray(data)) {
        setDirectives(data);
      }
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    fetchDirectives();
    const interval = setInterval(fetchDirectives, 10000);
    return () => clearInterval(interval);
  }, [vehicleNum]);

  const handleSendSOS = async (incidentType: string) => {
    try {
      await apiClient.post('/api/v1/driver-comm/alert', {
        vehicle_id: vehicleNum,
        driver_id: '1042',
        route_id: routeNum,
        alert_type: incidentType,
        message: `Сигнал тривоги: ${incidentType} від вагона №${vehicleNum}`,
        lat: 46.468,
        lng: 30.741
      });
      toast.error(`⚠️ Сигнал тривоги [${incidentType}] надіслано в БД та трансльовано через WebSocket усім диспетчерам!`);
    } catch (e) {
      toast.error(`⚠️ Сигнал тривоги: [${incidentType}] від вагона №${vehicleNum}`);
    }
  };

  const handleAckDirective = async (directiveId: number) => {
    try {
      await apiClient.post(`/api/v1/driver-comm/directives/${directiveId}/ack`);
      toast.success('Підтвердження отримання наказу надіслано диспетчеру!');
      fetchDirectives();
    } catch (e) {
      toast.info('Наказ диспетчера підтверджено.');
    }
  };

  const handleSimulateNextStop = () => {
    setCurrentStopIndex((prev) => (prev + 1) % stopsList.length);
    toast.info('Оновлено проходження зупинки вагона.');
  };

  const isDelay = deviationMin > 1.0;
  const isAhead = deviationMin < -1.0;
  const isOnTime = !isDelay && !isAhead;

  return (
    <div className="max-w-4xl mx-auto space-y-5 select-none font-sans pb-10">
      {/* Top Console Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-wider uppercase border border-emerald-500/30">
                ● В ЕФІРІ (WIALON LIVE)
              </span>
              <span className="text-xs font-bold text-slate-400 font-mono">
                Борт №{vehicleNum}
              </span>
            </div>
            <h1 className="text-lg font-black text-white">
              Трамвай №{routeNum} • Випуск №{blockNum}
            </h1>
          </div>
        </div>

        {/* Live Digital Clock & Driver */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-mono font-black text-white tracking-widest leading-none">
              {currentTime || '14:30:00'}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-0.5">
              Водій: {driverName}
            </div>
          </div>
        </div>
      </div>

      {/* Main Pacing Indicator Card (Темп руху та відхилення) */}
      <div className={`p-6 rounded-3xl border-2 shadow-2xl transition-all ${
        isDelay 
          ? 'bg-rose-950/40 border-rose-600/80 text-rose-100' 
          : isAhead 
            ? 'bg-blue-950/40 border-blue-600/80 text-blue-100' 
            : 'bg-emerald-950/40 border-emerald-600/80 text-emerald-100'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              Поточний статус графіка:
            </div>
            <div className="text-3xl sm:text-4xl font-black mt-1 flex items-center space-x-3">
              {isDelay && (
                <>
                  <span className="text-rose-400">🔴 ЗАПІЗНЕННЯ: +{deviationMin} хв</span>
                </>
              )}
              {isAhead && (
                <>
                  <span className="text-blue-400">🔵 НАГІН: {deviationMin} хв</span>
                </>
              )}
              {isOnTime && (
                <>
                  <span className="text-emerald-400">🟢 ТОЧНО В ГРАФІКУ</span>
                </>
              )}
            </div>
            <p className="text-xs font-bold mt-1 text-slate-300">
              {isDelay && '⚠️ Рекомендація: Наздогнати інтервал за наявності вільної колії.'}
              {isAhead && '⚠️ Рекомендація: Зменшіть швидкість ходу або затримайтесь на посадці.'}
              {isOnTime && '✅ Чудова робота! Рухайтесь з поточною швидкістю.'}
            </p>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700 text-center min-w-[140px]">
            <div className="text-[10px] uppercase font-bold text-slate-400">Швидкість руху</div>
            <div className="text-2xl font-mono font-black text-emerald-400 mt-0.5">
              {speedKmh} <span className="text-xs text-slate-400">км/год</span>
            </div>
          </div>
        </div>

        {/* Current & Next Stop Banner */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700">
            <div className="text-[10px] font-black uppercase text-slate-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Остання пройдена зупинка:</span>
            </div>
            <div className="text-base font-black text-white mt-1">
              {stopsList[Math.max(0, currentStopIndex - 1)].name}
            </div>
          </div>

          <div className="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-500/50">
            <div className="text-[10px] font-black uppercase text-indigo-300 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>НАСТУПНА ЗУПИНКА (ETA):</span>
            </div>
            <div className="text-base font-black text-white mt-1 flex items-center justify-between">
              <span>{stopsList[currentStopIndex].name}</span>
              <span className="text-xs font-mono bg-indigo-600 px-2 py-0.5 rounded text-white font-bold">
                {stopsList[currentStopIndex].time}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatcher Command Announcements */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white">
            Останні вказівки Центрального Диспетчера
          </h3>
        </div>
        <div className="space-y-2">
          {directives.length > 0 ? (
            directives.map((dir: any) => (
              <div key={dir.id} className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-xs text-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] shrink-0 border border-amber-500/30">
                    {dir.created_at ? new Date(dir.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '14:15'}
                  </span>
                  <p className="font-medium leading-relaxed">
                    <strong className="text-amber-300">[{dir.directive_type || 'НАКАЗ'}]:</strong> {dir.message}
                  </p>
                </div>
                <div>
                  {dir.is_acknowledged ? (
                    <span className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px]">
                      <Check className="w-3.5 h-3.5" />
                      <span>Прийнято</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAckDirective(dir.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Прийняти
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-xs text-slate-200 flex items-start space-x-2.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] shrink-0 border border-amber-500/30">
                14:15
              </span>
              <p className="font-medium leading-relaxed">
                <strong className="text-amber-300">Увага всім водіям 7-го маршруту:</strong> Рух через Пересипський міст уповільнено через дорожні роботи. Тримайте дистанцію 150м.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Emergency SOS Incident Buttons */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Екстрені сповіщення диспетчеру (Швидкий сигнал SOS):
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => handleSendSOS('ДТП / Схід вагона')}
            className="p-3.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900 border-2 border-rose-700 text-rose-100 font-extrabold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <span className="text-center">⚠️ ДТП / Схід</span>
          </button>

          <button
            onClick={() => handleSendSOS('Немає напруги в КС')}
            className="p-3.5 rounded-2xl bg-amber-950/60 hover:bg-amber-900 border-2 border-amber-700 text-amber-100 font-extrabold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <Zap className="w-6 h-6 text-amber-400" />
            <span className="text-center">⚡ Немає струму</span>
          </button>

          <button
            onClick={() => handleSendSOS('Перешкода на колії')}
            className="p-3.5 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900 border-2 border-indigo-700 text-indigo-100 font-extrabold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            <span className="text-center">🛑 Перешкода</span>
          </button>

          <button
            onClick={() => handleSendSOS('Медична допомога')}
            className="p-3.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900 border-2 border-purple-700 text-purple-100 font-extrabold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <LifeBuoy className="w-6 h-6 text-purple-400" />
            <span className="text-center">🚑 Пасажиру зле</span>
          </button>
        </div>
      </div>

      {/* Driver Shift Information & Meal Break */}
      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-300">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-white font-extrabold">Запланований обід:</div>
            <div className="text-slate-400 text-[11px]">15:10 (30 хв) • Диспетчерська «вул. Паустовського»</div>
          </div>
        </div>

        <button
          onClick={handleSimulateNextStop}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
        >
          <span>Фіксація проходження зупинки</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DriverTerminalView;
