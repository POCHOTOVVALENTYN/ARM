import React, { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { toast } from 'sonner'

interface SuperuserRouteProps {
  children?: React.ReactNode
}

export const SuperuserRoute: React.FC<SuperuserRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore()
  const { setPath } = useScheduleStore()

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Потрібна авторизація для доступу до панелі адміністратора.')
      setPath('/login')
      return
    }

    if (!user?.is_superuser) {
      toast.warning('Доступ обмежено: для цієї дії потрібні права адміністратора (Superuser).')
      setPath('/dispatch/marey')
    }
  }, [user, isAuthenticated, setPath])

  if (!isAuthenticated || !user?.is_superuser) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-3 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Перевірка прав доступу адміністратора (Superuser)...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default SuperuserRoute
