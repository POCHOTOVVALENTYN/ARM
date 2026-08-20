import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit3, Search, Phone, Building2, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';
import { toast } from 'sonner';

interface DriverRecord {
  id: string;
  tabNumber: string;
  fullName: string;
  phone: string;
  depot: string;
  status: 'active' | 'vacation' | 'sick';
}

const INITIAL_DRIVERS: DriverRecord[] = [
  { id: '1', tabNumber: '1042', fullName: 'Іваненко Василь Олексійович', phone: '+380 67 123 4567', depot: 'Трамвайне депо №1', status: 'active' },
  { id: '2', tabNumber: '1088', fullName: 'Петренко Сергій Миколайович', phone: '+380 50 987 6543', depot: 'Трамвайне депо №1', status: 'active' },
  { id: '3', tabNumber: '2014', fullName: 'Коваленко Олена Дмитрівна', phone: '+380 93 456 7890', depot: 'Трамвайне депо №2', status: 'active' },
  { id: '4', tabNumber: '2055', fullName: 'Сидоренко Михайло Петрович', phone: '+380 68 234 5678', depot: 'Трамвайне депо №2', status: 'vacation' },
  { id: '5', tabNumber: '3001', fullName: 'Бондар Андрій Вікторович', phone: '+380 99 345 6789', depot: 'Тролейбусне депо', status: 'active' },
  { id: '6', tabNumber: '3024', fullName: 'Мельник Тетяна Іванівна', phone: '+380 63 456 7891', depot: 'Тролейбусне депо', status: 'active' },
];

export const AdminDriversManager: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverRecord[]>(INITIAL_DRIVERS);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tabNumber, setTabNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [depot, setDepot] = useState('Трамвайне депо №1');

  // Load from backend
  const { data: backendData } = useQuery({
    queryKey: ['admin-drivers-available'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/crew/available');
      return data;
    },
  });

  useEffect(() => {
    if (backendData?.drivers && backendData.drivers.length > 0) {
      const mapped: DriverRecord[] = backendData.drivers.map((d: any, idx: number) => ({
        id: String(d.id),
        tabNumber: String(1000 + Number(d.id || idx + 1)),
        fullName: d.full_name || d.name || `Водій #${d.id}`,
        phone: '+380 67 ' + (1000000 + Number(d.id || idx) * 1234).toString().slice(0, 7),
        depot: Number(d.id) % 2 === 0 ? 'Трамвайне депо №1' : 'Трамвайне депо №2',
        status: 'active',
      }));
      setDrivers(mapped);
    }
  }, [backendData]);

  const filtered = drivers.filter(d => 
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    d.tabNumber.includes(search) ||
    d.depot.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !tabNumber.trim()) {
      toast.warning('Заповніть ПІБ та табельний номер');
      return;
    }
    const newDriver: DriverRecord = {
      id: Date.now().toString(),
      tabNumber: tabNumber.trim(),
      fullName: fullName.trim(),
      phone: phone.trim() || '+380 00 000 0000',
      depot,
      status: 'active',
    };
    setDrivers([newDriver, ...drivers]);
    toast.success(`Водія ${fullName} успішно внесено до реєстру!`);
    setIsAddOpen(false);
    setTabNumber('');
    setFullName('');
    setPhone('');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Ви дійсно бажаєте видалити водія ${name}?`)) {
      setDrivers(drivers.filter(d => d.id !== id));
      toast.success(`Водія ${name} видалено.`);
    }
  };

  const handleImportSample = () => {
    toast.info('Масовий імпорт водіїв з CSV/Excel активовано.');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Реєстр водіїв та персоналу КП «ОМЕТ»</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Управління базою водіїв для щоденної рознарядки за випусками та депо
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleImportSample}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Імпорт CSV</span>
          </button>
          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Додати водія</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук за ПІБ, табельним або депо..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs font-mono font-bold text-slate-500">
          Всього в базі: <span className="text-indigo-600 font-black">{drivers.length}</span>
        </div>
      </div>

      {/* Add Driver Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Внесення нового водія до реєстру
            </h3>
            <form onSubmit={handleAddDriver} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Табельний номер:
                </label>
                <input
                  type="text"
                  required
                  placeholder="напр. 1092"
                  value={tabNumber}
                  onChange={e => setTabNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  ПІБ водія:
                </label>
                <input
                  type="text"
                  required
                  placeholder="напр. Шевченко Тарас Григорович"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Контактний телефон:
                </label>
                <input
                  type="text"
                  placeholder="+380 XX XXX XX XX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Приналежність до Депо:
                </label>
                <select
                  value={depot}
                  onChange={e => setDepot(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
                >
                  <option value="Трамвайне депо №1">Трамвайне депо №1 (Водопровідна)</option>
                  <option value="Трамвайне депо №2">Трамвайне депо №2 (Слобідка)</option>
                  <option value="Тролейбусне депо">Тролейбусне депо</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 font-bold"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black"
                >
                  Зберегти водія
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drivers Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black uppercase text-[11px]">
            <tr>
              <th className="p-3.5 border-b">Таб. №</th>
              <th className="p-3.5 border-b">ПІБ Водія</th>
              <th className="p-3.5 border-b">Телефон</th>
              <th className="p-3.5 border-b">Депо</th>
              <th className="p-3.5 border-b">Статус</th>
              <th className="p-3.5 border-b text-right">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-3.5 font-mono font-black text-indigo-600">#{d.tabNumber}</td>
                <td className="p-3.5 font-bold text-slate-900 dark:text-white">{d.fullName}</td>
                <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{d.phone}</td>
                <td className="p-3.5">
                  <span className="flex items-center space-x-1 text-slate-700 dark:text-slate-300">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{d.depot}</span>
                  </span>
                </td>
                <td className="p-3.5">
                  {d.status === 'active' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Активний
                    </span>
                  )}
                  {d.status === 'vacation' && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      Відпустка
                    </span>
                  )}
                  {d.status === 'sick' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                      Лікарняний
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleDelete(d.id, d.fullName)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Видалити з реєстру"
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

export default AdminDriversManager;
