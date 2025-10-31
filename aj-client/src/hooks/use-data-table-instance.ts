import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  filterFns,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationState,
  SortingState,
  TableState, 
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

type UseDataTableInstanceProps<TData, TValue> = {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  getRowId?: (row: TData, index: number) => string;

  // Sunucu taraflı sayfalama
  manualPagination?: boolean;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  
  // Global Filtre (Arama)
  onGlobalFilterChange?: OnChangeFn<string>;
  
  // Kolon Filtreleme (Durum vb.)
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>; // <-- BU SATIR EKLENDİ
  
  // Dışarıdan state'i almak için
  state?: Partial<TableState>;
};

export function useDataTableInstance<TData, TValue>({
  data,
  columns,
  getRowId,
  manualPagination = false,
  pageCount,
  controlledPagination,
  onPaginationChange,
  onGlobalFilterChange,
  onColumnFiltersChange, // <-- PROP ALINDI
  state: controlledState = {},
}: UseDataTableInstanceProps<TData, TValue>) {
  
  // Kendi iç state'leri (sayfa tarafından yönetilmeyenler)
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]); // <-- Sıralama state'i burada

  // Sayfalama state'i
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    });

  const pagination = controlledPagination ?? internalPagination;
  const setPagination = onPaginationChange ?? setInternalPagination;

  const table = useReactTable({
    data,
    columns,

    // GÜNCELLEME: Dışarıdan gelen state ({ globalFilter, columnFilters })
    // ile içeride yönetilen state'leri ({ sorting, ... }) birleştiriyoruz.
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
      ...controlledState, // { globalFilter, columnFilters } buraya gelecek
    },

    manualPagination,
    pageCount,
    onPaginationChange: setPagination,

    globalFilterFn: filterFns.includesString,
    onGlobalFilterChange: onGlobalFilterChange,
    
    // GÜNCELLEME: Filtre değişikliği fonksiyonunu bağlıyoruz
    onColumnFiltersChange: onColumnFiltersChange, // <-- BU SATIR EKLENDİ

    onSortingChange: setSorting, // <-- Sıralama fonksiyonunu bağlıyoruz

    enableRowSelection: true,
    getRowId: getRowId ?? ((row) => (row as any).id.toString()),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return table;
}