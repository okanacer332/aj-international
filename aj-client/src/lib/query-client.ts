// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 * 
 * Optimized settings for AJ International:
 * - staleTime: 5 minutes for most data
 * - gcTime: 30 minutes garbage collection
 * - Retry with exponential backoff
 * - No refetch on window focus for better UX
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,         // 5 dakika - veri bu süre boyunca "taze" kabul edilir
            gcTime: 30 * 60 * 1000,           // 30 dakika - cache garbage collection süresi
            refetchOnWindowFocus: false,       // Pencere odaklanmasında yeniden çekme
            refetchOnReconnect: true,          // Bağlantı kesilip geldiğinde yeniden çek
            retry: 2,                          // 2 kez yeniden dene
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
            retry: 1,
        },
    },
});

export default queryClient;
