// src/hooks/use-depots.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiFetch } from '@/lib/api';

/**
 * Custom hooks for Depot data fetching with TanStack Query
 */

interface Depot {
    id: string;
    name: string;
    description?: string;
    tenantId: string;
}

/**
 * Fetch all depots with caching
 */
export function useDepots() {
    return useQuery({
        queryKey: queryKeys.depots.list(),
        queryFn: async () => {
            const res = await apiFetch('/api/inventory/depots');
            return res.json() as Promise<Depot[]>;
        },
        staleTime: 5 * 60 * 1000, // 5 dakika
    });
}

/**
 * Create or update a depot
 */
export function useSaveDepot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (depot: Partial<Depot>) => {
            const res = await apiFetch('/api/inventory/depots', {
                method: 'POST',
                body: JSON.stringify(depot),
            });
            return res.json() as Promise<Depot>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.depots.all });
        },
    });
}

/**
 * Delete a depot
 */
export function useDeleteDepot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiFetch(`/api/inventory/depots/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.depots.all });
        },
    });
}
