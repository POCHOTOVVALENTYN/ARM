import React, { useState } from 'react';
import { Route, VehicleBlock } from '../../types';
import { generateGtfsStaticFiles, generateGtfsRealtimeJson } from '../../utils/gtfsExporter';
import { 
  Download, 
  FileCode, 
  Radio, 
  CheckCircle2, 
  Copy, 
  Search, 
  Bus, 
  Database, 
  MapPin, 
  Zap, 
  RefreshCw, 
  Layers,
  Info
} from 'lucide-react';
import { GTFS_METADATA, GTFS_ROUTES } from '../../data/gtfsParsedData';
import { useScheduleStore } from '../../store/useScheduleStore';

interface GtfsIntegrationTabProps {
  routes: Route[];
  blocks: VehicleBlock[];
}

export const GtfsIntegrationTab: React.FC<GtfsIntegrationTabProps> = ({ routes = [], blocks = [] }) => {
  const { isGtfsActive, loadGtfsData, loadDefaultMockData } = useScheduleStore();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'routes' | 'static' | 'realtime'>('overview');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'tram' | 'trolleybus'>('all');

  const gtfsStatic = generateGtfsStaticFiles(routes.length > 0 ? routes : GTFS_ROUTES, blocks);
  const gtfsRealtime = generateGtfsRealtimeJson(blocks);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const filteredRoutes = GTFS_ROUTES.filter((r) => {
    const matchesSearch = 
      r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesType;
  });


  return (
    <div className="space-y-6">
      {/* Header Banner & Live GTFS Toggle */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-slate-900 font-extrabold text-lg tracking-tight">
                Інтеграційний модуль GTFS & Open Data м. Одеси
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isGtfsActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'
              }`}>
                {isGtfsActive ? 'Активні GTFS Дані' : 'Симуляційний Режим'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Комплексний аналіз та синхронізація 48 реальних маршрутів електротранспорту КП «Одесміськелектротранс» з сервісами EasyWay, Google Maps та міськими валідаторами.
            </p>
          </div>
        </div>

        {/* Action Controls & Subtabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          {/* Data Switcher Toggle Button */}
          {isGtfsActive ? (
            <button
              onClick={loadDefaultMockData}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xs"
              title="Повернутися до тестових симуляційних даних"
            >
              <RefreshCw className="w-4 h-4 text-slate-600" />
              <span>Повернути демо-графік</span>
            </button>
          ) : (
            <button
              onClick={loadGtfsData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
              title="Завантажити та активувати реальний розклад з gtfs_static_data"
            >
              <Zap className="w-4 h-4 fill-white text-white" />
              <span>Задіяти реальні GTFS-дані</span>
            </button>
          )}

          {/* Subtab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Аналіз БД
            </button>
            <button
              onClick={() => setActiveSubTab('routes')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'routes'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Маршрути ({GTFS_METADATA.totalUniqueRouteNumbers})
            </button>
            <button
              onClick={() => setActiveSubTab('static')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'static'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GTFS Static
            </button>
            <button
              onClick={() => setActiveSubTab('realtime')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeSubTab === 'realtime'
                  ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GTFS-RT Stream
            </button>
          </div>
        </div>
      </div>

      {/* Subtab 1: GTFS Overview & Metrics */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Перевізник / Агентство</span>
                <Database className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-lg font-black text-slate-900">{GTFS_METADATA.agencyName}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">{GTFS_METADATA.timezone} • {GTFS_METADATA.agencyUrl}</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Маршрутна Мережа</span>
                <Bus className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{GTFS_METADATA.totalUniqueRouteNumbers} <span className="text-xs font-bold text-slate-500">номінальних</span></p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">{GTFS_METADATA.totalRoutes} напрямків рухів</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Зупинки & Вузли</span>
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{GTFS_METADATA.totalStops}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Геоприв'язаних точок зупинок</p>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Обсяг Рейсів (Trips)</span>
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">{GTFS_METADATA.totalTrips.toLocaleString('uk-UA')}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">{GTFS_METADATA.totalStopTimes.toLocaleString('uk-UA')} розкладових відміток</p>
            </div>
          </div>

          {/* Detailed Structure Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Структура GTFS Static Файлів в `/gtfs_static_data/`</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">Стандарт GTFS Spec v2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>📄 agency.txt</span>
                    <span className="text-emerald-600">1 запис</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Інформація про оператора КП «Одесміськелектротранс»</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>📄 routes.txt</span>
                    <span className="text-emerald-600">48 записів</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Трамвайні та тролейбусні лінійні маршрути м. Одеси</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>📄 stops.txt</span>
                    <span className="text-emerald-600">638 записів</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Точні GPS-координати та назви пасажирських зупинок</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>📄 trips.txt</span>
                    <span className="text-emerald-600">3,489 записів</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Графіки обороту вагонів за номерами рейсів та блоків</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>📄 stop_times.txt</span>
                    <span className="text-emerald-600">89,233 записи</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Точний розклад прибуття та відправлення за кожною зупинкою</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>📄 calendar.txt / dates</span>
                    <span className="text-emerald-600">Календар типів</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Матриця випуску на робочі, вихідні та святкові дні</p>
                </div>
              </div>
            </div>

            {/* Daily Operational Summary */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Підсумок Випуску Техніки</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  За результатами аналізу GTFS-файлів Одеси, нормативний плановий випуск рухомого складу становить:
                </p>

                <div className="space-y-2 font-mono text-xs pt-2">
                  <div className="flex justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold">
                    <span>Вихідні дні (Weekend):</span>
                    <span>175 одиниць ТЗ</span>
                  </div>

                  <div className="flex justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold">
                    <span>Святковий випуск (Holiday):</span>
                    <span>150 одиниць ТЗ</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={loadGtfsData}
                  className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Імплементувати дані в графіки розкладу</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Routes Master Inspector */}
      {activeSubTab === 'routes' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Пошук за номером або назвою маршруту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Усі ({GTFS_ROUTES.length})
              </button>
              <button
                onClick={() => setFilterType('tram')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'tram' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Трамваї ({GTFS_ROUTES.filter(r => r.type === 'tram').length})
              </button>
              <button
                onClick={() => setFilterType('trolleybus')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'trolleybus' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Тролейбуси ({GTFS_ROUTES.filter(r => r.type === 'trolleybus').length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Тип / №</th>
                  <th className="py-3 px-4">Назва Маршруту (Термінали)</th>
                  <th className="py-3 px-4">Зупинки</th>
                  <th className="py-3 px-4">Довжина (км)</th>
                  <th className="py-3 px-4 text-center">Випуск (Робочий / Вихідний)</th>
                  <th className="py-3 px-4">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-white font-mono text-xs ${
                        route.type === 'tram' ? 'bg-red-600' : 'bg-blue-600'
                      }`}>
                        <span>{route.type === 'tram' ? 'Тм' : 'Тр'}</span>
                        <span>{route.number}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{route.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{route.stations.length} станцій</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{route.lengthDir1Km} км</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Активний GTFS</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: GTFS Static Exporter Files */}
      {activeSubTab === 'static' && (
        <div className="space-y-4">
          <h3 className="text-slate-900 font-extrabold text-sm">Згенеровані специфікаційні файли GTFS Static Specification:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(gtfsStatic).map(([filename, content]) => (
              <div key={filename} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono font-bold text-indigo-600 text-sm flex items-center space-x-2">
                      <FileCode className="w-4 h-4" />
                      <span>{filename}</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(content, filename)}
                      className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer"
                      title="Скопіювати у буфер"
                    >
                      {copiedFile === filename ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <pre className="mt-3 bg-slate-50 border border-slate-100 p-3 rounded-xl text-[11px] font-mono text-slate-700 max-h-48 overflow-y-auto whitespace-pre">
                    {content}
                  </pre>
                </div>
                <button
                  onClick={() => copyToClipboard(content, filename)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedFile === filename ? 'Скопійовано!' : 'Завантажити / Скопіювати'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 4: GTFS Realtime Stream */}
      {activeSubTab === 'realtime' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
            <div>
              <h3 className="text-slate-900 font-extrabold text-base">Потік даних GTFS-Realtime (Live Telematics Stream):</h3>
              <p className="text-xs text-slate-500">Автоматична оновлюваність позицій вагонів та коефіцієнтів затримок</p>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(gtfsRealtime, null, 2), 'gtfs_rt')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedFile === 'gtfs_rt' ? 'Скопійовано!' : 'Скопіювати JSON'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 text-emerald-400 p-5 rounded-2xl text-xs font-mono max-h-96 overflow-y-auto border border-slate-800">
            {JSON.stringify(gtfsRealtime, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

