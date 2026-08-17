import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { api } from '../utils/apiClient';

export interface StaticStopTimeResponse {
  id: number;
  stop_id: string;
  stop_sequence: number;
  arrival_time: string;
  departure_time: string;
  is_control_point: boolean;
  planned_slack_min: number;
}

export interface StaticTripResponse {
  id: number;
  trip_number: number;
  direction: 'direct' | 'reverse';
  start_time: string;
  end_time: string;
  is_peak: boolean;
  is_zero_trip: boolean;
  stop_times: StaticStopTimeResponse[];
}

export interface StaticShiftResponse {
  id: number;
  shift_number: number;
  start_time: string;
  end_time: string;
  driver_id?: string | null;
  break_duration_min: number;
  trips: StaticTripResponse[];
}

export interface StaticDutyResponse {
  id: number;
  duty_number: number;
  duty_type: string;
  vehicle_id?: string | null;
  shifts: StaticShiftResponse[];
}

export interface ScheduleResponse {
  id: number;
  route_id: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  active_date: string;
  created_at: string;
  duties: StaticDutyResponse[];
}

// 1. ЗАПИТ: Отримання масиву всіх АКТИВНИХ розкладів підприємства
export const useActiveSchedules = () => {
  return useQuery({
    queryKey: ['active-schedules'],
    queryFn: async () => {
      const { data } = await api.get<ScheduleResponse[]>('/schedules/active');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });
};

// 2. ЗАПИТ: Отримання конкретного розкладу за ID
export const useSchedule = (scheduleId: number | string | null) => {
  return useQuery({
    queryKey: ['schedule', scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;
      const { data } = await api.get<ScheduleResponse>(`/schedules/${scheduleId}`);
      return data;
    },
    enabled: !!scheduleId,
  });
};

// 3. ЗАПИТ: Отримання активного розкладу за конкретним маршрутом
export const useActiveSchedule = (routeId: string, activeDate?: string) => {
  return useQuery({
    queryKey: ['active-schedule', routeId, activeDate],
    queryFn: async () => {
      const params = activeDate ? { route_id: routeId, active_date: activeDate } : { route_id: routeId };
      const { data } = await api.get<ScheduleResponse[]>('/schedules/active', { params });
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    },
    enabled: !!routeId,
  });
};

// 4. ЗАПИТ: Отримання списку всіх розкладів
export const useScheduleList = (routeId?: string) => {
  return useQuery({
    queryKey: ['schedules', routeId],
    queryFn: async () => {
      const params = routeId ? { route_id: routeId } : {};
      const { data } = await api.get<ScheduleResponse[]>('/schedules', { params });
      return data;
    },
  });
};

// 5. МУТАЦІЯ: Активація чорновика / затвердження
export const useActivateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: number | string) => {
      const { data } = await api.post<ScheduleResponse>(`/schedules/${scheduleId}/activate`);
      return data;
    },
    onSuccess: (data) => {
      // Інвалідуємо кеш розкладів
      queryClient.invalidateQueries({ queryKey: ['active-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', data.id] });
      queryClient.invalidateQueries({ queryKey: ['active-schedule', data.route_id] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

// 6. МУТАЦІЯ: Генерація нового розкладу рушієм ScheduleEnginePipeline
export const useGenerateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      route_id: string;
      active_date: string;
      vehicles_count?: number;
      interval_peak_min?: number;
      interval_offpeak_min?: number;
    }) => {
      const { data } = await api.post<ScheduleResponse>('/schedules/generate', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['active-schedules'] });
    },
  });
};

// 7. МУТАЦІЯ: Оновлення часу відправлення та прибуття для конкретного рейсу
export const useUpdateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tripId, startTime, endTime }: { tripId: number; startTime: string; endTime: string }) => {
      const { data } = await api.put(`/schedules/trips/${tripId}`, {
        start_time: startTime,
        end_time: endTime
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
  });
};

// 8. МУТАЦІЯ: Генерація оптимізованої математичної моделі розкладу (Transit Solver)
export const useGenerateDraftSchedule = () => {
  return useMutation({
    mutationFn: async (payload: {
      route_id: string;
      vehicles_count: number;
      start_time: string;
      end_time: string;
      route_length_km: number;
      avg_speed_kmh: number;
      zero_trip_min: number;
      use_elastic_smoother: boolean;
    }) => {
      const { data } = await api.post('/schedules/generate-draft', payload);
      return data;
    }
  });
};

// 9. МУТАЦІЯ: Збереження еталонного розкладу в БД (Commit Draft)
export const useCommitScheduleDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      route_id: string;
      duties: any[];
      version_name?: string;
    }) => {
      const { data } = await api.post('/schedules/commit-draft', payload);
      return data;
    },
    onSuccess: () => {
      // Інвалідуємо кеш, щоб інші компоненти (напр. DailyDeploymentPanel, ActiveSchedules) одразу побачили новий розклад
      queryClient.invalidateQueries({ queryKey: ['active-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    }
  });
};


