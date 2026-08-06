import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { 
  Activity, 
  Bus, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  Users, 
  Zap, 
  FileSpreadsheet, 
  Navigation, 
  Coffee, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Bell,
  MessageSquare,
  Filter,
  Search,
  Info,
  XCircle,
  Radio,
  ExternalLink
} from 'lucide-react';

export const ExecutiveDashboardView: React.FC = () => {
  const { setPath, conflicts, isDraftModified, liveBlocks, liveDuties } = useScheduleStore();
  const { routes } = useRouteStore();

  const [notificationCategory, setNotificationCategory] = useState<'all' | 'node_conflict' | 'kzpp_violation' | 'delays_slack' | 'system_info'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalTrips = liveBlocks.reduce((acc, b) => acc + b.trips.length, 0);
  const totalDrivers = liveDuties.length;
  const violatingDuties = liveDuties.filter((d) => d.isViolating10hLimit);
  const activeRoutesCount = routes.filter((r) => r.status === 'active').length;

  // Construct structured notifications feed from real state & system events
  const generateNotifications = () => {
    const list: Array<{
      id: string;
      category: 'node_conflict' | 'kzpp_violation' | 'delays_slack' | 'system_info';
      severity: 'critical' | 'warning' | 'info' | 'success';
      time: string;
      title: string;
      description: string;
      nodeOrRoute?: string;
      actionText: string;
      actionPath: string;
    }> = [];

    // 1. Node Headway Conflicts
    conflicts.forEach((conf) => {
      list.push({
        id: `conf-${conf.id}`,
        category: 'node_conflict',
        severity: 'critical',
        time: '07:45',
        title: `Критичний конфлікт паровозності на вузлі "${conf.nodeName}"`,
        description: `Мінімальний інтервал між вагонами ${conf.vehicle1Id} (${conf.vehicle1Route}) та ${conf.vehicle2Id} (${conf.vehicle2Route}) становить Δt = ${conf.actualHeadwayMin} хв (норма h ≥ ${conf.requiredHeadwayMin} хв).`,
        nodeOrRoute: conf.nodeName,
        actionText: 'Усунути у Валідаторі',
        actionPath: '/planning/validate',
      });
    });

    // 2. Labor Code (КЗпП) Violations
    violatingDuties.forEach((duty) => {
      list.push({
        id: `duty-${duty.id}`,
        category: 'kzpp_violation',
        severity: 'warning',
        time: '08:10',
        title: `Порушення 10-годинної зміни КЗпП водієм ${duty.driverName}`,
        description: `Тривалість наряду ${duty.id} складає ${duty.totalShiftMin} хв (${(duty.totalShiftMin / 60).toFixed(1)} год) при дозволеному ліміті 600 хв (10 год). Потрібно призначити підмінний наряд.`,
        nodeOrRoute: duty.id,
        actionText: 'Відкрити Табель',
        actionPath: '/crew/roster',
      });
    });

    // 3. Operational Delays & Slack
    list.push({
      id: 'delay-4012',
      category: 'delays_slack',
      severity: 'warning',
      time: '08:32',
      title: 'Оперативна затримка Трамвая №5 (б/н 4012)',
      description: 'Відхилення від розкладу складає +4.2 хв на зупинці "вул. Канатна" через скупчення автотранспорту. Рекомендовано застосувати відтяжку slack_Starosinna = 3 хв.',
      nodeOrRoute: 'Трамвай №5',
      actionText: 'Застосувати Відтяжку',
      actionPath: '/dispatch/slack',
    });

    list.push({
      id: 'delay-802',
      category: 'delays_slack',
      severity: 'info',
      time: '08:50',
      title: 'Інтервальне вирівнювання на Тролейбусі №9',
      description: 'Автоматичний розрахунок рекомендує збільшити відстій на кінцевій "Залізничний вокзал" на 2 хвилини для збереження ритмічності.',
      nodeOrRoute: 'Тролейбус №9',
      actionText: 'Графік Марея',
      actionPath: '/dispatch/marey',
    });

    // 4. System & GTFS Information
    list.push({
      id: 'sys-gtfs',
      category: 'system_info',
      severity: 'success',
      time: '07:00',
      title: 'Синхронізація статичних даних GTFS м. Одеси',
      description: 'Геометрія ліній (shapes.txt), геозони та зупинки КП «ОМЕТ» актуалізовані у Leaflet-карті симуляції.',
      nodeOrRoute: 'GTFS / Open Data',
      actionText: 'Панель GTFS',
      actionPath: '/export/gtfs',
    });

    list.push({
      id: 'sys-reserve',
      category: 'system_info',
      severity: 'info',
      time: '06:30',
      title: 'Готовність Гарячого Резерву в Депо №1',
      description: '2 вивільнені вагони трамваю та 1 тролейбус знаходяться в режимі 5-хвилинного оперативного розгортання.',
      nodeOrRoute: 'Депо №1',
      actionText: 'Гарячий Резерв',
      actionPath: '/emergency/hot-reserve',
    });

    return list;
  };

  const allNotifications = generateNotifications();

  // Filter notifications by active tab & search query
  const filteredNotifications = allNotifications.filter((n) => {
    const matchesCategory = notificationCategory === 'all' || n.category === notificationCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.nodeOrRoute && n.nodeOrRoute.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = {
    all: allNotifications.length,
    node_conflict: allNotifications.filter((n) => n.category === 'node_conflict').length,
    kzpp_violation: allNotifications.filter((n) => n.category === 'kzpp_violation').length,
    delays_slack: allNotifications.filter((n) => n.category === 'delays_slack').length,
    system_info: allNotifications.filter((n) => n.category === 'system_info').length,
  };

  const quickNavItems = [
    { label: 'Диспетчерський Графік Марея', path: '/dispatch/marey', icon: Activity, color: 'bg-indigo-600 text-white' },
    { label: 'Карта руху в реальному часі', path: '/dispatch/map', icon: MapPin, color: 'bg-emerald-600 text-white' },
    { label: 'Карта Симуляції GTFS (Leaflet)', path: '/planning/simulation', icon: Radio, color: 'bg-purple-600 text-white' },
    { label: 'Конструктор нарядів', path: '/planning/duties', icon: Bus, color: 'bg-amber-600 text-white' },
    { label: 'Валідатор КЗпП та конфліктів', path: '/planning/validate', icon: ShieldAlert, color: 'bg-rose-600 text-white' },
    { label: 'Адміністрування & Open Data', path: '/admin', icon: Download, color: 'bg-blue-600 text-white' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="brutalist-card bg-white p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Активні маршрути</span>
            <Navigation className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900 font-mono">
              {activeRoutesCount} / {routes.length}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              100% Готовність
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Трамваї (T3, T7, T12) та Тролейбуси (Tr3, Tr8)</p>
        </div>

        {/* Metric 2 */}
        <div className="brutalist-card bg-white p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Добовий обсяг рейсів</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900 font-mono">
              {totalTrips} рейсів
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {liveBlocks.length} Вагонів
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Заплановано з 05:00 до 22:30</p>
        </div>

        {/* Metric 3 */}
        <div className="brutalist-card bg-white p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Конфлікти вузлів</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-extrabold font-mono ${conflicts.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {conflicts.length}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${conflicts.length > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
              {conflicts.length > 0 ? 'Потрібна увага' : 'Норма h ≥ 2 хв'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Канальна модель (Старосінна / Тираспольська)</p>
        </div>

        {/* Metric 4 */}
        <div className="brutalist-card bg-white p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Дотримання КЗпП</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-gray-900 font-mono">
              {totalDrivers - violatingDuties.length} / {totalDrivers}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${violatingDuties.length === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              {violatingDuties.length === 0 ? '100% Норма' : `${violatingDuties.length} порушень`}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">Ліміт 10 год (з t_prep) та обід 4-5 год</p>
        </div>
      </div>

      {/* Quick Access Modules Navigation Grid */}
      <div className="space-y-3">
        <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Швидкий доступ до ключових модулів системи:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickNavItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => setPath(item.path)}
                className="brutalist-card bg-white p-4 rounded-xl hover:bg-gray-50 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-lg font-bold border border-gray-900 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {item.label}
                    </h4>
                    <span className="text-[11px] text-gray-500 font-mono">{item.path}</span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            );
          })}
        </div>
      </div>

      {/* RESTRUCTURED: NOTIFICATION & CONFLICT FEED TAB SYSTEM */}
      <div className="brutalist-card bg-white p-6 rounded-2xl space-y-5 border-2 border-slate-900 shadow-md">
        {/* Header Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200 shrink-0">
              <Bell className="w-6 h-6 animate-bounce-slow" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>ЦЕНТР ОПЕРАТИВНИХ ПОВІДОМЛЕНЬ ТА КОНФЛІКТІВ</span>
                {allNotifications.length > 0 && (
                  <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full font-mono">
                    {allNotifications.length}
                  </span>
                )}
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Класифікована стрічка подій: конфлікти паровозності, норми КЗпП, відтяжки та системні сповіщення
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Пошук повідомлення..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Sub-Tabs Navigation for Message Types */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
          {[
            { id: 'all', label: 'Усі повідомлення', icon: MessageSquare, count: categoryCounts.all },
            { id: 'node_conflict', label: '🚨 Конфлікти вузлів', icon: ShieldAlert, count: categoryCounts.node_conflict },
            { id: 'kzpp_violation', label: '⚠️ Порушення КЗпП', icon: Users, count: categoryCounts.kzpp_violation },
            { id: 'delays_slack', label: '⏱️ Затримки та Відтяжка', icon: Clock, count: categoryCounts.delays_slack },
            { id: 'system_info', label: 'ℹ️ Системні сповіщення', icon: Info, count: categoryCounts.system_info },
          ].map((tab) => {
            const isActive = notificationCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setNotificationCategory(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm scale-102'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notification Feed Items List */}
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Немає повідомлень за обраним фільтром</p>
              <p className="text-xs text-slate-500">
                Усі оперативні параметри руху та розкладу знаходяться в межах встановлених норм.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              // Badge styling by severity
              let bgStyle = 'bg-slate-50 border-slate-200';
              let badgeStyle = 'bg-slate-200 text-slate-800';
              let iconElement = <Info className="w-5 h-5 text-indigo-600" />;

              if (item.severity === 'critical') {
                bgStyle = 'bg-rose-50/70 border-rose-300';
                badgeStyle = 'bg-rose-600 text-white';
                iconElement = <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />;
              } else if (item.severity === 'warning') {
                bgStyle = 'bg-amber-50/70 border-amber-300';
                badgeStyle = 'bg-amber-500 text-slate-950 font-black';
                iconElement = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
              } else if (item.severity === 'success') {
                bgStyle = 'bg-emerald-50/70 border-emerald-300';
                badgeStyle = 'bg-emerald-600 text-white';
                iconElement = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
              }

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 ${bgStyle}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm mt-0.5">
                      {iconElement}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${badgeStyle}`}>
                          {item.severity === 'critical'
                            ? 'КРИТИЧНИЙ КОНФЛІКТ'
                            : item.severity === 'warning'
                            ? 'УВАГА / ПОРУШЕННЯ'
                            : item.severity === 'success'
                            ? 'УСПІШНО'
                            : 'ІНФОРМАЦІЯ'}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-400">
                          [{item.time}]
                        </span>

                        {item.nodeOrRoute && (
                          <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                            📍 {item.nodeOrRoute}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">{item.description}</p>
                    </div>
                  </div>

                  {/* CTA Action Button */}
                  <div className="shrink-0 pt-2 md:pt-0">
                    <button
                      onClick={() => setPath(item.actionPath)}
                      className="w-full md:w-auto px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <span>{item.actionText}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

