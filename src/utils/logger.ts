/**
 * Клієнтська система деталізованого логування для фронтенду АРМ «ОМЕТ».
 * 1. Форматує кольорові бейджі в консолі браузера (DevTools).
 * 2. Автоматично надсилає помилки та критичні попередження на бекенд (/api/logs/client),
 *    щоб розробник міг бачити всі клієнтські баги безпосередньо в терміналі виконання.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

const isDev = import.meta.env.DEV;

// Кольори для консолі браузера
const STYLES = {
  debug: 'background: #334155; color: #94a3b8; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  info: 'background: #0284c7; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  warn: 'background: #d97706; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  error: 'background: #dc2626; color: #ffffff; font-weight: bold; border-radius: 4px; padding: 2px 6px;',
  module: 'color: #38bdf8; font-weight: bold;',
  time: 'color: #64748b; font-size: 11px;',
};

const sendLogToBackend = async (level: LogLevel, message: string, context?: LogContext, stack?: string) => {
  try {
    const payload = {
      level,
      message,
      context,
      stack,
      url: window.location.href,
    };
    
    // Використовуємо fetch з keepalive або navigator.sendBeacon
    fetch('/api/logs/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Ігноруємо якщо сервер недоступний
  }
};

const createLogger = (moduleName: string) => {
  const getTimestamp = () => new Date().toISOString().split('T')[1].slice(0, 12);

  return {
    debug: (message: string, context?: LogContext) => {
      if (!isDev) return;
      const time = getTimestamp();
      console.debug(
        `%c${time}%c %cDEBUG%c %c[${moduleName}]%c ${message}`,
        STYLES.time, '',
        STYLES.debug, '',
        STYLES.module, '',
        context || ''
      );
    },

    info: (message: string, context?: LogContext) => {
      const time = getTimestamp();
      console.info(
        `%c${time}%c %cINFO%c %c[${moduleName}]%c ${message}`,
        STYLES.time, '',
        STYLES.info, '',
        STYLES.module, '',
        context || ''
      );
    },

    warn: (message: string, context?: LogContext) => {
      const time = getTimestamp();
      console.warn(
        `%c${time}%c %cWARN%c %c[${moduleName}]%c ${message}`,
        STYLES.time, '',
        STYLES.warn, '',
        STYLES.module, '',
        context || ''
      );
      sendLogToBackend('warn', `[${moduleName}] ${message}`, context);
    },

    error: (message: string, error?: any, context?: LogContext) => {
      const time = getTimestamp();
      const stack = error?.stack || (error instanceof Error ? error.stack : undefined);
      console.error(
        `%c${time}%c %cERROR%c %c[${moduleName}]%c ${message}`,
        STYLES.time, '',
        STYLES.error, '',
        STYLES.module, '',
        error || '',
        context || ''
      );
      sendLogToBackend('error', `[${moduleName}] ${message}`, { ...context, errorMsg: error?.message || String(error) }, stack);
    },
  };
};

export const logger = {
  app: createLogger('APP'),
  api: createLogger('API.CLIENT'),
  ws: createLogger('WS.DISPATCH'),
  solver: createLogger('TRANSIT.SOLVER'),
  crew: createLogger('CREW.WAYBILL'),
  map: createLogger('MAP.TELEMETRY'),
  for: (name: string) => createLogger(name),
};

// Глобальне перехоплення непокритих помилок UI в Dev-режимі
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.app.error(`Неперехоплена помилка браузера: ${event.message}`, event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.app.error(`Необроблений Promise Rejection: ${event.reason}`, event.reason);
  });
}
