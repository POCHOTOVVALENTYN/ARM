import React, { useState, useMemo } from 'react';
import { X, Calendar, Activity, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useDailyPerformance, useIncidentsSummary } from '../hooks/useAnalyticsQueries';
import { GlobalLoader } from './GlobalLoader';

interface AnalyticalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PIE_COLORS = ['#10B981', '#EF4444']; // Смарагдовий (Вирішено) та Червоний (В процесі)

export const AnalyticalReportModal: React.FC<AnalyticalReportModalProps> = ({ isOpen, onClose }) => {
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Запити до нашого агрегаційного API
  const { data: performanceData, isLoading: isPerfLoading } = useDailyPerformance(targetDate);
  const { data: incidentData, isLoading: isIncLoading } = useIncidentsSummary(targetDate);

  // Підготовка даних для кругової діаграми інцидентів
  const pieChartData = useMemo(() => {
    if (!incidentData) return [];
    return [
      { name: 'Вирішено', value: incidentData.resolved_incidents },
      { name: 'В процесі', value: incidentData.unresolved_incidents },
    ].filter((item) => item.value > 0);
  }, [incidentData]);

  // Розрахунок загальносистемної регулярності (Network OTP)
  const networkOTP = useMemo(() => {
    if (!performanceData || performanceData.length === 0) return '0.0';
    const totalOTP = performanceData.reduce((acc, route) => acc + route.on_time_percentage, 0);
    return (totalOTP / performanceData.length).toFixed(1);
  }, [performanceData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[500] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity font-sans">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
        
        {/* Шапка модального вікна */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl mr-4 border border-blue-200 dark:border-blue-700">
              <Activity className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Аналітичний звіт та OTP</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Показники регулярності та якості роботи підприємства КП «ОМЕТ»</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar size={16} className="text-slate-500 mr-2" />
              <input 
                type="date" 
                value={targetDate} 
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-transparent border-none p-0 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer"
              />
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Тіло модального вікна */}
        <div className="flex-1 overflow-y-auto p-6">
          {(isPerfLoading || isIncLoading) ? (
            <div className="h-full flex items-center justify-center">
              <GlobalLoader text="Агрегація аналітичних даних..." />
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* KPI Картки */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center">
                  <div className="bg-emerald-100 dark:bg-emerald-950 p-3 rounded-xl mr-3.5 border border-emerald-200 dark:border-emerald-800">
                    <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Регулярність (OTP)</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{networkOTP}%</p>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-xl mr-3.5 border border-blue-200 dark:border-blue-800">
                    <CheckCircle className="text-blue-600 dark:text-blue-400" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Зафіксовано зупинок</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">
                      {performanceData?.reduce((acc, curr) => acc + curr.total_records, 0) || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center">
                  <div className="bg-amber-100 dark:bg-amber-950 p-3 rounded-xl mr-3.5 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="text-amber-600 dark:text-amber-400" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Усіх інцидентів</p>
                    <p className="text-xl font-black text-slate-800 dark:text-white">{incidentData?.total_incidents || 0}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center">
                  <div className="bg-rose-100 dark:bg-rose-950 p-3 rounded-xl mr-3.5 border border-rose-200 dark:border-rose-800">
                    <Activity className="text-rose-600 dark:text-rose-400" size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Невідпрацьовано</p>
                    <p className="text-xl font-black text-rose-600 dark:text-rose-400">{incidentData?.unresolved_incidents || 0}</p>
                  </div>
                </div>
              </div>

              {/* Графіки */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Гістограма відхилень (Займає 2 колонки) */}
                <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs lg:col-span-2">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Регулярність та Середнє запізнення по маршрутах</h3>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={performanceData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis dataKey="route_id" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" orientation="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px', fontSize: 12 }} />
                        
                        <Bar yAxisId="left" dataKey="on_time_percentage" name="Регулярність OTP (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} />
                        <Bar yAxisId="right" dataKey="avg_deviation_min" name="Сер. запізнення (хв)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Кругова діаграма інцидентів */}
                <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3">Статус обробки інцидентів</h3>
                  {!incidentData || incidentData.total_incidents === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs">
                      Інцидентів за дату не зафіксовано
                    </div>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Зведена таблиця (Датагрід) */}
              <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">Деталізація по маршрутах</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-3.5">Маршрут</th>
                        <th className="p-3.5">Фіксацій (Точок)</th>
                        <th className="p-3.5">Сер. відхилення</th>
                        <th className="p-3.5">Макс. запізнення</th>
                        <th className="p-3.5">OTP %</th>
                        <th className="p-3.5">Статус надійності</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {performanceData?.map((route) => (
                        <tr key={route.route_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3.5 font-bold text-slate-800 dark:text-white font-mono">Трамвай №{route.route_id}</td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono">{route.total_records}</td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono">{route.avg_deviation_min} хв</td>
                          <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono">{route.max_deviation_min} хв</td>
                          <td className="p-3.5 font-mono font-bold">{route.on_time_percentage}%</td>
                          <td className="p-3.5">
                            {route.on_time_percentage >= 85 ? (
                              <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded font-bold text-[11px]">У нормі</span>
                            ) : route.on_time_percentage >= 50 ? (
                              <span className="text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded font-bold text-[11px]">Нестабільно</span>
                            ) : (
                              <span className="text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded font-bold text-[11px]">Критично</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {(!performanceData || performanceData.length === 0) && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">Немає даних за обрану дату</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticalReportModal;
