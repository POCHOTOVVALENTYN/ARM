import os

content = """import React, { useState, useEffect } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { 
  Bus, 
  Clock, 
  Plus, 
  Calendar,
  Trash,
  Trash2,
  ListOrdered,
  X,
  Save,
  Check
} from 'lucide-react';

export const DutyBuilderView: React.FC = () => {
  const { routes } = useRouteStore();
  const { 
    draftBlocks, 
    updateVehicleBlockInfo, 
    generateMultipleBlocks,
    deleteVehicleBlock,
    clearVehicleBlocks,
    selectedDate,
    setSelectedDate
  } = useScheduleStore();

  const today = new Date().toISOString().split('T')[0];
  const isArchiveMode = selectedDate < today;

  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generation Modal
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genRoute, setGenRoute] = useState<string>('');
  const [genCount, setGenCount] = useState<number>(1);

  // View Trips Modal
  const [viewTripsBlockId, setViewTripsBlockId] = useState<string | null>(null);

  // Set default route for generation
  useEffect(() => {
    if (routes.length > 0 && !genRoute) {
      setGenRoute(routes[0].id);
    }
  }, [routes, genRoute]);

  const blocksForDate = draftBlocks.filter(b => b.date === selectedDate || (!b.date && selectedDate === today));

  const filteredBlocks = blocksForDate.filter((block) => {
    const matchesSearch = 
      block.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (block.vehicleNumber && block.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      block.routeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = routeFilter === 'all' || block.routeId === routeFilter;
    return matchesSearch && matchesRoute;
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (genCount < 1 || genCount > 50) return;
    const r = routes.find(rt => rt.id === genRoute);
    if (!r) return;
    
    generateMultipleBlocks(r.id, r.type, genCount, selectedDate);
    setIsGenModalOpen(false);
    setRouteFilter(r.id); // Switch to the generated route
  };

  const handleUpdateField = (blockId: string, field: string, value: string) => {
    updateVehicleBlockInfo(blockId, { [field]: value });
  };

  const getScheduleTypeName = (type: string) => {
    switch(type) {
      case 'single': return 'Однозмінний';
      case 'double': return 'Двохзмінний';
      case 'split': return 'Розривний';
      case 'peak': return 'Піковий';
      default: return type;
    }
  };

  const selectedTripsBlock = draftBlocks.find(b => b.id === viewTripsBlockId);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Bus className="w-7 h-7 text-blue-600" />
            <span>Оперативні розклади</span>
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Масове створення та управління нарядами вагонів
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
          {isArchiveMode ? (
            <div className="bg-amber-100 text-amber-800 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-amber-200 flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Режим Архіву</span>
            </div>
          ) : (
            <button
              onClick={() => setIsGenModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-blue-700 shadow-xs flex items-center space-x-2 cursor-pointer transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Створити Наряди</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Всі маршрути</option>
              {routes.map(r => {
                const count = blocksForDate.filter(b => b.routeId === r.id).length;
                return (
                  <option key={r.id} value={r.id}>
                    Маршрут №{r.id} ({count})
                  </option>
                );
              })}
            </select>
            
            <input
              type="text"
              placeholder="Пошук (ID, Вагон)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-extrabold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
              {filteredBlocks.length} записів
            </span>
            {!isArchiveMode && filteredBlocks.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Ви впевнені, що хочете видалити всі відфільтровані наряди?')) {
                    clearVehicleBlocks(filteredBlocks.map(b => b.id));
                  }
                }}
                className="text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Очистити список</span>
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm text-xs uppercase tracking-wider font-extrabold text-slate-500">
              <tr>
                <th className="p-3 border-b border-slate-200">ID Наряду</th>
                <th className="p-3 border-b border-slate-200">Тип Графіку</th>
                <th className="p-3 border-b border-slate-200">Вагон / Модель</th>
                <th className="p-3 border-b border-slate-200">Депо</th>
                <th className="p-3 border-b border-slate-200">Виїзд</th>
                <th className="p-3 border-b border-slate-200">Заїзд</th>
                <th className="p-3 border-b border-slate-200 text-center">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBlocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    Немає нарядів для відображення. {isArchiveMode ? '' : 'Створіть нові наряди.'}
                  </td>
                </tr>
              ) : (
                filteredBlocks.map(block => (
                  <tr key={block.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {block.id}
                        </span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {block.routeId}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {isArchiveMode ? (
                        <span className="text-sm font-bold text-slate-700">{getScheduleTypeName(block.scheduleType || 'single')}</span>
                      ) : (
                        <select
                          value={block.scheduleType || 'single'}
                          onChange={(e) => handleUpdateField(block.id, 'scheduleType', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="single">Однозмінний</option>
                          <option value="double">Двохзмінний</option>
                          <option value="split">Розривний</option>
                          <option value="peak">Піковий</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3">
                      {isArchiveMode ? (
                        <span className="text-sm font-bold text-slate-700">{block.vehicleNumber || '—'}</span>
                      ) : (
                        <input
                          type="text"
                          value={block.vehicleNumber || ''}
                          placeholder="Напр. T3 №4020"
                          onChange={(e) => handleUpdateField(block.id, 'vehicleNumber', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:font-normal"
                        />
                      )}
                    </td>
                    <td className="p-3">
                      {isArchiveMode ? (
                        <span className="text-sm font-bold text-slate-700">
                          {block.depotId === 'depot_tram_1' ? 'Депо №1' : block.depotId === 'depot_tram_2' ? 'Депо №2' : 'Трол. Депо'}
                        </span>
                      ) : (
                        <select
                          value={block.depotId || 'depot_tram_1'}
                          onChange={(e) => handleUpdateField(block.id, 'depotId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="depot_tram_1">Трам. Депо №1</option>
                          <option value="depot_tram_2">Трам. Депо №2</option>
                          <option value="depot_trolley_1">Трол. Депо</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3">
                      {isArchiveMode ? (
                        <span className="font-mono text-sm font-bold text-slate-700">{block.depotExitTime}</span>
                      ) : (
                        <input
                          type="time"
                          value={block.depotExitTime || ''}
                          onChange={(e) => handleUpdateField(block.id, 'depotExitTime', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      )}
                    </td>
                    <td className="p-3">
                      {isArchiveMode ? (
                        <span className="font-mono text-sm font-bold text-slate-700">{block.depotReturnTime}</span>
                      ) : (
                        <input
                          type="time"
                          value={block.depotReturnTime || ''}
                          onChange={(e) => handleUpdateField(block.id, 'depotReturnTime', e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setViewTripsBlockId(block.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Порейсний розклад"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                        {!isArchiveMode && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Видалити наряд ${block.id}?`)) {
                                deleteVehicleBlock(block.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Видалити"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generation Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-lg">Масове створення нарядів</h3>
              <button 
                onClick={() => setIsGenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Оберіть маршрут:</label>
                <select
                  value={genRoute}
                  onChange={(e) => setGenRoute(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="" disabled>Оберіть зі списку...</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      Маршрут №{r.id} ({r.type === 'tram' ? 'Трамвай' : 'Тролейбус'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Кількість нарядів:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                />
                <p className="text-xs text-slate-500 mt-1 font-medium">Буде створено порожніх блоків для заповнення у таблиці.</p>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Згенерувати</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trips Modal */}
      {viewTripsBlockId && selectedTripsBlock && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center space-x-2">
                <ListOrdered className="w-5 h-5 text-blue-600" />
                <span>Розклад: {selectedTripsBlock.id}</span>
              </h3>
              <button 
                onClick={() => setViewTripsBlockId(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto bg-slate-50/50">
              {selectedTripsBlock.trips.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl">
                  Порейсний розклад для цього наряду ще не згенеровано або порожній.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTripsBlock.trips.map((trip) => (
                    <div key={trip.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-300 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                          {trip.direction === 'forward' ? 'Прямий' : 'Зворотній'}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{trip.origin} → {trip.destination}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-400">Відправлення</span>
                          <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{trip.departureTime}</span>
                        </div>
                        <div className="w-4 h-[1px] bg-slate-300"></div>
                        <div className="flex flex-col items-start">
                          <span className="text-[10px] font-bold text-slate-400">Прибуття</span>
                          <span className="font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{trip.arrivalTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
"""

with open('src/components/views/DutyBuilderView.tsx', 'w') as f:
    f.write(content)

print("Successfully replaced DutyBuilderView.tsx")
