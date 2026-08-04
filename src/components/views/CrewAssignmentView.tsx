import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Users, UserCheck, ArrowRight, CheckCircle2, Bus, Clock, ShieldCheck } from 'lucide-react';

export const CrewAssignmentView: React.FC = () => {
  const { draftDuties, draftBlocks, assignDriverToDuty } = useScheduleStore();
  const [selectedDutyId, setSelectedDutyId] = useState<string>(draftDuties[0]?.id || '');
  const [successMsg, setSuccessMsg] = useState('');

  const AVAILABLE_DRIVERS = [
    { name: 'Петренко Василь Іванович', badge: 'DRV-101', class: '1 Клас', depot: 'Депо №1 (Трамвайне)' },
    { name: 'Коваленко Сергій Михайлович', badge: 'DRV-102', class: '1 Клас', depot: 'Депо №1 (Трамвайне)' },
    { name: 'Шевченко Анна Олексіївна', badge: 'DRV-103', class: '2 Клас', depot: 'Депо №2 (Тролейбусне)' },
    { name: 'Бондар Дмитро Миколайович', badge: 'DRV-104', class: '3 Клас', depot: 'Депо №1 (Трамвайне)' },
  ];

  const handleAssignQuick = (drv: typeof AVAILABLE_DRIVERS[0]) => {
    if (!selectedDutyId) return;
    assignDriverToDuty(selectedDutyId, drv.name, drv.badge);
    setSuccessMsg(`Водія ${drv.name} успішно закріплено за виходом вагона для наряду ${selectedDutyId}`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 text-white font-black px-2.5 py-0.5 rounded text-[11px] uppercase tracking-wider">
                Модуль Персонал
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                Призначення Водіїв на Вагони (Crew Assignment)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Оперативний розподіл екіпажів водіїв за рухомим складом (вагонами) з урахуванням кваліфікації та норм КЗпП
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl flex items-center space-x-2 text-xs font-bold animate-fadeIn shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Driver Roster Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Вільний Резервний Склад Водіїв
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg border border-blue-200">
              {AVAILABLE_DRIVERS.length} вільні
            </span>
          </div>

          <div className="space-y-2.5">
            {AVAILABLE_DRIVERS.map((drv, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">{drv.name}</div>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                    Жетон: <strong>{drv.badge}</strong> • {drv.class} • {drv.depot}
                  </div>
                </div>

                <button
                  onClick={() => handleAssignQuick(drv)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1.5 rounded-lg border border-blue-700 shadow-2xs flex items-center space-x-1 cursor-pointer text-xs transition-all hover:scale-102"
                >
                  <span>Призначити</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Target Duty / Wagon Slot Selector Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Наряди Вагонів та Поточні Екіпажі
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {draftDuties.length} нарядів
            </span>
          </div>

          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {draftDuties.map((duty) => {
              const isSelected = selectedDutyId === duty.id;
              const assignedBlock = draftBlocks.find((b) => duty.assignedBlockIds.includes(b.id));

              return (
                <div
                  key={duty.id}
                  onClick={() => setSelectedDutyId(duty.id)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all text-xs font-mono ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                      {duty.id}
                    </span>
                    <span className="font-extrabold text-slate-900 font-sans text-sm">
                      {duty.driverName}
                    </span>
                  </div>

                  {assignedBlock && (
                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-slate-100 text-[11px] font-sans text-slate-700">
                      <Bus className="w-3.5 h-3.5 text-blue-600" />
                      <span>Вагон: <strong>{assignedBlock.vehicleNumber}</strong> ({assignedBlock.id})</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 font-sans">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Зміна: {duty.shiftStartTime} - {duty.shiftEndTime}</span>
                    </span>
                    <span className="text-amber-800 font-extrabold">{duty.totalShiftMin} хв</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

