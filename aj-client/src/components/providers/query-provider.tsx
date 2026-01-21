'use client';

// src/components/providers/query-provider.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { ReactNode } from 'react';

interface QueryProviderProps {
    children: ReactNode;
}

/**
 * TanStack Query Provider
 * 
 * Wraps the application with QueryClientProvider for data fetching.
 * Includes React Query Devtools in development mode.
 */
export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
            )}
        </QueryClientProvider>
    );
}

export default QueryProvider;
