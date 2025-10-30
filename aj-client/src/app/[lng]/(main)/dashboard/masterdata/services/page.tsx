"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { ServiceDefinition } from "@/types/service-definition";
import { createServiceDefinitionColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { apiFetchAuth } from "@/lib/api-auth";
import { toast } from "sonner";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ServiceDefinitionForm } from "./service-definition-form";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

export default function ServiceDefinitionsPage() {
  const [data, setData] = useState<ServiceDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceDefinition | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<ServiceDefinition | null>(
    null
  );

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/masterdata/services");
      const data: ServiceDefinition[] = await res.json();
      setData(data);
    } catch (error) {
      toast.error(t("masterdata.service.toast.fetchError"));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, fetchData]);

  const handleEdit = useCallback((item: ServiceDefinition) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((item: ServiceDefinition) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await apiFetchAuth(`/api/masterdata/services/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("masterdata.service.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
      toast.error(t("masterdata.service.toast.deleteError"), {
        description: e.message,
      });
    } finally {
      setItemToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [itemToDelete, t, fetchData]);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedItem(null);
    fetchData();
  };

  const columns = useMemo(
    () =>
      createServiceDefinitionColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        t: t,
      }),
    [handleEdit, handleDelete, t]
  );

  const table = useDataTableInstance({
    data: data,
    columns: columns,
    state: {
      globalFilter: globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <div className="flex justify-end gap-2 py-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("masterdata.service.pageTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("masterdata.service.pageDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("masterdata.product.searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-9 w-full sm:w-64 pl-8"
            />
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedItem(null)} className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                {t("masterdata.service.newButton")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem
                    ? t("masterdata.service.dialogTitleEdit")
                    : t("masterdata.service.dialogTitleNew")}
                </DialogTitle>
                <DialogDescription>
                  {t("masterdata.service.dialogDescription")}
                </DialogDescription>
              </DialogHeader>
              <ServiceDefinitionForm
                initialData={selectedItem}
                onSuccess={handleFormSuccess}
                lng={lng}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <DataTable table={table} columns={columns} />
      </div>
      <DataTablePagination table={table} />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("masterdata.service.deleteDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <b>{itemToDelete?.vehiclePlate}</b>{" "}
              {t("masterdata.service.deleteDialogText")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>
              {t("masterdata.product.cancelButton")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t("masterdata.product.deleteButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}