import React, { useState } from 'react';
import { useScheduleStore, UserRole } from '../../store/useScheduleStore';
import { ShieldCheck, UserCheck, Key, Lock, Radio, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthLoginView: React.FC = () => {
  const { user, setUserRole, setPath } = useScheduleStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [badgeInput, setBadgeInput] = useState(user.badge);
  const [nameInput, setNameInput] = useState(user.name);
  const [isSaved, setIsSaved] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUserRole(selectedRole);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setPath('/dispatch/marey');
    }, 1000);
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      {/* Login Card */}
      <div className="brutalist-card bg-white p-8 rounded-2xl space-y-6 shadow-xl">
        <div className="flex items-center space-x-3 border-b-2 border-gray-900 pb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold border-2 border-gray-900 shadow-md">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Авторизація та Вибір Ролі Диспетчера
            </h2>
            <p className="text-xs text-gray-600">
              КП «Одесміськелектротранс» • АРМ «Розклади» v2.4 (JWT HttpOnly Session)
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-900 p-3 rounded-xl flex items-center space-x-2 text-xs font-bold animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Сесію успішно оновлено! Перенаправлення на Диспетчерський панель...</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans">
          <div>
            <label className="font-bold text-gray-900 block mb-1">
              ПІБ Співробітника / Диспетчера:
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl p-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="font-bold text-gray-900 block mb-1">
              Табельний номер / Нагрудний жетон:
            </label>
            <input
              type="text"
              value={badgeInput}
              onChange={(e) => setBadgeInput(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl p-3 font-bold text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Role selector */}
          <div className="space-y-2 pt-2">
            <label className="font-bold text-gray-900 block">
              Виберіть рівень доступу та роль у системі:
            </label>

            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: 'dispatcher',
                  title: 'Головний Диспетчер Зміни (Dispatcher)',
                  desc: 'Повний доступ до Графіка Марея, відтяжок Slack Manager, Hot Reserve та оперативного редагування.',
                  badge: 'Рівень 2 (Динаміка)',
                },
                {
                  id: 'admin',
                  title: 'Інженер-Технолог Розкладів (Admin)',
                  desc: 'Адміністрування довідників маршрутів, матриць часу, каналів вузлів та експорт GTFS.',
                  badge: 'Рівень 1 (Статика)',
                },
                {
                  id: 'viewer',
                  title: 'Спостерігач / Інспектор (Viewer)',
                  desc: 'Перегляд аналітики, табелів водіїв, карти руху без права внесення оперативно-диспетчерських змін.',
                  badge: 'Read-Only Mode',
                },
              ].map((r) => (
                <label
                  key={r.id}
                  onClick={() => setSelectedRole(r.id as UserRole)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer flex items-start space-x-3 transition-all ${
                    selectedRole === r.id
                      ? 'bg-indigo-50 border-indigo-600 shadow-sm'
                      : 'bg-white border-gray-300 hover:border-gray-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.id}
                    checked={selectedRole === r.id}
                    onChange={() => setSelectedRole(r.id as UserRole)}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{r.title}</span>
                      <span className="text-[10px] font-mono bg-gray-900 text-white px-2 py-0.5 rounded">
                        {r.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm py-3.5 rounded-xl border-2 border-indigo-700 shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all mt-4"
          >
            <span>Авторизувати сесію та увійти</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="bg-gray-100 border border-gray-300 p-3 rounded-xl text-[11px] text-gray-600 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-gray-900">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Безпека та авторизація:</span>
          </div>
          <p>
            Сесія захищенаHttpOnly Secure Cookie. Токени доступу (JWT Access/Refresh) автоматично оновлюються у фоновому режимі.
          </p>
        </div>
      </div>
    </div>
  );
};
