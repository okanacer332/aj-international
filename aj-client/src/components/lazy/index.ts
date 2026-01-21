// src/components/lazy/index.ts
/**
 * Lazy Loading Components Export
 * 
 * Use these components instead of direct imports to reduce initial bundle size
 * 
 * Example usage:
 * ```tsx
 * import { LazyDataTable, LazyDialog } from '@/components/lazy';
 * 
 * export default function MyPage() {
 *   return (
 *     <div>
 *       <LazyDataTable data={data} columns={columns} />
 *       <LazyDialog>...</LazyDialog>
 *     </div>
 *   );
 * }
 * ```
 */

export { LazyDataTable, LazyDataTablePagination } from './lazy-data-table';
export {
    LazyDialog,
    LazyDialogContent,
    LazyDialogHeader,
    LazyDialogTitle,
    LazyDialogDescription,
    LazyDialogTrigger,
    LazyAlertDialog,
    LazyAlertDialogContent,
    LazyAlertDialogHeader,
    LazyAlertDialogTitle,
    LazyAlertDialogDescription,
    LazyAlertDialogFooter,
    LazyAlertDialogAction,
    LazyAlertDialogCancel,
} from './lazy-forms';
