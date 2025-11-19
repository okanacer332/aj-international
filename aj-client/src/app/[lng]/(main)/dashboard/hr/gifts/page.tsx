"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { GiftRecord } from "@/types/gift-record";
import { createGiftColumns } from "./columns";
import { GiftForm } from "./gift-form";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Gift } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GiftsPage() {
  const [data, setData] = useState<GiftRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<GiftRecord | null>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/hr/gifts");
      const data: GiftRecord[] = await res.json();
      setData(data);
    } catch (error) {
      toast.error(t("masterdata.product.toast.fetchError")); // Genel hata mesajı
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (ready) fetchData();
  }, [ready, fetchData]);

  const handleDelete = useCallback((item: GiftRecord) => {
    setItemToDelete(item);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await apiFetchAuth(`/api/hr/gifts/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("hr.gifts.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
      toast.error(t("masterdata.product.toast.deleteFailed"));
    } finally {
      setItemToDelete(null);
    }
  }, [itemToDelete, fetchData, t]);

  const columns = useMemo(
    () => createGiftColumns({ onDelete: handleDelete, t }),
    [handleDelete, t]
  );

  const table = useDataTableInstance({
    data,
    columns,
  });

  if (!ready) return null;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/${lng}/dashboard/default`}>{t("sidebar.managementPanel.home")}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm font-medium">{t("sidebar.modules.humanResources")}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("hr.gifts.title")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {t("hr.gifts.title")}
              </h2>
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">{t("datatable.total")}</strong>
                  {data.length}
                </Badge>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8">
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("hr.gifts.newRecord")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t("hr.gifts.dialogTitle")}</DialogTitle>
                    </DialogHeader>
                    <GiftForm onSuccess={() => { setIsFormOpen(false); fetchData(); }} lng={lng} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 border-t">
          <DataTable table={table} columns={columns} />
        </CardContent>

        <CardFooter className="p-4 sm:p-6 border-t">
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("hr.gifts.deleteDialogTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                 {t("hr.gifts.deleteDialogDesc")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("masterdata.product.cancelButton")}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>{t("masterdata.product.deleteButton")}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}