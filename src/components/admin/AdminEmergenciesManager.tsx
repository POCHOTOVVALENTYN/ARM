import React, { useState } from 'react';
import { useConfigStore } from '../../store/useConfigStore';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const AdminEmergenciesManager: React.FC = () => {
  const { emergencyTemplates, addEmergencyTemplate, deleteEmergencyTemplate } = useConfigStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Обрив мережі',
    severity: 'high',
    instructions: '',
    affectedRoutes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEmergencyTemplate({
      id: uuidv4(),
      title: formData.title,
      cause: formData.type, // Map type to cause for compatibility
      affectedRouteIds: formData.affectedRoutes.split(',').map(s => s.trim()).filter(s => s),
      affectedStationIds: [],
      detourDescription: formData.instructions,
      alternativeStations: []
    });
    setIsFormOpen(false);
    setFormData({ title: '', type: 'Обрив мережі', severity: 'high', instructions: '', affectedRoutes: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Шаблони НС</h3>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Додати шаблон
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
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Тип/Причина</label>
              <input
                type="text"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Рівень критичності</label>
              <select
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value })}
              >
                <option value="low">Низький</option>
                <option value="medium">Середній</option>
                <option value="high">Високий</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Зачеплені маршрути (через кому)</label>
              <input
                type="text"
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600"
                value={formData.affectedRoutes}
                onChange={e => setFormData({ ...formData, affectedRoutes: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1">Інструкції / Опис об'їзду</label>
              <textarea
                required
                className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 min-h-[80px]"
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
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
        {emergencyTemplates.map(template => (
          <div key={template.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-start">
            <div>
              <h4 className="font-medium text-white">{template.title}</h4>
              <p className="text-sm text-slate-400">{template.cause}</p>
              <div className="mt-2 text-xs text-slate-500">
                Маршрути: {template.affectedRouteIds?.join(', ')}
              </div>
            </div>
            <button
              onClick={() => deleteEmergencyTemplate(template.id)}
              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-lg transition-colors"
              title="Видалити"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {emergencyTemplates.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-500">
            Немає шаблонів НС.
          </div>
        )}
      </div>
    </div>
  );
};
