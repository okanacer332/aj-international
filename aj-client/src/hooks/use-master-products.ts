// src/hooks/use-master-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { apiFetch } from '@/lib/api';
import type { MasterProduct } from '@/types/master-product';

/**
 * Custom hooks for Master Product data fetching with TanStack Query
 * 
 * Features:
 * - Automatic caching (10 min stale time for masterdata)
 * - Background refetching
 * - Cache invalidation on mutations
 */

interface UseMasterProductsOptions {
    enabled?: boolean;
}

/**
 * Fetch all master products with caching
 */
export function useMasterProducts(options: UseMasterProductsOptions = {}) {
    const { enabled = true } = options;

    return useQuery({
        queryKey: queryKeys.masterProducts.list(),
        queryFn: async () => {
            const res = await apiFetch('/api/masterdata/products');
            return res.json() as Promise<MasterProduct[]>;
        },
        staleTime: 10 * 60 * 1000, // 10 dakika - masterdata nadiren değişir
        enabled,
    });
}

/**
 * Fetch single master product by ID
 */
export function useMasterProduct(id: string) {
    return useQuery({
        queryKey: queryKeys.masterProducts.detail(id),
        queryFn: async () => {
            const res = await apiFetch(`/api/masterdata/products/${id}`);
            return res.json() as Promise<MasterProduct>;
        },
        enabled: !!id,
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Create or update a master product
 */
export function useSaveMasterProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (product: Partial<MasterProduct>) => {
            const res = await apiFetch('/api/masterdata/products', {
                method: 'POST',
                body: JSON.stringify(product),
            });
            return res.json() as Promise<MasterProduct>;
        },
        onSuccess: () => {
            // Invalidate list cache to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.masterProducts.all });
        },
    });
}

/**
 * Delete a master product
 */
export function useDeleteMasterProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiFetch(`/api/masterdata/products/${id}`, {
                method: 'DELETE',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.masterProducts.all });
        },
    });
}
