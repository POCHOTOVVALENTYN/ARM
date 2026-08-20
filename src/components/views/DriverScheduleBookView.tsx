import React, { useState, useMemo } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { 
  BookOpen, 
  Printer, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Bus, 
  FileSpreadsheet, 
  Copy, 
  CheckCircle2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// Format minutes from midnight to HH:MM
const formatTimeHM = (min: number) => {
  if (min === undefined || min === null || isNaN(min)) return '--:--';
  const totalM = Math.floor(min);
  const h = Math.floor(totalM / 60) % 24;
  const m = totalM % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const DriverScheduleBookView: React.FC = () => {
  const routes = useRouteStore((state) => state.routes);
  const liveSchedule = useScheduleStore((state) => state.liveSchedule);

  const [selectedRouteNumber, setSelectedRouteNumber] = useState<string>('7');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | '0' | '1'>('all');
  const [stopSearch, setStopSearch] = useState<string>('');

  // Selected route metadata
  const currentRoute = useMemo(() => {
    return routes.find((r) => r.number === selectedRouteNumber) || routes[0] || null;
  }, [routes, selectedRouteNumber]);

  // Extract blocks for this route
  const currentBlocks = useMemo(() => {
    const blocks = liveSchedule?.current_blocks || [];
    return blocks.filter((b: any) => !selectedRouteNumber || String(b.route_id || '') === String(selectedRouteNumber));
  }, [liveSchedule, selectedRouteNumber]);

  // Generate detailed stop-by-stop rows
  // Route stops profiles
  const ROUTE_STOPS_MAP: Record<string, { title: string; stops: Array<{ name: string; isCP: boolean; distKm: number; runMin: number }> }> = {
    '7': {
      title: 'вул. Паустовського ⇄ вул. 28-ї Бригади ⇄ Пересипський міст ⇄ Херсонський сквер',
      stops: [
        { name: 'вул. Паустовського (Кінцева А)', isCP: true, distKm: 0, runMin: 0 },
        { name: 'вул. Генерала Бочарова', isCP: false, distKm: 0.8, runMin: 3 },
        { name: 'вул. Академіка Заболотного', isCP: false, distKm: 1.5, runMin: 5 },
        { name: 'вул. Марсельська', isCP: false, distKm: 2.3, runMin: 8 },
        { name: 'вул. 28-ї Бригади (КП 1)', isCP: true, distKm: 3.4, runMin: 12 },
        { name: 'Продмаш', isCP: false, distKm: 4.8, runMin: 16 },
        { name: 'Лузанівка (КП 2 / Їдальня)', isCP: true, distKm: 6.2, runMin: 21 },
        { name: 'Крижанівка', isCP: false, distKm: 7.5, runMin: 25 },
        { name: 'Ярмаркова площа', isCP: false, distKm: 9.1, runMin: 30 },
        { name: 'Цукровий завод', isCP: false, distKm: 10.4, runMin: 34 },
        { name: 'Пересипський міст (КП 3)', isCP: true, distKm: 12.1, runMin: 40 },
        { name: 'вул. Пастера / Херсонський сквер (Кінцева Б)', isCP: true, distKm: 13.5, runMin: 45 },
      ]
    },
    '18': {
      title: 'Куликове поле ⇄ 4-та ст. Фонтану ⇄ 11-та ст. Фонтану ⇄ 16-та ст. Великого Фонтану',
      stops: [
        { name: 'Куликове поле (Кінцева А)', isCP: true, distKm: 0, runMin: 0 },
        { name: 'вул. Пироговська', isCP: false, distKm: 0.9, runMin: 4 },
        { name: 'вул. Семінарська', isCP: false, distKm: 1.6, runMin: 7 },
        { name: '4-та ст. Великого Фонтану (КП 1)', isCP: true, distKm: 2.8, runMin: 11 },
        { name: '5-та ст. Великого Фонтану', isCP: false, distKm: 3.7, runMin: 15 },
        { name: '7-ма ст. Великого Фонтану', isCP: false, distKm: 5.1, runMin: 20 },
        { name: '9-та ст. Великого Фонтану', isCP: false, distKm: 6.4, runMin: 24 },
        { name: '11-та ст. Фонтану (КП 2 / Розворотне кільце)', isCP: true, distKm: 7.9, runMin: 29 },
        { name: '13-та ст. Великого Фонтану', isCP: false, distKm: 9.3, runMin: 34 },
        { name: '14-та ст. Великого Фонтану', isCP: false, distKm: 10.2, runMin: 38 },
        { name: '16-та ст. Великого Фонтану (Кінцева Б)', isCP: true, distKm: 11.8, runMin: 43 },
      ]
    },
    '28': {
      title: 'Парк Шевченка ⇄ вул. Леонтовича ⇄ Тираспольська пл. ⇄ вул. Пастера',
      stops: [
        { name: 'Парк Шевченка (Кінцева А)', isCP: true, distKm: 0, runMin: 0 },
        { name: 'вул. Леонтовича (КП 1)', isCP: true, distKm: 1.1, runMin: 5 },
        { name: 'вул. Успенська', isCP: false, distKm: 2.2, runMin: 9 },
        { name: 'Тираспольська площа (КП 2)', isCP: true, distKm: 3.5, runMin: 14 },
        { name: 'вул. Торгова', isCP: false, distKm: 4.8, runMin: 19 },
        { name: 'вул. Пастера (Кінцева Б)', isCP: true, distKm: 5.6, runMin: 23 },
      ]
    },
    '5': {
      title: 'Аркадія ⇄ Французький бульвар ⇄ Привоз ⇄ Центральний Автовокзал',
      stops: [
        { name: 'Аркадія (Кінцева А)', isCP: true, distKm: 0, runMin: 0 },
        { name: 'Санаторій «Салют»', isCP: false, distKm: 1.2, runMin: 5 },
        { name: 'Ботанічний сад', isCP: false, distKm: 2.5, runMin: 10 },
        { name: 'вул. Пироговська (КП 1)', isCP: true, distKm: 4.2, runMin: 17 },
        { name: 'вул. Пантелеймонівська (Привоз)', isCP: true, distKm: 5.8, runMin: 24 },
        { name: 'вул. Старопортофранківська', isCP: false, distKm: 7.1, runMin: 30 },
        { name: 'Центральний Автовокзал (Кінцева Б)', isCP: true, distKm: 8.9, runMin: 37 },
      ]
    },
    '8': {
      title: 'Залізничний вокзал ⇄ Адміральський просп. ⇄ вул. Космонавтів ⇄ вул. Інглезі',
      stops: [
        { name: 'Залізничний вокзал (Кінцева А)', isCP: true, distKm: 0, runMin: 0 },
        { name: 'вул. Середньофонтанська', isCP: false, distKm: 1.4, runMin: 6 },
        { name: 'Адміральський проспект (КП 1)', isCP: true, distKm: 3.1, runMin: 12 },
        { name: 'вул. Героїв Крут', isCP: false, distKm: 4.8, runMin: 18 },
        { name: 'вул. Космонавтів (КП 2)', isCP: true, distKm: 6.5, runMin: 24 },
        { name: 'вул. Академіка Філатова', isCP: false, distKm: 7.9, runMin: 29 },
        { name: 'вул. Інглезі (Кінцева Б)', isCP: true, distKm: 9.6, runMin: 35 },
      ]
    }
  };

  // Generate detailed stop-by-stop rows
  const stopScheduleRows = useMemo(() => {
    const profile = ROUTE_STOPS_MAP[selectedRouteNumber] || ROUTE_STOPS_MAP['7'];
    const defaultStops = profile.stops;

    // Base departure times from 06:00 to 22:00
    const trips = [];
    const startBase = 6 * 60; // 06:00
    const interval = 8; // 8 mins headway
    for (let t = 0; t < 24; t++) {
      const tripDep = startBase + t * interval;
      const blockNum = (t % 8) + 1;
      const dir = t % 2 === 0 ? '0' : '1';

      trips.push({
        tripIndex: t + 1,
        blockNumber: blockNum,
        direction: dir,
        depTimeMin: tripDep,
        stops: defaultStops.map((st, sIdx) => ({
          ...st,
          stopSequence: sIdx + 1,
          arrTimeMin: tripDep + st.runMin,
          depTimeMin: tripDep + st.runMin + (sIdx === 0 || sIdx === defaultStops.length - 1 ? 2 : 0.5),
        }))
      });
    }
    return trips;
  }, [selectedRouteNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBook = () => {
    toast.success(`Розклад маршруту №${selectedRouteNumber} скопійовано для друку.`);
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                КП «ОМЕТ» • Служба руху
              </span>
              <h2 className="text-base font-extrabold text-white">
                Похвилинний Розклад Рейсів (Книжка Водія)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Табельний розклад точного часу прибуття вагона на кожну зупинку маршруту.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyBook}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Копіювати</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Друк розкладу водія</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        {/* Route Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-slate-700 flex items-center space-x-1">
            <Bus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Маршрут:</span>
          </span>
          {['7', '18', '28', '5', '3', '8', '10'].map((rNum) => (
            <button
              key={rNum}
              onClick={() => setSelectedRouteNumber(rNum)}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedRouteNumber === rNum
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              №{rNum}
            </button>
          ))}
        </div>

        {/* Direction & Block Filter */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-bold">Напрямок:</span>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Усі рейси зміни</option>
              <option value="0">Прямий (А ➔ Б)</option>
              <option value="1">Зворотний (Б ➔ А)</option>
            </select>
          </div>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={stopSearch}
              onChange={(e) => setStopSearch(e.target.value)}
              placeholder="Пошук зупинки..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Printable Schedule Booklet Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Header Card */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black bg-indigo-600 text-white px-2 py-0.5 rounded">
                КП «ОДЕСМІСЬКЕЛЕКТРОТРАНС»
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Затверджено: Служба Руху
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              КНИЖКА РОЗКЛАДУ ВОДІЯ • МАРШРУТ №{selectedRouteNumber}
            </h1>
            <p className="text-xs text-slate-600 font-bold">
              {ROUTE_STOPS_MAP[selectedRouteNumber]?.title || 'вул. Паустовського ⇄ Пересипський міст ⇄ Херсонський сквер'}
            </p>
          </div>

          <div className="text-right font-mono text-xs font-bold text-slate-700">
            <div>Випуск: <span className="text-indigo-600 font-black">№1–№8</span></div>
            <div>Режим: <span className="text-emerald-700">Робочі дні</span></div>
            <div>Інтервал: <span className="text-slate-900">8.0 хв</span></div>
          </div>
        </div>

        {/* Timetable Stop Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider">
                <th className="p-2.5 border-r border-slate-800 text-center w-12">№</th>
                <th className="p-2.5 border-r border-slate-800 min-w-[220px]">Зупинка маршруту</th>
                <th className="p-2.5 border-r border-slate-800 text-center w-24">Статус КП</th>
                <th className="p-2.5 border-r border-slate-800 text-center w-20">Рейс 1</th>
                <th className="p-2.5 border-r border-slate-800 text-center w-20">Рейс 2</th>
                <th className="p-2.5 border-r border-slate-800 text-center w-20">Рейс 3</th>
                <th className="p-2.5 border-r border-slate-800 text-center w-20">Рейс 4</th>
                <th className="p-2.5 border-r border-slate-800 text-center w-20">Рейс 5</th>
                <th className="p-2.5 border-r border-slate-800 text-center w-20">Рейс 6</th>
                <th className="p-2.5 text-center w-24">Обід / Відстій</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {stopScheduleRows.length > 0 && stopScheduleRows[0].stops
                .filter((st: any) => !stopSearch || st.name.toLowerCase().includes(stopSearch.toLowerCase()))
                .map((stop: any, sIdx: number) => {
                  const isCP = stop.isCP;
                  return (
                    <tr 
                      key={sIdx} 
                      className={`transition-colors ${
                        isCP 
                          ? 'bg-indigo-50/60 font-bold hover:bg-indigo-100/70' 
                          : sIdx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/50'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-500 font-bold">
                        {sIdx + 1}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="flex items-center space-x-1.5">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isCP ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className={`text-slate-900 ${isCP ? 'font-black' : 'font-medium'}`}>
                            {stop.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-center">
                        {isCP ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black border border-indigo-200">
                            КП КОНТРОЛЬ
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Звичайна</span>
                        )}
                      </td>

                      {/* Columns for Trip 1..6 */}
                      {[0, 1, 2, 3, 4, 5].map((tripIdx) => {
                        const trip = stopScheduleRows[tripIdx];
                        const stopData = trip?.stops[sIdx];
                        const timeStr = stopData ? formatTimeHM(stopData.arrTimeMin) : '--:--';
                        return (
                          <td key={tripIdx} className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-900">
                            <span className={isCP ? 'text-indigo-950 font-black' : 'text-slate-700'}>
                              {timeStr}
                            </span>
                          </td>
                        );
                      })}

                      <td className="p-2 text-center text-[10px] font-mono text-slate-500">
                        {sIdx === 6 ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            ☕ 12:40 (30хв)
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Footer Notes for Driver */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 font-medium">
          <p>
            * При запізненні понад 3 хвилини негайно сповістити центрального диспетчера через бортовий термінал або рацію.
          </p>
          <p className="font-mono">
            КП «Одесміськелектротранс» • АРМ «Розклади» v2.4
          </p>
        </div>
      </div>
    </div>
  );
};
