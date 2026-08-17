import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/apiClient';

export interface DriverResource {
  id: number;
  full_name: string;
  class_rank: number;
}

export interface VehicleResource {
  id: string;
  type: string;
  model: string;
}

export interface AvailableResources {
  drivers: DriverResource[];
  vehicles: VehicleResource[];
}

export interface CrewAssignment {
  id: number;
  duty_id: number;
  driver_id: number;
  vehicle_id: string;
  target_date: string;
  dispatcher_id?: number;
  status: string;
}

// Запит на отримання вільних ресурсів для конкретної дати
export const useAvailableResources = (targetDate: string) => {
  return useQuery({
    queryKey: ['available-resources', targetDate],
    queryFn: async () => {
      const { data } = await api.get<AvailableResources>(`/crew/available?target_date=${targetDate}`);
      return data;
    },
    staleTime: 1000 * 60, // Кешуємо на 1 хвилину
  });
};

// Запит на отримання призначених путівок на дату
export const useDailyDeployments = (targetDate: string) => {
  return useQuery({
    queryKey: ['daily-deployments', targetDate],
    queryFn: async () => {
      const { data } = await api.get<CrewAssignment[]>(`/crew/daily-deployments?target_date=${targetDate}`);
      return data;
    },
    staleTime: 1000 * 30,
  });
};

// Мутація для закріплення екіпажу
export const useAssignCrew = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { duty_id: number; driver_id: number; vehicle_id: string; target_date: string }) => {
      const { data } = await api.post<CrewAssignment>('/crew/assign', payload);
      return data;
    },
    onSuccess: (_, variables) => {
      // Інвалідуємо ресурси, щоб забрати призначеного водія/вагон зі списку вільних
      queryClient.invalidateQueries({ queryKey: ['available-resources', variables.target_date] });
      // Оновлюємо стан нарядів, щоб диспетчер побачив, що наряд закритий
      queryClient.invalidateQueries({ queryKey: ['daily-deployments', variables.target_date] });
    },
  });
};
