import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  // Налаштування карти
  mapTileUrl: string;
  mapAttribution: string;
  
  // Брендування
  enterpriseLogoUrl: string | null;
  theme: 'light' | 'dark' | 'system';
  
  // Екшени
  setMapTileUrl: (url: string, attribution: string) => void;
  setEnterpriseLogo: (url: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // За замовчуванням використовуємо класичний OSM
      mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      
      enterpriseLogoUrl: null,
      theme: 'light',

      setMapTileUrl: (url, attribution) => set({ mapTileUrl: url, mapAttribution: attribution }),
      setEnterpriseLogo: (url) => set({ enterpriseLogoUrl: url }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'omet-settings',
    }
  )
);
