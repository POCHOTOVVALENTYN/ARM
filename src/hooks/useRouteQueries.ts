import { useQuery } from '@tanstack/react-query';
import apiClient, { api } from '../utils/apiClient';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export const useRouteShape = (routeId?: string | null, directionId: number = 0) => {
  return useQuery<RoutePoint[]>({
    queryKey: ['route-shape', routeId, directionId],
    queryFn: async () => {
      if (!routeId || routeId === 'ALL') return [];
      const { data } = await api.get<RoutePoint[]>(`/routes/${routeId}/shape?direction_id=${directionId}`);
      return data;
    },
    enabled: !!routeId && routeId !== 'ALL',
    staleTime: Infinity, // Геометрія не змінюється
  });
};
