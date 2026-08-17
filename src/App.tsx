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
import { ValidatorView } from './components/views/ValidatorView';
import { LiveMapView } from './components/views/LiveMapView';
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
import { authApi } from './services/authApi';
import { SuperuserRoute } from './components/SuperuserRoute';
import { useWebSocket } from './hooks/useWebSocket';
import { GlobalLoader } from './components/GlobalLoader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';

export default function App() {
  // Активуємо WebSocket підключення при старті додатку,
  // воно запрацює тільки після isInitialized === true
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
    if (isAuthenticated) {
      if (!isInitialized) {
        fetchInitialData();
      }
      if (!isConfigLoaded) {
        fetchConfigs();
      }
    }
  }, [isAuthenticated, isInitialized, fetchInitialData, isConfigLoaded, fetchConfigs]);

  const handleApplySlack = (slackMin: number, tripId: string) => {
    applySlackToNode(tripId, 'st_starosinna', slackMin);
  };

  const handleTruncateTrip = () => {
    alert('Оперативне скорочення рейсу виконано (ТЗ повернено через внутрішнє кільце)');
  };

  const handleReserveVehicle = () => {
    setPath('/dispatch/hot-reserve');
  };

  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium font-sans">Перевірка сесії диспетчера...</p>
        </div>
      </div>
    );
  }

  // If path is a driver view, render it directly without standard layout
  if (currentPath.startsWith('/driver/')) {
    const vehicleId = currentPath.split('/')[2];
    return <SmartWaybillView vehicleId={vehicleId || '0000'} />;
  }

  // If not authenticated or on /login, render Login view directly
  if (!isAuthenticated || currentPath === '/login') {
    return (
      <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] text-[var(--text-main,#1E293B)] flex flex-col font-sans antialiased">
        <GlobalLoader />
        <Toaster position="top-right" richColors />
        <main className="flex-1 flex items-center justify-center p-4">
          <AuthLoginView />
        </main>
      </div>
    );
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

      {/* Main Content Workspace mapping 17 URLs/Views */}
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

          {/* /admin - Admin Panel (Superuser Only) */}
          {currentPath === '/admin' && (
            <SuperuserRoute>
              <AdminView initialTab="config" />
            </SuperuserRoute>
          )}

          {/* /export/gtfs - GTFS Open Data Tab inside Admin (Superuser Only) */}
          {currentPath === '/export/gtfs' && (
            <SuperuserRoute>
              <AdminView initialTab="gtfs" />
            </SuperuserRoute>
          )}

          {/* /login */}
          {currentPath === '/login' && <AuthLoginView />}

          {/* Dispatcher Views */}
          {currentPath === '/dispatch/marey' && <MareyDiagramTab />}

          {(currentPath === '/dispatch/gantt' ||
            currentPath === '/dispatch/slack') && (
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

          {/* Live Map View */}
          {currentPath === '/dispatch/map' && <LiveMapView />}

          {/* Operational Schedule Generator */}
          {currentPath === '/dispatch/generator' && <OperationalScheduleGenerator />}

          {/* Dispatcher Extras */}
          {currentPath === '/dispatch/hot-reserve' && <HotReserveView />}
          {currentPath === '/dispatch/detours' && <EmergencyDetoursTab />}

          {/* Planning Views */}
          {currentPath === '/planning/duties' && <DutyBuilderView />}
          {currentPath === '/planning/trips' && <TripGridView />}
          {currentPath === '/planning/validate' && <ValidatorView />}
          {(currentPath === '/planning/simulation' || currentPath === '/dispatch/simulation') && (
            <SimulationMapView />
          )}
          {currentPath === '/planning/archive' && <StaticDutiesArchiveView />}

          {/* Network Settings Views (Superuser Only) */}
          {(currentPath.startsWith('/settings/') || currentPath === '/settings') && (
            <SuperuserRoute>
              <NetworkSettingsTab />
            </SuperuserRoute>
          )}

          {/* Crew Views */}
          {currentPath === '/crew/roster' && <CrewRosterTab duties={draftDuties} />}
          {currentPath === '/crew/assignment' && <CrewAssignmentView />}
          {currentPath === '/crew/waybill' && <SmartWaybillView />}
        </ErrorBoundary>
      </main>

      {/* Analytical Report Modal */}
      <AnalyticalReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t-2 border-gray-900 py-4 px-4 sm:px-6 lg:px-8 text-xs text-gray-600 mt-auto font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© 2026 КП «Одесміськелектротранс». АРМ «Розклади» v2.4. Всі права захищено.</p>
          <div className="flex items-center space-x-4">
            <span>Рівень 1 (Статика)</span>
            <span>•</span>
            <span>Рівень 2 (Динамічне Диспетчерування)</span>
            <span>•</span>
            <span>GTFS / GTFS-RT Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  </ErrorBoundary>
);
}
