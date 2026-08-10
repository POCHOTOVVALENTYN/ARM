import axios from 'axios';
import { useUIStore } from '../store/useUIStore';
import { toast } from 'sonner'; 

const apiClient = axios.create({
  // Забираємо хардкод. URL має підтягуватись з .env файлу
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехоплювач запитів: вмикаємо спінер перед відправкою
apiClient.interceptors.request.use(
  (config) => {
    useUIStore.getState().setLoading(true);
    return config;
  },
  (error) => {
    useUIStore.getState().setLoading(false);
    return Promise.reject(error);
  }
);

// Перехоплювач відповідей: вимикаємо спінер та глобально обробляємо помилки
apiClient.interceptors.response.use(
  (response) => {
    useUIStore.getState().setLoading(false);
    return response;
  },
  (error) => {
    useUIStore.getState().setLoading(false);

    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      // Специфічна обробка бізнес-логіки
      if (status === 409) {
        toast.error(detail || "Конфлікт даних. Цю дію вже виконано іншим диспетчером.");
      } else if (status === 422) {
        toast.warning("Помилка валідації даних. Перевірте введені значення.");
      } else if (status === 500) {
        toast.error("Внутрішня помилка сервера. Зверніться до адміністратора.");
      } else {
        toast.error(detail || `Помилка запиту: ${status}`);
      }
    } else if (error.request) {
      toast.error("Відсутній зв'язок з сервером. Перевірте з'єднання або VPN.");
    } else {
      toast.error("Сталася помилка при формуванні запиту.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
