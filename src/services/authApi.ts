import { api } from '../utils/apiClient';
import { User } from '../store/useAuthStore';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    // Формуємо дані у форматі URLSearchParams для OAuth2 Password Request
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await api.post<LoginResponse>('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export default authApi;
