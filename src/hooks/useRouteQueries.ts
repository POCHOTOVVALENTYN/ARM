import { useQuery } from '@tanstack/react-query';
import apiClient, { api } from '../utils/apiClient';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteStopItem {
  stop_sequence: number;
  direction_id?: number;
  stop_id: string;
  name: string;
  lat: number;
  lng: number;
  type?: string;
  is_dispatch_station?: boolean;
  break_capacity?: number;
}

export interface AllRouteShapeItem {
  route_id: string;
  direction_id: number;
  geometry: RoutePoint[];
  type: string;
  color: string;
  route_number: string;
}

export interface RouteBothShapesItem {
  route_id: string;
  directions: {
    direction_id: number;
    geometry: RoutePoint[];
  }[];
}

export const useAllRouteShapes = (enabled: boolean = true) => {
  return useQuery<AllRouteShapeItem[]>({
    queryKey: ['all-route-shapes'],
    queryFn: async () => {
      try {
        const { data } = await api.get<AllRouteShapeItem[]>('/routes/shapes/all');
        return data || [];
      } catch {
        return [];
      }
    },
    enabled,
    staleTime: Infinity,
  });
};

export const useRouteBothShapes = (routeId?: string | null) => {
  return useQuery<RouteBothShapesItem>({
    queryKey: ['route-both-shapes', routeId],
    queryFn: async () => {
      if (!routeId || routeId === 'ALL') return { route_id: '', directions: [] };
      const cleanId = String(routeId).trim().replace(/^(T|Tr)/i, '');
      try {
        const { data } = await api.get<RouteBothShapesItem>(`/routes/${cleanId}/shapes`);
        return data;
      } catch {
        try {
          const { data } = await api.get<RouteBothShapesItem>(`/routes/${routeId}/shapes`);
          return data;
        } catch {
          return { route_id: routeId, directions: [] };
        }
      }
    },
    enabled: !!routeId && routeId !== 'ALL',
    staleTime: Infinity,
  });
};

export const useRouteShape = (routeId?: string | null, directionId: number = 0) => {
  return useQuery<RoutePoint[]>({
    queryKey: ['route-shape', routeId, directionId],
    queryFn: async () => {
      if (!routeId || routeId === 'ALL') return [];
      const cleanId = String(routeId).trim().replace(/^(T|Tr)/i, '');
      try {
        const { data } = await api.get<RoutePoint[]>(`/routes/${cleanId}/shape?direction_id=${directionId}`);
        return data;
      } catch {
        try {
          const { data } = await api.get<RoutePoint[]>(`/routes/${routeId}/shape?direction_id=${directionId}`);
          return data;
        } catch {
          return [];
        }
      }
    },
    enabled: !!routeId && routeId !== 'ALL',
    staleTime: Infinity,
  });
};

export const useRouteStops = (routeId?: string | null, directionId?: number) => {
  return useQuery<RouteStopItem[]>({
    queryKey: ['route-stops', routeId, directionId],
    queryFn: async () => {
      if (!routeId || routeId === 'ALL') return [];
      const cleanId = String(routeId).trim().replace(/^(T|Tr)/i, '');
      const queryParam = directionId !== undefined ? `?direction_id=${directionId}` : '';
      try {
        const { data } = await api.get<{ stops: RouteStopItem[] }>(`/routes/${cleanId}/stops${queryParam}`);
        return data?.stops || [];
      } catch {
        try {
          const { data } = await api.get<{ stops: RouteStopItem[] }>(`/routes/${routeId}/stops${queryParam}`);
          return data?.stops || [];
        } catch {
          return [];
        }
      }
    },
    enabled: !!routeId && routeId !== 'ALL',
    staleTime: 60000,
  });
};
