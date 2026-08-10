import React, { useState } from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const AdminDepotsManager: React.FC = () => {
  const { depots, addDepot, deleteDepot } = useConfigStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Трамвайне',
    address: '',
    lat: 46.4825,
    lng: 30.7233,
    prepTimeMin: 15
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDepot({
      id: uuidv4(),
      name: formData.name,
      type: formData.type,
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
      prepTimeMin: formData.prepTimeMin
    });
    setIsFormOpen(false);
    setFormData({ name: '', type: 'Трамвайне', address: '', lat: 46.4825, lng: 30.7233, prepTimeMin: 15 });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Управління Депо</h3>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Додати Депо
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-4 rounded-xl space-y-4 border border-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Назва</label>
              <input
                type="text"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Тип</label>
              <select
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Трамвайне">Трамвайне</option>
                <option value="Тролейбусне">Тролейбусне</option>
                <option value="Автобусне">Автобусне</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Адреса</label>
              <input
                type="text"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Час підготовки (хв)</label>
              <input
                type="number"
                min="1"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.prepTimeMin}
                onChange={e => setFormData({ ...formData, prepTimeMin: parseInt(e.target.value) })}
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
        {depots.map(depot => (
          <div key={depot.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-start">
            <div>
              <h4 className="font-medium text-white">{depot.name} ({depot.type})</h4>
              <p className="text-sm text-slate-400">{depot.address}</p>
              <div className="mt-2 text-xs text-slate-500">
                Час підготовки: {depot.prepTimeMin} хв
              </div>
            </div>
            <button
              onClick={() => deleteDepot(depot.id)}
              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-lg transition-colors"
              title="Видалити"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {depots.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-500">
            Немає жодного депо.
          </div>
        )}
      </div>
    </div>
  );
};
