import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { 
  Bus, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Search,
  Settings,
  Edit3,
  Gauge,
  FileText,
  X,
  Check,
  Calendar,
  Trash2,
  RefreshCw,
  Play
} from 'lucide-react';
import { VehicleBlock, TransportType, DayType, ShiftType, Trip } from '../../types';
import apiClient from '../../utils/apiClient';

export const OperationalScheduleGenerator: React.FC = () => {
  const { 
    draftBlocks, 
    draftDuties, 
    updateVehicleBlockInfo, 
    assignDriverToBlockShift,
    deleteVehicleBlock,
    clearVehicleBlocks,
    setDraftSchedule,
    setPath
  } = useScheduleStore();

  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { routes } = useRouteStore();

  const [selectedBlockId, setSelectedBlockId] = useState<string>(draftBlocks[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<string>('all');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isPastDate = selectedDate < todayStr;

  // Inline Wagon Specs Editing state
  const [isEditingSpecs, setIsEditingSpecs] = useState(false);
  const [editVehicleNum, setEditVehicleNum] = useState('');
  const [editDepot, setEditDepot] = useState('');
  const [editExitTime, setEditExitTime] = useState('');
  const [editReturnTime, setEditReturnTime] = useState('');

  // Driver Assignment form state
  const [driverShiftChoice, setDriverShiftChoice] = useState<'shift1' | 'shift2'>('shift1');
  const [driverNameInput, setDriverNameInput] = useState('');
  const [driverBadgeInput, setDriverBadgeInput] = useState('');
  const [assignmentFeedback, setAssignmentFeedback] = useState('');

  // Delete Confirmation Modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    blockId?: string;
  }>({ isOpen: false, type: 'single' });

  const selectedBlock = draftBlocks.find((b) => b.id === selectedBlockId) || draftBlocks[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const params = {
        route_id: selectedBlock?.routeId || draftBlocks[0]?.routeId || 'route_1',
        num_vehicles: 10,
        start_time_minutes: 360,
        end_time_minutes: 1380,
        layover_minutes: 5,
        stops_forward: [],
        stops_backward: []
      };
      
      const response = await apiClient.post('/schedules/generate', params);
      const scheduleData = response.data;
      setDraftSchedule(scheduleData);
      setIsGenModalOpen(false);
      setPath('/dispatch/gantt');
      
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Assigned drivers (duties) linked to this vehicle block
  const assignedDuties = draftDuties.filter((duty) =>
    duty.assignedBlockIds.includes(selectedBlock?.id || '')
  );

  // Filtered blocks list
  const filteredBlocks = draftBlocks.filter((block) => {
    const matchesSearch = 
      block.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.routeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoute = routeFilter === 'all' || block.routeId === routeFilter;
    const blockDate = block.date || todayStr;
    const matchesDate = blockDate === selectedDate;
    return matchesSearch && matchesRoute && matchesDate;
  });

  const handleStartEditSpecs = (blockToEdit = selectedBlock) => {
    if (!blockToEdit) return;
    setEditVehicleNum(blockToEdit.vehicleNumber);
    setEditDepot(blockToEdit.depotId);
    setEditExitTime(blockToEdit.depotExitTime);
    setEditReturnTime(blockToEdit.depotReturnTime);
    setIsEditingSpecs(true);
  };

  const handleSaveSpecs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlock) return;
    updateVehicleBlockInfo(selectedBlock.id, {
      vehicleNumber: editVehicleNum,
      depotId: editDepot,
      depotExitTime: editExitTime,
      depotReturnTime: editReturnTime,
    });
    setIsEditingSpecs(false);
  };

  const handleAssignDriverToShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlock || !driverNameInput) return;

    // Generate or locate duty ID based on shift
    const dutyId = driverShiftChoice === 'shift1'
      ? `Duty-${selectedBlock.id.replace('Block-', '')}-S1`
      : `Duty-${selectedBlock.id.replace('Block-', '')}-S2`;

    assignDriverToBlockShift(
      selectedBlock.id,
      dutyId,
      driverNameInput,
      driverBadgeInput || 'DRV-NEW'
    );

    setAssignmentFeedback(`Водія ${driverNameInput} успішно закріплено за виходом вагона ${selectedBlock.id}!`);
    setDriverNameInput('');
    setDriverBadgeInput('');

    setTimeout(() => setAssignmentFeedback(''), 3500);
  };

  // Calculations for t_prep & Operational metrics
  const isTram = selectedBlock?.type === 'tram';
  const prepTimeMin = isTram ? 10 : 19; // 10 min for tram, 19 min for trolleybus

  // Calculate total operating hours
  let operatingHoursStr = 'Невідомо';
  if (selectedBlock?.depotExitTime && selectedBlock?.depotReturnTime) {
    try {
      const exitParts = selectedBlock.depotExitTime.split(':');
      const returnParts = selectedBlock.depotReturnTime.split(':');
      
      if (exitParts.length >= 2 && returnParts.length >= 2) {
        const eH = parseInt(exitParts[0], 10);
        const eM = parseInt(exitParts[1], 10);
        const rH = parseInt(returnParts[0], 10);
        const rM = parseInt(returnParts[1], 10);

        if (!isNaN(eH) && !isNaN(eM) && !isNaN(rH) && !isNaN(rM)) {
          let totalM = (rH * 60 + rM) - (eH * 60 + eM);
          if (totalM < 0) totalM += 24 * 60; // Handle overnight shifts
          const hours = Math.floor(totalM / 60);
          const mins = totalM % 60;
          operatingHoursStr = `${hours} год ${mins} хв`;
        } else {
          operatingHoursStr = 'Помилка формату';
        }
      } else {
        operatingHoursStr = 'Помилка формату';
      }
    } catch (err) {
      operatingHoursStr = 'Помилка обчислення';
    }
  }

  // Estimated mileage calculation based on trips
  const tripCount = selectedBlock?.trips.length || 0;
  const estimatedMileageKm = (tripCount * 14.8).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Top Banner Header - Executive Style */}
      <div className="bg-white border border-blue-200 rounded-2xl p-5 text-slate-900 shadow-[0_8px_30px_rgba(37,99,235,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-2xs shrink-0">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Оперативні розклади
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (Operational Schedule Editor)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Моніторинг та редагування оперативних розкладів. Внесення корективів щодо фактичних обставин руху електротранспорту.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsGenModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl flex items-center space-x-2 shadow-xs transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Генерувати розклад</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Wagon Outfit Registry (Vehicle Blocks) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Реєстр Нарядів Вагонів
              </h3>
            </div>
            
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <Calendar className="w-4 h-4 text-blue-600 ml-1" />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedBlockId(''); // reset selection on date change
                }}
                className="bg-transparent border-none text-xs font-extrabold text-slate-700 focus:ring-0 outline-none cursor-pointer p-1"
              />
            </div>
          </div>
          
          {isPastDate && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 mb-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 font-semibold leading-tight">
                Минулі наряди доступні лише для перегляду. Вони зберігаються в архіві.
              </div>
            </div>
          )}

          {/* Search & Filter Controls */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Пошук за № вагона, ID чи маршрутом..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Оберіть маршрут:</label>
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-no-repeat bg-[position:right_0.5rem_center]"
              >
                <option value="all">Всі маршрути</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>Маршрут №{r.id}</option>
                ))}
              </select>
              <div className="flex items-center justify-between mt-1">
                <div className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 inline-block text-center">
                  Знайдено нарядів: {filteredBlocks.length}
                </div>
                {!isPastDate && filteredBlocks.length > 0 && (
                  <button
                    onClick={() => setDeleteConfirmation({ isOpen: true, type: 'bulk' })}
                    className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-200 rounded-lg px-2.5 py-1.5 inline-flex items-center space-x-1 transition-colors cursor-pointer"
                    title="Видалити всі знайдені наряди"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Очистити реєстр</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Wagon Block Cards List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredBlocks.length === 0 ? (
               <div className="p-6 text-center text-slate-500 font-bold text-xs bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                 Немає нарядів для відображення
               </div>
            ) : (
              filteredBlocks.map((block) => {
                const isSelected = selectedBlock?.id === block.id;
                const driversAssigned = draftDuties.filter((d) => d.assignedBlockIds.includes(block.id));

                return (
                  <div
                    key={block.id}
                    onClick={() => {
                      setSelectedBlockId(block.id);
                      setIsEditingSpecs(false);
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all text-xs font-mono ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-xs">
                          {block.id}
                        </span>
                        <span className="font-extrabold text-slate-900">
                          {block.routeId}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {block.type === 'tram' ? 'Трамвай' : 'Тролейбус'}
                        </span>
                        
                        {!isPastDate && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlockId(block.id);
                                handleStartEditSpecs(block);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                              title="Редагувати параметри"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmation({ isOpen: true, type: 'single', blockId: block.id });
                              }}
                              className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                              title="Видалити наряд"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-900 font-sans font-extrabold text-xs mt-2">
                      {block.vehicleNumber}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{block.depotExitTime} - {block.depotReturnTime}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-sans text-[10px] font-extrabold ${
                        driversAssigned.length >= 2
                          ? 'bg-emerald-100 text-emerald-800'
                          : driversAssigned.length === 1
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {driversAssigned.length > 0
                          ? `${driversAssigned.length} зм. водіїв`
                          : 'Без водія'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Panel: Selected Wagon Outfit Details & Driver Shift Mapping */}
        {selectedBlock ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 lg:col-span-2">
            {/* Header / Primary Specs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-600 text-white font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg">
                    {selectedBlock.id}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                    Маршрут №{selectedBlock.routeId}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {selectedBlock.type === 'tram' ? 'Трамвайний вихід' : 'Тролейбусний вихід'}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 mt-1.5 flex items-center space-x-2">
                  <span>{selectedBlock.vehicleNumber}</span>
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                {!isEditingSpecs ? (
                  <button
                    onClick={() => handleStartEditSpecs(selectedBlock)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 flex items-center space-x-1.5 cursor-pointer transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Змінити параметри ТЗ</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingSpecs(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Скасувати</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editing Form for Wagon Characteristics */}
            {isEditingSpecs && (
              <form onSubmit={handleSaveSpecs} className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-3 text-xs animate-fadeIn">
                <h4 className="font-extrabold text-blue-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>Редагування характеристик виходу вагона</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Назва / № Вагона:</label>
                    <input
                      type="text"
                      value={editVehicleNum}
                      onChange={(e) => setEditVehicleNum(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Депо приписки:</label>
                    <input
                      type="text"
                      value={editDepot}
                      onChange={(e) => setEditDepot(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Час виїзду з депо:</label>
                    <input
                      type="text"
                      value={editExitTime}
                      onChange={(e) => setEditExitTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Час заїзду в депо:</label>
                    <input
                      type="text"
                      value={editReturnTime}
                      onChange={(e) => setEditReturnTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-lg border border-blue-700 shadow-xs flex items-center space-x-1.5 cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Зберегти характеристики</span>
                  </button>
                </div>
              </form>
            )}

            {/* Technical & Operational Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                  Підготовка (t_prep):
                </span>
                <strong className="text-blue-900 text-sm font-extrabold flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{prepTimeMin} хв ({isTram ? 'трамвай' : 'тролейбус'})</span>
                </strong>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                  Робота на лінії:
                </span>
                <strong className="text-slate-900 text-sm font-extrabold">
                  {operatingHoursStr}
                </strong>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                  Кількість рейсів:
                </span>
                <strong className="text-amber-800 text-sm font-extrabold">
                  {tripCount} рейсів / день
                </strong>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">
                  Пробіг (розрахунковий):
                </span>
                <strong className="text-emerald-800 text-sm font-extrabold flex items-center space-x-1">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                  <span>~{estimatedMileageKm} км</span>
                </strong>
              </div>
            </div>

            {/* Driver Shifts Allocation Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Закріплені Водії за Змінами Вагона (Driver Shifts)</span>
                </h4>

                <span className="text-[11px] font-bold text-slate-500">
                  {assignedDuties.length} з 2 змін закриті
                </span>
              </div>

              {assignedDuties.length === 0 ? (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold">До цього виходу вагона ще не закріплено жодного водія!</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignedDuties.map((duty, idx) => (
                    <div
                      key={duty.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                          {idx === 0 ? '1-ша зміна (Ранкова)' : '2-га зміна (Вечірня)'}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            duty.isViolating10hLimit
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {duty.isViolating10hLimit ? '⚠️ >10г КЗпП' : '✓ До 10г КЗпП'}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-sm">
                        {duty.driverName}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                        <span>Жетон: <strong>{duty.driverBadge}</strong></span>
                        <span>Зміна: <strong>{duty.shiftStartTime} - {duty.shiftEndTime}</strong></span>
                      </div>

                      {duty.lunchStartTime && (
                        <div className="text-[11px] text-purple-900 bg-purple-50 border border-purple-200 p-1.5 rounded-lg flex items-center justify-between">
                          <span>Обід: {duty.lunchStartTime}</span>
                          <span className="font-bold">{duty.lunchDurationMin} хв</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Driver Attachment / Shift Assignment Form */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 mt-4">
                <h5 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Призначити або замінити водія на даний вихід:</span>
                  <span className="text-[10px] text-blue-600 font-bold">Вихід №{selectedBlock.id}</span>
                </h5>

                {assignmentFeedback && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-xs rounded-lg flex items-center space-x-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{assignmentFeedback}</span>
                  </div>
                )}

                <form onSubmit={handleAssignDriverToShift} className="space-y-3">
                  <div className="flex items-center space-x-3 text-xs font-bold text-slate-700">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="shiftChoice"
                        checked={driverShiftChoice === 'shift1'}
                        onChange={() => setDriverShiftChoice('shift1')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>1-ша Зміна (Ранок)</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="shiftChoice"
                        checked={driverShiftChoice === 'shift2'}
                        onChange={() => setDriverShiftChoice('shift2')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>2-га Зміна (Вечір)</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      placeholder="ПІБ Водія (напр. Коваленко О.В.)"
                      value={driverNameInput}
                      onChange={(e) => setDriverNameInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                      required
                    />

                    <input
                      type="text"
                      placeholder="Жетон (В-0421)"
                      value={driverBadgeInput}
                      onChange={(e) => setDriverBadgeInput(e.target.value)}
                      className="w-full sm:w-32 bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={isPastDate}
                      className={`font-extrabold text-xs px-4 py-2.5 rounded-xl border shadow-xs flex items-center justify-center space-x-1.5 transition-all shrink-0 ${
                        isPastDate
                          ? 'bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed opacity-70'
                          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 cursor-pointer'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Закріпити за вагоном</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Wagon Schedule Trips */}
            <div className="space-y-2 pt-2">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Порейсний розклад вагона ({selectedBlock.trips.length} рейсів)</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">ID Рейсу</th>
                      <th className="p-2.5">Напрямок</th>
                      <th className="p-2.5">Виїзд</th>
                      <th className="p-2.5">Прибуття</th>
                      <th className="p-2.5">Наряд водія</th>
                      <th className="p-2.5">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedBlock.trips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-bold text-blue-900">{trip.id}</td>
                        <td className="p-2.5 text-slate-700">
                          {trip.direction === 1 ? 'Прямий' : 'Зворотний'}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{trip.departureTime}</td>
                        <td className="p-2.5 text-slate-700">{trip.arrivalTime}</td>
                        <td className="p-2.5 text-slate-600">{trip.dutyId}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {trip.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-slate-500 lg:col-span-2 min-h-[400px]">
            <Layers className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Оберіть наряд вагона</h3>
            <p className="text-sm mt-1 max-w-md text-center">
              Оберіть наряд вагона з реєстру зліва, щоб переглянути або змінити його оперативні дані.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="bg-rose-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Підтвердження видалення
              </h3>
            </div>
            <p className="text-sm text-slate-600 font-semibold">
              {deleteConfirmation.type === 'bulk' 
                ? 'Ви впевнені, що хочете очистити всі знайдені наряди у цьому списку? Цю дію буде важко скасувати.'
                : 'Ви впевнені, що хочете видалити цей наряд вагона?'}
            </p>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, type: 'single' })}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm"
              >
                Скасувати
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmation.type === 'bulk') {
                    // Collect filtered block IDs and remove them all
                    filteredBlocks.forEach(block => deleteVehicleBlock(block.id));
                    setSelectedBlockId(''); // Clear selection since everything was deleted
                  } else if (deleteConfirmation.blockId) {
                    deleteVehicleBlock(deleteConfirmation.blockId);
                    if (selectedBlockId === deleteConfirmation.blockId) {
                      setSelectedBlockId('');
                    }
                  }
                  setDeleteConfirmation({ isOpen: false, type: 'single' });
                }}
                className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs text-sm"
              >
                Підтвердити Видалення
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Modal */}
      {isGenModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3 text-blue-600">
                <Play className="w-6 h-6" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Генерація розкладу
                </h3>
              </div>
              <button 
                onClick={() => setIsGenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-600 font-semibold leading-relaxed">
              Ви збираєтесь запустити алгоритм генерації розкладу для маршруту.
              Це запустить 4 проходи, включаючи еластичне згладжування (Elastic Smoother).
            </p>
            
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsGenModalOpen(false)}
                disabled={isGenerating}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm"
              >
                Скасувати
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-colors cursor-pointer shadow-xs text-sm flex items-center space-x-2"
              >
                {isGenerating && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{isGenerating ? 'Генерується...' : 'Запустити генерацію'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
