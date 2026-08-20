import React, { useState } from 'react';
import { Layers, Plus, Trash2, Edit3, Shield, Clock, Palette } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

interface DutyTypeItem {
  id: string;
  name: string;
  code: string;
  description: string;
  max_shift_hours: number;
  color: string;
  is_active: boolean;
}

export const AdminDutyTypesManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<DutyTypeItem | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    description: '',
    max_shift_hours: 8.0,
    color: '#3b82f6'
  });

  const { data: dutyTypes = [], isLoading } = useQuery<DutyTypeItem[]>({
    queryKey: ['admin-duty-types'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/duty-types');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/api/v1/duty-types', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Тип наряду успішно створено!');
      queryClient.invalidateQueries({ queryKey: ['admin-duty-types'] });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка створення');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.put(`/api/v1/duty-types/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Тип наряду оновлено!');
      queryClient.invalidateQueries({ queryKey: ['admin-duty-types'] });
      setEditingType(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка оновлення');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/v1/duty-types/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Тип наряду видалено!');
      queryClient.invalidateQueries({ queryKey: ['admin-duty-types'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка видалення');
    }
  });

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      code: '',
      description: '',
      max_shift_hours: 8.0,
      color: '#3b82f6'
    });
  };

  const handleOpenEdit = (t: DutyTypeItem) => {
    setEditingType(t);
    setFormData({
      id: t.id,
      name: t.name,
      code: t.code,
      description: t.description || '',
      max_shift_hours: t.max_shift_hours,
      color: t.color || '#3b82f6'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.warning('Заповніть назву та літерний код типу наряду');
      return;
    }

    if (editingType) {
      updateMutation.mutate({
        id: editingType.id,
        payload: {
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description.trim(),
          max_shift_hours: Number(formData.max_shift_hours) || 8.0,
          color: formData.color
        }
      });
    } else {
      createMutation.mutate({
        id: formData.id.trim().toUpperCase() || `DUTY_${Date.now()}`,
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim(),
        max_shift_hours: Number(formData.max_shift_hours) || 8.0,
        color: formData.color,
        is_active: true
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Довідник типів нарядів (Сутності випусків)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Конфігурація категорій нарядів КП «ОМЕТ» (Двозмінні, Однозмінні, Розривні, Пікові, Чергові) для графіків служби руху
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setEditingType(null); setIsFormOpen(!isFormOpen); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Додати тип наряду</span>
        </button>
      </div>

      {/* Form modal or panel */}
      {(isFormOpen || editingType) && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs animate-fade-in">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {editingType ? `Редагування типу: ${editingType.name}` : 'Створення нового типу наряду'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {!editingType && (
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">ID (Код англ.):</label>
                <input
                  type="text"
                  required
                  placeholder="напр. DOUBLE, SINGLE"
                  value={formData.id}
                  onChange={e => setFormData({ ...formData, id: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Назва типу наряду:</label>
              <input
                type="text"
                required
                placeholder="напр. Двозмінний"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Літерний код (2-3 літери):</label>
              <input
                type="text"
                required
                placeholder="напр. ДВ, ОД, РОЗ"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ліміт зміни водія (год):</label>
              <input
                type="number"
                step="0.5"
                min="4"
                max="12"
                value={formData.max_shift_hours}
                onChange={e => setFormData({ ...formData, max_shift_hours: parseFloat(e.target.value) || 8.0 })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Колір бейджа:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-bold"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Опис та правила призначення:</label>
              <input
                type="text"
                placeholder="Опис режиму роботи..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setIsFormOpen(false); setEditingType(null); }}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer shadow-md"
            >
              Зберегти в PostgreSQL
            </button>
          </div>
        </form>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dutyTypes.map(t => (
          <div
            key={t.id}
            className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-0.5 rounded-lg text-white font-black text-xs shadow-xs"
                  style={{ backgroundColor: t.color || '#3b82f6' }}
                >
                  {t.code} • {t.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  {t.id}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t.description || 'Опис відсутній'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Макс. зміна: <strong>{t.max_shift_hours} год</strong></span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleOpenEdit(t)}
                  className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors cursor-pointer"
                  title="Редагувати"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Видалити тип наряду «${t.name}»?`)) {
                      deleteMutation.mutate(t.id);
                    }
                  }}
                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                  title="Видалити"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDutyTypesManager;
