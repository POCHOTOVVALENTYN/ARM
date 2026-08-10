import React, { useState } from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const AdminBreakLocationsManager: React.FC = () => {
  const { breakLocations, addBreakLocation, deleteBreakLocation } = useConfigStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    routeId: '',
    locationId: '',
    locationName: '',
    locationType: 'Кінцева',
    maxCapacityVehicles: 2,
    durationMin: 15
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBreakLocation({
      id: uuidv4(),
      routeId: formData.routeId,
      locationId: formData.locationId,
      locationName: formData.locationName,
      locationType: formData.locationType,
      maxCapacityVehicles: formData.maxCapacityVehicles,
      durationMin: formData.durationMin
    });
    setIsFormOpen(false);
    setFormData({ routeId: '', locationId: '', locationName: '', locationType: 'Кінцева', maxCapacityVehicles: 2, durationMin: 15 });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Місця відпочинку</h3>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Додати місце
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-xl space-y-4 border border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Маршрут</label>
              <input
                type="text"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.routeId}
                onChange={e => setFormData({ ...formData, routeId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Назва локації</label>
              <input
                type="text"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.locationName}
                onChange={e => setFormData({ ...formData, locationName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Тип локації</label>
              <select
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.locationType}
                onChange={e => setFormData({ ...formData, locationType: e.target.value })}
              >
                <option value="Кінцева">Кінцева</option>
                <option value="Депо">Депо</option>
                <option value="Диспетчерський пункт">Диспетчерський пункт</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ідентифікатор локації (ID)</label>
              <input
                type="text"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.locationId}
                onChange={e => setFormData({ ...formData, locationId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Макс. ТЗ</label>
              <input
                type="number"
                min="1"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.maxCapacityVehicles}
                onChange={e => setFormData({ ...formData, maxCapacityVehicles: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Тривалість (хв)</label>
              <input
                type="number"
                min="1"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.durationMin}
                onChange={e => setFormData({ ...formData, durationMin: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Зберегти
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breakLocations.map(loc => (
          <div key={loc.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-start">
            <div>
              <h4 className="font-medium text-white">{loc.locationName} ({loc.routeId})</h4>
              <p className="text-sm text-slate-400">{loc.locationType}</p>
              <div className="mt-2 text-xs text-slate-500">
                Макс ТЗ: {loc.maxCapacityVehicles} | Тривалість: {loc.durationMin} хв
              </div>
            </div>
            <button
              onClick={() => deleteBreakLocation(loc.id)}
              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-lg transition-colors"
              title="Видалити"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {breakLocations.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-500">
            Немає жодного місця відпочинку.
          </div>
        )}
      </div>
    </div>
  );
};
