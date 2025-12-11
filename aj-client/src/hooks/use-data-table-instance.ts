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
  pagination?: PaginationState; // Dışarıdan gelen sayfalama state'i
  controlledPagination?: PaginationState; // (Alternatif isimlendirme desteği için)
  onPaginationChange?: OnChangeFn<PaginationState>;
  
  // Global Filtre (Arama)
  onGlobalFilterChange?: OnChangeFn<string>;
  
  // Kolon Filtreleme (Durum vb.)
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

  // YENİ EKLENDİ: Kolon Görünürlüğü (Visibility)
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  
  // Dışarıdan state'i almak için
  state?: Partial<TableState>;
};

export function useDataTableInstance<TData, TValue>({
  data,
  columns,
  getRowId,
  manualPagination = false,
  pageCount,
  pagination: propPagination, // İsim çakışmasını önlemek için alias
  controlledPagination,
  onPaginationChange,
  onGlobalFilterChange,
  onColumnFiltersChange,
  onColumnVisibilityChange, // <-- ARTIK PROP OLARAK ALINIYOR
  state: controlledState = {},
}: UseDataTableInstanceProps<TData, TValue>) {
  
  // -- LOCAL STATES (Fallback) --
  // Eğer dışarıdan yönetilmiyorsa bu yerel state'ler kullanılır.
  const [rowSelection, setRowSelection] = React.useState({});
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({});
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([]);
  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
  });

  // -- STATE RESOLUTION (External vs Internal) --
  
  // Pagination: Dışarıdan geldiyse onu kullan, yoksa içeridekini
  const pagination = controlledPagination ?? propPagination ?? internalPagination;
  const setPagination = onPaginationChange ?? setInternalPagination;

  // Visibility: Dışarıdan geldiyse onu kullan (controlledState içinden bakıyoruz), yoksa içeridekini
  const columnVisibility = controlledState.columnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = onColumnVisibilityChange ?? setInternalColumnVisibility;

  // Sorting: Dışarıdan geldiyse onu kullan, yoksa içeridekini
  const sorting = controlledState.sorting ?? internalSorting;
  // Eğer dışarıdan sorting handler gelirse onu da buraya ekleyebilirsin, şimdilik internal set
  const setSorting = (updater: any) => {
      // Eğer dışarıdan bir onSortingChange prop'u eklersek burası güncellenmeli.
      // Şimdilik sadece internal çalışıyor gibi görünüyor ama state dışarıdan beslenebiliyor.
      setInternalSorting(updater);
  };

  const table = useReactTable({
    data,
    columns,

    state: {
      // Merge order important: Internal defaults < Controlled State
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
      ...controlledState, // Dışarıdan gelen her şey (globalFilter, columnFilters vb.)
    },

    manualPagination,
    pageCount,
    
    // Handlers
    onPaginationChange: setPagination,
    globalFilterFn: filterFns.includesString,
    onGlobalFilterChange: onGlobalFilterChange,
    onColumnFiltersChange: onColumnFiltersChange,
    
    onSortingChange: setSorting,

    // Visibility Handler (DÜZELTİLDİ)
    onColumnVisibilityChange: setColumnVisibility, // Artık dışarıdan geleni kullanabiliyor

    enableRowSelection: true,
    getRowId: getRowId ?? ((row) => (row as any).id.toString()),
    onRowSelectionChange: setRowSelection,
    
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return table;
}