// aj-client/src/app/[lng]/(main)/dashboard/audit/logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AuditLog, PaginatedResponse } from "@/types/audit-log";
// KRİTİK DÜZELTME 1: Artık columns değil, createAuditLogColumns fonksiyonu import ediliyor
import { createAuditLogColumns } from "./columns"; 
import { DataTable } from "@/components/data-table/data-table";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";


export default function AuditLogsPage() {
  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, 'common');

  useEffect(() => {
    if (!ready) return;

    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: pagination.pageIndex.toString(),
          size: pagination.pageSize.toString(),
          sort: 'timestamp,desc'
        });
        const res = await apiFetchAuth(`/api/audit/logs?${params.toString()}`);
        const pageData = await res.json();
        setData(pageData);
      } catch (error: any) {
        toast.error(t("audit.log.toast.fetchError"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [pagination, ready, t]);

  // KRİTİK DÜZELTME 2: columns yerine createAuditLogColumns(t) kullanıldı
  const table = useDataTableInstance({
    data: data?.content ?? [],
    columns: createAuditLogColumns(t), 
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
    pagination,
    onPaginationChange: setPagination,
  });

  if (!ready) {
     return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-12 w-full" />
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('audit.log.pageTitle')}</h1>
        <p className="text-muted-foreground">{t('audit.log.pageDescription')}</p>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
            {/* KRİTİK DÜZELTME 3: Burada da createAuditLogColumns(t) kullanıldı */}
            <DataTable table={table} columns={createAuditLogColumns(t)} />
        </div>
      )}
      
      {!isLoading && data && data.content.length > 0 && <DataTablePagination table={table} />}
    </div>
  );
}