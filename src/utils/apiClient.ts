import axios from 'axios';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { useScheduleStore } from '../store/useScheduleStore';
import { toast } from 'sonner';

// Створення базового екземпляра Axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Інтерцептор ЗАПИТІВ (додаємо Bearer токен та вмикаємо спінер)
api.interceptors.request.use(
  (config) => {
    useUIStore.getState().setLoading(true);

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    useUIStore.getState().setLoading(false);
    return Promise.reject(error);
  }
);

// 2. Інтерцептор ВІДПОВІДЕЙ (обробка 401 Unauthorized та глобальних помилок)
api.interceptors.response.use(
  (response) => {
    useUIStore.getState().setLoading(false);
    return response;
  },
  (error) => {
    useUIStore.getState().setLoading(false);

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 401) {
        // Якщо токен недійсний або прострочений - очищаємо стор
        useAuthStore.getState().logout();
        useScheduleStore.getState().setPath('/login');
        toast.error("Сесія завершилась. Будь ласка, авторизуйтесь знову.");
      } else if (status === 409) {
        toast.error(detail || "Конфлікт даних. Цю дію вже виконано іншим диспетчером.");
      } else if (status === 422) {
        toast.warning("Помилка валідації даних. Перевірте введені значення.");
      } else if (status === 500) {
        toast.error("Внутрішня помилка сервера. Зверніться до адміністратора.");
      } else {
        toast.error(detail || `Помилка запиту: ${status}`);
      }
    } else if (error.request) {
      toast.error("Відсутній зв'язок з сервером. Перевірте з'єднання.");
    } else {
      toast.error("Сталася помилка при формуванні запиту.");
    }

    return Promise.reject(error);
  }
);

export default api;
