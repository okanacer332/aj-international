"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MeasureDefinition } from "@/types/measure-definition";
import { createMeasureDefinitionColumns } from "./columns";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileDown } from "lucide-react"; // Filter ikonu kaldırıldı
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
import { MeasureDefinitionForm } from "./measure-definition-form";
import { useTranslation } from "@/lib/i18n-client";
import { useParams } from "next/navigation";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

// YENİ İMPORTLAR
import { ColumnFiltersState } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MeasureDefinitionsPage() {
  const [data, setData] = useState<MeasureDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // YENİ STATE'LER
  const [globalFilter, setGlobalFilter] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // columnFilters state'ine gerek yok çünkü filtre butonu kullanmıyoruz

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MeasureDefinition | null>(
    null
  );
  const [itemToDelete, setItemToDelete] = useState<MeasureDefinition | null>(
    null
  );

  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/masterdata/measures");
      const data: MeasureDefinition[] = await res.json();
      setData(data);
    } catch (error) {
      toast.error(t("masterdata.measure.toast.fetchError"));
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

  // Handler Fonksiyonları (Aynı)
  const handleEdit = useCallback((item: MeasureDefinition) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((item: MeasureDefinition) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await apiFetchAuth(`/api/masterdata/measures/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("masterdata.measure.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
      toast.error(t("masterdata.measure.toast.deleteError"), {
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

  // Arama çubuğu için Effect
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const columns = useMemo(
    () =>
      createMeasureDefinitionColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        t: t,
      }),
    [handleEdit, handleDelete, t]
  );

  // GÜNCELLEME: Table Instance (columnFilters kaldırıldı)
  const table = useDataTableInstance({
    data: data,
    columns: columns,
    state: {
      globalFilter: globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // Skeleton
  if (isLoading || !ready) {
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
              {t("sidebar.modules.definitions")}
            </span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("masterdata.measure.pageTitle")}
            </BreadcrumbPage>
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
                {t("masterdata.measure.pageTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-2.5 py-1 text-sm">
                  <strong className="mr-1.5 font-semibold">
                    {t("datatable.total", "Toplam")}
                  </strong>
                  {data.length}
                </Badge>
                <Dialog
                  open={isFormOpen}
                  onOpenChange={setIsFormOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => setSelectedItem(null)} size="sm" className="h-8">
                      <Plus className="mr-1.5 h-4 w-4" />
                      {t("datatable.add_new", "Yeni")} 
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedItem
                          ? t("masterdata.measure.dialogTitleEdit")
                          : t("masterdata.measure.dialogTitleNew")}
                      </DialogTitle>
                      <DialogDescription>
                        {t("masterdata.measure.dialogDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <MeasureDefinitionForm
                      initialData={selectedItem}
                      onSuccess={handleFormSuccess}
                      lng={lng}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Sağ Taraf: Aksiyonlar (Filtre butonu yok) */}
            <div className="flex w-full sm:w-auto items-center gap-2">
              {/* Arama */}
              {isSearchOpen ? (
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder={t("datatable.search", "Ara...")}
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
                  aria-label={t("datatable.search", "Ara...")}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}

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
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {/* 5. MODALLAR (Aynı) */}
      {isFormOpen && (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
           <DialogContent className="sm:max-w-md">
             <DialogHeader>
               <DialogTitle>
                 {selectedItem
                   ? t("masterdata.measure.dialogTitleEdit")
                   : t("masterdata.measure.dialogTitleNew")}
               </DialogTitle>
               <DialogDescription>
                 {t("masterdata.measure.dialogDescription")}
               </DialogDescription>
             </DialogHeader>
             <MeasureDefinitionForm
               initialData={selectedItem}
               onSuccess={handleFormSuccess}
               lng={lng}
             />
           </DialogContent>
         </Dialog>
      )}

      {itemToDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("masterdata.measure.deleteDialogTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <b>{itemToDelete?.name}</b>{" "}
                {t("masterdata.measure.deleteDialogText")}
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
      )}
    </div>
  );
}