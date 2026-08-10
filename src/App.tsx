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
import { useScheduleStore } from './store/useScheduleStore';
import { useRouteStore } from './store/useRouteStore';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  useWebSocket(); // Активуємо WebSocket підключення при старті додатку

  const { currentPath, setPath, theme, draftBlocks, draftDuties, conflicts, applySlackToNode, setInitialSchedule } = useScheduleStore();
  const { routes, setInitialRoutes } = useRouteStore();
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch initial configuration on mount
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const response = await fetch('/api/schedule/init');
        if (response.ok) {
          const data = await response.json();
          setInitialRoutes(data.routes || []);
          setInitialSchedule(data.vehicle_blocks || [], data.driver_duties || []);
        } else {
          console.error('Failed to load initial schedule data', response.status);
        }
      } catch (err) {
        console.error('API Error:', err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    fetchInitData();
  }, [setInitialRoutes, setInitialSchedule]);

  const handleApplySlack = (slackMin: number, tripId: string) => {
    applySlackToNode(tripId, 'st_starosinna', slackMin);
  };

  const handleTruncateTrip = () => {
    alert('Оперативне скорочення рейсу виконано (ТЗ повернено через внутрішнє кільце)');
  };

  const handleReserveVehicle = () => {
    setPath('/dispatch/hot-reserve');
  };

  // If path is a driver view, render it directly without standard layout
  if (currentPath.startsWith('/driver/')) {
    const vehicleId = currentPath.split('/')[2];
    return <SmartWaybillView vehicleId={vehicleId || '0000'} />;
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Завантаження розкладів...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg,#EEF2F6)] text-[var(--text-main,#1E293B)] flex flex-col font-sans antialiased selection:bg-indigo-200 selection:text-indigo-900 transition-colors duration-200">
      {/* Primary Navigation & Header */}
      <Header onOpenReport={() => setIsReportOpen(true)} />

      {/* Main Content Workspace mapping 17 URLs/Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* / or /analytics/dashboard */}
        {(currentPath === '/' || currentPath === '/analytics/dashboard') && (
          <ExecutiveDashboardView />
        )}

        {/* /admin - Admin Panel */}
        {currentPath === '/admin' && <AdminView initialTab="config" />}

        {/* /export/gtfs - GTFS Open Data Tab inside Admin */}
        {currentPath === '/export/gtfs' && <AdminView initialTab="gtfs" />}

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

        {/* Network Settings Views */}
        {(currentPath.startsWith('/settings/') || currentPath === '/settings') && (
          <NetworkSettingsTab />
        )}

        {/* Crew Views */}
        {currentPath === '/crew/roster' && <CrewRosterTab duties={draftDuties} />}
        {currentPath === '/crew/assignment' && <CrewAssignmentView />}
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
  );
}
