import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Конфігурація QueryClient оптимізована для десктопного АРМ
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Не робити запит при поверненні на вкладку
      retry: 1,                    // Кількість повторних спроб при помилці
      staleTime: 1000 * 60 * 5,    // Кеш вважається "свіжим" 5 хвилин
      gcTime: 1000 * 60 * 30,      // Зберігаємо в пам'яті 30 хвилин
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
