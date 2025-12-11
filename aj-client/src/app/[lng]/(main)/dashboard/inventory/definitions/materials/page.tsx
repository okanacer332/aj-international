"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { 
  Plus, 
  FileDown 
} from "lucide-react";
import { ColumnFiltersState, VisibilityState } from "@tanstack/react-table";

import { useTranslation } from "@/lib/i18n-client";
import { apiFetchAuth } from "@/lib/api-auth";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Custom Data Table Components
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"; // Yeni Toolbar'ı import ettik

// Local Page Components
import { createMaterialDefinitionColumns } from "./columns";
import { MaterialDefinition, MaterialDefinitionForm } from "./material-definition-form";

export default function MaterialsPage() {
  // -- Data State --
  const [data, setData] = useState<MaterialDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // -- Table State --
  // Toolbar'ın yönetebilmesi için state'leri burada tutuyoruz
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({}); 

  // -- Dialog State --
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaterialDefinition | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MaterialDefinition | null>(null);

  // -- I18n --
  const { lng } = useParams() as { lng: string };
  const { t, ready } = useTranslation(lng, "common");

  // -- Fetch Data --
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetchAuth("/api/inventory/definitions/materials");
      if (res.ok) {
        const data: MaterialDefinition[] = await res.json();
        setData(data);
      } else {
        toast.error(t("masterdata.material.toast.fetchError"));
      }
    } catch (error) {
      toast.error(t("masterdata.material.toast.fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (ready) fetchData();
  }, [ready, fetchData]);

  // -- Handlers --
  const handleEdit = useCallback((item: MaterialDefinition) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((item: MaterialDefinition) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await apiFetchAuth(`/api/inventory/definitions/materials/${itemToDelete.id}`, {
        method: "DELETE",
      });
      toast.success(t("masterdata.material.toast.deleteSuccess"));
      fetchData();
    } catch (e: any) {
      toast.error(t("masterdata.material.toast.deleteError"), {
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

  // -- Table Configuration --
  const columns = useMemo(
    () => createMaterialDefinitionColumns({ onEdit: handleEdit, onDelete: handleDelete, t: t }),
    [handleEdit, handleDelete, t]
  );

  const table = useDataTableInstance({
    data,
    columns,
    state: { 
      globalFilter, 
      columnFilters,
      columnVisibility // Görünürlük state'ini table instance'a veriyoruz
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility, // Handler
  });

  if (isLoading || !ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb Navigation */}
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
            <BreadcrumbLink href={`/${lng}/dashboard/inventory/definitions`}>
              {t("inventory.definitions.title")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {t("masterdata.material.pageTitle")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        {/* Card Header: Başlık ve Ana Aksiyonlar (Yeni Ekle / Export) */}
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Sol Taraf: Başlık ve Sayaç */}
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {t("masterdata.material.pageTitle")}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                  {t("datatable.total", "Toplam")}: {data.length}
                </Badge>
              </div>
            </div>

            {/* Sağ Taraf: Butonlar */}
            <div className="flex items-center gap-2">
               {/* Export Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("datatable.export", "Dışa Aktar")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    {t("datatable.exportPdf", "PDF İndir")}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {t("datatable.exportExcel", "Excel İndir")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add New Dialog */}
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedItem(null)} size="sm" className="h-8">
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t("datatable.add_new", "Yeni Ekle")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedItem
                        ? t("masterdata.material.dialogTitleEdit")
                        : t("masterdata.material.dialogTitleNew")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("masterdata.material.dialogDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <MaterialDefinitionForm
                    initialData={selectedItem}
                    onSuccess={handleFormSuccess}
                    lng={lng}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="p-4 border-b bg-muted/5">
            {/* YENİ TOOLBAR BURAYA GELİYOR 
              searchKey="name": Tablodaki 'name' kolonunda text araması yapar.
            */}
            <DataTableToolbar 
              table={table} 
              searchKey="name"
              filters={[
                // BURASI ÖNEMLİ: İleride "Kategori" veya "Tip" alanı eklersen burayı açabilirsin:
                /*
                {
                  columnId: "category",
                  title: "Kategori",
                  options: [
                    { label: "Hammadde", value: "RAW" },
                    { label: "Yarı Mamul", value: "SEMI" },
                  ]
                }
                */
              ]} 
            />
          </div>
          
          {/* Tablo */}
          <div className="border-b">
            <DataTable table={table} columns={columns} />
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-6">
          <DataTablePagination table={table} t={t} />
        </CardFooter>
      </Card>

      {/* Delete Alert Dialog */}
      {itemToDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("masterdata.material.deleteDialogTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-semibold text-foreground">"{itemToDelete?.name}"</span>{" "}
                {t("masterdata.material.deleteDialogText")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>
                {t("common.cancel", "İptal")}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("common.delete", "Sil")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}