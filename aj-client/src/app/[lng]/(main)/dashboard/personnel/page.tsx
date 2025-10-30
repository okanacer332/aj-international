"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Personnel } from "@/types/personnel"; 
import { createPersonnelColumns } from "./columns"; 
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
import { PersonnelForm } from "./personnel-form"; 
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

export default function Page() { // 'PersonnelPage' değil, 'Page' olmalı
  const [data, setData] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Personnel | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Personnel | null>(null);

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/hr/personnel");
      const data: Personnel[] = await res.json();
      setData(data);
    } catch (error) {
      toast.error(t("hr.personnel.toast.fetchError"));
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

  // --- GÜNCELLEME (EDIT) ---
  const handleEdit = useCallback((item: Personnel) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  // --- GÜNCELLEME (DELETE) ---
  const handleDelete = useCallback((item: Personnel) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  // --- GÜNCELLEME (DELETE CONFIRM) ---
  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      // Backend /api/hr/personnel/{id} DELETE endpoint'i artık var
      await apiFetchAuth(`/api/hr/personnel/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("hr.personnel.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
      toast.error(t("hr.personnel.toast.deleteError"), {
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
      createPersonnelColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        t: t,
        lng: lng, // Dil prop'u eklendi (tarih formatı için)
      }),
    [handleEdit, handleDelete, t, lng] // lng eklendi
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
    // ... (Skeleton aynı kalır)
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
            {t("hr.personnelManagement.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("hr.personnelManagement.pageDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("hr.personnel.searchPlaceholder")}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="h-9 w-full sm:w-64 pl-8"
            />
          </div>
          {/* --- GÜNCELLEME (DIALOG) --- */}
          {/* 'selectedItem' değiştiğinde Form'u yeniden render et */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedItem(null)} className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                {t("hr.personnel.newButton")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedItem
                    ? t("hr.personnel.dialogTitleEdit") // Yeni çeviri
                    : t("hr.personnel.dialogTitleNew")}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem
                    ? t("hr.personnel.dialogDescriptionEdit") // Yeni çeviri
                    : t("hr.personnel.dialogDescriptionNew")}
                </DialogDescription>
              </DialogHeader>
              {/* Form'a initialData'yı yolla */}
              <PersonnelForm
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

      {/* --- GÜNCELLEME (ALERT DIALOG) --- */}
      {/* Silinecek öğe varsa diyalog açılır */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("hr.personnel.deleteDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <b>{itemToDelete?.user?.fullName || itemToDelete?.onxCode}</b>{" "}
              {t("hr.personnel.deleteDialogText")}
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