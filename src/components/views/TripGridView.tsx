import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Table as TableIcon, Search, Filter, Edit3, Save, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useStationStore } from '../../store/useStationStore';
import { DailyDeploymentPanel } from './DailyDeploymentPanel';

export const TripGridView: React.FC = () => {
  const stations = useStationStore(state => state.stations);
  const { draftBlocks, updateTripDeparture, isDraftModified } = useScheduleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [newTimeInput, setNewTimeInput] = useState('');

  const allTrips = draftBlocks.flatMap((block) =>
    block.trips.map((t) => ({
      ...t,
      vehicleNumber: block.vehicleNumber,
      depotId: block.depotId,
    }))
  );

  const filteredTrips = allTrips.filter(
    (t) =>
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.routeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartEdit = (tripId: string, currentDepTime: string) => {
    setEditingTripId(tripId);
    setNewTimeInput(currentDepTime);
  };

  const handleSaveTime = (blockId: string, tripId: string) => {
    if (newTimeInput) {
      updateTripDeparture(blockId, tripId, newTimeInput);
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
            Табличний вигляд усіх добових рейсів. Можливість оперативної зміни часу відправлення з вагонів у режиме Чернетки (Draft).
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
            placeholder="Пошук за рейсом, маршрутом або вагоном..."
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
                <th className="p-3">Вагон</th>
                <th className="p-3">Старт (Зупинка)</th>
                <th className="p-3">Фініш (Зупинка)</th>
                <th className="p-3">Час відправлення</th>
                <th className="p-3">Час прибуття</th>
                <th className="p-3">Тип / Статус</th>
                <th className="p-3 text-right">Операції</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTrips.map((trip) => {
                const startSt = stations.find((s) => s.id === trip.startStationId)?.name || trip.startStationId;
                const endSt = stations.find((s) => s.id === trip.endStationId)?.name || trip.endStationId;
                const isEditing = editingTripId === trip.id;

                return (
                  <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-bold text-indigo-950">{trip.id}</td>
                    <td className="p-3 font-sans font-bold text-gray-900">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                        №{trip.routeId}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-gray-700">{trip.vehicleNumber}</td>
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
                        trip.departureTime
                      )}
                    </td>

                    <td className="p-3 text-gray-700">{trip.arrivalTime}</td>

                    <td className="p-3 font-sans">
                      {trip.isLunchBreak ? (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold border border-purple-200">
                          Обід
                        </span>
                      ) : trip.isZeroRun ? (
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold border border-amber-200">
                          Нульовий
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                          Основний
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right font-sans">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveTime(trip.blockId, trip.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded flex items-center space-x-1 cursor-pointer ml-auto text-xs"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Зберегти</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(trip.id, trip.departureTime)}
                          className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                          title="Змінити час відправлення"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
