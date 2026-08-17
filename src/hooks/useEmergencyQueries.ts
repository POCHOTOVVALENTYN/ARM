import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/apiClient';

export interface ActiveDetour {
  id: number;
  vehicle_id: string;
  route_id: string;
  reason: string;
  new_path_description: string;
  started_at?: string;
  ended_at?: string | null;
  dispatcher_id?: number | null;
}

export const useActiveDetours = () => {
  return useQuery({
    queryKey: ['active-detours'],
    queryFn: async () => {
      const { data } = await api.get<ActiveDetour[]>('/emergencies/detours/active');
      return data;
    },
    staleTime: 30000,
  });
};

export const useActivateDetour = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { vehicle_id: string; route_id: string; reason: string; new_path_description: string }) => {
      const { data } = await api.post<ActiveDetour>('/emergencies/detours/activate', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-detours'] });
    },
  });
};

export const useDeactivateDetour = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (detourId: number) => {
      const { data } = await api.put(`/emergencies/detours/${detourId}/deactivate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-detours'] });
    },
  });
};
