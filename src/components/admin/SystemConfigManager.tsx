import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Save, Map, Image, AlertCircle, CheckCircle2, Sliders, Palette, RefreshCw } from 'lucide-react';

export const SystemConfigManager: React.FC = () => {
  const { mapTileUrl, mapAttribution, enterpriseLogoUrl, theme, saveSettings, fetchSettings, isLoading } = useSettingsStore();

  const [form, setForm] = useState({
    mapTileUrl,
    mapAttribution,
    enterpriseLogoUrl: enterpriseLogoUrl || '',
    theme
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    setForm({
      mapTileUrl,
      mapAttribution,
      enterpriseLogoUrl: enterpriseLogoUrl || '',
      theme
    });
  }, [mapTileUrl, mapAttribution, enterpriseLogoUrl, theme]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    try {
      await saveSettings({
        mapTileUrl: form.mapTileUrl,
        mapAttribution: form.mapAttribution,
        enterpriseLogoUrl: form.enterpriseLogoUrl || null,
        theme: form.theme as any
      });
      setNotification({ type: 'success', text: 'Налаштування системи успішно збережено в базі даних!' });
    } catch (error) {
      setNotification({ type: 'error', text: 'Помилка збереження. Перевірте з\'єднання або права доступу.' });
    }
  };

  // Попередньо налаштовані пресети тайлів
  const applyPreset = (tileUrl: string, attribution: string) => {
    setForm(prev => ({
      ...prev,
      mapTileUrl: tileUrl,
      mapAttribution: attribution
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sliders className="text-blue-500" />
            Глобальні конфігурації АРМ
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Керування тайловими серверами OpenStreetMap, брендуванням та візуальним стилем КП «ОМЕТ»
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchSettings()}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-bold transition-all"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>Оновити з БД</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-semibold border ${
          notification.type === 'error' 
            ? 'bg-rose-950/80 text-rose-300 border-rose-800' 
            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
        } animate-in fade-in`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{notification.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 space-y-8 shadow-xl">
        {/* Секція: Карта (ГІС) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="text-base font-bold flex items-center text-slate-100">
              <Map className="mr-2.5 text-blue-400" size={20} /> 
              Налаштування ГІС (Leaflet / OpenStreetMap)
            </h3>
            
            {/* Швидкі пресети */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">Пресети:</span>
              <button
                type="button"
                onClick={() => applyPreset('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', '&copy; OpenStreetMap contributors')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg border border-slate-600 transition-all font-mono"
              >
                OSM Standard
              </button>
              <button
                type="button"
                onClick={() => applyPreset('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', '&copy; CartoDB &copy; OpenStreetMap contributors')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg border border-slate-600 transition-all font-mono"
              >
                CartoDB Voyager
              </button>
              <button
                type="button"
                onClick={() => applyPreset('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', '&copy; CartoDB &copy; OpenStreetMap contributors')}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg border border-slate-600 transition-all font-mono"
              >
                CartoDB Dark
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Tile Server URL Шаблон
              </label>
              <input
                name="mapTileUrl"
                type="text"
                value={form.mapTileUrl}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-slate-400 mt-1.5">
                URL шаблон тайлового сервера із параметрами <code className="bg-slate-950 px-1.5 py-0.5 rounded text-blue-300">{"{z}/{x}/{y}"}</code>.
              </p>
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Map Attribution (Права та копірайт)
              </label>
              <input
                name="mapAttribution"
                type="text"
                value={form.mapAttribution}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </section>

        {/* Секція: Брендування та тема */}
        <section className="space-y-4">
          <div className="border-b border-slate-700 pb-3">
            <h3 className="text-base font-bold flex items-center text-slate-100">
              <Image className="mr-2.5 text-blue-400" size={20} /> 
              Брендування та Інтерфейс
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                URL Логотипу підприємства
              </label>
              <input
                name="enterpriseLogoUrl"
                type="text"
                value={form.enterpriseLogoUrl}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Зображення накладається поверх карти у верхньому куті.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Глобальна тема оформлення
              </label>
              <select
                name="theme"
                value={form.theme}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="light">Світла тема (Light)</option>
                <option value="dark">Темна тема (Dark)</option>
                <option value="system">Системна (Автоматично)</option>
              </select>
            </div>
          </div>
        </section>

        <div className="pt-4 border-t border-slate-700 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save size={18} />
            <span>{isLoading ? 'Збереження...' : 'Зберегти конфігурацію'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemConfigManager;
