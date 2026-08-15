import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useScheduleStore } from '../store/useScheduleStore';
import { authApi } from '../services/authApi';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, isAuthenticated, setUser, logout } = useAuthStore();
  const { setPath } = useScheduleStore();
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsVerifying(false);
        return;
      }

      try {
        // При кожному оновленні сторінки підтягуємо свіжі дані користувача
        const user = await authApi.getMe();
        setUser(user);
      } catch (error) {
        console.error("Session verification failed:", error);
        logout();
        setPath('/login');
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [token, setUser, logout, setPath]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 p-8 bg-white rounded-2xl border-2 border-gray-900 shadow-xl">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-900 font-extrabold text-sm">Перевірка активної сесії диспетчера...</p>
        </div>
      </div>
    );
  }

  // Якщо токен відсутній або не авторизований
  if (!token || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
