import React from 'react'
import { Database, Bus, MapPin, Zap, Layers, Info } from 'lucide-react'

interface GtfsOverviewPanelProps {
  routesCount: number
  onLoadGtfsData: () => void
}

export const GtfsOverviewPanel: React.FC<GtfsOverviewPanelProps> = ({
  routesCount,
  onLoadGtfsData
}) => {
  return (
    <div className="space-y-6">
      {/* Top KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Перевізник / Агентство</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-lg font-black text-slate-900">КП "ОМЕТ"</p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Europe/Kiev • https://omet.od.ua</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Маршрутна Мережа</span>
            <Bus className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{routesCount} <span className="text-xs font-bold text-slate-500">номінальних</span></p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">{routesCount * 2} напрямків рухів</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Зупинки & Вузли</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">~600</p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Геоприв'язаних точок зупинок</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Обсяг Рейсів (Trips)</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">1000+</p>
          <p className="text-[11px] text-slate-500 font-mono mt-1">розкладових відміток</p>
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
              onClick={onLoadGtfsData}
              className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Імплементувати дані в графіки розкладу</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
