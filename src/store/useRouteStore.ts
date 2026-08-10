import { create } from 'zustand';
import { Route, RouteStatus, TimePeriod, TransportType } from '../types';

interface RouteState {
  routes: Route[];
  searchQuery: string;
  typeFilter: 'all' | TransportType;
  statusFilter: 'all' | RouteStatus;
  selectedRouteId: string | null;
  activeViewMode: 'overview' | 'passport' | 'matrix';
  validationErrors: Record<string, string>; // e.g., "routeId-segIdx-period": "error msg"

  // Setters / Filters
  setInitialRoutes: (routes: Route[]) => void;
  setSearchQuery: (query: string) => void;
  setTypeFilter: (filter: 'all' | TransportType) => void;
  setStatusFilter: (filter: 'all' | RouteStatus) => void;
  setSelectedRouteId: (id: string | null) => void;
  setActiveViewMode: (mode: 'overview' | 'passport' | 'matrix') => void;

  // CRUD Operations
  addRoute: (newRoute: Omit<Route, 'id'>) => void;
  updateRoute: (updatedRoute: Route) => void;
  deleteRoute: (id: string) => void;
  duplicateRoute: (id: string) => void;

  // Inline Travel Matrix Editing with Validation (> 0)
  updateSegmentTime: (
    routeId: string,
    segmentIndex: number,
    period: TimePeriod,
    timeMin: number
  ) => { success: boolean; error?: string };

  clearValidationError: (key: string) => void;

  // JSON Import & Export
  exportRoutesJson: (routeId?: string) => void;
  importRoutesJson: (jsonString: string) => { success: boolean; count?: number; error?: string };

  // Reset
  resetToDefaults: () => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [],
  searchQuery: '',
  typeFilter: 'all',
  statusFilter: 'all',
  selectedRouteId: null,
  activeViewMode: 'overview',
  validationErrors: {},

  setInitialRoutes: (routes) => set({ routes, selectedRouteId: routes[0]?.id || null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),
  setActiveViewMode: (activeViewMode) => set({ activeViewMode }),

  addRoute: (newRouteData) => {
    const id = `${newRouteData.type === 'tram' ? 'T' : 'Tr'}${newRouteData.number}_${Date.now()}`;
    const fullRoute: Route = {
      ...newRouteData,
      id,
    };
    set((state) => ({
      routes: [fullRoute, ...state.routes],
      selectedRouteId: id,
    }));
  },

  updateRoute: (updatedRoute) => {
    set((state) => ({
      routes: state.routes.map((r) => (r.id === updatedRoute.id ? updatedRoute : r)),
    }));
  },

  deleteRoute: (id) => {
    set((state) => {
      const remaining = state.routes.filter((r) => r.id !== id);
      const nextSelected = state.selectedRouteId === id ? (remaining[0]?.id || null) : state.selectedRouteId;
      return {
        routes: remaining,
        selectedRouteId: nextSelected,
      };
    });
  },

  duplicateRoute: (id) => {
    const state = get();
    const source = state.routes.find((r) => r.id === id);
    if (!source) return;

    const newNumber = `${source.number}-Д`;
    const newId = `${source.type === 'tram' ? 'T' : 'Tr'}${newNumber}_${Date.now()}`;
    const duplicatedRoute: Route = {
      ...source,
      id: newId,
      number: newNumber,
      name: `${source.name} (Копія)`,
      status: 'reserve',
    };

    set({
      routes: [duplicatedRoute, ...state.routes],
      selectedRouteId: newId,
    });
  },

  updateSegmentTime: (routeId, segmentIndex, period, timeMin) => {
    const key = `${routeId}-${segmentIndex}-${period}`;

    // Validation: travel time must be > 0
    if (isNaN(timeMin) || timeMin <= 0) {
      const errorMsg = 'Час ходу повинен бути більшим за 0 хв!';
      set((state) => ({
        validationErrors: {
          ...state.validationErrors,
          [key]: errorMsg,
        },
      }));
      return { success: false, error: errorMsg };
    }

    set((state) => {
      const updatedErrors = { ...state.validationErrors };
      delete updatedErrors[key];

      const updatedRoutes = state.routes.map((route) => {
        if (route.id !== routeId) return route;

        const updatedSegments = route.segments.map((seg, idx) => {
          if (idx !== segmentIndex) return seg;
          return {
            ...seg,
            baseTravelTimes: {
              ...seg.baseTravelTimes,
              [period]: Number(timeMin),
            },
          };
        });

        return {
          ...route,
          segments: updatedSegments,
        };
      });

      return {
        routes: updatedRoutes,
        validationErrors: updatedErrors,
      };
    });

    return { success: true };
  },

  clearValidationError: (key) => {
    set((state) => {
      const updated = { ...state.validationErrors };
      delete updated[key];
      return { validationErrors: updated };
    });
  },

  exportRoutesJson: (routeId) => {
    const state = get();
    const exportData = routeId
      ? state.routes.filter((r) => r.id === routeId)
      : state.routes;

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = routeId
      ? `route_${routeId}_export.json`
      : `omet_routes_master_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  importRoutesJson: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      // Validate mandatory fields
      for (const item of items) {
        if (!item.number || !item.name || !item.type || !Array.isArray(item.segments)) {
          return {
            success: false,
            error: 'Некоректний формат JSON: відсутні обов\'язкові поля (number, name, type, segments).',
          };
        }
      }

      set((state) => {
        // Merge or replace by ID
        const routeMap = new Map<string, Route>();
        state.routes.forEach((r) => routeMap.set(r.id, r));
        items.forEach((item: Route) => {
          const id = item.id || `${item.type === 'tram' ? 'T' : 'Tr'}${item.number}_${Date.now()}`;
          routeMap.set(id, {
            ...item,
            id,
            status: item.status || 'active',
          });
        });

        const merged = Array.from(routeMap.values());
        return {
          routes: merged,
          selectedRouteId: merged[0]?.id || state.selectedRouteId,
        };
      });

      return { success: true, count: items.length };
    } catch (err: any) {
      return {
        success: false,
        error: `Помилка читання JSON файлу: ${err.message || 'Некоректний синтаксис'}`,
      };
    }
  },

  resetToDefaults: () => {
    set({
      selectedRouteId: get().routes[0]?.id || null,
      validationErrors: {},
      searchQuery: '',
      typeFilter: 'all',
      statusFilter: 'all',
    });
  },
}));
