"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react"; // useRef, useCallback eklendi
import { AuditLog, PaginatedResponse } from "@/types/audit-log";
import { createAuditLogColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";
// 1. YENİ İMPORTLAR
import {
  ColumnFiltersState,
  PaginationState,
  SortingState, // Sıralama için eklendi
} from "@tanstack/react-table";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, FileDown } from "lucide-react";

export default function AuditLogsPage() {
  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. YENİ STATE'LER (Sunucu taraflı işlem için)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  // 3. GÜNCELLEME: fetchData, tüm state'leri API'ye gönderecek
  const fetchData = useCallback(async () => {
    if (!ready) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        size: pagination.pageSize.toString(),
        sort: sorting[0]
          ? `${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`
          : "timestamp,desc", // Varsayılan sıralama
      });

      // Arama (globalFilter)
      if (globalFilter) {
        params.append("search", globalFilter);
      }

      // Filtreler (columnFilters)
      columnFilters.forEach(filter => {
        if (filter.value && Array.isArray(filter.value) && filter.value.length > 0) {
          // 'action' filtresi için
          if (filter.id === 'action') {
            params.append('action', filter.value.join(','));
          }
        }
      });

      const res = await apiFetchAuth(`/api/audit/logs?${params.toString()}`);
      const pageData = await res.json();
      setData(pageData);
    } catch (error: any) {
      toast.error(t("audit.log.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [ready, t, pagination, sorting, globalFilter, columnFilters]); // Tüm state'ler bağımlılık oldu

  // 4. GÜNCELLEME: Tüm state'ler useEffect'e eklendi
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Arama çubuğu için Effect
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const columns = useMemo(() => createAuditLogColumns(t), [t]);

  // 5. GÜNCELLEME: table instance'ı sunucu taraflı state'leri alıyor
  const table = useDataTableInstance({
    data: data?.content ?? [],
    columns: columns,
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
    manualSorting: true, // Sunucu taraflı sıralama
    manualFiltering: true, // Sunucu taraflı filtreleme
    state: {
      pagination,
      sorting,
      globalFilter,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
  });

  // 6. YENİ: Filtre menüsü için yardımcı değişkenler
  // Loglarda çok fazla aksiyon olabileceğinden, manuel bir liste sunmak daha iyi
  const actionFilterOptions = [
    "USER_LOGIN_SUCCESS",
    "USER_LOGIN_FAILURE",
    "USER_LOGOUT_SUCCESS",
    "USER_CREATED",
    "USER_UPDATED",
    "USER_DELETED",
    "ROLE_CREATED",
    "ROLE_UPDATED",
    "ROLE_DELETED",
    // Diğer önemli aksiyonlar buraya eklenebilir
  ];
  const filterValues =
    (table.getColumn("action")?.getFilterValue() as string[]) || [];

  if (!ready) {
    // ... (Skeleton aynı kalır) ...
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // --- YENİ RENDER YAPISI ---
  return (
    <div className="flex flex-col gap-6">
      {/* 1. BREADCRUMB */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${lng}/dashboard/default`}>
              {t("sidebar.managementPanel.home")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium">
              {t("sidebar.modules.systemManagement")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("audit.log.pageTitle")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        {/* 2. KONTROL ÇUBUĞU */}
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Sol Taraf */}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">
                {t("audit.log.pageTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {data?.totalElements ?? 0}
                </Badge>
                {/* Log sayfasına "Yeni Ekle" butonu koymuyoruz */}
              </div>
            </div>

            {/* Sağ Taraf: Aksiyonlar */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              {/* Arama */}
              {isSearchOpen ? (
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder={t("datatable.searchLogs", "Loglarda ara...")}
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    onBlur={() => {
                      if (globalFilter === "") {
                        setIsSearchOpen(false);
                      }
                    }}
                    className="h-9 pl-8 w-full"
                  />
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label={t("datatable.searchLogs", "Loglarda ara...")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

              {/* Filtre (Aksiyon için) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    {t("datatable.filter", "Filtrele")}
                    {filterValues.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 rounded-full px-1.5"
                      >
                        {filterValues.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-[300px] overflow-y-auto"
                >
                  <DropdownMenuLabel>
                    {t("audit.log.column.action")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {actionFilterOptions.map((action) => (
                    <DropdownMenuCheckboxItem
                      key={action}
                      checked={filterValues.includes(action)}
                      onCheckedChange={(isChecked) =>
                        table
                          .getColumn("action")
                          ?.setFilterValue((old: string[] = []) =>
                            isChecked
                              ? [...old, action]
                              : old.filter((v) => v !== action)
                          )
                      }
                    >
                      {action}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={filterValues.length === 0}
                    onClick={() => table.setColumnFilters([])}
                    className="text-destructive focus:text-destructive"
                  >
                    {t("datatable.clear_filters", "Filtreleri Temizle")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dışa Aktar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("datatable.export", "Dışa Aktar")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    {t("datatable.exportPdf", "PDF olarak aktar")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {t("datatable.exportExcel", "Excel olarak aktar")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* 3. DATA TABLOSU */}
        <CardContent className="p-0">
          <div className="rounded-t-none border-t">
            <DataTable table={table} columns={columns} />
          </div>
        </CardContent>

        {/* 4. SAYFALAMA */}
        <CardFooter className="p-4 sm:p-6 border-t">
          {/* 't' fonksiyonu aktarıldı */}
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>
      
      {/* Bu sayfada Modal (Dialog/Alert) bulunmuyor */}
    </div>
  );
}