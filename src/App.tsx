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

  const settingsTheme = useSettingsStore((state) => state.theme);

  // Глобально застосовуємо клас теми до тегу <html> та <body>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (settingsTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      document.body.setAttribute('data-theme', systemTheme);
      root.setAttribute('data-theme', systemTheme);
    } else {
      root.classList.add(settingsTheme);
      document.body.setAttribute('data-theme', settingsTheme);
      root.setAttribute('data-theme', settingsTheme);
    }
  }, [settingsTheme]);

  // Session verification on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
        } catch (err) {
          console.error("Session expired or invalid:", err);
          logout();
          setPath('/login');
        }
      } else {
        if (currentPath !== '/login' && !currentPath.startsWith('/driver/')) {
          setPath('/login');
        }
      }
      setIsVerifyingSession(false);
    };

    verifyAuth();
  }, [token, setUser, logout, setPath]);

  // Fetch initial configuration on mount
  useEffect(() => {
    if (token) {
      fetchConfigs();
      fetchInitialData();
    }
  }, [token, fetchConfigs, fetchInitialData]);

  const handleApplySlack = (slackMin: number, tripId: string) => {
    applySlackToNode(slackMin, tripId);
  };

  const handleTruncateTrip = () => {};

  const handleReserveVehicle = () => {};

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Перевірка авторизації...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && currentPath !== '/login' && !currentPath.startsWith('/driver/')) {
    return <AuthLoginView />;
  }

  if (!isInitialized || !isConfigLoaded) {
    return (
      <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Завантаження даних АРМ...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] text-[var(--text-main,#1E293B)] flex flex-col font-sans antialiased selection:bg-indigo-200 selection:text-indigo-900 transition-colors duration-200">
        <GlobalLoader />
        <Toaster position="top-right" richColors />
        
        {/* Primary Navigation & Header */}
        <Header onOpenReport={() => setIsReportOpen(true)} />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary>
          {/* / or /analytics/dashboard */}
          {(currentPath === '/' || currentPath === '/analytics/dashboard') && (
            <ExecutiveDashboardView />
          )}

          {/* /analytics or /analytics/reports */}
          {(currentPath === '/analytics' || currentPath === '/analytics/reports') && (
            <AnalyticsReportView />
          )}

          {/* /admin - Admin Panel */}
          {currentPath === '/admin' && (
            <SuperuserRoute>
              <AdminView initialTab="users" />
            </SuperuserRoute>
          )}

          {/* /export/gtfs */}
          {currentPath === '/export/gtfs' && (
            <SuperuserRoute>
              <AdminView initialTab="gtfs" />
            </SuperuserRoute>
          )}

          {/* /login */}
          {currentPath === '/login' && <AuthLoginView />}

          {/* 2. Dispatcher Views */}
          {currentPath === '/dispatch/gantt' && <OperationalGanttView />}

          {(currentPath === '/dispatch/map' || currentPath === '/dispatch/live') && (
            <DispatcherLiveView />
          )}

          {(currentPath === '/dispatch/slack' ||
            currentPath === '/dispatch/marey' ||
            currentPath === '/dispatch/hot-reserve' ||
            currentPath === '/dispatch/detours') && (
            <DispatcherTab
              routes={routes}
              blocks={draftBlocks}
              duties={draftDuties}
              conflicts={conflicts}
              onApplySlack={handleApplySlack}
              onTruncateTrip={handleTruncateTrip}
              onReserveVehicle={handleReserveVehicle}
            />
          )}

          {/* Operational Schedule Generator */}
          {currentPath === '/dispatch/generator' && <OperationalScheduleGenerator />}

          {/* 3. Unified Planning Workspace */}
          {(currentPath === '/planning/workspace' ||
            currentPath === '/planning/duties' ||
            currentPath === '/planning/trips' ||
            currentPath === '/planning/validate' ||
            currentPath === '/planning/simulation' ||
            currentPath === '/dispatch/simulation') && (
            <PlanningWorkspaceView />
          )}

          {/* Planning Archive */}
          {currentPath === '/planning/archive' && <StaticDutiesArchiveView />}

          {/* 4. Network Directory / Settings Views */}
          {(currentPath.startsWith('/settings/') || currentPath === '/settings') && (
            <NetworkSettingsTab />
          )}

          {/* 5. Crew & Driver Views */}
          {currentPath === '/crew/assignment' && <CrewAssignmentView />}
          {currentPath === '/crew/schedule-book' && <DriverScheduleBookView />}
          {currentPath === '/driver' && <DriverTerminalView />}
          {currentPath === '/crew/roster' && <CrewRosterTab duties={draftDuties} />}
          {currentPath === '/crew/waybill' && <SmartWaybillView />}
        </ErrorBoundary>
      </main>

      {/* Global Analytics Report Modal */}
      {isReportOpen && (
        <AnalyticalReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      )}
    </div>
    </ErrorBoundary>
  );
}
