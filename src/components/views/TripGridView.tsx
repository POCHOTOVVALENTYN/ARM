import React, { useState, useEffect } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Table as TableIcon, Search, Filter, Edit3, Save, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useStationStore } from '../../store/useStationStore';
import { DailyDeploymentPanel } from './DailyDeploymentPanel';

// Helper to format minutes from midnight to HH:MM
const formatTime = (minutes: number) => {
  if (minutes === undefined || minutes === null) return '--:--';
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Helper to parse HH:MM to minutes
const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const TripGridView: React.FC = () => {
  const stations = useStationStore(state => state.stations);
  const { liveSchedule, updateTripDeparture, isDraftModified, loadDefaultMockData } = useScheduleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [newTimeInput, setNewTimeInput] = useState('');

  useEffect(() => {
    if (!liveSchedule?.current_blocks || liveSchedule.current_blocks.length === 0) {
      loadDefaultMockData();
    }
  }, [liveSchedule?.current_blocks, loadDefaultMockData]);

  const currentBlocks = liveSchedule?.current_blocks || [];

  const allTrips = currentBlocks.flatMap((block: any) =>
    (block.trips || []).map((t: any) => ({
      ...t,
      blockId: block.block_id,
      vehicleType: block.vehicle_type,
    }))
  );

  const filteredTrips = allTrips.filter(
    (t: any) =>
      String(t.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.route_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.blockId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (tripId: string, currentDepTimeMin: number) => {
    setEditingTripId(tripId);
    setNewTimeInput(formatTime(currentDepTimeMin));
  };

  const handleSaveTime = (blockId: string, tripId: string, originalTimeMin: number) => {
    if (newTimeInput && updateTripDeparture) {
      const newTimeMin = parseTime(newTimeInput);
      const delayMinutes = newTimeMin - originalTimeMin;
      if (delayMinutes !== 0) {
        updateTripDeparture(blockId, tripId, originalTimeMin, delayMinutes);
      }
    }
    setEditingTripId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="brutalist-card bg-gray-900 text-white p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-500 text-white font-bold px-2 py-0.5 rounded text-xs">
              Модуль Планування 2.2
            </span>
            <h2 className="text-base font-bold text-white">
              Генератор та Реєстр Сітки Рейсів (Trip Grid Master)
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Табличний вигляд усіх добових рейсів. Синхронізовано з Backend API.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold">
          <span className="bg-gray-800 text-emerald-400 px-3 py-1.5 rounded-lg border border-gray-700">
            Всього рейсів: {allTrips.length}
          </span>
        </div>
      </div>

      {/* Daily Deployment Panel (Наряди) */}
      <DailyDeploymentPanel />

      {/* Toolbar */}
      <div className="brutalist-card bg-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Пошук за рейсом, маршрутом або блоком..."
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-2 font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {isDraftModified && (
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg font-bold">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span>Чернетку змінено. Застосуйте Коміт у нижній/верхній панелі.</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="brutalist-card bg-white rounded-2xl p-5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto border border-gray-300 rounded-xl">
          <table className="w-full text-xs text-left text-gray-800 font-mono">
            <thead className="bg-gray-900 text-white uppercase tracking-wider border-b-2 border-gray-900">
              <tr>
                <th className="p-3">ID Рейсу</th>
                <th className="p-3">Маршрут</th>
                <th className="p-3">Блок (Наряд)</th>
                <th className="p-3">Старт (Зупинка)</th>
                <th className="p-3">Фініш (Зупинка)</th>
                <th className="p-3">Час відправлення</th>
                <th className="p-3">Час прибуття</th>
                <th className="p-3">Тип</th>
                <th className="p-3 text-right">Операції</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTrips.map((trip: any) => {
                const startSt = stations.find((s) => s.id === trip.start_station_id)?.name || trip.start_station_id;
                const endSt = stations.find((s) => s.id === trip.end_station_id)?.name || trip.end_station_id;
                const isEditing = editingTripId === trip.id;

                return (
                  <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-bold text-indigo-950">{trip.id}</td>
                    <td className="p-3 font-sans font-bold text-gray-900">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                        №{trip.route_id}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-gray-700">{trip.blockId} ({trip.vehicleType})</td>
                    <td className="p-3 font-sans text-gray-800">{startSt}</td>
                    <td className="p-3 font-sans text-gray-800">{endSt}</td>

                    <td className="p-3 font-bold text-amber-900">
                      {isEditing ? (
                        <input
                          type="time"
                          value={newTimeInput}
                          onChange={(e) => setNewTimeInput(e.target.value)}
                          className="bg-amber-100 border-2 border-amber-500 rounded px-1.5 py-0.5 text-xs text-gray-900 font-bold"
                        />
                      ) : (
                        formatTime(trip.start_time)
                      )}
                    </td>

                    <td className="p-3 text-gray-700">{formatTime(trip.end_time)}</td>

                    <td className="p-3 font-sans">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        Основний
                      </span>
                    </td>

                    <td className="p-3 text-right font-sans">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveTime(trip.blockId, trip.id, trip.start_time)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded flex items-center space-x-1 cursor-pointer ml-auto text-xs"
                          aria-label={`Зберегти час відправлення для рейсу ${trip.id}`}
                          tabIndex={0}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Зберегти</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(trip.id, trip.start_time)}
                          className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                          title="Змінити час відправлення"
                          aria-label={`Редагувати час відправлення для рейсу ${trip.id}`}
                          tabIndex={0}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 font-sans">
                    Рейси не знайдено. Переконайтеся, що дані завантажені з бекенду.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
