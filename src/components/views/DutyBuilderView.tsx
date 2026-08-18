import React, { useState, useEffect } from 'react';
import { useScheduleStore, ODESSA_DEFAULT_ROUTES } from '../../store/useScheduleStore';
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
  Check,
  GripVertical,
  ChevronDown
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface SortableRowProps {
  block: any;
  isArchiveMode: boolean;
  getScheduleTypeName: (type: string) => string;
  handleUpdateField: (id: string, field: string, value: string) => void;
  setViewTripsBlockId: (id: string) => void;
  requestDeleteVehicleBlock: (id: string) => void;
}

const SortableRow: React.FC<SortableRowProps> = ({ 
  block, 
  isArchiveMode, 
  getScheduleTypeName, 
  handleUpdateField, 
  setViewTripsBlockId, 
  requestDeleteVehicleBlock 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.9 : 1,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
  };

  return (
    <tr ref={setNodeRef} style={style} className={`transition-colors group ${isDragging ? 'bg-blue-50' : 'hover:bg-blue-50/50'}`}>
      <td className="p-3">
        <div className="flex items-center space-x-2">
          {!isArchiveMode && (
            <button 
              {...attributes} 
              {...listeners} 
              className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing p-1"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            {block.id}
          </span>
          <span className="font-extrabold text-slate-900 text-sm">
            №{block.routeId}
          </span>
        </div>
      </td>
      <td className="p-3">
        {isArchiveMode ? (
          <span className="text-sm font-bold text-slate-700">{getScheduleTypeName(block.scheduleType || 'double')}</span>
        ) : (
          <select
            value={block.scheduleType || 'double'}
            onChange={(e) => handleUpdateField(block.id, 'scheduleType', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="double">Двозмінний (DOUBLE)</option>
            <option value="single">Однозмінний (SINGLE)</option>
            <option value="split">Розривний (SPLIT з ТО)</option>
            <option value="peak">Піковий (PEAK)</option>
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
            placeholder="Борт (напр. 4020)"
            onChange={(e) => handleUpdateField(block.id, 'vehicleNumber', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
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
            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="depot_tram_1">Трамвайне депо №1</option>
            <option value="depot_tram_2">Трамвайне депо №2</option>
            <option value="depot_trolley_1">Тролейбусне депо</option>
          </select>
        )}
      </td>
      <td className="p-3">
        {isArchiveMode ? (
          <span className="font-mono text-sm font-bold text-slate-700">{block.depotExitTime}</span>
        ) : (
          <input
            type="time"
            value={block.depotExitTime || '05:30'}
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
            value={block.depotReturnTime || '23:00'}
            onChange={(e) => handleUpdateField(block.id, 'depotReturnTime', e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        )}
      </td>
      <td className="p-3 text-center">
        <div className="flex items-center justify-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setViewTripsBlockId(block.id)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Порейсний розклад"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          {!isArchiveMode && (
            <button
              onClick={() => requestDeleteVehicleBlock(block.id)}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Видалити"
            >
              <Trash className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export const DutyBuilderView: React.FC = () => {
  const storeRoutes = useRouteStore(state => state.routes);
  const scheduleRoutes = useScheduleStore(state => state.routes);
  const routes = (storeRoutes && storeRoutes.length > 0) 
    ? storeRoutes 
    : ((scheduleRoutes && scheduleRoutes.length > 0) ? scheduleRoutes : ODESSA_DEFAULT_ROUTES);

  const { 
    draftBlocks, 
    updateVehicleBlockInfo, 
    generateMultipleBlocks,
    deleteVehicleBlock,
    clearVehicleBlocks,
    reorderVehicleBlocks,
    commitDraft,
    isDraftModified,
    selectedDate,
    setSelectedDate
  } = useScheduleStore();

  const today = new Date().toISOString().split('T')[0];
  const isArchiveMode = selectedDate < today;

  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Generation Modal
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genRoute, setGenRoute] = useState<string>('18');
  const [genCount, setGenCount] = useState<number>(8);

  // View Trips Modal
  const [viewTripsBlockId, setViewTripsBlockId] = useState<string | null>(null);

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderVehicleBlocks(active.id as string, over.id as string);
    }
  };

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
    const r = routes.find(rt => String(rt.id) === String(genRoute)) || routes[0];
    if (!r) return;
    
    generateMultipleBlocks(String(r.id), r.type as any, genCount, selectedDate);
    setIsGenModalOpen(false);
    setRouteFilter(String(r.id));
    toast.success(`Згенеровано ${genCount} нарядів для маршруту №${r.number || r.id}`);
  };

  const handleUpdateField = (blockId: string, field: string, value: string) => {
    updateVehicleBlockInfo(blockId, { [field]: value });
  };

  const handleSaveDraft = () => {
    commitDraft();
    toast.success('Наряди успішно зафіксовано в системі!');
  };

  const getScheduleTypeName = (type: string) => {
    switch(type) {
      case 'single': return 'Однозмінний';
      case 'double': return 'Двозмінний';
      case 'split': return 'Розривний';
      case 'peak': return 'Піковий';
      default: return type;
    }
  };

  const selectedTripsBlock = draftBlocks.find(b => b.id === viewTripsBlockId);

  return (
    <div className="h-full flex flex-col space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Bus className="w-7 h-7 text-blue-600" />
            <span>Конструктор нарядів (Duty Master)</span>
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Масове формування нарядів, закріплення типів змін (SINGLE, DOUBLE, PEAK, SPLIT) та номерів вагонів
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>

          {isDraftModified && (
            <button
              onClick={handleSaveDraft}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Зберегти наряди</span>
            </button>
          )}

          {!isArchiveMode && (
            <button
              onClick={() => setIsGenModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition-all hover:scale-105"
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
            <div className="relative">
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-300 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="all">Всі маршрути ({routes.length})</option>
                {routes.map(r => {
                  const count = blocksForDate.filter(b => String(b.routeId) === String(r.id)).length;
                  return (
                    <option key={r.id} value={r.id}>
                      {r.type === 'trolleybus' ? 'Тролейбус' : 'Трамвай'} №{r.number || r.id} ({count} нар.)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            <input
              type="text"
              placeholder="Пошук (ID, Борт, Маршрут)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono font-extrabold bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
              {filteredBlocks.length} нарядів
            </span>
            {!isArchiveMode && filteredBlocks.length > 0 && (
              <button
                onClick={() => {
                  confirmAction('Підтвердження дії', 'Ви впевнені, що хочете видалити всі відфільтровані наряди?', () => {
                    clearVehicleBlocks(filteredBlocks.map(b => b.id));
                  });
                }}
                className="text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
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
            <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm text-[11px] uppercase tracking-wider font-extrabold text-slate-600">
              <tr>
                <th className="p-3 border-b border-slate-200">ID Наряду / Маршрут</th>
                <th className="p-3 border-b border-slate-200">Тип Графіку</th>
                <th className="p-3 border-b border-slate-200">Бортовий номер вагона</th>
                <th className="p-3 border-b border-slate-200">Депо випуску</th>
                <th className="p-3 border-b border-slate-200">Виїзд на лінію</th>
                <th className="p-3 border-b border-slate-200">Заїзд у депо</th>
                <th className="p-3 border-b border-slate-200 text-center">Дії</th>
              </tr>
            </thead>
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <tbody className="divide-y divide-slate-100">
                <SortableContext 
                  items={filteredBlocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredBlocks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 font-medium">
                        <p className="text-sm font-bold text-slate-600 mb-1">На обрану дату ({selectedDate}) наряди ще не створено.</p>
                        <p className="text-xs text-slate-400">Натисніть кнопку «Створити Наряди» вгорі для генерації випуску.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBlocks.map(block => (
                      <SortableRow
                        key={block.id}
                        block={block}
                        isArchiveMode={isArchiveMode}
                        getScheduleTypeName={getScheduleTypeName}
                        handleUpdateField={handleUpdateField}
                        setViewTripsBlockId={setViewTripsBlockId}
                        requestDeleteVehicleBlock={(id) => confirmAction('Підтвердження дії', `Видалити наряд ${id}?`, () => deleteVehicleBlock(id))}
                      />
                    ))
                  )}
                </SortableContext>
              </tbody>
            </DndContext>
          </table>
        </div>
      </div>

      {/* Generation Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-slate-800 text-base">Масове створення нарядів</h3>
              <button 
                onClick={() => setIsGenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Оберіть маршрут:</label>
                <select
                  value={genRoute}
                  onChange={(e) => setGenRoute(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                  required
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.type === 'trolleybus' ? 'Тролейбус' : 'Трамвай'} №{r.number || r.id} — {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Кількість нарядів:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">Буде згенеровано блоки B_{genRoute}_1 .. B_{genRoute}_{genCount} для заповнення.</p>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Створити</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trips Modal */}
      {viewTripsBlockId && selectedTripsBlock && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center space-x-2">
                <ListOrdered className="w-5 h-5 text-blue-600" />
                <span>Розклад наряду: {selectedTripsBlock.id} (Маршрут №{selectedTripsBlock.routeId})</span>
              </h3>
              <button 
                onClick={() => setViewTripsBlockId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto bg-slate-50/50">
              {selectedTripsBlock.trips.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-xl text-xs">
                  Порейсний розклад для цього наряду ще не згенеровано або порожній.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTripsBlock.trips.map((trip: any) => (
                    <div key={trip.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                          {trip.direction === 1 ? 'Прямий' : 'Зворотній'}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{trip.startStationId} → {trip.endStationId}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs">
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

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-lg">
              {confirmDialog.title}
            </h3>
            <p className="text-slate-600 text-xs">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Скасувати
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-xs transition-colors text-xs cursor-pointer"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DutyBuilderView;
