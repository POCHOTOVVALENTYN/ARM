import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../utils/apiClient'

export interface Vehicle {
  id: string
  model: string
  type: string
  status: string
  depot_id?: string
}

export interface Depot {
  id: string
  name: string
  address?: string
  type?: string
  vehicles: Vehicle[]
}

export const useDepots = () => {
  return useQuery({
    queryKey: ['depots-fleet'],
    queryFn: async () => {
      const { data } = await api.get<Depot[]>('/depots/')
      return data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export const useCreateDepot = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; address?: string; type?: string }) => {
      const { data } = await api.post<Depot>('/depots/', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['depots-fleet'] }),
  })
}

export const useRegisterVehicle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: string; model: string; type: string; depot_id?: string }) => {
      const { data } = await api.post<Vehicle>('/depots/vehicles', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['depots-fleet'] }),
  })
}

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      const { data } = await api.delete(`/depots/vehicles/${vehicleId}`)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['depots-fleet'] }),
  })
}
