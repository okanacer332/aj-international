// src/components/lazy/lazy-data-table.tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading skeleton for data table
const DataTableSkeleton = () => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    </div>
);

/**
 * Lazy Load Wrapper for DataTable Component
 * 
 * Uses Next.js dynamic import with loading skeleton
 * to reduce initial bundle size
 */
export const LazyDataTable = dynamic(
    () => import('@/components/data-table/data-table').then((mod) => mod.DataTable),
    {
        loading: () => <DataTableSkeleton />,
        ssr: false,
    }
);

/**
 * Lazy Load Wrapper for DataTablePagination
 */
export const LazyDataTablePagination = dynamic(
    () => import('@/components/data-table/data-table-pagination').then((mod) => mod.DataTablePagination),
    {
        loading: () => <Skeleton className="h-10 w-full" />,
        ssr: false,
    }
);

export default LazyDataTable;
