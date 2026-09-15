import axios from 'axios'
import { useUIStore } from '../store/useUIStore'
import { useAuthStore } from '../store/useAuthStore'
import { useScheduleStore } from '../store/useScheduleStore'
import { toast } from 'sonner'
import { logger } from './logger'

let lastNetworkErrorToastTime = 0

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return `http://${window.location.hostname}:8000/api`
  }
  return '/api'
}

// Створення базового екземпляра Axios
export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 1. Інтерцептор ЗАПИТІВ (нормалізація префіксів /api, додавання Bearer токена)
api.interceptors.request.use(
  (config) => {
    // Вмикаємо глобальний лоадер лише якщо це явно вказано (showGlobalLoader: true)
    if ((config as any).showGlobalLoader) {
      useUIStore.getState().setLoading(true)
    }

    // Нормалізація подвійного префікса /api (якщо передано /api/v1/..., при базовому baseURL /api)
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.substring(4)
    }

    // Додаємо мітку часу для профілювання запиту
    (config as any)._startTime = performance.now()

    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    logger.api.debug(`--> ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    })

    return config
  },
  (error) => {
    if ((error.config as any)?.showGlobalLoader) {
      useUIStore.getState().setLoading(false)
    }
    logger.api.error('Помилка формування вихідного запиту', error)
    return Promise.reject(error)
  }
)

const configWithTime = (config: any): boolean => {
  return config && typeof config._startTime === 'number'
}

// 2. Інтерцептор ВІДПОВІДЕЙ (профілювання часу, логування 4xx/5xx та сповіщення)
api.interceptors.response.use(
  (response) => {
    if ((response.config as any)?.showGlobalLoader) {
      useUIStore.getState().setLoading(false)
    }
    const elapsed = configWithTime(response.config)
      ? Math.round(performance.now() - (response.config as any)._startTime)
      : 0

    logger.api.debug(
      `<-- ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${elapsed}ms)`
    )
    return response
  },
  (error) => {
    if ((error.config as any)?.showGlobalLoader) {
      useUIStore.getState().setLoading(false)
    }
    const elapsed =
      error.config && (error.config as any)._startTime
        ? Math.round(performance.now() - (error.config as any)._startTime)
        : 0

    if (error.response) {
      const status = error.response.status
      const detail = error.response.data?.detail
      const rawUrl = error.config?.url || ''
      const url = `${error.config?.method?.toUpperCase()} ${rawUrl}`
      const isAuthEndpoint = rawUrl.includes('/auth/login') || rawUrl.includes('/auth/me')

      logger.api.warn(
        `<-- ${status} ${url} (${elapsed}ms): ${detail || error.message}`,
        {
          status,
          data: error.response.data,
        }
      )

      if (status === 401) {
        const wasAuth = useAuthStore.getState().isAuthenticated
        useAuthStore.getState().logout()
        useScheduleStore.getState().setPath('/login')
        if (wasAuth && !isAuthEndpoint) {
          toast.error('Сесія завершилась. Будь ласка, авторизуйтесь знову.')
        }
      } else if (status === 404) {
        // Логуємо 404 без спливаючого спам-тосту
        logger.api.warn(`Ресурс не знайдено (404): ${url}`)
      } else if (status === 409) {
        toast.error(
          detail || 'Конфлікт даних. Цю дію вже виконано іншим диспетчером.'
        )
      } else if (status === 422) {
        toast.warning('Помилка валідації даних. Перевірте введені значення.')
      } else if (status === 500) {
        toast.error(detail || 'Внутрішня помилка сервера. Зверніться до адміністратора.')
      } else if (!isAuthEndpoint) {
        toast.error(detail || `Помилка запиту: ${status}`)
      }
    } else if (error.request) {
      logger.api.error(
        `Мережева помилка (сервер недоступний): ${error.config?.url}`,
        error
      )
      const now = Date.now()
      if (now - lastNetworkErrorToastTime > 5000) {
        lastNetworkErrorToastTime = now
        toast.error("Відсутній зв'язок з сервером. Перевірте з'єднання.")
      }
    } else {
      logger.api.error('Невідома помилка HTTP клієнта', error)
      toast.error('Сталася помилка при формуванні запиту.')
    }

    return Promise.reject(error)
  }
)

export default api
