"use client";

import { useEffect, useState } from "react";
import { AuditLog, PaginatedResponse } from "@/types/audit-log";
import { columns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { OnChangeFn, PaginationState } from "@tanstack/react-table";

export default function AuditLogsPage() {
  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
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
      } catch (error) {
        toast.error("Log kayıtları getirilirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [pagination]);

  const table = useDataTableInstance({
    data: data?.content ?? [],
    columns,
    manualPagination: true,
    pageCount: data?.totalPages ?? -1,
    pagination,
    onPaginationChange: setPagination,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Log Kayıtları</h1>
        <p className="text-muted-foreground">Sistemde gerçekleşen tüm kullanıcı eylemlerini izleyin.</p>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
            <DataTable table={table} columns={columns} />
        </div>
      )}
      
      {!isLoading && data && data.content.length > 0 && <DataTablePagination table={table} />}
    </div>
  );
}