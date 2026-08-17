import React, { useState, useMemo } from 'react';
import { useUpdateTrip } from '../../hooks/useScheduleQueries';
import { 
  Edit2, 
  Save, 
  X, 
  Clock, 
  ArrowRight, 
  Filter, 
  Search, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  TramFront
} from 'lucide-react';
import { toast } from 'sonner';

interface RouteTableProps {
  schedule?: any;
  blocks?: any[];
  duties?: any[];
  routeId?: string;
  onTripUpdated?: (tripId: number | string, startTime: string, endTime: string) => void;
}

export const RouteTable: React.FC<RouteTableProps> = ({ 
  schedule, 
  blocks, 
  duties, 
  routeId,
  onTripUpdated 
}) => {
  const updateTripMutation = useUpdateTrip();
  
  // Стан для inline-редагування: зберігає ID рейсу, який зараз редагується
  const [editingTripId, setEditingTripId] = useState<number | string | null>(null);
  const [editForm, setEditForm] = useState<{ start_time: string; end_time: string }>({ start_time: '', end_time: '' });
  const [searchDuty, setSearchDuty] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'direct' | 'reverse'>('all');

  // Трансформація будь-якої ієрархічної структури у плоский масив рейсів
  const flatTrips = useMemo(() => {
    // Варіант 1: якщо передано об'єкт з бекенду (ScheduleResponse з duties -> shifts -> trips)
    if (schedule && schedule.duties && Array.isArray(schedule.duties)) {
      const trips = schedule.duties.flatMap((duty: any) => 
        (duty.shifts || []).flatMap((shift: any) => 
          (shift.trips || []).map((trip: any) => {
            // Визначаємо час з stop_times, якщо прямі поля відсутні
            let startTime = trip.start_time;
            let endTime = trip.end_time;
            if (!startTime && trip.stop_times && trip.stop_times.length > 0) {
              startTime = trip.stop_times[0].departure_time?.slice(0, 5);
              endTime = trip.stop_times[trip.stop_times.length - 1].arrival_time?.slice(0, 5);
            }

            return { 
              ...trip, 
              id: trip.id,
              duty_number: duty.duty_number,
              shift_id: shift.id,
              start_time: startTime || '06:00',
              end_time: endTime || '06:45',
              direction: trip.direction === 'FORWARD' || trip.direction === 'direct' ? 'direct' : 'reverse'
            };
          })
        )
      );
      return trips.sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''));
    }

    // Варіант 2: якщо передано blocks з клієнтського стору (draftBlocks)
    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      const trips = blocks.flatMap((block: any) => 
        (block.trips || []).map((trip: any, idx: number) => ({
          ...trip,
          id: trip.id || `${block.id}-tr-${idx}`,
          duty_number: block.dutyNumber || block.id,
          start_time: trip.startTime || trip.start_time || '06:00',
          end_time: trip.endTime || trip.end_time || '06:45',
          direction: trip.direction === 'FORWARD' || trip.direction === 'direct' ? 'direct' : 'reverse',
          startStation: trip.startStation || 'Старосінна пл.',
          endStation: trip.endStation || 'вул. Паустовського'
        }))
      );
      return trips.sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || ''));
    }

    return [];
  }, [schedule, blocks]);

  // Фільтрація рейсів
  const filteredTrips = useMemo(() => {
    return flatTrips.filter((t: any) => {
      const matchDuty = !searchDuty || String(t.duty_number).toLowerCase().includes(searchDuty.toLowerCase());
      const matchDir = directionFilter === 'all' || t.direction === directionFilter;
      return matchDuty && matchDir;
    });
  }, [flatTrips, searchDuty, directionFilter]);

  const handleEditClick = (trip: any) => {
    setEditingTripId(trip.id);
    setEditForm({ 
      start_time: trip.start_time?.slice(0, 5) || '06:00', 
      end_time: trip.end_time?.slice(0, 5) || '06:45' 
    });
  };

  const handleCancelEdit = () => {
    setEditingTripId(null);
  };

  const handleSaveClick = async (tripId: number | string) => {
    if (!editForm.start_time || !editForm.end_time) {
      toast.error('Будь ласка, вкажіть коректний час відправлення та прибуття');
      return;
    }

    // Якщо це числовий ID з БД (бекенд розклад)
    const numId = typeof tripId === 'number' ? tripId : parseInt(String(tripId), 10);

    if (!isNaN(numId) && numId > 0) {
      updateTripMutation.mutate(
        { tripId: numId, startTime: editForm.start_time, endTime: editForm.end_time },
        {
          onSuccess: () => {
            toast.success(`Час рейсу #${tripId} успішно оновлено`);
            setEditingTripId(null);
            if (onTripUpdated) {
              onTripUpdated(tripId, editForm.start_time, editForm.end_time);
            }
          },
          onError: (err: any) => {
            toast.error(`Помилка оновлення рейсу: ${err?.message || 'Не вдалося зберегти'}`);
          }
        }
      );
    } else {
      // Клієнтське оновлення
      if (onTripUpdated) {
        onTripUpdated(tripId, editForm.start_time, editForm.end_time);
      }
      toast.success(`Рейс ${tripId} відкориговано в чернетці`);
      setEditingTripId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredTrips.length === 0) return;
    const headers = ['Наряд', 'Напрямок', 'Час відправлення', 'Час прибуття'];
    const rows = filteredTrips.map((t: any) => [
      `№ ${t.duty_number}`,
      t.direction === 'direct' ? 'Прямий' : 'Зворотний',
      t.start_time,
      t.end_time
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OMET_Route_Trips_Table_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayRouteId = routeId || schedule?.route_id || '7';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full font-sans">
      
      {/* Шапка таблиці рейсів */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
              <span>Таблиця рейсів</span>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded font-mono text-xs">
                Маршрут №{displayRouteId}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inline-редагування часу відправлення та прибуття для інженерів-технологів
            </p>
          </div>
        </div>

        {/* Фільтри та експорт */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Пошук наряду..."
              value={searchDuty}
              onChange={(e) => setSearchDuty(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 font-mono"
            />
          </div>

          <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDirectionFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                directionFilter === 'all'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Всі
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('direct')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                directionFilter === 'direct'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Прямий
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('reverse')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                directionFilter === 'reverse'
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Зворотний
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredTrips.length === 0}
            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
            title="Експорт таблиці в CSV"
          >
            <Download size={14} />
          </button>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono">
            Рейсів: {filteredTrips.length}
          </span>
        </div>
      </div>

      {/* Тіло таблиці з inline-редагуванням */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-bold uppercase sticky top-0 shadow-xs z-10">
            <tr>
              <th className="py-3 px-4 border-b border-slate-200 dark:border-slate-700">Наряд</th>
              <th className="py-3 px-4 border-b border-slate-200 dark:border-slate-700">Напрямок</th>
              <th className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 text-center">Час відправлення</th>
              <th className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 text-center">Час прибуття</th>
              <th className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 text-center">Тривалість</th>
              <th className="py-3 px-4 border-b border-slate-200 dark:border-slate-700 text-center w-28">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTrips.map((trip: any, idx: number) => {
              const isEditing = editingTripId === trip.id;
              const uniqueRowKey = `${trip.duty_number || 'duty'}-${trip.shift_id || 'shift'}-${trip.id || idx}`;

              // Розрахунок тривалості рейсу
              let durationMin = 0;
              if (trip.start_time && trip.end_time) {
                const [sh, sm] = trip.start_time.split(':').map(Number);
                const [eh, em] = trip.end_time.split(':').map(Number);
                const startMins = sh * 60 + sm;
                let endMins = eh * 60 + em;
                if (endMins < startMins) endMins += 1440;
                durationMin = endMins - startMins;
              }

              return (
                <tr 
                  key={uniqueRowKey} 
                  className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                    isEditing ? 'bg-blue-50/70 dark:bg-blue-950/40 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100 font-mono">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold">
                      № {trip.duty_number}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                      trip.direction === 'direct' 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}>
                      <span>{trip.direction === 'direct' ? 'Прямий' : 'Зворотний'}</span>
                    </span>
                  </td>
                  
                  {/* Час відправлення */}
                  <td className="py-3 px-4 text-center">
                    {isEditing ? (
                      <input 
                        type="time" 
                        value={editForm.start_time}
                        onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                        onBlur={() => !editForm.start_time && handleCancelEdit()}
                        autoFocus
                        className="border-2 border-blue-500 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono font-bold text-xs text-slate-900 dark:text-white"
                      />
                    ) : (
                      <span 
                        onClick={() => handleEditClick(trip)}
                        className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:ring-1 hover:ring-blue-300 transition-all"
                        title="Натисніть для швидкого редагування"
                      >
                        {trip.start_time?.slice(0, 5)}
                      </span>
                    )}
                  </td>

                  {/* Час прибуття */}
                  <td className="py-3 px-4 text-center">
                    {isEditing ? (
                      <input 
                        type="time" 
                        value={editForm.end_time}
                        onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                        onBlur={() => !editForm.end_time && handleCancelEdit()}
                        className="border-2 border-blue-500 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono font-bold text-xs text-slate-900 dark:text-white"
                      />
                    ) : (
                      <span 
                        onClick={() => handleEditClick(trip)}
                        className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:ring-1 hover:ring-blue-300 transition-all"
                        title="Натисніть для швидкого редагування"
                      >
                        {trip.end_time?.slice(0, 5)}
                      </span>
                    )}
                  </td>

                  {/* Тривалість */}
                  <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                    {durationMin} хв
                  </td>

                  {/* Кнопки дій */}
                  <td className="py-3 px-4 text-center">
                    {isEditing ? (
                      <div className="flex justify-center space-x-1.5">
                        <button 
                          onClick={() => handleSaveClick(trip.id)}
                          disabled={updateTripMutation.isPending}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                          title="Зберегти зміни"
                        >
                          <Save size={15} />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Скасувати"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditClick(trip)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex justify-center cursor-pointer border border-transparent hover:border-blue-200"
                        title="Редагувати рейс"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredTrips.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Clock size={28} className="mx-auto mb-2 opacity-50" />
                  Рейсів за вибраними фільтрами не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouteTable;
