import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Header } from './components/Header'
import { AnalyticalReportModal } from './components/AnalyticalReportModal'
import { ExecutiveDashboardView } from './components/views/ExecutiveDashboardView'
import { AuthLoginView } from './components/views/AuthLoginView'
import { SuperuserRoute } from './components/SuperuserRoute'
import { GlobalLoader } from './components/GlobalLoader'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ViewLoadingFallback } from './components/ViewLoadingFallback'
import { Toaster } from 'sonner'
import { useWebSocket } from './hooks/useWebSocket'
import { useScheduleStore } from './store/useScheduleStore'
import { useConfigStore } from './store/useConfigStore'
import { useAuthStore } from './store/useAuthStore'
import { useSettingsStore } from './store/useSettingsStore'
import { authApi } from './services/authApi'

// Ліниве асинхронне завантаження важких вкладок (Code Splitting)
const LiveMapView = lazy(() => import('./components/views/LiveMapView').then(m => ({ default: m.LiveMapView })))
const MareyDiagramTab = lazy(() => import('./components/tabs/MareyDiagramTab').then(m => ({ default: m.MareyDiagramTab })))
const DispatcherLiveView = lazy(() => import('./components/views/DispatcherLiveView').then(m => ({ default: m.DispatcherLiveView })))
const OperationalGanttView = lazy(() => import('./components/views/OperationalGanttView').then(m => ({ default: m.OperationalGanttView })))
const DispatchOrdersJournalView = lazy(() => import('./components/views/DispatchOrdersJournalView').then(m => ({ default: m.DispatchOrdersJournalView })))
const AnalyticsReportView = lazy(() => import('./components/views/AnalyticsReportView').then(m => ({ default: m.AnalyticsReportView })))
const PlanningWorkspaceView = lazy(() => import('./components/views/PlanningWorkspaceView').then(m => ({ default: m.PlanningWorkspaceView })))
const DutyParametersBuilderView = lazy(() => import('./components/views/DutyParametersBuilderView').then(m => ({ default: m.DutyParametersBuilderView })))
const TripGridView = lazy(() => import('./components/views/TripGridView').then(m => ({ default: m.TripGridView })))
const ControlPointsTripsView = lazy(() => import('./components/views/ControlPointsTripsView').then(m => ({ default: m.ControlPointsTripsView })))
const DutyBuilderView = lazy(() => import('./components/views/DutyBuilderView').then(m => ({ default: m.DutyBuilderView })))
const DriverShiftConstructorView = lazy(() => import('./components/views/DriverShiftConstructorView').then(m => ({ default: m.DriverShiftConstructorView })))
const InterlineSyncView = lazy(() => import('./components/views/InterlineSyncView').then(m => ({ default: m.InterlineSyncView })))
const DriverScheduleBookView = lazy(() => import('./components/views/DriverScheduleBookView').then(m => ({ default: m.DriverScheduleBookView })))
const ActiveDutiesView = lazy(() => import('./components/views/ActiveDutiesView').then(m => ({ default: m.ActiveDutiesView })))
const StaticDutiesArchiveView = lazy(() => import('./components/views/StaticDutiesArchiveView').then(m => ({ default: m.StaticDutiesArchiveView })))
const CrewAssignmentView = lazy(() => import('./components/views/CrewAssignmentView').then(m => ({ default: m.CrewAssignmentView })))
const CrewRosterTab = lazy(() => import('./components/tabs/CrewRosterTab').then(m => ({ default: m.CrewRosterTab })))
const AdminView = lazy(() => import('./components/views/AdminView').then(m => ({ default: m.AdminView })))
const NetworkSettingsTab = lazy(() => import('./components/tabs/NetworkSettingsTab').then(m => ({ default: m.NetworkSettingsTab })))
const DriverTerminalView = lazy(() => import('./components/views/DriverTerminalView').then(m => ({ default: m.DriverTerminalView })))
const DeadheadOptimizerView = lazy(() => import('./components/views/DeadheadOptimizerView').then(m => ({ default: m.DeadheadOptimizerView })))

export const App: React.FC = () => {
  // Активуємо реактивне WebSocket підключення при старті додатку
  useWebSocket()

  const { token, isAuthenticated, setUser, logout } = useAuthStore()
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true)

  const { currentPath, fetchInitialData } = useScheduleStore()
  const { fetchConfigs } = useConfigStore()
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false)

  const scheduleTheme = useScheduleStore((state) => state.theme)
  const settingsTheme = useSettingsStore((state) => state.theme)

  // Глобально застосовуємо клас теми до тегу <html> та <body>
  useEffect(() => {
    const isDark = scheduleTheme === 'night-dispatch' || scheduleTheme === 'dark'

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    document.body.classList.remove('light', 'dark')

    if (isDark) {
      root.classList.add('dark')
      document.body.classList.add('dark')
      document.body.setAttribute('data-theme', 'night-dispatch')
      root.setAttribute('data-theme', 'night-dispatch')
    } else {
      root.classList.remove('dark')
      document.body.classList.remove('dark')
      document.body.setAttribute('data-theme', 'omet-clean')
      root.setAttribute('data-theme', 'omet-clean')
    }
  }, [scheduleTheme, settingsTheme])

  // Session verification on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const me = await authApi.getMe()
          setUser(me)
        } catch (error) {
          console.error('Сесія застаріла, авторизуйтесь знову:', error)
          logout()
        }
      }
      setIsVerifyingSession(false)
    }

    verifyAuth()
  }, [token, setUser, logout])

  // Fetch static GTFS data & system configs once session is valid
  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData()
      fetchConfigs()
    }
  }, [isAuthenticated, fetchInitialData, fetchConfigs])

  if (isVerifyingSession) {
    return <GlobalLoader message="Перевірка сесії авторизації КП «ОМЕТ»..." />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans flex items-center justify-center p-4">
        <AuthLoginView />
        <Toaster position="top-right" richColors />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased">
        <GlobalLoader />
        
        {/* Header Navigation */}
        <Header onOpenReport={() => setIsReportOpen(true)} />

        {/* Main Content View Routing with Suspense fallback */}
        <main className={currentPath === '/dispatch/map' ? "flex-1 w-full h-[calc(100vh-125px)] flex flex-col overflow-hidden" : "flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6"}>
          <Suspense fallback={<ViewLoadingFallback />}>
            {currentPath === '/' && <ExecutiveDashboardView />}
            {currentPath === '/analytics' && <AnalyticsReportView />}
            {currentPath === '/dispatch/map' && <LiveMapView />}
            {currentPath === '/dispatch/marey' && <MareyDiagramTab />}
            {currentPath === '/dispatch/matrix' && <DispatcherLiveView />}
            {currentPath === '/dispatch/gantt' && <OperationalGanttView />}
            {currentPath === '/dispatch/orders' && <DispatchOrdersJournalView />}
            {currentPath === '/planning/workspace' && <PlanningWorkspaceView />}
            {currentPath === '/planning/parameters' && <DutyParametersBuilderView />}
            {currentPath === '/planning/matrix' && <TripGridView />}
            {currentPath === '/planning/control-points' && <PlanningWorkspaceView initialTab="parameters" />}
            {currentPath === '/planning/gantt' && <PlanningWorkspaceView initialTab="parameters" />}
            {currentPath === '/planning/shifts' && <DriverShiftConstructorView />}
            {currentPath === '/planning/interline' && <InterlineSyncView />}
            {currentPath === '/planning/driver-book' && <PlanningWorkspaceView initialTab="parameters" />}
            {currentPath === '/planning/active-duties' && <ActiveDutiesView />}
            {currentPath === '/planning/archive' && <StaticDutiesArchiveView />}
            {currentPath === '/planning/deadhead' && <PlanningWorkspaceView initialTab="parameters" />}
            
            {/* Superuser Admin Section */}
            {currentPath === '/settings/stops' && (
              <SuperuserRoute>
                <NetworkSettingsTab initialSubTab="stops" />
              </SuperuserRoute>
            )}
            {currentPath === '/settings/shared-stops' && (
              <SuperuserRoute>
                <NetworkSettingsTab initialSubTab="shared-stops" />
              </SuperuserRoute>
            )}
            {currentPath === '/settings/routes' && (
              <SuperuserRoute>
                <NetworkSettingsTab initialSubTab="routes" />
              </SuperuserRoute>
            )}
            {currentPath === '/settings/intersections' && (
              <SuperuserRoute>
                <NetworkSettingsTab initialSubTab="intersections" />
              </SuperuserRoute>
            )}
            {currentPath === '/settings/depots' && (
              <SuperuserRoute>
                <NetworkSettingsTab initialSubTab="depots" />
              </SuperuserRoute>
            )}
            {currentPath === '/settings/breaks' && (
              <SuperuserRoute>
                <NetworkSettingsTab initialSubTab="breaks" />
              </SuperuserRoute>
            )}
            {(currentPath === '/admin' || currentPath === '/admin/users') && (
              <SuperuserRoute>
                <AdminView initialTab="users" />
              </SuperuserRoute>
            )}
            {currentPath === '/admin/vehicles' && (
              <SuperuserRoute>
                <AdminView initialTab="vehicles" />
              </SuperuserRoute>
            )}
            {currentPath === '/admin/drivers' && (
              <SuperuserRoute>
                <AdminView initialTab="drivers" />
              </SuperuserRoute>
            )}
            {currentPath === '/admin/duty-types' && (
              <SuperuserRoute>
                <AdminView initialTab="duty_types" />
              </SuperuserRoute>
            )}
            {currentPath === '/admin/backup' && (
              <SuperuserRoute>
                <AdminView initialTab="backup" />
              </SuperuserRoute>
            )}

            {/* Personnel & Drivers Section */}
            {currentPath === '/crew/assignment' && <CrewAssignmentView />}
            {currentPath === '/crew/schedule-book' && <DriverScheduleBookView />}
            {(currentPath === '/crew/roster' || currentPath === '/crew') && <CrewRosterTab />}
            {(currentPath === '/crew/terminal' || currentPath === '/driver/terminal') && <DriverTerminalView />}
            {currentPath === '/login' && <AuthLoginView />}
          </Suspense>
        </main>

        {/* Analytics OTP Report Modal */}
        <AnalyticalReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />

        <Toaster position="top-right" richColors />
      </div>
    </ErrorBoundary>
  )
}

export default App
