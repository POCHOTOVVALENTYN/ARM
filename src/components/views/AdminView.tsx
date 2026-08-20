import React, { useState } from 'react';
import { 
  Lock, 
  Download, 
  Upload, 
  Trash2, 
  Zap, 
  FileText, 
  CheckCircle2, 
  Radio, 
  Database, 
  Settings, 
  Users, 
  Plus, 
  Shield, 
  Check, 
  X,
  Bus,
  MapPin,
  Coffee,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/apiClient';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { GtfsIntegrationTab } from '../tabs/GtfsIntegrationTab';
import { AdminDepotsManager } from '../admin/AdminDepotsManager';
import { AdminDriversManager } from '../admin/AdminDriversManager';
import { AdminStopsManager } from '../admin/AdminStopsManager';
import { AdminHubsManager } from '../admin/AdminHubsManager';
import { AdminBreakLocationsManager } from '../admin/AdminBreakLocationsManager';
import { AdminDutyTypesManager } from '../admin/AdminDutyTypesManager';
import { ConfirmActionModal, ConfirmModalConfig } from '../ConfirmActionModal';
import { toast } from 'sonner';

type AdminTabKey = 'users' | 'vehicles' | 'drivers' | 'stops' | 'infra' | 'duty_types' | 'gtfs' | 'backup';

interface AdminViewProps {
  initialTab?: AdminTabKey;
}

export const AdminView: React.FC<AdminViewProps> = ({ initialTab = 'users' }) => {
  const queryClient = useQueryClient();
  const { liveBlocks, draftBlocks, discardDraft } = useScheduleStore();
  const { routes } = useRouteStore();
  const [activeTab, setActiveTab] = useState<AdminTabKey>(initialTab);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<ConfirmModalConfig | null>(null);

  // Стан модального вікна створення користувача
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('DISPATCHER');

  // Запит списку користувачів з бекенду
  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/auth/users');
      return data;
    },
    enabled: activeTab === 'users',
  });

  // Мутація створення нового користувача
  const registerMutation = useMutation({
    mutationFn: async (payload: { username: string; password: string; full_name: string; role: string; is_superuser: boolean }) => {
      const { data } = await api.post('/auth/register', payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Користувача ${data.username} (${data.full_name}) успішно створено!`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsAddUserOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewRole('DISPATCHER');
    },
    onError: (err: any) => {
      toast.error(`Помилка створення користувача: ${err?.response?.data?.detail || err?.message || 'Помилка сервера'}`);
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.warning('Заповніть обов\'язкові поля: логін та пароль');
      return;
    }
    registerMutation.mutate({
      username: newUsername.trim(),
      password: newPassword.trim(),
      full_name: newFullName.trim() || newUsername.trim(),
      role: newRole,
      is_superuser: newRole === 'SUPERUSER'
    });
  };

  const triggerExportBackupModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Експорт резервної копії БД',
      description: 'Ви збираєтесь сформувати та завантажити повний файл конфігурації (.json) із розкладами, випуском та налаштуваннями КП «Одесміськелектротранс». Завантажити?',
      confirmText: 'Завантажити (.json)',
      cancelText: 'Скасувати',
      variant: 'info',
      icon: 'download',
      onConfirm: () => {
        executeExportBackup();
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  };

  const executeExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: 'v2.5.0',
      city: 'Одеса',
      liveBlocks,
      draftBlocks,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omet_backup_odesa_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatusMessage('Резервну копію успішно створено та завантажено (.json)');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const triggerResetSystemModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Повне очищення системи',
      description: 'Увага! Всі поточні чернетки змін, тимчасовий кеш та користувацькі коригування будуть анульовані. Систему буде повернено до базового стану м. Одеси. Виконати скидання?',
      confirmText: 'Очистити всі дані',
      cancelText: 'Скасувати',
      variant: 'danger',
      icon: 'trash',
      onConfirm: () => {
        discardDraft();
        setStatusMessage('Систему повернено до дефолтного стану м. Одеси');
        setTimeout(() => setStatusMessage(null), 4000);
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {statusMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 p-4 rounded-2xl flex items-center space-x-3 shadow-md animate-fade-in font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Banner Card with Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <span>Панель адміністрування та керування даними</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
              КП «Одесміськелектротранс» • Центр Master Data, користувачів та топології
            </p>
          </div>
        </div>

        {/* Tab Navigation inside Admin */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Користувачі</span>
          </button>

          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'vehicles'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Bus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Рухомий склад</span>
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Водії</span>
          </button>

          <button
            onClick={() => setActiveTab('stops')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'stops'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Зупинки та КП</span>
          </button>

          <button
            onClick={() => setActiveTab('infra')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'infra'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Вузли та Обіди</span>
          </button>

          <button
            onClick={() => setActiveTab('duty_types')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'duty_types'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Типи нарядів</span>
          </button>

          <button
            onClick={() => setActiveTab('gtfs')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'gtfs'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-600" />
            <span>GTFS Open Data</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <span>Резервування</span>
          </button>
        </div>
      </div>

      {/* 1. Вкладка КОРИСТУВАЧІ ТА РОЛІ (Users & RBAC) */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Реєстр диспетчерів та користувачів системи</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Керування правами доступу, ролями (SUPERUSER, CENTRAL_DISPATCHER, LINE_DISPATCHER, PLANNER, DRIVER, OBSERVER)
              </p>
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Додати користувача</span>
            </button>
          </div>

          {/* Таблиця користувачів */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[11px]">
                <tr>
                  <th className="p-3.5 border-b">ID</th>
                  <th className="p-3.5 border-b">Логін (Username)</th>
                  <th className="p-3.5 border-b">ПІБ / Повне ім'я</th>
                  <th className="p-3.5 border-b">Роль у системі</th>
                  <th className="p-3.5 border-b">Статус акаунта</th>
                  <th className="p-3.5 border-b">Права адміністратора</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      Завантаження списку користувачів...
                    </td>
                  </tr>
                ) : (
                  users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400">#{u.id}</td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-white font-mono">{u.username}</td>
                      <td className="p-3.5 font-bold text-slate-700 dark:text-slate-200">{u.full_name || '—'}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="flex items-center space-x-1 text-emerald-600 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Активний</span>
                        </span>
                      </td>
                      <td className="p-3.5">
                        {u.is_superuser ? (
                          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-black text-[10px]">
                            SUPERUSER
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Звичайні права</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Вкладка РУХОМИЙ СКЛАД (Вагони за депо) */}
      {activeTab === 'vehicles' && <AdminDepotsManager />}

      {/* 3. Вкладка ВОДІЇ ТА ПЕРСОНАЛ */}
      {activeTab === 'drivers' && <AdminDriversManager />}

      {/* 4. Вкладка ЗУПИНКИ ТА КП */}
      {activeTab === 'stops' && <AdminStopsManager />}

      {/* 5. Вкладка ВУЗЛИ, СТРІЛКИ ТА ОБІДИ */}
      {activeTab === 'infra' && (
        <div className="space-y-6">
          <AdminHubsManager />
          <AdminBreakLocationsManager />
        </div>
      )}

      {/* 6. Вкладка ТИПИ НАРЯДІВ */}
      {activeTab === 'duty_types' && <AdminDutyTypesManager />}

      {/* 7. Вкладка GTFS OPEN DATA */}
      {activeTab === 'gtfs' && <GtfsIntegrationTab routes={routes} blocks={liveBlocks} />}

      {/* 7. Вкладка РЕЗЕРВУВАННЯ БД */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-lg">📦</span>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
                  РЕЗЕРВНЕ КОПІЮВАННЯ ТА СКИДАННЯ
                </h2>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Експортувати базу даних:
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Зберегти всі поточні графіки змін, випуск техніки на лінії та налаштування відтяжок у один файл.
                </p>
                <button
                  onClick={triggerExportBackupModal}
                  className="w-full bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Створити резервну копію (.json)</span>
                </button>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <label className="block text-xs font-bold text-red-600">
                  Скинути систему:
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Повне очищення кешу та налаштувань. Повертає систему до первинного дефолтного стану м. Одеси.
                </p>
                <button
                  onClick={triggerResetSystemModal}
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Очистити всі дані системи</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-5 text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-2xl">
                  <Upload className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Інтеграція Open Data</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Статичні GTFS-дані КП «Одесміськелектротранс» синхронізовані та готові для публікації для пасажирських сервісів.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно додавання користувача */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Створення нового облікового запису</span>
              </h3>
              <button 
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Логін (Username) *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="напр. dispatcher_t18"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Пароль *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Введіть надійний пароль"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  ПІБ / Повне ім'я
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="напр. Диспетчер 1-ї лінії"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Роль у системі
                </label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="SUPERUSER">Адміністратор (SUPERUSER)</option>
                  <option value="CENTRAL_DISPATCHER">Центральний Головний Диспетчер (CENTRAL_DISPATCHER)</option>
                  <option value="LINE_DISPATCHER">Лінійний диспетчер КП (LINE_DISPATCHER)</option>
                  <option value="PLANNER">Інженер-плановик розкладів (PLANNER)</option>
                  <option value="DRIVER">Водій (DRIVER)</option>
                  <option value="OBSERVER">Спостерігач (OBSERVER)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{registerMutation.isPending ? 'Створення...' : 'Створити акаунт'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalConfig && <ConfirmActionModal {...modalConfig} />}
    </div>
  );
};

export default AdminView;

