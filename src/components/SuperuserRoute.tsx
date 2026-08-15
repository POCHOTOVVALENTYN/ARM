import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useScheduleStore } from '../store/useScheduleStore';
import { toast } from 'sonner';

interface SuperuserRouteProps {
  children?: React.ReactNode;
}

export const SuperuserRoute: React.FC<SuperuserRouteProps> = ({ children }) => {
  const { user } = useAuthStore();
  const { setPath } = useScheduleStore();

  // Перевірка наявності прав суперкористувача (адміністратора)
  if (!user?.is_superuser) {
    // Якщо прав немає - повертаємо на робоче місце диспетчера
    toast.warning('Доступ обмежено: для цієї дії потрібні права адміністратора (Superuser).');
    setPath('/dispatch/marey');
    return null;
  }

  return <>{children}</>;
};

export default SuperuserRoute;
