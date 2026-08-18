import axios from 'axios';
import { useUIStore } from '../store/useUIStore';
import { useAuthStore } from '../store/useAuthStore';
import { useScheduleStore } from '../store/useScheduleStore';
import { toast } from 'sonner';
import { logger } from './logger';

// Створення базового екземпляра Axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Інтерцептор ЗАПИТІВ (додаємо Bearer токен, час старту та логуємо)
api.interceptors.request.use(
  (config) => {
    useUIStore.getState().setLoading(true);

    // Додаємо мітку часу для профілювання запиту
    (config as any)._startTime = performance.now();

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logger.api.debug(`--> ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });

    return config;
  },
  (error) => {
    useUIStore.getState().setLoading(false);
    logger.api.error('Помилка формування вихідного запиту', error);
    return Promise.reject(error);
  }
);

// 2. Інтерцептор ВІДПОВІДЕЙ (профілювання часу, логування 4xx/5xx та сповіщення)
api.interceptors.response.use(
  (response) => {
    useUIStore.getState().setLoading(false);
    const elapsed = (configWithTime(response.config)) ? Math.round(performance.now() - (response.config as any)._startTime) : 0;
    
    logger.api.debug(`<-- ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${elapsed}ms)`);
    return response;
  },
  (error) => {
    useUIStore.getState().setLoading(false);
    const elapsed = error.config && (error.config as any)._startTime
      ? Math.round(performance.now() - (error.config as any)._startTime)
      : 0;

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;
      const url = `${error.config?.method?.toUpperCase()} ${error.config?.url}`;

      logger.api.warn(`<-- ${status} ${url} (${elapsed}ms): ${detail || error.message}`, {
        status,
        data: error.response.data,
      });

      if (status === 401) {
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
      logger.api.error(`Мережева помилка (сервер недоступний): ${error.config?.url}`, error);
      toast.error("Відсутній зв'язок з сервером. Перевірте з'єднання.");
    } else {
      logger.api.error('Невідома помилка HTTP клієнта', error);
      toast.error("Сталася помилка при формуванні запиту.");
    }

    return Promise.reject(error);
  }
);

const configWithTime = (config: any): boolean => {
  return config && typeof config._startTime === 'number';
};

export default api;
