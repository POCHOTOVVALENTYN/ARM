import React from 'react'
import { Users, Plus, Check, X } from 'lucide-react'
import { AdminUserRecord } from '../../hooks/useAdminViewLogic'

interface AdminUsersPanelProps {
  users: AdminUserRecord[]
  isLoadingUsers: boolean
  isAddUserOpen: boolean
  isRegisterPending: boolean
  newUsername: string
  newPassword: string
  newFullName: string
  newRole: string
  onOpenAddUser: (open: boolean) => void
  onUsernameChange: (val: string) => void
  onPasswordChange: (val: string) => void
  onFullNameChange: (val: string) => void
  onRoleChange: (val: string) => void
  onSubmitUser: (e: React.FormEvent) => void
}

export const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({
  users,
  isLoadingUsers,
  isAddUserOpen,
  isRegisterPending,
  newUsername,
  newPassword,
  newFullName,
  newRole,
  onOpenAddUser,
  onUsernameChange,
  onPasswordChange,
  onFullNameChange,
  onRoleChange,
  onSubmitUser
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Реєстр диспетчерів та користувачів системи</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Керування правами доступу та ролями (SUPERUSER, CENTRAL_DISPATCHER, LINE_DISPATCHER, PLANNER, DRIVER, OBSERVER)
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenAddUser(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Додати користувача</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold uppercase text-[10px]">
            <tr>
              <th className="p-3 border-b">ID</th>
              <th className="p-3 border-b">Логін (Username)</th>
              <th className="p-3 border-b">ПІБ / Повне ім'я</th>
              <th className="p-3 border-b">Роль у системі</th>
              <th className="p-3 border-b">Статус акаунта</th>
              <th className="p-3 border-b">Права адміністратора</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
            {isLoadingUsers ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                  Завантаження списку користувачів...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">
                  Немає зареєстрованих користувачів
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-mono text-slate-400">#{u.id}</td>
                  <td className="p-3 font-black text-slate-900 dark:text-white font-mono">{u.username}</td>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{u.full_name || '—'}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex items-center space-x-1 text-emerald-600 font-bold text-xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>Активний</span>
                    </span>
                  </td>
                  <td className="p-3">
                    {u.is_superuser ? (
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-black text-[10px]">
                        SUPERUSER
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium text-xs">Звичайні права</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Модальне вікно додавання користувача */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Новий користувач системи</span>
              </h3>
              <button
                type="button"
                onClick={() => onOpenAddUser(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmitUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Логін (Username) *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  placeholder="dispatcher_center"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Пароль *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-mono font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ПІБ / Повне ім'я
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => onFullNameChange(e.target.value)}
                  placeholder="Сидоренко Олена Петрівна"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Роль у системі
                </label>
                <select
                  value={newRole}
                  onChange={(e) => onRoleChange(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DISPATCHER">DISPATCHER (Черговий диспетчер)</option>
                  <option value="CENTRAL_DISPATCHER">CENTRAL_DISPATCHER (Центральний диспетчер ЦД)</option>
                  <option value="LINE_DISPATCHER">LINE_DISPATCHER (Лінійний диспетчер / ДП)</option>
                  <option value="PLANNER">PLANNER (Інженер з організації руху / Розкладник)</option>
                  <option value="DRIVER">DRIVER (Водій електротранспорту)</option>
                  <option value="OBSERVER">OBSERVER (Наглядач / Моніторинг)</option>
                  <option value="SUPERUSER">SUPERUSER (Повний адміністративний доступ)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onOpenAddUser(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isRegisterPending}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRegisterPending ? 'Створення...' : 'Зберегти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
