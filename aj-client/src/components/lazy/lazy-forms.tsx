// src/components/lazy/lazy-forms.tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Loading skeleton for dialog forms
const FormSkeleton = () => (
    <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-end gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
        </div>
    </div>
);

/**
 * Lazy Load Dialog Component
 * 
 * Heavy dialog components loaded on demand
 */
export const LazyDialog = dynamic(
    () => import('@/components/ui/dialog').then((mod) => mod.Dialog),
    {
        loading: () => <FormSkeleton />,
        ssr: false,
    }
);

export const LazyDialogContent = dynamic(
    () => import('@/components/ui/dialog').then((mod) => mod.DialogContent),
    { ssr: false }
);

export const LazyDialogHeader = dynamic(
    () => import('@/components/ui/dialog').then((mod) => mod.DialogHeader),
    { ssr: false }
);

export const LazyDialogTitle = dynamic(
    () => import('@/components/ui/dialog').then((mod) => mod.DialogTitle),
    { ssr: false }
);

export const LazyDialogDescription = dynamic(
    () => import('@/components/ui/dialog').then((mod) => mod.DialogDescription),
    { ssr: false }
);

export const LazyDialogTrigger = dynamic(
    () => import('@/components/ui/dialog').then((mod) => mod.DialogTrigger),
    { ssr: false }
);

/**
 * Lazy Load AlertDialog Component
 */
export const LazyAlertDialog = dynamic(
    () => import('@/components/ui/alert-dialog').then((mod) => mod.AlertDialog),
    { ssr: false }
);

export const LazyAlertDialogContent = dynamic(
    () => import('@/components/ui/alert-dialog').then((mod) => mod.AlertDialogContent),
    { ssr: false }
);

export const LazyAlertDialogHeader = dynamic(
    () => import('@/components/ui/alert-dialog').then((mod) => mod.AlertDialogHeader),
    { ssr: false }
);

export const LazyAlertDialogTitle = dynamic(
    () => import('@/components/ui/alert-dialog').then((mod) => mod.AlertDialogTitle),
    { ssr: false }
);

export const LazyAlertDialogDescription = dynamic(
    () => import('@/components/ui/alert-dialog').then((mod) => mod.AlertDialogDescription),
    { ssr: false }
);

export const LazyAlertDialogFooter = dynamic(
    () => import('@/components/ui/alert-dialog').then((mod) => mod.AlertDialogFooter),
    { ssr: false }
);

export const LazyAlertDialogAction = dynamic(
    () => import('@/components/ui/alert-dialog').then((mod) => mod.AlertDialogAction),
    { ssr: false }
);

export const LazyAlertDialogCancel = dynamic(
    () => import('@/components/ui/alert-dialog').then((mod) => mod.AlertDialogCancel),
    { ssr: false }
);
