import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/apiClient';

export interface RoutePerformance {
  route_id: string;
  total_records: number;
  avg_deviation_min: number;
  max_deviation_min: number;
  on_time_percentage: number;
}

export interface IncidentStats {
  total_incidents: number;
  resolved_incidents: number;
  unresolved_incidents: number;
}

export const useDailyPerformance = (targetDate: string) => {
  return useQuery({
    queryKey: ['analytics-performance', targetDate],
    queryFn: async () => {
      const { data } = await api.get<RoutePerformance[]>(`/analytics/daily-performance?target_date=${targetDate}`);
      return data;
    },
    enabled: !!targetDate,
    staleTime: 1000 * 60 * 5, // 5 хвилин
  });
};

export const useIncidentsSummary = (targetDate: string) => {
  return useQuery({
    queryKey: ['analytics-incidents', targetDate],
    queryFn: async () => {
      const { data } = await api.get<IncidentStats>(`/analytics/incidents-summary?target_date=${targetDate}`);
      return data;
    },
    enabled: !!targetDate,
    staleTime: 1000 * 60 * 5,
  });
};
