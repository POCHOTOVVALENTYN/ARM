import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { authApi } from '../services/authApi'
import { useSettingsStore } from '../store/useSettingsStore'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { token, isAuthenticated, setUser, logout } = useAuthStore()
  const { setPath } = useScheduleStore()
  const fetchSettings = useSettingsStore((state) => state.fetchSettings)
  const [isVerifying, setIsVerifying] = useState<boolean>(true)

  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsVerifying(false)
        setPath('/login')
        return
      }

      try {
        const user = await authApi.getMe()
        setUser(user)
        fetchSettings(true)
      } catch (error) {
        console.error('Session verification failed:', error)
        logout()
        setPath('/login')
      } finally {
        setIsVerifying(false)
      }
    }

    verifySession()
  }, [token, setUser, logout, setPath, fetchSettings])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-900 dark:border-slate-800 shadow-xl">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-900 dark:text-slate-100 font-extrabold text-sm">Перевірка активної сесії диспетчера...</p>
        </div>
      </div>
    )
  }

  if (!token || !isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
