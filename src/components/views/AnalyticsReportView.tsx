import React, { useState, useMemo } from 'react';
import { useDailyPerformance, useIncidentsSummary } from '../../hooks/useAnalyticsQueries';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Download, 
  Activity, 
  TramFront,
  Zap,
  Filter,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { GlobalLoader } from '../GlobalLoader';

export const AnalyticsReportView: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [chartType, setChartType] = useState<'otp' | 'delays'>('otp');

  const { data: performanceData, isLoading: isPerfLoading } = useDailyPerformance(targetDate);
  const { data: incidentStats, isLoading: isIncLoading } = useIncidentsSummary(targetDate);

  const isLoading = isPerfLoading || isIncLoading;

  // Агреговані системні показники (Network-wide KPI)
  const networkKPI = useMemo(() => {
    if (!performanceData || performanceData.length === 0) {
      return {
        avgOTP: 0,
        totalRecords: 0,
        avgDeviation: 0,
        maxDeviation: 0,
        routesCount: 0
      };
    }

    const totalRecords = performanceData.reduce((acc, curr) => acc + curr.total_records, 0);
    const weightedOTP = performanceData.reduce((acc, curr) => acc + (curr.on_time_percentage * curr.total_records), 0);
    const avgOTP = totalRecords > 0 ? weightedOTP / totalRecords : 0;
    
    const weightedDev = performanceData.reduce((acc, curr) => acc + (curr.avg_deviation_min * curr.total_records), 0);
    const avgDev = totalRecords > 0 ? weightedDev / totalRecords : 0;
    
    const maxDev = Math.max(...performanceData.map((p) => p.max_deviation_min), 0);

    return {
      avgOTP: round(avgOTP, 1),
      totalRecords,
      avgDeviation: round(avgDev, 1),
      maxDeviation: round(maxDev, 1),
      routesCount: performanceData.length
    };
  }, [performanceData]);

  // Дані для кругової діаграми інцидентів
  const incidentPieData = useMemo(() => {
    if (!incidentStats) return [];
    return [
      { name: 'Вирішено', value: incidentStats.resolved_incidents, color: '#10B981' },
      { name: 'В обробці', value: incidentStats.unresolved_incidents, color: '#EF4444' },
    ].filter(item => item.value > 0);
  }, [incidentStats]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!performanceData || performanceData.length === 0) return;
    
    const headers = ['Маршрут', 'Перевірок зупинок', 'Сер. відхилення (хв)', 'Макс. запізнення (хв)', 'Регулярність OTP (%)'];
    const rows = performanceData.map(p => [
      `Маршрут ${p.route_id}`,
      p.total_records,
      p.avg_deviation_min,
      p.max_deviation_min,
      p.on_time_percentage
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OMET_Analytics_Report_${targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-y-auto">
      
      {/* Шапка аналітики (приховується при друку) */}
      <div className="p-6 max-w-7xl mx-auto w-full print:hidden space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">
                  Аналітика Руху
                </span>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Звітність Регулярності Руху та Інцидентів (On-Time Performance)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Автоматична агрегація відхилень з бази даних PostgreSQL (eta_logs) та аналіз надійності графіків
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar size={16} className="text-slate-400" />
              <input 
                type="date" 
                value={targetDate} 
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-transparent border-0 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:ring-0 p-0 cursor-pointer"
              />
            </div>

            <button 
              type="button"
              onClick={handleExportCSV}
              disabled={!performanceData || performanceData.length === 0}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>Експорт CSV</span>
            </button>

            <button 
              type="button"
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Друк звіту</span>
            </button>
          </div>
        </div>
      </div>

      {/* Основний вміст звіту */}
      <div className="flex-1 px-6 pb-6 max-w-7xl mx-auto w-full space-y-6">
        {isLoading && <GlobalLoader text="Агрегація аналітичних даних..." />}

        {/* 4 Карточки KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Регулярність OTP */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Регулярність (OTP)</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {networkKPI.avgOTP}%
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                Норматив (±2 хв від графіка)
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Сер. відхилення */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Сер. відхилення</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {networkKPI.avgDeviation > 0 ? `+${networkKPI.avgDeviation}` : networkKPI.avgDeviation} хв
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Макс: {networkKPI.maxDeviation} хв
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Clock size={24} />
            </div>
          </div>

          {/* Фіксацій зупинок */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Перевірок зупинок</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {networkKPI.totalRecords}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                На {networkKPI.routesCount} активних маршрутах
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-500">
              <Activity size={24} />
            </div>
          </div>

          {/* Інциденти */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Інциденти на лінії</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {incidentStats?.total_incidents || 0}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                Вирішено: {incidentStats?.resolved_incidents || 0} • Відкрито: {incidentStats?.unresolved_incidents || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <AlertTriangle size={24} />
            </div>
          </div>

        </div>

        {/* Графіки та Діаграми */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Гістограма по маршрутах (2 колонки) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-blue-500" />
                  <span>Порівняння ефективності за маршрутами</span>
                </h3>
                <p className="text-xs text-slate-400">Регулярність руху (OTP %) та середнє запізнення</p>
              </div>

              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setChartType('otp')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartType === 'otp'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Регулярність (OTP %)
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('delays')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartType === 'delays'
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Запізнення (хв)
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full pt-2">
              {!performanceData || performanceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Немає накопичених даних телеметрії за {targetDate}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'otp' ? (
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="route_id" tickFormatter={(val) => `Т-${val}`} />
                      <YAxis domain={[0, 100]} unit="%" />
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Регулярність']} />
                      <Bar dataKey="on_time_percentage" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="route_id" tickFormatter={(val) => `Т-${val}`} />
                      <YAxis unit=" хв" />
                      <Tooltip formatter={(val: any) => [`${val} хв`, 'Сер. запізнення']} />
                      <Legend />
                      <Bar dataKey="avg_deviation_min" name="Сер. відхилення" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="max_deviation_min" name="Макс. запізнення" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Структура інцидентів (1 колонка) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon size={16} className="text-amber-500" />
                <span>Оперативне реагування на збої</span>
              </h3>
              <p className="text-xs text-slate-400">Співвідношення опрацьованих інцидентів</p>
            </div>

            <div className="h-[220px] w-full flex items-center justify-center">
              {incidentPieData.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-8">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                  Інцидентів за {targetDate} не зафіксовано
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {incidentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Всього подій:</span>
                <span className="font-bold">{incidentStats?.total_incidents || 0}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Усунуто диспетчером:</span>
                <span className="font-bold">{incidentStats?.resolved_incidents || 0}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>В процесі опрацювання:</span>
                <span className="font-bold">{incidentStats?.unresolved_incidents || 0}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Детальна таблиця аналізу маршрутів */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TramFront size={16} className="text-blue-500" />
              <span>Зведена таблиця регулярності та запізнень по маршрутах</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Дата звіту: {targetDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700">Маршрут</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700 text-center">Зафіксовано зупинок</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700 text-center">Сер. відхилення</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700 text-center">Макс. запізнення</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700 text-center">Регулярність OTP (±2 хв)</th>
                  <th className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-700">Оцінка надійності</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {!performanceData || performanceData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Немає даних відхилень за вказану дату. Телеметрія фіксується автоматично під час проходження зупинок.
                    </td>
                  </tr>
                ) : (
                  performanceData.map((row) => {
                    const isOptimal = row.on_time_percentage >= 80;
                    const isModerate = row.on_time_percentage >= 60 && row.on_time_percentage < 80;
                    
                    return (
                      <tr key={row.route_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white">
                          <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded text-xs">
                            Трамвай №{row.route_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {row.total_records}
                        </td>
                        <td className={`py-3.5 px-4 text-center font-mono font-bold ${row.avg_deviation_min > 2 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {row.avg_deviation_min > 0 ? `+${row.avg_deviation_min}` : row.avg_deviation_min} хв
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-rose-500 font-bold">
                          {row.max_deviation_min > 0 ? `+${row.max_deviation_min} хв` : '0 хв'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-black">
                          <span className={`px-2.5 py-0.5 rounded ${
                            isOptimal ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            isModerate ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {row.on_time_percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isOptimal ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 size={13} /> Відповідає нормативу
                            </span>
                          ) : isModerate ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                              <Clock size={13} /> Потребує коригування
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                              <AlertTriangle size={13} /> Критичні затримки
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

      </div>
    </div>
  );
};

function round(value: number, decimals: number) {
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}

export default AnalyticsReportView;
