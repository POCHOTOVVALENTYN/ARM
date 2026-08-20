import React from 'react';
import { X, Printer, Download, Clock, Bus, User, FileText, CheckCircle2 } from 'lucide-react';

interface KPZCardData {
  kpz_id: string;
  date: string;
  route_number: string;
  route_name: string;
  duty_number: number;
  shift_name: string;
  driver_name: string;
  driver_tab_num: string;
  vehicle_num: string;
  second_vehicle_num?: string | null;
  depot_name: string;
  depot_arrival_time: string;
  prep_time_min: number;
  med_check_time: string;
  pullout_time: string;
  pullin_time: string;
  lunch_location: string;
  lunch_start_time: string;
  lunch_duration_min: number;
  paid_excess_break_min: number;
  total_work_hours: number;
  driving_hours: number;
  night_hours: number;
  timeline_events: Array<{ time: string; event: string }>;
}

interface KPZCardPrinterModalProps {
  data: KPZCardData | null;
  onClose: () => void;
}

export const KPZCardPrinterModal: React.FC<KPZCardPrinterModalProps> = ({ data, onClose }) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Картка обліку роботи водія (КПЗ / Бланк Зміни) — {data.kpz_id}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Друк КПЗ</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 font-sans text-xs bg-white text-slate-900 leading-relaxed print:p-0 print:overflow-visible">
          {/* Header Document Branding */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase">
                КП «Одесміськелектротранс»
              </h1>
              <p className="text-[11px] font-bold text-slate-600 uppercase">
                Служба Руху • Картка Зміни Водія (КПЗ) № {data.kpz_id}
              </p>
            </div>
            <div className="text-right font-mono text-[11px]">
              <div>Дата випуску: <strong>{data.date}</strong></div>
              <div>Депо: <strong>{data.depot_name}</strong></div>
            </div>
          </div>

          {/* Key Attributes Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Маршрут:</span>
              <span className="font-extrabold text-sm text-slate-900">№{data.route_number}</span>
              <p className="text-[10px] text-slate-500 truncate">{data.route_name}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Наряд / Зміна:</span>
              <span className="font-extrabold text-sm text-slate-900">Наряд #{data.duty_number}</span>
              <p className="text-[10px] text-indigo-600 font-bold">{data.shift_name}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Водій / Табельний:</span>
              <span className="font-extrabold text-sm text-slate-900">{data.driver_tab_num}</span>
              <p className="text-[10px] text-slate-600 font-bold">{data.driver_name}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Бортовий вагон:</span>
              <span className="font-extrabold text-sm font-mono text-slate-900">{data.vehicle_num}</span>
              {data.second_vehicle_num && (
                <p className="text-[10px] text-purple-600 font-bold">Заміна: {data.second_vehicle_num}</p>
              )}
            </div>
          </div>

          {/* Preparation & Depot Timeline Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
              <span className="text-[10px] font-sans font-bold text-indigo-700 uppercase">Підготовка в Депо:</span>
              <div className="font-bold">Явка в депо: <strong>{data.depot_arrival_time}</strong></div>
              <div>Огляд техніки: <strong>{data.prep_time_min} хв</strong></div>
              <div>Медогляд: <strong>{data.med_check_time}</strong></div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <span className="text-[10px] font-sans font-bold text-amber-700 uppercase">Обід у вікні (4–6 год):</span>
              <div className="font-bold">Пункт обіду: <strong>{data.lunch_location}</strong></div>
              <div>Час обіду: <strong>{data.lunch_start_time} ({data.lunch_duration_min} хв)</strong></div>
              {data.paid_excess_break_min > 0 && (
                <div className="text-amber-800 font-bold">Понаднормово: +{data.paid_excess_break_min} хв (оплачено)</div>
              )}
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[10px] font-sans font-bold text-emerald-700 uppercase">Підсумкові години:</span>
              <div className="font-bold">Робочий час: <strong>{data.total_work_hours} год</strong></div>
              <div>Кермовий час: <strong>{data.driving_hours} год</strong></div>
              <div>Нічні години: <strong>{data.night_hours} год</strong></div>
            </div>
          </div>

          {/* Chronological Timeline Events */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider">
              Хронологічна графік-сітка зміни КПЗ:
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {data.timeline_events.map((ev, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {ev.time}
                  </span>
                  <span className="font-medium text-slate-800 flex-1 ml-3">{ev.event}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Document Signatures */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[11px] font-bold text-slate-500">
            <div>
              <span>Підпис диспетчера депо: __________________</span>
            </div>
            <div>
              <span>Підпис водія: __________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
