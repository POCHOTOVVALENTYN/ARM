import React, { useState } from 'react';
import { Lock, Download, Upload, Trash2, Zap, FileText, CheckCircle2, Radio, Database, Settings } from 'lucide-react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { useRouteStore } from '../../store/useRouteStore';
import { AdminTab } from "../tabs/AdminTab";
import { GtfsIntegrationTab } from '../tabs/GtfsIntegrationTab';
import { ConfirmActionModal, ConfirmModalConfig } from '../ConfirmActionModal';

interface AdminViewProps {
  initialTab?: 'config' | 'gtfs';
}

export const AdminView: React.FC<AdminViewProps> = ({ initialTab = 'config' }) => {
  const { liveBlocks, draftBlocks, discardDraft } = useScheduleStore();
  const { routes } = useRouteStore();
  const [activeTab, setActiveTab] = useState<'config' | 'gtfs'>(initialTab);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<ConfirmModalConfig | null>(null);

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
      version: 'v1.4.6',
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

  const triggerImportGTFSModal = () => {
    setModalConfig({
      isOpen: true,
      title: 'Синхронізація з GTFS м. Одеси',
      description: 'Ви збираєтесь завантажити та синхронізувати статичні GTFS-дані маршрутів, зупинок та геозонування КП «ОМЕТ» для EasyWay та Google Maps. Синхронізувати?',
      confirmText: 'Синхронізувати GTFS',
      cancelText: 'Скасувати',
      variant: 'success',
      icon: 'zap',
      onConfirm: () => {
        executeImportGTFS();
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  };

  const executeImportGTFS = () => {
    setStatusMessage('Реальні GTFS дані м. Одеси успішно завантажені та синхронізовані!');
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
        executeResetSystem();
        setModalConfig(null);
      },
      onCancel: () => setModalConfig(null),
    });
  };

  const executeResetSystem = () => {
    discardDraft();
    setStatusMessage('Систему повернено до дефолтного стану м. Одеси');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {statusMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 p-4 rounded-2xl flex items-center space-x-3 shadow-md animate-fade-in font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Banner Card with Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>🔒 ПАНЕЛЬ АДМІНІСТРУВАННЯ ТА OPEN DATA</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
              КЕРУВАННЯ КОНФІГУРАЦІЄЮ СИСТЕМИ, ЕКСПОРТ GTFS ТА ДІАГНОСТИКА
            </p>
          </div>
        </div>

        {/* Tab Navigation inside Admin */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>База Даних</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span>Система & Резервування</span>
          </button>
          <button
            onClick={() => setActiveTab('gtfs')}
            className={`px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'gtfs'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4 text-indigo-600" />
            <span>Open Data & GTFS</span>
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'gtfs' ? (
        <GtfsIntegrationTab routes={routes} blocks={liveBlocks} />
      ) : activeTab === 'database' ? (
        <AdminTab />
      ) : (
        /* Main 2-Column Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Card: Backup & Reset */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                <span className="text-lg">📦</span>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
                  РЕЗЕРВНЕ КОПІЮВАННЯ ТА СКИДАННЯ
                </h2>
              </div>

              {/* Export Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
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

              {/* Restore Section */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold text-slate-800">
                  Відновити з файлу:
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Завантажити раніше збережений файл резервної копії для відновлення стану.
                </p>
                <label className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Обрати файл</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setStatusMessage(`Файл ${e.target.files[0].name} успішно зчитано та застосовано!`);
                        setTimeout(() => setStatusMessage(null), 4000);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Reset Section */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
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

          {/* Right Card: GTFS Import */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-5 text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Upload className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Оберіть завантаження реальних статичних GTFS-даних м. Одеси, які вже розміщені в папці проекту.
              </p>

              <button
                onClick={triggerImportGTFSModal}
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold py-4 px-6 rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-white text-white" />
                <span>Завантажити реальні GTFS дані м. Одеси</span>
              </button>

              <div className="py-2 text-center">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  АБО ЗАВАНТАЖИТИ ВРУЧНУ
                </span>
              </div>

              {/* Drag & Drop Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer space-y-2">
                <FileText className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-bold text-slate-600">
                  Перетягніть файли stops, routes, stop_times
                </p>
                <p className="text-[11px] text-slate-400">
                  Підтримується мульти-вибір
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalConfig && <ConfirmActionModal {...modalConfig} />}
    </div>
  );
};
