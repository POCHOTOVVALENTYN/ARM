import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AnalyticalReportModal } from './components/AnalyticalReportModal';
import { ExecutiveDashboardView } from './components/views/ExecutiveDashboardView';
import { AuthLoginView } from './components/views/AuthLoginView';
import { AdminView } from './components/views/AdminView';
import { DispatcherTab } from './components/tabs/DispatcherTab';
import { NetworkSettingsTab } from './components/tabs/NetworkSettingsTab';
import { DutyBuilderView } from './components/views/DutyBuilderView';
import { TripGridView } from './components/views/TripGridView';
import { PlanningWorkspaceView } from './components/views/PlanningWorkspaceView';
import { DriverScheduleBookView } from './components/views/DriverScheduleBookView';
import { DriverTerminalView } from './components/views/DriverTerminalView';
import { ValidatorView } from './components/views/ValidatorView';
import { LiveMapView } from './components/views/LiveMapView';
import { DispatcherLiveView } from './components/views/DispatcherLiveView';
import { OperationalGanttView } from './components/views/OperationalGanttView';
import { SimulationMapView } from './components/views/SimulationMapView';
import { OperationalScheduleGenerator } from './components/views/OperationalScheduleGenerator';
import { MareyDiagramTab } from './components/tabs/MareyDiagramTab';
import { CrewRosterTab } from './components/tabs/CrewRosterTab';
import { CrewAssignmentView } from './components/views/CrewAssignmentView';
import { HotReserveView } from './components/views/HotReserveView';
import { EmergencyDetoursTab } from './components/tabs/EmergencyDetoursTab';
import { GtfsIntegrationTab } from './components/tabs/GtfsIntegrationTab';
import { AlgorithmSimulatorTab } from './components/tabs/AlgorithmSimulatorTab';
import { StaticDutiesArchiveView } from './components/views/StaticDutiesArchiveView';
import { SmartWaybillView } from './components/views/SmartWaybillView';
import { AnalyticsReportView } from './components/views/AnalyticsReportView';
import { useScheduleStore } from './store/useScheduleStore';
import { useConfigStore } from './store/useConfigStore';
import { useRouteStore } from './store/useRouteStore';
import { useAuthStore } from './store/useAuthStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useTelemetryStore } from './store/useTelemetryStore';
import { authApi } from './services/authApi';
import { SuperuserRoute } from './components/SuperuserRoute';
import { useWebSocket } from './hooks/useWebSocket';
import { GlobalLoader } from './components/GlobalLoader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';

export default function App() {
  // Активуємо WebSocket підключення при старті додатку
  useWebSocket('ws://localhost:8000/ws');

  const { token, isAuthenticated, setUser, logout } = useAuthStore();
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);

  const { 
    currentPath, setPath, draftBlocks, draftDuties, conflicts, 
    applySlackToNode, isInitialized, fetchInitialData 
  } = useScheduleStore();
  const { isLoaded: isConfigLoaded, fetchConfigs } = useConfigStore();
  const { routes } = useRouteStore();
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  const scheduleTheme = useScheduleStore((state) => state.theme);
  const settingsTheme = useSettingsStore((state) => state.theme);

  // Глобально застосовуємо клас теми до тегу <html> та <body>
  useEffect(() => {
    const isDark = scheduleTheme === 'night-dispatch' || scheduleTheme === 'dark';

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    document.body.classList.remove('light', 'dark');

    if (isDark) {
      root.classList.add('dark');
      document.body.classList.add('dark');
      document.body.setAttribute('data-theme', 'night-dispatch');
      root.setAttribute('data-theme', 'night-dispatch');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.setAttribute('data-theme', 'omet-clean');
      root.setAttribute('data-theme', 'omet-clean');
    }
  }, [scheduleTheme, settingsTheme]);

  // Session verification on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const me = await authApi.getMe();
          setUser(me);
        } catch (error) {
          console.error('Сесія застаріла, авторизуйтесь знову:', error);
          logout();
        }
      }
      setIsVerifyingSession(false);
    };

    verifyAuth();
  }, [token, setUser, logout]);

  // Fetch static GTFS data & system configs once session is valid
  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
      fetchConfigs();
    }
  }, [isAuthenticated, fetchInitialData, fetchConfigs]);

  if (isVerifyingSession) {
    return <GlobalLoader message="Перевірка сесії авторизації КП «ОМЕТ»..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans flex items-center justify-center p-4">
        <AuthLoginView />
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased">
        <GlobalLoader />
        
        {/* Header Navigation */}
        <Header onOpenReport={() => setIsReportOpen(true)} />

        {/* Main Content View Routing */}
        <main className={currentPath === '/dispatch/map' ? "flex-1 w-full h-[calc(100vh-125px)] flex flex-col overflow-hidden" : "flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6"}>
          {currentPath === '/' && <ExecutiveDashboardView />}
          {currentPath === '/analytics' && <AnalyticsReportView />}
          {currentPath === '/dispatch/map' && <LiveMapView />}
          {currentPath === '/dispatch/marey' && <MareyDiagramTab />}
          {currentPath === '/dispatch/matrix' && <DispatcherLiveView />}
          {currentPath === '/dispatch/gantt' && <OperationalGanttView />}
          {currentPath === '/dispatch/generator' && <OperationalScheduleGenerator />}
          {currentPath === '/planning/workspace' && <PlanningWorkspaceView />}
          {currentPath === '/planning/archive' && <StaticDutiesArchiveView />}
          
          {/* Superuser Admin Section */}
          {currentPath === '/settings/stops' && (
            <SuperuserRoute>
              <NetworkSettingsTab initialSubTab="stops" />
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
          {currentPath === '/admin' && (
            <SuperuserRoute>
              <AdminView />
            </SuperuserRoute>
          )}

          {/* Personnel & Drivers Section */}
          {currentPath === '/crew/assignment' && <CrewAssignmentView />}
          {currentPath === '/crew/schedule-book' && <DriverScheduleBookView />}
          {currentPath === '/driver' && <DriverTerminalView />}
          {currentPath === '/login' && <AuthLoginView />}
        </main>

        {/* Analytics OTP Report Modal */}
        <AnalyticalReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />

        <Toaster position="top-right" richColors />
      </div>
    </ErrorBoundary>
  );
}
