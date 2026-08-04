import React from 'react';
import { 
  X, 
  FileText, 
  Layers, 
  Cpu, 
  Table, 
  GitMerge, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertTriangle 
} from 'lucide-react';

interface AnalyticalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticalReportModal: React.FC<AnalyticalReportModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Аналітичний звіт та Технічне завдання
              </h2>
              <p className="text-xs text-slate-400">
                КП «Одесміськелектротранс» — Розробка АРМ «Розклади» з дворічневою архітектурою
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-8 text-slate-300 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Executive Summary */}
          <div className="bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-xl p-5">
            <h3 className="text-amber-400 font-semibold text-base mb-2 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <span>Аналітичне резюме проєкту</span>
            </h3>
            <p className="text-slate-300">
              Організація руху міського електричного транспорту в КП «Одесміськелектротранс» (КП ОМЕТ) становить складну просторово-часову задачу. Традиційний лінійний підхід до планування не здатен забезпечити одночасну довгострокову стабільність та оперативну гнучкість у міських умовах Одеси.
            </p>
          </div>

          {/* 1. Two-Level System Architecture Comparison */}
          <section className="space-y-4">
            <h3 className="text-white font-bold text-base flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <span>1. Дворічнева архітектура обчислювальної системи</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Level 1 Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-sky-400 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Рівень 1: Статична планова система</span>
                </div>
                <p className="text-xs text-slate-400">
                  Формування фундаментального розкладу руху на довгостроковий період (сезон, тип дня: «Робочий», «Вихідний», «Святковий»).
                </p>
                <ul className="text-xs space-y-1 text-slate-300 list-disc list-inside pt-2">
                  <li>Норматив часу ходу з сегментацією за періодами доби.</li>
                  <li>Статичні інтервали (I = T_rev / N).</li>
                  <li>База даних планових випусків, підготовчо-заключний час.</li>
                  <li>Офіційний документ для пасажирів та нарядів депо.</li>
                </ul>
              </div>

              {/* Level 2 Card */}
              <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                  <Cpu className="w-4 h-4" />
                  <span>Рівень 2: Динамічна оперативно-диспетчерська система</span>
                </div>
                <p className="text-xs text-slate-400">
                  Надбудова над статичним розкладом у режимі реального часу для адаптації до аномалій міського середовища.
                </p>
                <ul className="text-xs space-y-1 text-slate-300 list-disc list-inside pt-2">
                  <li>Урахування світлофорів, заторів, неправильного паркування, ДТП.</li>
                  <li>Автоматична адаптація до обривів контактної мережі та злив.</li>
                  <li>Автоматичний перерозподіл, відтяжки, об'їзди та гарячий резерв.</li>
                </ul>
              </div>
            </div>

            {/* Architecture Comparison Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Параметр / Фактор</th>
                    <th className="p-3 text-sky-400">Рівень 1: Статична система</th>
                    <th className="p-3 text-amber-400">Рівень 2: Динамічна система</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3 font-medium text-white">Основне призначення</td>
                    <td className="p-3">Базова сітка та водійські книжки</td>
                    <td className="p-3">Оперативне вирівнювання інтервалів та усунення збоїв</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Джерело даних</td>
                    <td className="p-3">Довідники норм часу ходу, графіки випусків</td>
                    <td className="p-3">GPS-телематика, сповіщення диспетчера</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Час ходу між зупинками</td>
                    <td className="p-3">Нормативно-статичний (за періодами доби)</td>
                    <td className="p-3">Динамічний (із коефіцієнтами заторів γ)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Урахування світлофорів</td>
                    <td className="p-3">Усереднений часовий норматив</td>
                    <td className="p-3">Динамічний фазовий розрахунок затримки</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Модель вузлів («Зв'язок»)</td>
                    <td className="p-3">Перевірка базового інтервалу між ТЗ</td>
                    <td className="p-3">Розрахунок канальної місткості та векторів руху</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Реакція на збої</td>
                    <td className="p-3 text-slate-500">Відсутня (статичний графік)</td>
                    <td className="p-3 text-amber-400">Автоматичний перерозподіл, відтяжки, об'їзди</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 2. Mathematical Steps */}
          <section className="space-y-4">
            <h3 className="text-white font-bold text-base flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span>2. Логічні та математичні етапи розрахунку розкладу руху</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400">Етап 1: Топологічний аналіз та оборотний рейс</span>
                <p>Обчислення оборотного часу з урахуванням 2 хвилин обов'язкової диспетчерської відмітки:</p>
                <div className="bg-slate-900 font-mono p-2 rounded text-emerald-300 border border-slate-800">
                  T_rev = t_dir1 + t_dir2 + 2 * t_disp
                </div>
                <div className="bg-slate-900 font-mono p-2 rounded text-amber-300 border border-slate-800">
                  T_rev_dynamic = ∑ (t_segment_k * γ(t, S_k)) + 2 * t_disp
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400">Етап 2: Пул нарядів та відокремлення сутностей</span>
                <p>Суворе розділення фізичного транспортного засобу та зміни водія:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong className="text-white">Block_ID (Блок вагона):</strong> послідовність рейсів ТЗ від виїзду з депо до повернення.</li>
                  <li><strong className="text-white">Duty_ID (Зміна водія):</strong> робочий час конкретного керманича.</li>
                  <li>Типи нарядів: Однозмінний, Двозмінний, Піковий, Розривний.</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400">Етап 3: Інтервал та виїзд з депо</span>
                <div className="bg-slate-900 font-mono p-2 rounded text-sky-300 border border-slate-800">
                  I = T_rev / N
                </div>
                <div className="bg-slate-900 font-mono p-2 rounded text-sky-300 border border-slate-800">
                  t_depot_exit = t_first_trip_start - t_zero_run - t_prep
                </div>
                <p className="text-slate-400">
                  * Підготовчо-заключний час (t_prep): 10 хвилин для трамвая, 19 хвилин для тролейбуса.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-amber-400">Етап 4 & 5: Праця водіїв та канальні вузли</span>
                <ul className="space-y-1 list-disc list-inside text-slate-300">
                  <li>Гранична тривалість зміни: <strong className="text-rose-400">T_shift ≤ 600 хвилин (10 годин)</strong>.</li>
                  <li>Початкове вікно обіду: <strong className="text-emerald-400">t_lunch_start ≥ t_shift_start + 240 хв (через 4 год)</strong>.</li>
                  <li>Мінімальний інтервал у вузлі: <strong className="text-amber-300">h_min = 2–4 хвилини</strong>.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Norms & Rules Table */}
          <section className="space-y-4">
            <h3 className="text-white font-bold text-base flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Table className="w-5 h-5 text-amber-400" />
              <span>3. Порівняльна таблиця нормативів (Трамвай vs Тролейбус)</span>
            </h3>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-slate-950 text-slate-200 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Параметр розрахунку</th>
                    <th className="p-3 text-rose-400">Трамвайний транспорт</th>
                    <th className="p-3 text-sky-400">Тролейбусний транспорт</th>
                    <th className="p-3">Виробниче обґрунтування</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3 font-medium text-white">Підготовчо-заключний час (t_prep)</td>
                    <td className="p-3 font-bold text-rose-300">10 хвилин</td>
                    <td className="p-3 font-bold text-sky-300">19 хвилин</td>
                    <td className="p-3 text-slate-400">Огляд рейдів, струмоприймачів та пневмосистеми</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Базовий інтервал у «зв'язці» (h_min)</td>
                    <td className="p-3">2 хвилини</td>
                    <td className="p-3">2 хвилини</td>
                    <td className="p-3 text-slate-400">Мінімальний часовий інтервал безпеки</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Конкурентний інтервал «зв'язки»</td>
                    <td className="p-3">3–4 хвилини</td>
                    <td className="p-3">3–4 хвилини</td>
                    <td className="p-3 text-slate-400">Захист від «перехоплення» пасажирів</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Диспетчерська відмітка (t_disp)</td>
                    <td className="p-3">2 хвилини</td>
                    <td className="p-3">2 хвилини</td>
                    <td className="p-3 text-slate-400">Нормативний вистій на кінцевій станції</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Тривалість обіду (t_lunch)</td>
                    <td className="p-3">10–15 хвилин</td>
                    <td className="p-3">10–20 хвилин</td>
                    <td className="p-3 text-slate-400">Режим відпочинку на ДП або Старосінній пл.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Гранична тривалість зміни (T_shift)</td>
                    <td className="p-3 font-bold text-amber-300">10 годин (600 хв)</td>
                    <td className="p-3 font-bold text-amber-300">10 годин (600 хв)</td>
                    <td className="p-3 text-slate-400">Максимальна робоча зміна водія за КЗпП</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Максимальна відтяжка (Δt_slack)</td>
                    <td className="p-3">До 10 хвилин</td>
                    <td className="p-3">До 10 хвилин</td>
                    <td className="p-3 text-slate-400">Ручне оперативне вирівнювання інтервалу</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Node Validation & Python Code Reference */}
          <section className="space-y-3 bg-slate-950 p-5 rounded-xl border border-slate-800">
            <h3 className="text-white font-bold text-base flex items-center space-x-2">
              <GitMerge className="w-5 h-5 text-purple-400" />
              <span>4. Алгоритм валідації канальних вузлів (Старосінна площа)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Спеціальна канальна модель моделює вузол як множину паралельних колій (Channel 1..k). Перевірка h_min здійснюється лише між ТЗ, які претендують на той самий колійний канал та напрямок:
            </p>
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono border border-slate-800 overflow-x-auto">
{`def check_node_capacity_and_headway(node_id, target_vehicle, arrival_time, node_db):
    node_info = node_db.get_node(node_id)
    # 5-6 колій для Старосінньої площі
    conflicting_vehicles = [
        v for v in node_info.active_vehicles
        if v.assigned_track == target_vehicle.assigned_track
        and v.direction_vector == target_vehicle.direction_vector
    ]
    for v in conflicting_vehicles:
        delta = abs(arrival_time - v.arrival_time)
        if delta < node_info.min_headway: # 2-4 хвилини
            return {
                "has_conflict": True,
                "conflict_node": node_id,
                "track_id": target_vehicle.assigned_track,
                "required_headway": node_info.min_headway,
                "actual_headway": delta
            }
    return {"has_conflict": False}`}
            </pre>
          </section>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between sticky bottom-0">
          <div className="text-xs text-slate-400">
            КП «Одесміськелектротранс» • Служба руху та АСУ
          </div>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition-all text-sm shadow-md"
          >
            Зрозуміло, перейти до роботи
          </button>
        </div>

      </div>
    </div>
  );
};
