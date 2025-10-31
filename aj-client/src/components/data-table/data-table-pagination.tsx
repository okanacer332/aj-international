import { Table } from "@tanstack/react-table";
import {
  ChevronRight,
  ChevronsRight,
  ChevronLeft,
  ChevronsLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 1. YENİ PROP: 't' fonksiyonunu ekle
interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  t: (key: string, options?: any) => string; // 'any' kullandık çünkü interpolasyon ({{count}}) alacak
}

export function DataTablePagination<TData>({
  table,
  t, // 2. 't' fonksiyonunu props'tan al
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-4">
      {/* 3. ÇEVİRİ: "X row(s) selected." */}
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {t("datatable.rowsSelected", {
          count: table.getFilteredSelectedRowModel().rows.length,
          total: table.getFilteredRowModel().rows.length,
        })}
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          {/* 4. ÇEVİRİ: "Rows per page" */}
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            {t("datatable.rowsPerPage")}
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-20"
              id="rows-per-page"
            >
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          {/* 5. ÇEVİRİ: "Page X of Y" */}
          {t("datatable.pageInfo", {
            page: table.getState().pagination.pageIndex + 1,
            totalPages: table.getPageCount(),
          })}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {/* 6. ÇEVİRİ: "Go to first page" */}
            <span className="sr-only">{t("datatable.goToFirstPage")}</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {/* 7. ÇEVİRİ: "Go to previous page" */}
            <span className="sr-only">{t("datatable.goToPrevPage")}</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {/* 8. ÇEVİRİ: "Go to next page" */}
            <span className="sr-only">{t("datatable.goToNextPage")}</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {/* 9. ÇEVİRİ: "Go to last page" */}
            <span className="sr-only">{t("datatable.goToLastPage")}</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}