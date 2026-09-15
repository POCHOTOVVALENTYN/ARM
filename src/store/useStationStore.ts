import { create } from 'zustand'
import { Station } from '../types'
import apiClient from '../utils/apiClient'

interface StationState {
  stations: Station[]
  isLoading: boolean
  setStations: (stations: Station[]) => void
  fetchStations: () => Promise<void>
  addStation: (station: Station) => void
  updateStation: (station: Station) => void
  deleteStation: (id: string) => void
  getStationById: (id: string) => Station | undefined
}

export const useStationStore = create<StationState>((set, get) => ({
  stations: [],
  isLoading: false,
  setStations: (stations) => set({ stations }),
  fetchStations: async () => {
    set({ isLoading: true })
    try {
      const res = await apiClient.get('/stations')
      if (Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map((s: any) => ({
          id: String(s.id),
          name: s.name,
          code: s.name ? s.name.substring(0, 3).toUpperCase() : `ЗП${s.id}`,
          isTerminal: Boolean(s.is_dispatch_station || s.type === 'HUB' || s.type === 'TERMINAL'),
          lat: Number(s.lat) || 46.468,
          lng: Number(s.lng || s.lon) || 30.741,
        }))
        set({ stations: formatted, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch (err) {
      console.error('Помилка завантаження зупинок з API:', err)
      set({ isLoading: false })
    }
  },
  addStation: (station) => set((state) => ({
    stations: [...state.stations.filter(s => s.id !== station.id), station]
  })),
  updateStation: (updated) => set((state) => ({
    stations: state.stations.map(s => s.id === updated.id ? updated : s)
  })),
  deleteStation: (id) => set((state) => ({
    stations: state.stations.filter(s => s.id !== id)
  })),
  getStationById: (id) => {
    if (!id) return undefined
    return get().stations.find((s) => s.id === id)
  },
}))


