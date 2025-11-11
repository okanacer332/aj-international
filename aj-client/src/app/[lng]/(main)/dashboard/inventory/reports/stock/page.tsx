// aj-client/src/app/[lng]/(main)/dashboard/inventory/reports/stock/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building, Package, Weight, Clock } from "lucide-react";
import { format } from "date-fns";

// Backend DTO'larına karşılık gelen TypeScript tipleri
interface StockReportLineDto {
  materialId: string;
  materialName: string;
  materialCode: string;
  totalStock: number;
}

interface StockReportDto {
  depotId: string;
  depotName: string;
  stockLines: StockReportLineDto[];
  depotTotalStock: number;
}

export default function StockReportPage() {
  const [reportData, setReportData] = useState<StockReportDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/inventory/report/stock");
      const data: StockReportDto[] = await res.json();
      setReportData(data);
      setLastUpdated(new Date()); // Veri çekildiğinde zamanı güncelle
    } catch (error) {
      toast.error(t("inventory.reports.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, fetchData]);

  const totalStockAllDepots = useMemo(() => {
    return reportData.reduce((acc, depot) => acc + depot.depotTotalStock, 0);
  }, [reportData]);

  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

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
              {t("sidebar.modules.inventory")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("inventory.reports.pageTitle")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("inventory.reports.pageTitle")}
        </h1>
        <p className="text-muted-foreground">
          {t("inventory.reports.pageDescription")}
        </p>
      </div>

      {/* 3. ÖZET KARTLARI */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Bakış</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Weight className="h-6 w-6 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{t("inventory.reports.totalStock")}</span>
                <span className="text-xl font-bold">{totalStockAllDepots.toFixed(3)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Building className="h-6 w-6 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{t("inventory.reports.totalDepots")}</span>
                <span className="text-xl font-bold">{reportData.length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-md border p-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">{t("inventory.reports.lastUpdated")}</span>
                <span className="text-xl font-bold">{format(lastUpdated, "HH:mm:ss")}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. DEPO BAZLI STOK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportData.map((depot) => (
          <Card key={depot.depotId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{depot.depotName}</span>
                <Badge variant="secondary">
                  {depot.depotTotalStock.toFixed(3)} {t("inventory.reports.stockAmount")}
                </Badge>
              </CardTitle>
              <CardDescription>{t("inventory.reports.depotStockTitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("inventory.reports.material")}</TableHead>
                    <TableHead className="text-right">{t("inventory.reports.stockAmount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {depot.stockLines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        {t("inventory.reports.noStock")}
                      </TableCell>
                    </TableRow>
                  )}
                  {depot.stockLines.map((line) => (
                    <TableRow key={line.materialId}>
                      <TableCell>
                        <div className="font-medium">{line.materialName}</div>
                        <div className="text-xs text-muted-foreground">{line.materialCode || "---"}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{line.totalStock.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}