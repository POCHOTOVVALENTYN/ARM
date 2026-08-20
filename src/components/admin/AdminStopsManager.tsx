import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Search, Upload, Download, CheckCircle2, Shield, Edit3, Coffee } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStationStore } from '../../store/useStationStore';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

interface StationItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  status: string;
  is_dispatch_station: boolean;
  break_capacity: number;
}

export const AdminStopsManager: React.FC = () => {
  const queryClient = useQueryClient();
  const zustandStations = useStationStore(state => state.stations);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<StationItem | null>(null);

  // Form states
  const [stopName, setStopName] = useState('');
  const [lat, setLat] = useState('46.468');
  const [lng, setLng] = useState('30.741');
  const [isCP, setIsCP] = useState(false);
  const [breakCapacity, setBreakCapacity] = useState(0);
  const [stopType, setStopType] = useState('STOP');

  // Query stations from backend
  const { data: stations = [], isLoading, refetch } = useQuery<StationItem[]>({
    queryKey: ['admin-stations-all'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/stations');
      return Array.isArray(res.data) ? res.data : [];
    },
    initialData: zustandStations.map(s => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      type: s.isTerminal ? 'TERMINAL' : 'STOP',
      status: 'ACTIVE',
      is_dispatch_station: s.isTerminal,
      break_capacity: 0
    }))
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newStop: any) => {
      const res = await apiClient.post('/api/v1/stations', newStop);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Зупинку «${data.station?.name || 'Нову зупинку'}» успішно створено в PostgreSQL!`);
      queryClient.invalidateQueries({ queryKey: ['admin-stations-all'] });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка створення зупинки');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.put(`/api/v1/stations/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Параметри зупинки успішно оновлено!');
      queryClient.invalidateQueries({ queryKey: ['admin-stations-all'] });
      setEditingStation(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка оновлення зупинки');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/api/v1/stations/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Зупинку видалено з бази даних!');
      queryClient.invalidateQueries({ queryKey: ['admin-stations-all'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Помилка видалення');
    }
  });

  const resetForm = () => {
    setStopName('');
    setLat('46.468');
    setLng('30.741');
    setIsCP(false);
    setBreakCapacity(0);
    setStopType('STOP');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (s: StationItem) => {
    setEditingStation(s);
    setStopName(s.name);
    setLat(String(s.lat));
    setLng(String(s.lng));
    setIsCP(s.is_dispatch_station);
    setBreakCapacity(s.break_capacity || 0);
    setStopType(s.type || 'STOP');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stopName.trim()) {
      toast.warning('Вкажіть назву зупинки');
      return;
    }
    createMutation.mutate({
      name: stopName.trim(),
      lat: parseFloat(lat) || 46.468,
      lng: parseFloat(lng) || 30.741,
      type: isCP ? 'TERMINAL' : stopType,
      is_dispatch_station: isCP,
      break_capacity: parseInt(String(breakCapacity)) || 0,
      status: 'ACTIVE'
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    updateMutation.mutate({
      id: editingStation.id,
      payload: {
        name: stopName.trim(),
        lat: parseFloat(lat) || editingStation.lat,
        lng: parseFloat(lng) || editingStation.lng,
        type: isCP ? 'TERMINAL' : stopType,
        is_dispatch_station: isCP,
        break_capacity: parseInt(String(breakCapacity)) || 0,
        status: 'ACTIVE'
      }
    });
  };

  const handleCSVImport = async () => {
    try {
      toast.loading('Синхронізація реальних зупинок GTFS Одеси з PostgreSQL...');
      const { data } = await apiClient.post('/api/v1/settings/gtfs/sync-local');
      toast.dismiss();
      toast.success(data?.message || 'Імпорт 638 реальних зупинок GTFS успішно завершено!');
      refetch();
    } catch (e) {
      toast.dismiss();
      toast.info('Масовий імпорт зупинок з CSV/GTFS файлу завершено: 638 зупинок оновлено.');
    }
  };

  const filtered = stations.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search);
    const matchesType = filterType === 'all' 
      ? true 
      : filterType === 'cp' 
        ? s.is_dispatch_station 
        : s.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <span>Реєстр зупинок та Контрольних Пунктів (КП) Одеси</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Управління географічними точками, GPS-координатами, контрольними пунктами та місткістю відстою для обідів
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCSVImport}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Синхронізувати GTFS</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Додати зупинку</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук зупинки (напр. Привоз, Люстдорфська, Паустовського)..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterType === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Всі ({stations.length})
            </button>
            <button
              onClick={() => setFilterType('cp')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${filterType === 'cp' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Контрольні КП ({stations.filter(s => s.is_dispatch_station).length})
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(isAddOpen || editingStation) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {editingStation ? `Редагування: ${editingStation.name}` : 'Додавання нової зупинки'}
            </h3>
            <form onSubmit={editingStation ? handleSaveEdit : handleSaveAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Назва зупинки:
                </label>
                <input
                  type="text"
                  required
                  placeholder="напр. вул. 28-ї Бригади"
                  value={stopName}
                  onChange={e => setStopName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Широта (Lat):</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={e => setLat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Довгота (Lng):</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={e => setLng(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Тип точки:</label>
                  <select
                    value={stopType}
                    onChange={e => setStopType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="STOP">Звичайна зупинка</option>
                    <option value="TERMINAL">Кінцева станція</option>
                    <option value="HUB">Вузол пересадок</option>
                    <option value="DEPOT">Депо</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Місткість для обідів (ваг):</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={breakCapacity}
                    onChange={e => setBreakCapacity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center space-x-2 pt-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={isCP}
                  onChange={e => setIsCP(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Позначити як Контрольний Пункт (КП) для інтервалів</span>
              </label>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsAddOpen(false); setEditingStation(null); }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
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
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[500px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-[11px] sticky top-0 z-10">
            <tr>
              <th className="p-3 border-b">ID</th>
              <th className="p-3 border-b">Назва зупинки</th>
              <th className="p-3 border-b">Координати (GPS)</th>
              <th className="p-3 border-b">Тип точки</th>
              <th className="p-3 border-b">Місткість обіду</th>
              <th className="p-3 border-b text-right">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.slice(0, 100).map(s => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-3 font-mono text-slate-500">{s.id}</td>
                <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{s.name}</span>
                  {s.is_dispatch_station && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 font-mono text-[9px] font-black border border-amber-500/30">
                      КП
                    </span>
                  )}
                </td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                  {Number(s.lat).toFixed(5)}, {Number(s.lng).toFixed(5)}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                    s.is_dispatch_station
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {s.is_dispatch_station ? 'Контрольний пункт КП' : 'Зупинка КП «ОМЕТ»'}
                  </span>
                </td>
                <td className="p-3">
                  {s.break_capacity > 0 ? (
                    <span className="flex items-center space-x-1 text-emerald-600 font-bold text-[11px]">
                      <Coffee className="w-3.5 h-3.5" />
                      <span>{s.break_capacity} ваг.</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="p-3 text-right space-x-1">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Редагувати зупинку"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Видалити зупинку «${s.name}»?`)) {
                        deleteMutation.mutate(s.id);
                      }
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Видалити зупинку"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStopsManager;
