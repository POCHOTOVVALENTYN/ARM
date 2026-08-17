import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsApi, SystemConfigDTO } from '../services/settingsApi';

export interface SettingsState {
  mapTileUrl: string;
  mapAttribution: string;
  enterpriseLogoUrl: string | null;
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;

  // Асинхронні екшени
  fetchSettings: () => Promise<void>;
  saveSettings: (settings: Partial<SettingsState>) => Promise<void>;

  // Синхронні локальні мутації
  setMapTileUrl: (url: string, attribution: string) => void;
  setEnterpriseLogo: (url: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // За замовчуванням використовуємо класичний OSM
      mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      mapAttribution: '&copy; OpenStreetMap contributors',
      enterpriseLogoUrl: null,
      theme: 'light',
      isLoading: false,

      fetchSettings: async () => {
        set({ isLoading: true });
        try {
          const data = await settingsApi.getSettings();
          set({
            mapTileUrl: data.map_tile_url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            mapAttribution: data.map_attribution || '&copy; OpenStreetMap contributors',
            enterpriseLogoUrl: data.enterprise_logo_url,
            theme: (data.theme as 'light' | 'dark' | 'system') || 'light',
          });
        } catch (error) {
          console.error("Помилка завантаження системних налаштувань:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      saveSettings: async (newSettings) => {
        set({ isLoading: true });
        try {
          const payload: Partial<SystemConfigDTO> = {};
          if (newSettings.mapTileUrl !== undefined) payload.map_tile_url = newSettings.mapTileUrl;
          if (newSettings.mapAttribution !== undefined) payload.map_attribution = newSettings.mapAttribution;
          if (newSettings.enterpriseLogoUrl !== undefined) payload.enterprise_logo_url = newSettings.enterpriseLogoUrl;
          if (newSettings.theme !== undefined) payload.theme = newSettings.theme;

          const data = await settingsApi.updateSettings(payload);
          
          set({
            mapTileUrl: data.map_tile_url,
            mapAttribution: data.map_attribution,
            enterpriseLogoUrl: data.enterprise_logo_url,
            theme: (data.theme as 'light' | 'dark' | 'system') || 'light',
          });
        } catch (error) {
          console.error("Помилка збереження системних налаштувань:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setMapTileUrl: (url, attribution) => set({ mapTileUrl: url, mapAttribution: attribution }),
      setEnterpriseLogo: (url) => set({ enterpriseLogoUrl: url }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'omet-settings',
    }
  )
);
