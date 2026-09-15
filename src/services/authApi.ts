import { api } from '../utils/apiClient'
import { User } from '../store/useAuthStore'

export interface LoginResponse {
  access_token: string
  token_type: string
  user?: User
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const cleanUser = username.trim()
    const cleanPass = password.trim()
    const response = await api.post<LoginResponse>('/auth/login', {
      username: cleanUser,
      password: cleanPass,
    })
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me')
    return response.data
  },
}

export default authApi
