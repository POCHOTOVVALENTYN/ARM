import { api } from '../utils/apiClient';

export interface SystemConfigDTO {
  id?: number;
  map_tile_url: string;
  map_attribution: string;
  enterprise_logo_url: string | null;
  theme: string;
}

export const settingsApi = {
  // Отримати поточні налаштування (для всіх авторизованих диспетчерів)
  getSettings: async (): Promise<SystemConfigDTO> => {
    const response = await api.get<SystemConfigDTO>('/settings/');
    return response.data;
  },
  
  // Оновити налаштування (тільки для суперкористувачів/admin)
  updateSettings: async (data: Partial<SystemConfigDTO>): Promise<SystemConfigDTO> => {
    const response = await api.put<SystemConfigDTO>('/settings/', data);
    return response.data;
  }
};
