import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { 
  Bus, 
  Clock, 
  Plus, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  Search,
  Settings,
  Edit3,
  Gauge,
  FileText,
  X,
  Check,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { VehicleBlock, DriverDuty, TransportType, DayType, ShiftType } from '../../types';

export const DutyBuilderView: React.FC = () => {
  const { 
    draftBlocks, 
    draftDuties, 
    updateVehicleBlockInfo, 
    addVehicleBlock, 
    assignDriverToBlockShift 
  } = useScheduleStore();
  const { routes } = useRouteStore();

  const [selectedBlockId, setSelectedBlockId] = useState<string>(draftBlocks[0]?.id || 'Block-301');
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<string>('all');

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

  // Create New Vehicle Block Modal state
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newBlockId, setNewBlockId] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newType, setNewType] = useState<TransportType>('tram');
  const [newRoute, setNewRoute] = useState('T3');
  const [newDayType, setNewDayType] = useState<DayType>('workday');
  const [newScheduleType, setNewScheduleType] = useState<ShiftType>('single');
  const [newVehicleNum, setNewVehicleNum] = useState('');
  const [newDepot, setNewDepot] = useState('depot_tram_1');
  const [newInitialDestination, setNewInitialDestination] = useState<'dispatcher_point' | 'opposite_terminal'>('dispatcher_point');
  const [newExitTime, setNewExitTime] = useState('05:30');
  const [newReturnTime, setNewReturnTime] = useState('21:30');

  const selectedBlock = draftBlocks.find((b) => b.id === selectedBlockId) || draftBlocks[0];

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
    return matchesSearch && matchesRoute;
  });

  const handleStartEditSpecs = () => {
    if (!selectedBlock) return;
    setEditVehicleNum(selectedBlock.vehicleNumber);
    setEditDepot(selectedBlock.depotId);
    setEditExitTime(selectedBlock.depotExitTime);
    setEditReturnTime(selectedBlock.depotReturnTime);
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

  const handleCreateNewBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep < 5) {
      setWizardStep(wizardStep + 1);
      return;
    }

    const id = newBlockId.trim() || `Block-${Math.floor(100 + Math.random() * 900)}`;
    const created: VehicleBlock = {
      id,
      vehicleNumber: newVehicleNum || 'Татра T3 №' + Math.floor(4000 + Math.random() * 100),
      type: newType,
      depotId: newDepot,
      routeId: newRoute,
      date: newDate,
      dayType: newDayType,
      scheduleType: newScheduleType,
      initialDestination: newInitialDestination,
      depotExitTime: newExitTime,
      depotReturnTime: newReturnTime,
      trips: [
        {
          id: `trip_${id}_1`,
          blockId: id,
          dutyId: `Duty-${id}-S1`,
          routeId: newRoute,
          direction: 1,
          departureTime: newExitTime,
          arrivalTime: '06:15',
          startStationId: 'st_starosinna',
          endStationId: 'st_lustdorf_11th',
          status: 'normal'
        }
      ]
    };

    addVehicleBlock(created);
    setSelectedBlockId(created.id);
    setIsAddBlockOpen(false);
    setWizardStep(1);
    setNewBlockId('');
    setNewVehicleNum('');
  };

  // Calculations for t_prep & Operational metrics
  const isTram = selectedBlock?.type === 'tram';
  const prepTimeMin = isTram ? 10 : 19; // 10 min for tram, 19 min for trolleybus

  // Calculate total operating hours
  let operatingHoursStr = '16 год 22 хв';
  if (selectedBlock?.depotExitTime && selectedBlock?.depotReturnTime) {
    const [eH, eM] = selectedBlock.depotExitTime.split(':').map(Number);
    const [rH, rM] = selectedBlock.depotReturnTime.split(':').map(Number);
    let totalM = (rH * 60 + rM) - (eH * 60 + eM);
    if (totalM < 0) totalM += 24 * 60;
    const hours = Math.floor(totalM / 60);
    const mins = totalM % 60;
    operatingHoursStr = `${hours} год ${mins} хв`;
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
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Конструктор Нарядів Вагонів
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (Vehicle-Centric Outfit Builder)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Первинне планування та характеристика виходів ТЗ (t_prep = 10 хв трамвай, 19 хв тролейбус). Прив'язка змінних екіпажів водіїв до кожного наряду вагона.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddBlockOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-blue-700 shadow-xs flex items-center space-x-2 cursor-pointer shrink-0 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Створити Наряд Вагона</span>
        </button>
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
            <span className="text-xs font-mono font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {filteredBlocks.length} ТЗ
            </span>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-2">
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

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] font-bold">
              {['all', ...routes.map(r => r.id)].map((rt) => (
                <button
                  key={rt}
                  onClick={() => setRouteFilter(rt)}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-all ${
                    routeFilter === rt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rt === 'all' ? 'Всі маршрути' : rt}
                </button>
              ))}
            </div>
          </div>

          {/* Wagon Block Cards List */}
          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredBlocks.map((block) => {
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

                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {block.type === 'tram' ? 'Трамвай' : 'Тролейбус'}
                    </span>
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
            })}
          </div>
        </div>

        {/* Right Main Panel: Selected Wagon Outfit Details & Driver Shift Mapping */}
        {selectedBlock && (
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
                    onClick={handleStartEditSpecs}
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-blue-700 shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer transition-all shrink-0"
                    >
                      <Plus className="w-4 h-4" />
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
        )}
      </div>

      {/* Modal Dialog: Create New Vehicle Block */}
      {isAddBlockOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Bus className="w-5 h-5 text-blue-600" />
                <span>Створення Наряду Вагона</span>
              </h3>
              <button
                onClick={() => setIsAddBlockOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBlock} className="space-y-3 text-xs">
              {/* Wizard Steps indicator */}
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className={`flex-1 h-1.5 mx-0.5 rounded-full ${wizardStep >= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
                ))}
              </div>

              {wizardStep === 1 && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="font-extrabold text-slate-800 mb-2">Крок 1: Дата, Тип транспорту та Маршрут</h4>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Дата наряду:</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Тип транспорту:</label>
                    <div className="flex space-x-2">
                      <label className="flex-1 flex items-center p-2.5 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                        <input type="radio" name="transportType" value="tram" checked={newType === 'tram'} onChange={() => setNewType('tram')} className="mr-2" />
                        <span className="font-bold">Трамвай</span>
                      </label>
                      <label className="flex-1 flex items-center p-2.5 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                        <input type="radio" name="transportType" value="trolleybus" checked={newType === 'trolleybus'} onChange={() => setNewType('trolleybus')} className="mr-2" />
                        <span className="font-bold">Тролейбус</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Маршрут:</label>
                    <select
                      value={newRoute}
                      onChange={(e) => setNewRoute(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                    >
                      {routes.filter(r => r.type === newType).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="font-extrabold text-slate-800 mb-2">Крок 2: Тип шаблону</h4>
                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center p-3 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                      <input type="radio" name="dayType" value="workday" checked={newDayType === 'workday'} onChange={() => setNewDayType('workday')} className="mr-3" />
                      <span className="font-bold">Будній наряд</span>
                    </label>
                    <label className="flex items-center p-3 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                      <input type="radio" name="dayType" value="weekend" checked={newDayType === 'weekend'} onChange={() => setNewDayType('weekend')} className="mr-3" />
                      <span className="font-bold">Вихідний наряд</span>
                    </label>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="font-extrabold text-slate-800 mb-2">Крок 3: Параметри (Тип наряду)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center p-3 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                      <input type="radio" name="scheduleType" value="single" checked={newScheduleType === 'single'} onChange={() => setNewScheduleType('single')} className="mr-2" />
                      <span className="font-bold text-[11px]">Однозмінний</span>
                    </label>
                    <label className="flex items-center p-3 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                      <input type="radio" name="scheduleType" value="double" checked={newScheduleType === 'double'} onChange={() => setNewScheduleType('double')} className="mr-2" />
                      <span className="font-bold text-[11px]">Двохзмінний</span>
                    </label>
                    <label className="flex items-center p-3 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                      <input type="radio" name="scheduleType" value="split" checked={newScheduleType === 'split'} onChange={() => setNewScheduleType('split')} className="mr-2" />
                      <span className="font-bold text-[11px]">Розривний</span>
                    </label>
                    <label className="flex items-center p-3 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                      <input type="radio" name="scheduleType" value="peak" checked={newScheduleType === 'peak'} onChange={() => setNewScheduleType('peak')} className="mr-2" />
                      <span className="font-bold text-[11px]">Піковий</span>
                    </label>
                  </div>
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="font-extrabold text-slate-800 mb-2">Крок 4: Вагон та Депо</h4>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ID Наряду Вагона:</label>
                    <input
                      type="text"
                      placeholder="Block-305"
                      value={newBlockId}
                      onChange={(e) => setNewBlockId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Номер та Модель Вагона:</label>
                    <input
                      type="text"
                      placeholder="Татра T3 №4020"
                      value={newVehicleNum}
                      onChange={(e) => setNewVehicleNum(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Депо виїзду:</label>
                    <select
                      value={newDepot}
                      onChange={(e) => setNewDepot(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900"
                    >
                      <option value="depot_tram_1">Трамвайне депо №1</option>
                      <option value="depot_tram_2">Трамвайне депо №2</option>
                      <option value="depot_trolley_1">Тролейбусне депо</option>
                    </select>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-3 animate-fadeIn">
                  <h4 className="font-extrabold text-slate-800 mb-2">Крок 5: Початковий напрямок та Час</h4>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Куди спершу їде вагон:</label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center p-3 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                        <input type="radio" name="initialDestination" value="dispatcher_point" checked={newInitialDestination === 'dispatcher_point'} onChange={() => setNewInitialDestination('dispatcher_point')} className="mr-3" />
                        <span className="font-bold">На диспетчерський пункт маршруту</span>
                      </label>
                      <label className="flex items-center p-3 border border-slate-300 rounded-xl bg-slate-50 cursor-pointer">
                        <input type="radio" name="initialDestination" value="opposite_terminal" checked={newInitialDestination === 'opposite_terminal'} onChange={() => setNewInitialDestination('opposite_terminal')} className="mr-3" />
                        <span className="font-bold">На протилежну кінцеву станцію</span>
                      </label>
                    </div>
                    {newRoute === 'T7' && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-amber-800 font-semibold leading-tight">
                          Виняток: Для маршруту №7 диспетчерський пункт також є на Старосінній площі через велику протяжність маршруту.
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Час виїзду:</label>
                      <input
                        type="time"
                        value={newExitTime}
                        onChange={(e) => setNewExitTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Час заїзду:</label>
                      <input
                        type="time"
                        value={newReturnTime}
                        onChange={(e) => setNewReturnTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-between space-x-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (wizardStep > 1) {
                      setWizardStep(wizardStep - 1);
                    } else {
                      setIsAddBlockOpen(false);
                      setWizardStep(1);
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {wizardStep > 1 ? 'Назад' : 'Скасувати'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-xs flex items-center space-x-1"
                >
                  <span>{wizardStep < 5 ? 'Далі' : 'Створити наряд'}</span>
                  {wizardStep < 5 && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

