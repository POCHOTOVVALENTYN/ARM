import React, { useState } from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const AdminHubsManager: React.FC = () => {
  const { hubs, addHub, deleteHub } = useConfigStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    locationDescription: '',
    availableTracksCount: 1,
    minHeadwayMin: 2,
    routesConnecting: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addHub({
      id: uuidv4(),
      name: formData.name,
      locationDescription: formData.locationDescription,
      availableTracksCount: formData.availableTracksCount,
      minHeadwayMin: formData.minHeadwayMin,
      routesConnecting: formData.routesConnecting.split(',').map(s => s.trim()).filter(s => s),
      channels: []
    });
    setIsFormOpen(false);
    setFormData({ name: '', locationDescription: '', availableTracksCount: 1, minHeadwayMin: 2, routesConnecting: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Управління Хабами</h3>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Додати Хаб
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Опис розташування</label>
              <input
                type="text"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.locationDescription}
                onChange={e => setFormData({ ...formData, locationDescription: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Кількість колій</label>
              <input
                type="number"
                min="1"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.availableTracksCount}
                onChange={e => setFormData({ ...formData, availableTracksCount: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Маршрути (через кому)</label>
              <input
                type="text"
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.routesConnecting}
                onChange={e => setFormData({ ...formData, routesConnecting: e.target.value })}
                placeholder="напр. 5, 7, 28"
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
        {hubs.map(hub => (
          <div key={hub.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-start">
            <div>
              <h4 className="font-medium text-white">{hub.name}</h4>
              <p className="text-sm text-slate-400">{hub.locationDescription}</p>
              <div className="mt-2 text-xs text-slate-500">
                Колій: {hub.availableTracksCount} | Маршрути: {hub.routesConnecting.join(', ')}
              </div>
            </div>
            <button
              onClick={() => deleteHub(hub.id)}
              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-lg transition-colors"
              title="Видалити"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {hubs.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-500">
            Немає жодного хабу.
          </div>
        )}
      </div>
    </div>
  );
};
