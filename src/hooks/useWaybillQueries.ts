import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/apiClient';

export interface WaybillTrip {
  trip_number: number;
  route: string;
  plan_start: string;
  plan_end: string;
  fact_start: string | null;
  fact_end: string | null;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'CANCELLED';
}

export interface SmartWaybill {
  waybill_id: number | string;
  target_date: string;
  driver: { id: number | string; full_name: string; class_rank: number };
  vehicle: { id: string; model: string };
  duty_id: number;
  trips: WaybillTrip[];
  summary: {
    total_planned_trips: number;
    completed_trips: number;
    total_work_hours: string;
  };
}

export const useSmartWaybill = (driverId: number | string | null, targetDate: string) => {
  return useQuery({
    queryKey: ['waybill', driverId, targetDate],
    queryFn: async () => {
      if (!driverId || !targetDate) return null;
      const { data } = await api.get<SmartWaybill>(`/crew/waybill?driver_id=${driverId}&target_date=${targetDate}`);
      return data;
    },
    enabled: !!driverId && !!targetDate,
    retry: false,
    staleTime: 30000,
  });
};

export const useAssignWaybill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { duty_id: number; vehicle_id: string; driver_id: string; target_date: string }) => {
      const { data } = await api.post('/waybills/assign', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waybills'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-status'] });
      queryClient.invalidateQueries({ queryKey: ['active-schedules'] });
    }
  });
};

export const useWaybillsByDate = (date: string) => {
  return useQuery({
    queryKey: ['waybills', date],
    queryFn: async () => {
      const { data } = await api.get(`/waybills/today?target_date=${date}`);
      return data;
    },
    enabled: !!date,
  });
};

export const useAvailableDuties = (targetDate?: string, routeId?: string) => {
  return useQuery({
    queryKey: ['available-duties', targetDate, routeId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetDate) params.append('target_date', targetDate);
      if (routeId) params.append('route_id', routeId);
      const { data } = await api.get(`/waybills/duties-available?${params.toString()}`);
      return data;
    },
  });
};
