import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsApi, SystemConfigDTO } from '../services/settingsApi';

export type VehicleMarkerStyle = 'halo' | 'dualtone' | 'muted' | 'balanced';

export interface SettingsState {
  mapTileUrl: string;
  mapAttribution: string;
  enterpriseLogoUrl: string | null;
  theme: 'light' | 'dark' | 'system';
  markerStyle: VehicleMarkerStyle;
  isLoading: boolean;

  // Асинхронні екшени
  fetchSettings: (silent?: boolean) => Promise<void>;
  saveSettings: (settings: Partial<SettingsState>) => Promise<void>;

  // Синхронні локальні мутації
  setMapTileUrl: (url: string, attribution: string) => void;
  setEnterpriseLogo: (url: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setMarkerStyle: (style: VehicleMarkerStyle) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // За замовчуванням використовуємо класичний OSM та світлу тему
      mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      mapAttribution: '&copy; OpenStreetMap contributors',
      enterpriseLogoUrl: null,
      theme: (localStorage.getItem('omet_theme') === 'night-dispatch' ? 'dark' : 'light'),
      markerStyle: 'balanced',
      isLoading: false,

      fetchSettings: async (silent = false) => {
        if (!silent) set({ isLoading: true });
        try {
          const data = await settingsApi.getSettings();
          const localSavedTheme = localStorage.getItem('omet_theme');
          const effectiveTheme = localSavedTheme 
            ? (localSavedTheme === 'night-dispatch' ? 'dark' : 'light')
            : ((data.theme as any) === 'night-dispatch' || data.theme === 'dark' ? 'dark' : 'light');

          set({
            mapTileUrl: data.map_tile_url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            mapAttribution: data.map_attribution || '&copy; OpenStreetMap contributors',
            enterpriseLogoUrl: data.enterprise_logo_url,
            theme: effectiveTheme,
          });
        } catch (error) {
          console.error("Помилка завантаження системних налаштувань:", error);
        } finally {
          if (!silent) set({ isLoading: false });
        }
      },

      saveSettings: async (newSettings) => {
        set({ isLoading: true });
        try {
          if (newSettings.theme) {
            const mappedTheme = newSettings.theme === 'dark' ? 'night-dispatch' : 'omet-clean';
            localStorage.setItem('omet_theme', mappedTheme);
          }

          await settingsApi.updateSettings({
            map_tile_url: newSettings.mapTileUrl ?? get().mapTileUrl,
            map_attribution: newSettings.mapAttribution ?? get().mapAttribution,
            enterprise_logo_url: newSettings.enterpriseLogoUrl ?? get().enterpriseLogoUrl,
            theme: newSettings.theme ?? get().theme,
          });

          set((state) => ({ ...state, ...newSettings }));
        } catch (error) {
          console.error("Помилка збереження налаштувань:", error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setMapTileUrl: (url, attribution) => set({ mapTileUrl: url, mapAttribution: attribution }),
      setEnterpriseLogo: (url) => set({ enterpriseLogoUrl: url }),
      setTheme: (theme) => {
        const mappedTheme = theme === 'dark' ? 'night-dispatch' : 'omet-clean';
        localStorage.setItem('omet_theme', mappedTheme);
        set({ theme });
      },
      setMarkerStyle: (style) => set({ markerStyle: style }),
    }),
    {
      name: 'omet-settings-storage',
      partialize: (state) => ({
        mapTileUrl: state.mapTileUrl,
        mapAttribution: state.mapAttribution,
        theme: state.theme,
        markerStyle: state.markerStyle,
      }),
    }
  )
);
