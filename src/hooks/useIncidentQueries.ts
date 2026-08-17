import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/apiClient';

export interface Incident {
  id: number;
  vehicle_id: string;
  route_id: string;
  description: string;
  status: string;
  source: string;
  recorded_at: string;
  resolution_notes?: string | null;
}

export const useActiveIncidents = () => {
  return useQuery({
    queryKey: ['active-incidents'],
    queryFn: async () => {
      const { data } = await api.get<Incident[]>('/incidents/active');
      return data;
    },
    // Дані також оновлюються через WebSocket, бекап-полінг раз на 30 секунд
    staleTime: 30000,
  });
};

export const useResolveIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const { data } = await api.put(`/incidents/${id}/resolve?notes=${encodeURIComponent(notes)}`, { notes });
      return data;
    },
    onSuccess: () => {
      // Миттєво оновлюємо UI після вирішення
      queryClient.invalidateQueries({ queryKey: ['active-incidents'] });
    },
  });
};
