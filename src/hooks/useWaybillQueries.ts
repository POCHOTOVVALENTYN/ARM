import { useQuery } from '@tanstack/react-query';
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
    enabled: !!driverId && !!targetDate, // Запит не виконується, якщо не обрано водія
    retry: false, // Не повторювати при 404
    staleTime: 30000,
  });
};
