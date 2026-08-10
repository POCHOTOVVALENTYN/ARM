import axios from 'axios';
import { useUIStore } from '../store/useUIStore';
import { toast } from 'sonner';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

apiClient.interceptors.request.use((config) => {
  useUIStore.getState().setLoading(true);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    useUIStore.getState().setLoading(false);
    return response;
  },
  (error) => {
    useUIStore.getState().setLoading(false);
    if (error.response?.status === 409) {
      toast.error(error.response.data.detail || "Дані були змінені іншим користувачем.");
    } else {
      toast.error("Помилка зв'язку з сервером.");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
