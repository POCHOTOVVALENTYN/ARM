import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Printer, 
  Download, 
  RotateCcw, 
  Clock, 
  Zap, 
  Bus, 
  AlertTriangle, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Layers, 
  ChevronDown, 
  ShieldAlert, 
  Activity,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import apiClient from '../../utils/apiClient';
import { useRouteStore } from '../../store/useRouteStore';
import { CreateDispatchOrderModal } from '../modals/CreateDispatchOrderModal';
import { toast } from 'sonner';

export interface DispatchOrder {
  id: number;
  order_number: string;
  created_at: string;
  completed_at: string | null;
  dispatcher_name: string;
  dispatcher_id: string | null;
  route_id: string;
  route_number: string;
  transport_type: string;
  vehicle_id: string | null;
  duty_number: number | null;
  driver_name: string | null;
  order_type: string;
  target_location: string | null;
  duration_min: number | null;
  reason: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
}

export interface DispatchStats {
  total_today: number;
  active_count: number;
  completed_count: number;
  short_turns_count: number;
  pacing_count: number;
  pull_in_count: number;
  detour_count: number;
  service_calls_count: number;
}

export const DispatchOrdersJournalView: React.FC = () => {
  const { routes } = useRouteStore();

  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [stats, setStats] = useState<DispatchStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Фільтри
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const [selectedRoute, setSelectedRoute] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedDate !== 'ALL') params.date_str = selectedDate;
      if (selectedRoute !== 'ALL') params.route_id = selectedRoute;
      if (selectedType !== 'ALL') params.order_type = selectedType;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      const [ordersRes, statsRes] = await Promise.all([
        apiClient.get<DispatchOrder[]>('/dispatch/orders', { params }),
        apiClient.get<DispatchStats>('/dispatch/orders/stats')
      ]);

      setOrders(ordersRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      console.error('Помилка завантаження журналу розпоряджень:', error);
      toast.error('Не вдалося завантажити журнал розпоряджень');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedDate, selectedRoute, selectedType, selectedStatus]);

  const handleCompleteOrder = async (orderId: number) => {
    try {
      await apiClient.patch(`/dispatch/orders/${orderId}/complete`);
      toast.success('Розпорядження позначено як виконане');
      fetchOrders();
    } catch (error) {
      toast.error('Помилка оновлення статусу');
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      await apiClient.patch(`/dispatch/orders/${orderId}/cancel`);
      toast.success('Розпорядження скасовано');
      fetchOrders();
    } catch (error) {
      toast.error('Помилка скасування');
    }
  };

  // Пошукова фільтрація на клієнті
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(o => 
      o.order_number.toLowerCase().includes(q) ||
      o.route_number.toLowerCase().includes(q) ||
      (o.vehicle_id && o.vehicle_id.toLowerCase().includes(q)) ||
      (o.driver_name && o.driver_name.toLowerCase().includes(q)) ||
      o.dispatcher_name.toLowerCase().includes(q) ||
      o.reason.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q) ||
      (o.target_location && o.target_location.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  // Друк офіційного бланку КП ОМЕТ
  const handlePrint = () => {
    window.print();
  };

  // Експорт у CSV (Excel-сумісний)
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('Немає даних для експорту');
      return;
    }

    const headers = ['Номер наказу', 'Час видачі', 'Маршрут', 'Борт', 'Наряд', 'Водій', 'Тип заходу', 'Локація/Кільце', 'Причина', 'Зміст розпорядження', 'Диспетчер', 'Статус'];
    
    const rows = filteredOrders.map(o => [
      `"${o.order_number}"`,
      `"${new Date(o.created_at).toLocaleString('uk-UA')}"`,
      `"${o.transport_type === 'TROLLEYBUS' ? 'Тролейбус' : 'Трамвай'} №${o.route_number}"`,
      `"${o.vehicle_id || '—'}"`,
      `"${o.duty_number ? '#' + o.duty_number : '—'}"`,
      `"${o.driver_name || '—'}"`,
      `"${o.order_type}"`,
      `"${o.target_location || '—'}"`,
      `"${o.reason.replace(/"/g, '""')}"`,
      `"${o.description.replace(/"/g, '""')}"`,
      `"${o.dispatcher_name}"`,
      `"${o.status}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Журнал_розпоряджень_ОМЕТ_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Журнал успішно експортовано у CSV');
  };

  const getOrderTypeBadge = (type: string) => {
    switch (type) {
      case 'SHORT_TURN':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-extrabold text-[11px]">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Скорочення рейсу (Розворот)</span>
          </span>
        );
      case 'PACING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-extrabold text-[11px]">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Регулювання темпу (Відстій)</span>
          </span>
        );
      case 'CAR_SWAP':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold text-[11px]">
            <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Підміна / Випуск резерву</span>
          </span>
        );
      case 'PULL_IN':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-extrabold text-[11px]">
            <Bus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Схід у депо (Pull-In)</span>
          </span>
        );
      case 'DETOUR':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-extrabold text-[11px]">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Об'їзд / Перенаправлення</span>
          </span>
        );
      case 'SERVICE_CALL':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-extrabold text-[11px]">
            <PhoneCall className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Виклик спецтехніки (КМ/Колія)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Заголовок панелі та дії */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Журнал диспетчерських розпоряджень
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center space-x-2">
                <span>КП «Одесміськелектротранс»</span>
                <span>•</span>
                <span>Служба руху</span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">Центральна диспетчерська (ЦД)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Кнопки дій */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors flex items-center space-x-1.5"
            title="Експорт в Excel (CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-extrabold text-xs cursor-pointer transition-colors flex items-center space-x-1.5 shadow-2xs"
            title="Друк офіційного звіту зміни або збереження в PDF"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Друк / Зберегти в PDF</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Нове розпорядження</span>
          </button>
        </div>
      </div>

      {/* 2. Картки статистики за зміну */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 print:hidden">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Всього за зміну</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {stats?.total_today ?? orders.length}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Офіційних наказів ЦД</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">В процесі</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {stats?.active_count ?? orders.filter(o => o.status === 'ACTIVE').length}
          </p>
          <span className="text-[10px] text-amber-500/80 font-bold">Активні розпорядження</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Розвороти</span>
            <RotateCcw className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            {stats?.short_turns_count ?? orders.filter(o => o.order_type === 'SHORT_TURN').length}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Скорочень рейсу</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Відстої (Pacing)</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {stats?.pacing_count ?? orders.filter(o => o.order_type === 'PACING').length}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Регулювання темпу</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Підміна / Депо</span>
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {(stats?.pull_in_count || 0) + (orders.filter(o => o.order_type === 'CAR_SWAP').length)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Випусків резерву</span>
        </div>
      </div>

      {/* 3. Панель фільтрів */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Фільтр дати */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none outline-hidden cursor-pointer"
            >
              <option value="today">Сьогодні (Поточна зміна)</option>
              <option value="ALL">Всі дати</option>
            </select>
          </div>

          {/* Фільтр маршруту */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none outline-hidden cursor-pointer"
            >
              <option value="ALL">Всі маршрути</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.type === 'trolleybus' ? '🚎 Тр-' : '🚊 Тм-'}{r.number}
                </option>
              ))}
            </select>
          </div>

          {/* Фільтр типу заходу */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none outline-hidden cursor-pointer"
            >
              <option value="ALL">Всі типи заходів</option>
              <option value="SHORT_TURN">🔄 Розвороти (Short Turn)</option>
              <option value="PACING">⏱️ Відстої (Pacing)</option>
              <option value="CAR_SWAP">⚡ Підміна резервом</option>
              <option value="PULL_IN">🏢 Заїзд у депо</option>
              <option value="DETOUR">🚨 Об'їзди (Detour)</option>
              <option value="SERVICE_CALL">🛠️ Спецтехніка</option>
            </select>
          </div>

          {/* Фільтр статусу */}
          <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none outline-hidden cursor-pointer"
            >
              <option value="ALL">Всі статуси</option>
              <option value="ACTIVE">🟢 В процесі (Active)</option>
              <option value="COMPLETED">⚪ Виконано</option>
              <option value="CANCELLED">🔴 Скасовано</option>
            </select>
          </div>
        </div>

        {/* Пошук */}
        <div className="relative w-full lg:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Пошук наказів, бортів, водіїв..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4. Друкована офіційна шапка КП ОМЕТ (Тільки при друці / збереженні в PDF) */}
      <div className="hidden print:block mb-6 text-center border-b-2 border-slate-800 pb-4">
        <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
          Комунальне підприємство «Одесміськелектротранс»
        </h2>
        <h3 className="text-sm font-bold text-slate-700 uppercase mt-0.5">
          Служба руху • Відділ оперативного регулювання руху (Центральна диспетчерська)
        </h3>
        <h1 className="text-lg font-black text-slate-950 uppercase mt-2">
          Журнал диспетчерських розпоряджень та оперативних вказівок
        </h1>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Дата формування: {new Date().toLocaleDateString('uk-UA')} {new Date().toLocaleTimeString('uk-UA')} | 
          Кількість зареєстрованих наказів: {filteredOrders.length}
        </p>
      </div>

      {/* 5. Таблиця журналу розпоряджень */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] print:bg-slate-100 print:text-black">
                <th className="p-3.5">№ Наказу</th>
                <th className="p-3.5">Час видачі</th>
                <th className="p-3.5">Маршрут / Борт / Наряд</th>
                <th className="p-3.5">Тип заходу</th>
                <th className="p-3.5">Локація / Кільце</th>
                <th className="p-3.5">Причина та зміст розпорядження</th>
                <th className="p-3.5">Диспетчер ЦД</th>
                <th className="p-3.5">Статус</th>
                <th className="p-3.5 text-right print:hidden">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    За обраними критеріями розпоряджень не знайдено.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const createdAt = new Date(order.created_at);
                  const timeStr = createdAt.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const dateStr = createdAt.toLocaleDateString('uk-UA');

                  return (
                    <tr 
                      key={order.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors print:hover:bg-transparent"
                    >
                      {/* 1. Номер наказу */}
                      <td className="p-3.5 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs">
                          {order.order_number}
                        </span>
                      </td>

                      {/* 2. Час видачі */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {timeStr}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {dateStr}
                        </div>
                      </td>

                      {/* 3. Маршрут / Борт / Наряд */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-black text-xs border border-blue-200 dark:border-blue-800">
                            {order.transport_type === 'TROLLEYBUS' ? '🚎' : '🚊'} №{order.route_number}
                          </span>
                          {order.vehicle_id && (
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                              Вг-{order.vehicle_id}
                            </span>
                          )}
                          {order.duty_number && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              (Наряд #{order.duty_number})
                            </span>
                          )}
                        </div>
                        {order.driver_name && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]" title={order.driver_name}>
                            👤 {order.driver_name}
                          </div>
                        )}
                      </td>

                      {/* 4. Тип заходу */}
                      <td className="p-3.5 whitespace-nowrap">
                        {getOrderTypeBadge(order.order_type)}
                      </td>

                      {/* 5. Локація / Кільце */}
                      <td className="p-3.5 text-slate-800 dark:text-slate-200 font-bold text-xs whitespace-nowrap">
                        {order.target_location || 'За трасою маршруту'}
                        {order.duration_min && (
                          <span className="block text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                            ⏱️ {order.duration_min} хв відстою
                          </span>
                        )}
                      </td>

                      {/* 6. Причина та зміст розпорядження */}
                      <td className="p-3.5 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-1" title={order.reason}>
                          ⚠️ {order.reason}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2" title={order.description}>
                          {order.description}
                        </div>
                      </td>

                      {/* 7. Диспетчер ЦД */}
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap font-medium">
                        {order.dispatcher_name}
                      </td>

                      {/* 8. Статус */}
                      <td className="p-3.5 whitespace-nowrap">
                        {order.status === 'ACTIVE' ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider inline-flex items-center space-x-1 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>В процесі</span>
                          </span>
                        ) : order.status === 'COMPLETED' ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px] inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Виконано</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[11px] inline-flex items-center space-x-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Скасовано</span>
                          </span>
                        )}
                      </td>

                      {/* 9. Дії */}
                      <td className="p-3.5 text-right whitespace-nowrap print:hidden">
                        {order.status === 'ACTIVE' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] cursor-pointer transition-colors inline-flex items-center space-x-1 shadow-2xs"
                              title="Позначити розпорядження як виконане"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Завершити</span>
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950 font-bold text-[11px] cursor-pointer transition-colors"
                              title="Скасувати розпорядження"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">
                            {order.completed_at ? new Date(order.completed_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Офіційний підвал для підписів при друці (Тільки в режимі друку) */}
      <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-800 text-xs font-sans">
        <div className="grid grid-cols-2 gap-12">
          <div>
            <p className="font-bold text-slate-900">
              Черговий старший диспетчер ЦД:
            </p>
            <div className="mt-8 border-b border-slate-800 flex justify-between text-[11px] text-slate-600">
              <span>(підпис)</span>
              <span>(ПІБ, табельний №)</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-slate-900">
              Начальник служби руху КП «ОМЕТ»:
            </p>
            <div className="mt-8 border-b border-slate-800 flex justify-between text-[11px] text-slate-600">
              <span>(підпис)</span>
              <span>(ПІБ)</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-8">
          Електронний підпис згенеровано автоматизованою системою диспетчеризації КП «Одесміськелектротранс»
        </p>
      </div>

      {/* Модальне вікно створення нового розпорядження */}
      <CreateDispatchOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchOrders}
      />
    </div>
  );
};

export default DispatchOrdersJournalView;
