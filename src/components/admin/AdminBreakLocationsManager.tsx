import React, { useState } from 'react';
import { Coffee, Plus, Trash2, Edit3, Building2, Shield, Bus, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

interface BreakLocationItem {
  id: string;
  routeId: string;
  locationId: string;
  locationName: string;
  locationType: string;
  maxCapacityVehicles: number;
  durationMin: number;
}

const ODESSA_ROUTES_LIST = [
  { id: '7', label: 'Трамвай №7 (Паустовського ⇄ Херсонський сквер)' },
  { id: '18', label: 'Трамвай №18 (Куликове поле ⇄ 16-та ст. Фонтану)' },
  { id: '28', label: 'Трамвай №28 (Парк Шевченка ⇄ вул. Пастера)' },
  { id: '5', label: 'Трамвай №5 (Аркадія ⇄ Центральний Автовокзал)' },
  { id: '10', label: 'Трамвай №10 (вул. Іцхака Рабіна ⇄ Тираспольська пл.)' },
  { id: '15', label: 'Трамвай №15 (Слобідський ринок ⇄ Олексіївська пл.)' },
  { id: '20', label: 'Трамвай №20 (Херсонський сквер ⇄ Хаджибейський лиман)' },
  { id: '3', label: 'Трамвай №3 (ст. Застава-1 ⇄ Парк Шевченка)' },
  { id: '1', label: 'Трамвай №1 (вул. Чорноморського козацтва ⇄ Центроліт)' },
  { id: '17', label: 'Трамвай №17 (Куликове поле ⇄ 11-та ст. Фонтану)' },
  { id: '26', label: 'Трамвай №26 (Старосінна пл. ⇄ 11-та ст. Люстдорфської дор.)' },
  { id: '27', label: 'Трамвай №27 (16-та ст. Люстдорфської дор. ⇄ Переправа)' },
  { id: '8', label: 'Тролейбус №8 (Залізничний вокзал ⇄ вул. Інглезі)' },
  { id: '7-Tr', label: 'Тролейбус №7 (вул. Архітекторська ⇄ вул. Новосельського)' },
  { id: '9', label: 'Тролейбус №9 (вул. Інглезі ⇄ вул. Рішельєвська)' },
  { id: '10-Tr', label: 'Тролейбус №10 (вул. Інглезі ⇄ вул. Приморська)' },
  { id: '12', label: 'Тролейбус №12 (вул. Архітекторська ⇄ Аеропорт)' },
  { id: '2', label: 'Тролейбус №2 (Парк Шевченка ⇄ вул. Новосельського)' },
];

export const AdminBreakLocationsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    routeId: '7',
    locationId: '',
    locationName: '',
    locationType: 'Диспетчерський пункт / Їдальня',
    maxCapacityVehicles: 3,
    durationMin: 45
  });

  // Query break locations from backend
  const { data: breakLocations = [], isLoading } = useQuery<BreakLocationItem[]>({
    queryKey: ['admin-break-locations'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/break-locations');
      return Array.isArray(res.data) ? res.data : [];
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/api/v1/settings/break-locations', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Пункт обіду для маршруту успішно додано до PostgreSQL!');
      queryClient.invalidateQueries({ queryKey: ['admin-break-locations'] });
      setIsFormOpen(false);
      setFormData({
        routeId: '7',
        locationId: '',
        locationName: '',
        locationType: 'Диспетчерський пункт / Їдальня',
        maxCapacityVehicles: 3,
        durationMin: 45
      });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка збереження пункту обіду');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/v1/settings/break-locations/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Пункт обіду видалено!');
      queryClient.invalidateQueries({ queryKey: ['admin-break-locations'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка видалення');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.locationName.trim()) {
      toast.warning('Вкажіть назву диспетчерського пункту або їдальні');
      return;
    }
    const locId = formData.locationId || `dp_${formData.routeId}_${Date.now().toString().slice(-4)}`;
    createMutation.mutate({
      id: `brk_${formData.routeId}_${Date.now()}`,
      routeId: formData.routeId,
      locationId: locId,
      locationName: formData.locationName.trim(),
      locationType: formData.locationType,
      maxCapacityVehicles: Number(formData.maxCapacityVehicles) || 2,
      durationMin: Number(formData.durationMin) || 45
    });
  };

  const filtered = breakLocations.filter(b => {
    if (selectedRouteFilter === 'all') return true;
    return b.routeId === selectedRouteFilter;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-500" />
            <span>Диспетчерські пункти обідів та відпочинку водіїв</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Конфігурація закріплення диспетчерських станцій, їдалень, місткості колій відстою та тривалості обіду за кожним маршрутом
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Призначити пункт обіду</span>
        </button>
      </div>

      {/* Filter by Route */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center space-x-1">
          <Bus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Маршрут:</span>
        </span>
        <button
          onClick={() => setSelectedRouteFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            selectedRouteFilter === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          Всі маршрути ({breakLocations.length})
        </button>
        {['7', '18', '28', '5', '10', '15', '20', '3', '1', '26', '8', '9', '12'].map(rNum => (
          <button
            key={rNum}
            onClick={() => setSelectedRouteFilter(rNum)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedRouteFilter === rNum
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            №{rNum}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 text-xs animate-fade-in">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Закріплення нового диспетчерського пункту обіду</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Маршрут:</label>
              <select
                value={formData.routeId}
                onChange={e => setFormData({ ...formData, routeId: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
              >
                {ODESSA_ROUTES_LIST.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Назва локації (ДП / Їдальня):</label>
              <input
                type="text"
                required
                placeholder="напр. ДП «вул. Паустовського» (Їдальня)"
                value={formData.locationName}
                onChange={e => setFormData({ ...formData, locationName: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Місткість відстою (вагонів):</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxCapacityVehicles}
                onChange={e => setFormData({ ...formData, maxCapacityVehicles: parseInt(e.target.value) || 2 })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Тривалість обіду (хв):</label>
              <input
                type="number"
                min="20"
                max="90"
                value={formData.durationMin}
                onChange={e => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 45 })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
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

      {/* Break Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(b => (
          <div
            key={b.id}
            className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-black text-xs">
                  Маршрут №{b.routeId}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono font-bold text-[10px] border border-amber-500/30">
                  {b.durationMin} хв обід
                </span>
              </div>

              <div className="flex items-start space-x-2 pt-1">
                <Building2 className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug">
                  {b.locationName}
                </h4>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 font-medium">
                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                <span>Ліміт відстою: <strong>{b.maxCapacityVehicles} ваг.</strong></span>
              </div>

              <button
                onClick={() => {
                  if (window.confirm(`Видалити закріплення обіду для маршруту №${b.routeId}?`)) {
                    deleteMutation.mutate(b.id);
                  }
                }}
                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                title="Видалити"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBreakLocationsManager;
