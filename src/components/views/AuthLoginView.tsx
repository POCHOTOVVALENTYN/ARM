import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useScheduleStore } from '../../store/useScheduleStore';
import { authApi } from '../../services/authApi';
import { Radio, ArrowRight, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AuthLoginView: React.FC = () => {
  const { setAuth } = useAuthStore();
  const { setPath } = useScheduleStore();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await authApi.login(username, password);
      
      // Якщо бекенд не повернув user у відповіді логіну, отримуємо через getMe
      let userData = data.user;
      if (!userData) {
        // Встановлюємо тимчасово токен у стор для виклику getMe
        useAuthStore.setState({ token: data.access_token });
        userData = await authApi.getMe();
      }

      setAuth(data.access_token, userData);
      toast.success(`Вітаємо, ${userData.full_name || userData.username}! Успішний вхід.`);
      setPath('/dispatch/marey');
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Помилка авторизації. Перевірте логін та пароль.";
      setErrorMessage(detail);
      toast.error(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      {/* Login Card */}
      <div className="bg-white p-8 rounded-2xl border-2 border-gray-900 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3 border-b-2 border-gray-900 pb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold border-2 border-gray-900 shadow-md">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">
              АРМ Диспетчера
            </h2>
            <p className="text-xs text-gray-600 font-mono">
              КП «Одесміськелектротранс» • v2.4
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border-2 border-rose-500 text-rose-900 p-3 rounded-xl flex items-center space-x-2 text-xs font-bold animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs font-sans">
          <div>
            <label className="font-bold text-gray-900 block mb-1">
              Логін (Username):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введіть логін (напр. admin)"
                className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl py-3 pl-10 pr-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-900 block mb-1">
              Пароль:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль"
                className="w-full bg-gray-50 border-2 border-gray-900 rounded-xl py-3 pl-10 pr-3 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-xl border-2 border-indigo-700 shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all mt-6"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Авторизуватись у системі</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="bg-gray-50 border border-gray-300 p-3.5 rounded-xl text-[11px] text-gray-600 space-y-1.5 font-sans">
          <div className="flex items-center space-x-1.5 font-bold text-gray-900">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Безпека та авторизація:</span>
          </div>
          <p>
            Доступ захищено за стандартом <strong>OAuth2 + JWT</strong> (термін дії сесії — 10 годин).
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLoginView;
